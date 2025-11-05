import { waitForTransactionReceipt, sendTransaction } from 'viem/actions'
import { encodeAbiParameters, concat, encodeFunctionData, parseEther } from 'viem'
import type { Account, PublicClient, WalletClient } from 'viem'
import type { TokenParams, DeploymentResult } from './types'
import { getBaseScanUrl } from '../utils/base'
import { TOKEN_CONTRACT_BYTECODE, ERC20_ABI } from './contract'
import { validateGasPayment, calculateTokenDistribution } from './gas'
import { createLiquidityPool, transferTokens } from './uniswap'

/**
 * Deploy token contract to Base network
 * 
 * Flow:
 * 1. Deploy token contract (mints all tokens to deployer/bot)
 * 2. If creator wants to buy: transfer bought tokens to creator
 * 3. Send remaining tokens to liquidity pool (future: add LP, for now send to contract)
 */
export async function deployToken(
    viemClient: PublicClient & WalletClient,
    account: Account,
    appAddress: `0x${string}`,
    params: TokenParams,
): Promise<DeploymentResult> {
    try {
        // Check if bytecode is available
        if (!TOKEN_CONTRACT_BYTECODE || TOKEN_CONTRACT_BYTECODE === '0x') {
            return {
                success: false,
                error: 'Contract bytecode not compiled. Please run: bun run compile (once Solidity contract is created)',
            }
        }
        
        // Validate gas payment
        const gasValidation = validateGasPayment(params.creatorBuyAmount || 0n)
        
        // If needs prepayment and no buy amount
        if (gasValidation.needsPrepayment) {
            return {
                success: false,
                error: `⚠️ **Gas Payment Required**\n\n` +
                    `To deploy without buying tokens, you need to prepay gas.\n\n` +
                    `**Option 1:** Buy tokens on deployment\n` +
                    `Use \`buy=0.02\` or higher (min ${formatEther(gasValidation.gasAmount)} ETH for gas)\n\n` +
                    `**Option 2:** Prepay gas (NOT YET IMPLEMENTED)\n` +
                    `Send ${formatEther(gasValidation.gasAmount)} ETH tip to bot\n\n` +
                    `💡 **Tip:** Buying tokens on deployment is easier!`,
            }
        }
        
        // If buy amount insufficient
        if (!gasValidation.valid && gasValidation.error) {
            return {
                success: false,
                error: gasValidation.error,
            }
        }
        
        // Calculate token distribution
        const distribution = calculateTokenDistribution(
            params.totalSupply,
            gasValidation.remainingForTokens,
        )
        
        console.log('Deploying token:', {
            name: params.name,
            symbol: params.symbol,
            creatorBuyAmount: formatEther(params.creatorBuyAmount || 0n),
            gasDeducted: formatEther(gasValidation.gasAmount),
            remainingForTokens: formatEther(gasValidation.remainingForTokens),
            tokensToCreator: distribution.tokensToCreator.toString(),
            tokensToLP: distribution.tokensToLP.toString(),
        })
        
        // Encode constructor parameters for SimpleToken
        const constructorArgs = encodeAbiParameters(
            [
                { name: '_name', type: 'string' },
                { name: '_symbol', type: 'string' },
                { name: '_decimals', type: 'uint8' },
                { name: '_totalSupply', type: 'uint256' },
                { name: '_creator', type: 'address' },
            ],
            [
                params.name,
                params.symbol,
                params.decimals,
                params.totalSupply,
                params.creator,
            ],
        )
        
        // Concatenate bytecode with constructor args
        const deploymentData = concat([TOKEN_CONTRACT_BYTECODE as `0x${string}`, constructorArgs])
        
        // Deploy contract directly
        // Note: Gas is paid from the creator's buy amount (already validated above)
        const hash = await sendTransaction(viemClient, {
            account,
            to: null, // null = contract deployment
            data: deploymentData,
            chain: null,
            value: 0n, // No ETH sent with deployment (gas deducted from buy amount)
        })
        
        // Wait for transaction receipt
        const receipt = await waitForTransactionReceipt(viemClient, { hash })
        
        // Extract deployed contract address from receipt
        const tokenAddress = receipt.contractAddress as `0x${string}` | undefined
        
        if (!tokenAddress) {
            return {
                success: false,
                error: 'Could not determine contract address from receipt. Transaction hash: ' + hash,
            }
        }
        
        console.log('✅ Token deployed successfully!')
        console.log('   Token address:', tokenAddress)
        
        // Step 2: Distribute tokens
        console.log('📦 Distributing tokens...')
        
        // If creator bought tokens, transfer them
        if (distribution.tokensToCreator > 0n) {
            console.log('   Transferring', distribution.tokensToCreator.toString(), 'tokens to creator')
            
            const transferResult = await transferTokens(
                viemClient,
                account,
                appAddress,
                tokenAddress,
                params.creator,
                distribution.tokensToCreator,
            )
            
            if (!transferResult.success) {
                console.warn('⚠️ Token transfer to creator failed:', transferResult.error)
                // Continue anyway - creator can get tokens from LP
            }
        }
        
        // Step 3: Create liquidity pool with remaining tokens
        if (distribution.tokensToLP > 0n) {
            console.log('   Creating LP with', distribution.tokensToLP.toString(), 'tokens')
            
            // Use a small amount of ETH for initial liquidity (0.001 ETH)
            const lpEthAmount = parseEther('0.001')
            
            const lpResult = await createLiquidityPool(
                viemClient,
                account,
                appAddress,
                tokenAddress,
                distribution.tokensToLP,
                lpEthAmount,
                params.creator, // LP tokens go to creator
            )
            
            if (!lpResult.success) {
                console.warn('⚠️ LP creation failed:', lpResult.error)
                // Return warning but still show success
                return {
                    success: true,
                    tokenAddress,
                    transactionHash: hash,
                    tokensToCreator: distribution.tokensToCreator,
                    tokensToLP: distribution.tokensToLP,
                    gasUsed: gasValidation.gasAmount,
                    error: `Token deployed but LP creation failed: ${lpResult.error}. Tokens held by bot.`,
                }
            }
        }
        
        return {
            success: true,
            tokenAddress,
            transactionHash: hash,
            tokensToCreator: distribution.tokensToCreator,
            tokensToLP: distribution.tokensToLP,
            gasUsed: gasValidation.gasAmount,
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return {
            success: false,
            error: `Deployment failed: ${errorMessage}`,
        }
    }
}

/**
 * Format ETH amount from wei
 */
export function formatEther(wei: bigint): string {
    const eth = Number(wei) / 1e18
    return eth.toFixed(4)
}

/**
 * Format token deployment result message
 */
export function formatDeploymentMessage(
    result: DeploymentResult,
    params: TokenParams,
): string {
    if (!result.success || !result.tokenAddress || !result.transactionHash) {
        return `❌ **Deployment Failed**\n\n${result.error || 'Unknown error'}`
    }
    
    const txUrl = getBaseScanUrl('tx', result.transactionHash)
    const tokenUrl = getBaseScanUrl('token', result.tokenAddress)
    
    // Format distribution info
    let distributionInfo = ''
    if (result.tokensToCreator && result.tokensToCreator > 0n) {
        distributionInfo = (
            `\n**Token Distribution:**\n` +
            `• Your tokens: ${formatSupply(result.tokensToCreator, params.decimals)} ${params.symbol}\n` +
            `• LP tokens: ${formatSupply(result.tokensToLP || 0n, params.decimals)} ${params.symbol}\n` +
            `• Gas paid: ${formatEther(result.gasUsed || 0n)} ETH\n`
        )
    } else {
        distributionInfo = (
            `\n**Token Distribution:**\n` +
            `• All tokens (${formatSupply(result.tokensToLP || params.totalSupply, params.decimals)} ${params.symbol}) → Liquidity Pool\n`
        )
    }
    
    return (
        `✅ **Token Deployed Successfully!**\n\n` +
        `**Token Details:**\n` +
        `• Name: ${params.name}\n` +
        `• Symbol: ${params.symbol}\n` +
        `• Decimals: ${params.decimals}\n` +
        `• Total Supply: ${formatSupply(params.totalSupply, params.decimals)} ${params.symbol}\n\n` +
        `**Contract Address:**\n` +
        `${result.tokenAddress}\n\n` +
        `**Transaction:**\n` +
        `${txUrl}\n\n` +
        `**View on BaseScan:**\n` +
        `${tokenUrl}\n` +
        distributionInfo +
        `\n💡 **Fee Structure:**\n` +
        `• 1% transfer fee on all transfers\n` +
        `• 0.5% goes to creator (you)\n` +
        `• 0.5% goes to $TOWNS buyback & burn\n\n` +
        `⚠️ **Note:** Token distribution pending (creator tokens & LP creation not yet implemented)`
    )
}

/**
 * Format supply with decimals
 */
function formatSupply(supply: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals)
    const wholePart = supply / divisor
    const fractionalPart = supply % divisor
    
    if (fractionalPart === 0n) {
        return wholePart.toString()
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmed = fractionalStr.replace(/0+$/, '')
    
    return trimmed ? `${wholePart}.${trimmed}` : wholePart.toString()
}

