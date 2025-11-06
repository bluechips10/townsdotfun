import { parseEther } from 'viem'

/**
 * Track gas prepayments from users
 * Key: userId, Value: { amount, channelId, timestamp }
 */
const prepayments = new Map<string, {
    amount: bigint
    channelId: string
    timestamp: number
}>()

/**
 * Prepayment timeout: 1 hour
 */
const PREPAYMENT_TIMEOUT = 60 * 60 * 1000

/**
 * Clean up expired prepayments
 */
function cleanupExpiredPrepayments() {
    const now = Date.now()
    for (const [userId, payment] of prepayments.entries()) {
        if (now - payment.timestamp > PREPAYMENT_TIMEOUT) {
            prepayments.delete(userId)
        }
    }
}

/**
 * Record a gas prepayment from onTip event
 */
export function recordPrepayment(userId: string, channelId: string, amount: bigint): void {
    console.log('💰 recordPrepayment called')
    console.log('   User ID:', userId)
    console.log('   Amount:', Number(amount) / 1e18, 'ETH')
    
    cleanupExpiredPrepayments()
    
    const existing = prepayments.get(userId)
    console.log('   Existing balance:', existing ? Number(existing.amount) / 1e18 : 0, 'ETH')
    
    const newAmount = existing ? existing.amount + amount : amount
    console.log('   New total:', Number(newAmount) / 1e18, 'ETH')
    
    prepayments.set(userId, {
        amount: newAmount,
        channelId,
        timestamp: Date.now(),
    })
    
    console.log('   Prepayment recorded successfully')
}

/**
 * Check if user has prepaid gas
 */
export function hasPrepayment(userId: string, requiredAmount: bigint): boolean {
    cleanupExpiredPrepayments()
    
    const payment = prepayments.get(userId)
    if (!payment) {
        return false
    }
    
    return payment.amount >= requiredAmount
}

/**
 * Consume prepayment (deduct from user's balance)
 */
export function consumePrepayment(userId: string, amount: bigint): boolean {
    const payment = prepayments.get(userId)
    if (!payment || payment.amount < amount) {
        return false
    }
    
    payment.amount -= amount
    
    if (payment.amount === 0n) {
        prepayments.delete(userId)
    } else {
        payment.timestamp = Date.now() // Reset timeout
    }
    
    return true
}

/**
 * Get prepayment balance for user
 */
export function getPrepaymentBalance(userId: string): bigint {
    console.log('💳 getPrepaymentBalance called for:', userId)
    
    cleanupExpiredPrepayments()
    
    const payment = prepayments.get(userId)
    const balance = payment ? payment.amount : 0n
    
    console.log('   Balance:', Number(balance) / 1e18, 'ETH')
    
    return balance
}

