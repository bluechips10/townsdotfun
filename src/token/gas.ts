import { parseEther } from 'viem'
import { ESTIMATED_DEPLOYMENT_GAS_ETH } from '../utils/base'

/**
 * Estimated gas cost for token deployment (in wei)
 */
export const ESTIMATED_GAS_WEI = parseEther(ESTIMATED_DEPLOYMENT_GAS_ETH.toString())

/**
 * Validate that creator has enough to cover gas
 * Returns adjusted amounts for token purchase after gas deduction
 */
export function validateGasPayment(creatorBuyAmount: bigint): {
    valid: boolean
    error?: string
    gasAmount: bigint
    remainingForTokens: bigint
    needsPrepayment: boolean
} {
    // If no buy amount, creator needs to prepay gas
    if (creatorBuyAmount === 0n) {
        return {
            valid: false,
            error: undefined, // Not an error, just needs prepayment
            gasAmount: ESTIMATED_GAS_WEI,
            remainingForTokens: 0n,
            needsPrepayment: true,
        }
    }
    
    // If buy amount < gas cost, insufficient
    if (creatorBuyAmount < ESTIMATED_GAS_WEI) {
        return {
            valid: false,
            error: `Insufficient ETH. Minimum ${formatEther(ESTIMATED_GAS_WEI)} ETH needed for gas. You provided ${formatEther(creatorBuyAmount)} ETH.`,
            gasAmount: ESTIMATED_GAS_WEI,
            remainingForTokens: 0n,
            needsPrepayment: false,
        }
    }
    
    // Buy amount covers gas
    const remaining = creatorBuyAmount - ESTIMATED_GAS_WEI
    
    return {
        valid: true,
        gasAmount: ESTIMATED_GAS_WEI,
        remainingForTokens: remaining,
        needsPrepayment: false,
    }
}

/**
 * Format ETH amount from wei
 */
function formatEther(wei: bigint): string {
    const eth = Number(wei) / 1e18
    return eth.toFixed(4)
}

/**
 * Calculate token distribution
 * @param totalSupply Total token supply
 * @param creatorBuyAmountETH ETH amount creator is spending (after gas deduction)
 * @param initialPricePerToken Initial price per token in ETH
 */
export function calculateTokenDistribution(
    totalSupply: bigint,
    creatorBuyAmountETH: bigint,
    initialPricePerToken: bigint = parseEther('0.00001'), // Default: 0.00001 ETH per token
): {
    tokensToCreator: bigint
    tokensToLP: bigint
} {
    if (creatorBuyAmountETH === 0n) {
        // All tokens go to LP
        return {
            tokensToCreator: 0n,
            tokensToLP: totalSupply,
        }
    }
    
    // Calculate how many tokens creator gets for their ETH
    // tokensToCreator = creatorBuyAmountETH / initialPricePerToken
    const tokensToCreator = (creatorBuyAmountETH * parseEther('1')) / initialPricePerToken
    
    // Ensure we don't exceed total supply
    const actualTokensToCreator = tokensToCreator > totalSupply ? totalSupply : tokensToCreator
    const tokensToLP = totalSupply - actualTokensToCreator
    
    return {
        tokensToCreator: actualTokensToCreator,
        tokensToLP,
    }
}

