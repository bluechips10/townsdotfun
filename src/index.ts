import { makeTownsBot } from '@towns-protocol/bot'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import commands from './commands'
import {
    startWorkflow,
    setTokenName,
    setTokenSymbol,
    setTotalSupply,
    setDecimals,
    setCreatorBuyAmount,
    getTokenParams,
    completeWorkflow,
    cancelWorkflow,
    getWorkflow,
} from './token/workflow'
import { parseCommandArgs, validateAddress } from './utils/validation'
import { deployToken, formatDeploymentMessage, formatEther } from './token/deploy'
import { recordPrepayment, hasPrepayment, consumePrepayment, getPrepaymentBalance } from './token/prepayment'
import { ESTIMATED_GAS_WEI } from './token/gas'

const bot = await makeTownsBot(process.env.APP_PRIVATE_DATA!, process.env.JWT_SECRET!, {
    commands,
})

bot.onSlashCommand('help', async (handler, { channelId }) => {
    await handler.sendMessage(
        channelId,
        '**Available Commands:**\n\n' +
            '• `/help` - Show this help message\n' +
            '• `/start` - Deploy a custom ERC20 token on Base\n\n' +
            '**Token Deployment:**\n\n' +
            '**Quick Deploy:**\n' +
            '`/start name=MyToken symbol=MTK supply=1000000000 buy=0.02`\n\n' +
            '**Interactive Mode:**\n' +
            '`/start` (bot guides you through 5 steps)\n\n' +
            '**Gas Payment (Hybrid Model):**\n' +
            '• **Option 1:** Buy tokens (min 0.02 ETH covers gas + tokens)\n' +
            '• **Option 2:** Prepay gas by tipping bot during deployment\n' +
            '• Gas is ~0.01 ETH, deducted from buy amount if buy > 0\n\n' +
            '**Creator Benefits:**\n' +
            '• Buy tokens at initial price (optional)\n' +
            '• Remaining tokens → liquidity pool\n' +
            '• Earn 0.5% of ALL transfer fees forever\n\n' +
            '**Message Triggers:**\n\n' +
            '• Say "hello" - I\'ll greet you back\n' +
            '• Say "ping" - I\'ll show latency\n' +
            '• Say "react" - I\'ll add a reaction\n' +
            "• React with 👋 - I'll wave back\n",
    )
})


bot.onReaction(async (handler, { reaction, channelId }) => {
    if (reaction === '👋') {
        await handler.sendMessage(channelId, 'I saw your wave! 👋')
    }
})

