import { execute } from 'viem/experimental/erc7821'
import { waitForTransactionReceipt } from 'viem/actions'
import { parseEther, encodeFunctionData } from 'viem'
import type { Account, PublicClient, WalletClient } from 'viem'
import { BUYBACK_ROUTER_ADDRESS, WETH_ADDRESS } from '../utils/base'

/**
 * Uniswap V2 Router ABI (minimal - just what we need)
 */
const UNISWAP_V2_ROUTER_ABI = [
    {
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amountTokenDesired', type: 'uint256' },
            { name: 'amountTokenMin', type: 'uint256' },
            { name: 'amountETHMin', type: 'uint256' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'addLiquidityETH',
        outputs: [
            { name: 'amountToken', type: 'uint256' },
            { name: 'amountETH', type: 'uint256' },
            { name: 'liquidity', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
] as const

/**
 * ERC20 approve ABI
 */
const ERC20_APPROVE_ABI = [
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

/**
 * Create liquidity pool on Uniswap V2
 * 
 * @param viemClient Viem client with account
 * @param account Bot account
 * @param appAddress Bot's app address
 * @param tokenAddress Deployed token contract address
 * @param tokenAmount Amount of tokens to add to LP
 * @param ethAmount Amount of ETH to add to LP (sets initial price)
 * @param recipient Address to receive LP tokens
 */
export async function createLiquidityPool(
    viemClient: PublicClient & WalletClient,
    account: Account,
    appAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    tokenAmount: bigint,
    ethAmount: bigint,
    recipient: `0x${string}`,
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
    try {
        console.log('🏊 Creating liquidity pool...')
        console.log('   Token:', tokenAddress)
        console.log('   Token amount:', tokenAmount.toString())
        console.log('   ETH amount:', Number(ethAmount) / 1e18, 'ETH')
        console.log('   Recipient:', recipient)
        
        // Calculate deadline (10 minutes from now)
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
        
        // Batch: Approve router + Add liquidity
        const hash = await execute(viemClient, {
            address: appAddress,
            account,
            chain: null,
            calls: [
                // Step 1: Approve router to spend tokens
                {
                    to: tokenAddress,
                    abi: ERC20_APPROVE_ABI,
                    functionName: 'approve',
                    args: [BUYBACK_ROUTER_ADDRESS, tokenAmount],
                },
                // Step 2: Add liquidity (tokens + ETH)
                {
                    to: BUYBACK_ROUTER_ADDRESS,
                    abi: UNISWAP_V2_ROUTER_ABI,
                    functionName: 'addLiquidityETH',
                    args: [
                        tokenAddress,
                        tokenAmount,
                        0n, // amountTokenMin (accept any amount)
                        0n, // amountETHMin (accept any amount)
                        recipient, // LP tokens go to recipient
                        deadline,
                    ],
                    value: ethAmount, // Send ETH with transaction
                },
            ],
        })
        
        console.log('   Transaction sent:', hash)
        
        // Wait for confirmation
        const receipt = await waitForTransactionReceipt(viemClient, { hash })
        
        console.log('✅ Liquidity pool created!')
        console.log('   Gas used:', receipt.gasUsed.toString())
        
        return {
            success: true,
            txHash: hash,
        }
    } catch (error) {
        console.error('❌ LP creation failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
            success: false,
            error: `LP creation failed: ${errorMessage}`,
        }
    }
}

/**
 * Transfer tokens from bot to recipient
 */
export async function transferTokens(
    viemClient: PublicClient & WalletClient,
    account: Account,
    appAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    recipient: `0x${string}`,
    amount: bigint,
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
    try {
        console.log('📤 Transferring tokens...')
        console.log('   Token:', tokenAddress)
        console.log('   To:', recipient)
        console.log('   Amount:', amount.toString())
        
        const hash = await execute(viemClient, {
            address: appAddress,
            account,
            chain: null,
            calls: [{
                to: tokenAddress,
                abi: ERC20_APPROVE_ABI,
                functionName: 'transfer',
                args: [recipient, amount],
            }],
        })
        
        await waitForTransactionReceipt(viemClient, { hash })
        
        console.log('✅ Tokens transferred!')
        
        return {
            success: true,
            txHash: hash,
        }
    } catch (error) {
        console.error('❌ Token transfer failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
            success: false,
            error: `Transfer failed: ${errorMessage}`,
        }
    }
}