// Handle tips for gas prepayment
bot.onTip(async (handler, event) => {
    // Only track tips sent to the bot
    if (event.receiverAddress.toLowerCase() !== bot.botId.toLowerCase()) {
        return
    }
    
    const ethAmount = Number(event.amount) / 1e18
    
    // Record prepayment
    recordPrepayment(event.senderAddress, event.channelId, event.amount)
    
    const currentBalance = getPrepaymentBalance(event.senderAddress)
    const currentBalanceEth = Number(currentBalance) / 1e18
    const gasNeededEth = Number(ESTIMATED_GAS_WEI) / 1e18
    
    // Check if user has an active workflow waiting for gas payment
    const workflow = getWorkflow(event.senderAddress)
    
    if (workflow && workflow.step === 'awaiting_gas_payment' && workflow.channelId === event.channelId) {
        // User is in the middle of deployment, waiting for gas payment
        if (currentBalance >= ESTIMATED_GAS_WEI) {
            await handler.sendMessage(
                event.channelId,
                `✅ **Gas payment received!** (${ethAmount.toFixed(4)} ETH)\n\n` +
                    `Processing deployment now...`,
            )
            // The onMessage handler will pick this up and continue deployment
        } else {
            const remaining = Number(ESTIMATED_GAS_WEI - currentBalance) / 1e18
            await handler.sendMessage(
                event.channelId,
                `💰 **Payment received:** ${ethAmount.toFixed(4)} ETH\n\n` +
                    `**Current Balance:** ${currentBalanceEth.toFixed(4)} ETH\n` +
                    `**Still need:** ${remaining.toFixed(4)} ETH\n\n` +
                    `Please tip ${remaining.toFixed(4)} more ETH to continue.`,
            )
        }
    } else {
        // General prepayment (no active workflow)
        if (currentBalance >= ESTIMATED_GAS_WEI) {
            await handler.sendMessage(
                event.channelId,
                `✅ **Gas Prepayment Received**\n\n` +
                    `You tipped ${ethAmount.toFixed(4)} ETH for gas.\n\n` +
                    `**Your Balance:** ${currentBalanceEth.toFixed(4)} ETH\n` +
                    `**Gas Needed:** ${gasNeededEth.toFixed(4)} ETH\n\n` +
                    `✅ You have enough! You can now deploy with \`/start\` without buying tokens.`,
            )
        } else {
            const remaining = Number(ESTIMATED_GAS_WEI - currentBalance) / 1e18
            await handler.sendMessage(
                event.channelId,
                `💰 **Prepayment Recorded**\n\n` +
                    `You tipped ${ethAmount.toFixed(4)} ETH.\n\n` +
                    `**Your Balance:** ${currentBalanceEth.toFixed(4)} ETH\n` +
                    `**Gas Needed:** ${gasNeededEth.toFixed(4)} ETH\n\n` +
                    `⚠️ Need ${remaining.toFixed(4)} more ETH.\n\n` +
                    `💡 **Or** use \`buy=0.02\` when deploying to skip prepayment!`,
            )
        }
    }
})

// Token Deployment Command Handler
bot.onSlashCommand('start', async (handler, event) => {
    const { channelId, userId, args } = event
    
    // Validate userId is a valid address
    const addressValidation = validateAddress(userId)
    if (!addressValidation.valid || !addressValidation.normalized) {
        await handler.sendMessage(channelId, `❌ Error: Invalid user address format`)
        return
    }
    
    const creatorAddress = addressValidation.normalized
    
    // Check if args provided (single command mode) or start workflow (multi-step mode)
    if (args.length > 0) {
        // Single command mode: parse arguments
        const params = parseCommandArgs(args)
        
        if (params.name && params.symbol && params.supply) {
            // All required params provided
            const creatorBuyEth = params.buy ? parseFloat(params.buy) : 0
            const tokenParams = {
                name: params.name.trim(),
                symbol: params.symbol.trim().toUpperCase(),
                decimals: parseInt(params.decimals || '18', 10),
                totalSupply: BigInt(Math.floor(parseFloat(params.supply) * 1e18)),
                creator: creatorAddress,
                creatorBuyAmount: creatorBuyEth > 0 ? BigInt(Math.floor(creatorBuyEth * 1e18)) : 0n,
            }
            
            // Deploy immediately
            await handler.sendMessage(channelId, '🚀 Deploying your token... This may take a moment.')
            
            const result = await deployToken(
                bot.viem as any,
                bot.viem.account!,
                bot.appAddress,
                tokenParams,
            )
            
            await handler.sendMessage(channelId, formatDeploymentMessage(result, tokenParams))
        } else {
            await handler.sendMessage(
                channelId,
                '**Usage:** `/start name=MyToken symbol=MTK [supply=1000000000] [decimals=18] [buy=0.1]`\n\n' +
                    '**Parameters:**\n' +
                    '• `name` - Token name (required)\n' +
                    '• `symbol` - Token symbol (required)\n' +
                    '• `supply` - Total supply (optional, default: 1 billion)\n' +
                    '• `decimals` - Decimals (optional, default: 18)\n' +
                    '• `buy` - ETH amount to buy tokens (optional, default: 0)\n\n' +
                    '**Or start interactive mode:** `/start`\n\n' +
                    '**Token Distribution:**\n' +
                    '• If you buy tokens: You get tokens based on your ETH amount\n' +
                    '• Remaining tokens: Sent to liquidity pool for market\n' +
                    '• All tokens go to LP if buy=0 or not specified\n\n' +
                    '**Fee Structure:**\n' +
                    '• 1% transfer fee on all transfers\n' +
                    '• 0.5% goes to you (creator)\n' +
                    '• 0.5% goes to $TOWNS buyback & burn',
            )
        }
    } else {
        // Multi-step workflow mode
        const existingWorkflow = getWorkflow(userId)
        
        if (existingWorkflow) {
            await handler.sendMessage(
                channelId,
                `⚠️ You already have an active deployment workflow. It will timeout after 30 minutes of inactivity.`,
            )
            return
        }
        
        startWorkflow(channelId, userId)
        await handler.sendMessage(
            channelId,
            '🚀 **Token Deployment Started**\n\n' +
                'I\'ll guide you through creating your token step by step.\n\n' +
                '**Step 1 of 5:** What should your token be named?\n' +
                '(Just type the name in chat)\n\n' +
                '💡 Default supply will be 1 billion tokens',
        )
    }
})

// Handle workflow steps via messages
bot.onMessage(async (handler, event) => {
    const { message, channelId, userId } = event
    
    // Skip if this is the bot's own message or not related to token deployment
    if (event.userId === bot.botId) {
        return
    }
    
    // Check for existing message handlers first
    if (message.includes('hello')) {
        await handler.sendMessage(channelId, 'Hello there! 👋')
        return
    }
    if (message.includes('ping')) {
        const now = new Date()
        await handler.sendMessage(channelId, `Pong! 🏓 ${now.getTime() - event.createdAt.getTime()}ms`)
        return
    }
    if (message.includes('react')) {
        await handler.sendReaction(channelId, event.eventId, '👍')
        return
    }
    
    // Check for token deployment workflow
    const workflow = getWorkflow(userId)
    if (!workflow || workflow.channelId !== channelId) {
        return // No active workflow for this user
    }
    
    // Handle workflow steps
    switch (workflow.step) {
        case 'awaiting_name': {
            const result = setTokenName(userId, message)
            if (!result.success) {
                await handler.sendMessage(channelId, `❌ ${result.error}\n\nPlease try again with a valid token name.`)
                return
            }
            await handler.sendMessage(
                channelId,
                `✅ Token name set to: **${workflow.tokenParams.name}**\n\n` +
                    '**Step 2 of 5:** What should the token symbol be? (e.g., BTC, ETH)\n' +
                    '(Just type the symbol in chat)',
            )
            break
        }
        
        case 'awaiting_symbol': {
            const result = setTokenSymbol(userId, message)
            if (!result.success) {
                await handler.sendMessage(channelId, `❌ ${result.error}\n\nPlease try again with a valid token symbol.`)
                return
            }
            await handler.sendMessage(
                channelId,
                `✅ Token symbol set to: **${workflow.tokenParams.symbol}**\n\n` +
                    '**Step 3 of 5:** What should the total supply be?\n' +
                    '(Enter a number, e.g., 1000000000 for 1 billion tokens)\n' +
                    '(Type a number, or "skip" for default: 1 billion)',
            )
            break
        }
        
        case 'awaiting_supply': {
            const supplyInput = message.trim().toLowerCase()
            const result = setTotalSupply(userId, supplyInput === 'skip' || supplyInput === '' ? undefined : supplyInput)
            if (!result.success) {
                await handler.sendMessage(channelId, `❌ ${result.error}\n\nPlease try again with a valid supply amount.`)
                return
            }
            await handler.sendMessage(
                channelId,
                `✅ Total supply set to: **${formatSupply(workflow.tokenParams.totalSupply!, 18)}**\n\n` +
                    '**Step 4 of 5:** How many decimals? (Default: 18)\n' +
                    '(Type a number 0-18, or "skip" for default)',
            )
            break
        }
        
        case 'awaiting_decimals': {
            const decimalsInput = message.trim().toLowerCase()
            const decimalsResult = setDecimals(userId, decimalsInput === 'skip' || decimalsInput === '' ? undefined : decimalsInput)
            if (!decimalsResult.success) {
                await handler.sendMessage(channelId, `❌ ${decimalsResult.error}\n\nPlease try again with a valid number of decimals (0-18).`)
                return
            }
            await handler.sendMessage(
                channelId,
                `✅ Decimals set to: **${workflow.tokenParams.decimals}**\n\n` +
                    '**Step 5 of 5:** How much ETH do you want to spend buying tokens?\n' +
                    '(Enter amount in ETH, e.g., "0.1" for 0.1 ETH, or "0" or "skip" to send all to LP)\n' +
                    '(Just type the amount in chat)',
            )
            break
        }
        
        case 'awaiting_creator_buy': {
            const buyInput = message.trim().toLowerCase()
            const buyResult = setCreatorBuyAmount(userId, buyInput === 'skip' || buyInput === '' ? '0' : buyInput)
            if (!buyResult.success) {
                await handler.sendMessage(channelId, `❌ ${buyResult.error}\n\nPlease try again with a valid ETH amount (e.g., 0.1).`)
                return
            }
            
            const params = getTokenParams(userId, userId as `0x${string}`)
            if (!params) {
                await handler.sendMessage(channelId, '❌ Error: Failed to prepare token parameters. Please start over with `/start`.')
                cancelWorkflow(userId)
                return
            }
            
            const buyAmountEth = params.creatorBuyAmount ? Number(params.creatorBuyAmount) / 1e18 : 0
            
            // Check if gas payment is needed
            if (buyAmountEth === 0) {
                // No buy amount, check prepaid balance
                const prepaidBalance = getPrepaymentBalance(userId)
                const gasNeededEth = Number(ESTIMATED_GAS_WEI) / 1e18
                
                if (prepaidBalance < ESTIMATED_GAS_WEI) {
                    const currentBalanceEth = Number(prepaidBalance) / 1e18
                    const remainingNeeded = gasNeededEth - currentBalanceEth
                    
                    // Move to awaiting_gas_payment step
                    const currentWorkflow = getWorkflow(userId)
                    if (currentWorkflow) {
                        currentWorkflow.step = 'awaiting_gas_payment'
                    }
                    
                    await handler.sendMessage(
                        channelId,
                        `⚠️ **Gas Payment Required**\n\n` +
                            `You chose not to buy tokens, so you need to prepay gas.\n\n` +
                            `**Your Prepaid Balance:** ${currentBalanceEth.toFixed(4)} ETH\n` +
                            `**Gas Needed:** ${gasNeededEth.toFixed(4)} ETH\n` +
                            `**Remaining:** ${remainingNeeded.toFixed(4)} ETH\n\n` +
                            `💡 **Please tip the bot ${remainingNeeded.toFixed(4)} ETH** to continue.\n\n` +
                            `Once you tip, I'll automatically proceed with deployment.\n\n` +
                            `Or type "cancel" to cancel this deployment.`,
                    )
                    return
                }
                // Has enough prepaid, proceed to deployment
            }
            
            const distribution = buyAmountEth > 0 
                ? `You will buy tokens with **${buyAmountEth.toFixed(4)} ETH**, remaining tokens go to LP`
                : 'All tokens will go to liquidity pool'
            
            await handler.sendMessage(
                channelId,
                '**Ready to Deploy!**\n\n' +
                    `**Token Summary:**\n` +
                    `• Name: ${params.name}\n` +
                    `• Symbol: ${params.symbol}\n` +
                    `• Decimals: ${params.decimals}\n` +
                    `• Total Supply: ${formatSupply(params.totalSupply, params.decimals)} ${params.symbol}\n` +
                    `• Creator: ${params.creator}\n` +
                    `• Distribution: ${distribution}\n\n` +
                    '🚀 Deploying your token... This may take a moment.',
            )
            
            // Consume prepayment if used
            if (buyAmountEth === 0) {
                consumePrepayment(userId, ESTIMATED_GAS_WEI)
            }
            
            // Deploy token
            const deployResult = await deployToken(
                bot.viem as any,
                bot.viem.account!,
                bot.appAddress,
                params,
            )
            
            await handler.sendMessage(channelId, formatDeploymentMessage(deployResult, params))
            completeWorkflow(userId)
            break
        }
        
        case 'awaiting_gas_payment': {
            // User should be tipping, wait for onTip event
            // Check if they're trying to cancel
            if (message.trim().toLowerCase() === 'cancel') {
                cancelWorkflow(userId)
                await handler.sendMessage(channelId, '❌ Token deployment cancelled.')
                return
            }
            
            // Check if they've tipped enough now
            const prepaidBalance = getPrepaymentBalance(userId)
            const gasNeededEth = Number(ESTIMATED_GAS_WEI) / 1e18
            
            if (prepaidBalance >= ESTIMATED_GAS_WEI) {
                // They've paid enough! Proceed with deployment
                const params = getTokenParams(userId, userId as `0x${string}`)
                if (!params) {
                    await handler.sendMessage(channelId, '❌ Error: Failed to prepare token parameters. Please start over with `/start`.')
                    cancelWorkflow(userId)
                    return
                }
                
                await handler.sendMessage(
                    channelId,
                    '✅ **Gas payment received!**\n\n' +
                        '**Ready to Deploy!**\n\n' +
                        `**Token Summary:**\n` +
                        `• Name: ${params.name}\n` +
                        `• Symbol: ${params.symbol}\n` +
                        `• Decimals: ${params.decimals}\n` +
                        `• Total Supply: ${formatSupply(params.totalSupply, params.decimals)} ${params.symbol}\n` +
                        `• Distribution: All tokens → Liquidity Pool\n\n` +
                        '🚀 Deploying your token... This may take a moment.',
                )
                
                // Consume prepayment
                consumePrepayment(userId, ESTIMATED_GAS_WEI)
                
                // Deploy token
                const deployResult = await deployToken(
                    bot.viem as any,
                    bot.viem.account!,
                    bot.appAddress,
                    params,
                )
                
                await handler.sendMessage(channelId, formatDeploymentMessage(deployResult, params))
                completeWorkflow(userId)
            } else {
                const currentBalanceEth = Number(prepaidBalance) / 1e18
                const remainingNeeded = gasNeededEth - currentBalanceEth
                await handler.sendMessage(
                    channelId,
                    `💰 Current balance: ${currentBalanceEth.toFixed(4)} ETH\n` +
                        `Still need ${remainingNeeded.toFixed(4)} ETH\n\n` +
                        `Please tip the bot, or type "cancel" to cancel.`,
                )
            }
            break
        }
        
        default:
            // Should not reach here
            break
    }
})

// Helper function to format supply
function formatSupply(supply: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals)
    const wholePart = supply / divisor
    const fractionalPart = supply % divisor
    
    if (fractionalPart === 0n) {
        return wholePart.toLocaleString()
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmed = fractionalStr.replace(/0+$/, '')
    
    return trimmed ? `${wholePart.toLocaleString()}.${trimmed}` : wholePart.toLocaleString()
}

const { jwtMiddleware, handler } = bot.start()

const app = new Hono()
app.use(logger())
app.post('/webhook', jwtMiddleware, handler)

// Start the server
const port = parseInt(process.env.PORT || '5123')
console.log(`🚀 Bot server starting on port ${port}...`)

export default {
    port,
    fetch: app.fetch,
}
