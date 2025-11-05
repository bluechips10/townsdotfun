/**
 * Validate token name
 */
export function validateTokenName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Token name cannot be empty' }
    }
    
    if (name.length > 50) {
        return { valid: false, error: 'Token name cannot exceed 50 characters' }
    }
    
    // Allow alphanumeric, spaces, and common symbols
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
        return { valid: false, error: 'Token name contains invalid characters' }
    }
    
    return { valid: true }
}

/**
 * Validate token symbol
 */
export function validateTokenSymbol(symbol: string): { valid: boolean; error?: string } {
    if (!symbol || symbol.trim().length === 0) {
        return { valid: false, error: 'Token symbol cannot be empty' }
    }
    
    if (symbol.length > 10) {
        return { valid: false, error: 'Token symbol cannot exceed 10 characters' }
    }
    
    // Allow only alphanumeric
    if (!/^[A-Z0-9]+$/.test(symbol.toUpperCase())) {
        return { valid: false, error: 'Token symbol must be alphanumeric only' }
    }
    
    return { valid: true }
}

/**
 * Validate total supply
 */
export function validateTotalSupply(supply: string | undefined): { valid: boolean; error?: string; value?: bigint } {
    // Default to 1 billion if not provided or "skip"
    if (!supply || supply.trim().length === 0 || supply.trim().toLowerCase() === 'skip') {
        const DEFAULT_SUPPLY = 1_000_000_000n * 10n ** 18n // 1 billion tokens with 18 decimals
        return { valid: true, value: DEFAULT_SUPPLY }
    }
    
    const supplyNum = parseFloat(supply)
    
    if (isNaN(supplyNum)) {
        return { valid: false, error: 'Total supply must be a valid number' }
    }
    
    if (supplyNum <= 0) {
        return { valid: false, error: 'Total supply must be greater than 0' }
    }
    
    // Maximum supply: 10^27 (1 billion tokens with 18 decimals)
    const MAX_SUPPLY = 1_000_000_000n * 10n ** 18n
    const supplyBigInt = BigInt(Math.floor(supplyNum * 1e18))
    
    if (supplyBigInt > MAX_SUPPLY) {
        return { valid: false, error: 'Total supply exceeds maximum allowed (1 billion tokens)' }
    }
    
    return { valid: true, value: supplyBigInt }
}

/**
 * Validate decimals
 */
export function validateDecimals(decimals: string | undefined): { valid: boolean; error?: string; value?: number } {
    if (!decimals) {
        return { valid: true, value: 18 } // Default to 18
    }
    
    const decimalsNum = parseInt(decimals, 10)
    
    if (isNaN(decimalsNum)) {
        return { valid: false, error: 'Decimals must be a valid number' }
    }
    
    if (decimalsNum < 0 || decimalsNum > 18) {
        return { valid: false, error: 'Decimals must be between 0 and 18' }
    }
    
    return { valid: true, value: decimalsNum }
}

/**
 * Validate wallet address format
 */
export function validateAddress(address: string): { valid: boolean; error?: string; normalized?: `0x${string}` } {
    if (!address || address.trim().length === 0) {
        return { valid: false, error: 'Address cannot be empty' }
    }
    
    // Check if it's a valid hex address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { valid: false, error: 'Invalid address format (must be 0x followed by 40 hex characters)' }
    }
    
    return { valid: true, normalized: address.toLowerCase() as `0x${string}` }
}

/**
 * Validate creator buy amount (in ETH)
 */
export function validateCreatorBuyAmount(amount: string | undefined): { valid: boolean; error?: string; value?: bigint } {
    if (!amount || amount.trim().length === 0 || amount.toLowerCase() === 'skip' || amount === '0') {
        return { valid: true, value: 0n } // No buy, send all to LP
    }
    
    const amountNum = parseFloat(amount)
    
    if (isNaN(amountNum)) {
        return { valid: false, error: 'Buy amount must be a valid number' }
    }
    
    if (amountNum < 0) {
        return { valid: false, error: 'Buy amount cannot be negative' }
    }
    
    // Convert to wei (18 decimals for ETH)
    const amountWei = BigInt(Math.floor(amountNum * 1e18))
    
    return { valid: true, value: amountWei }
}

/**
 * Parse command arguments in format: key=value key2=value2
 */
export function parseCommandArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    
    for (const arg of args) {
        const [key, ...valueParts] = arg.split('=')
        if (key && valueParts.length > 0) {
            result[key.toLowerCase()] = valueParts.join('=')
        }
    }
    
    return result
}

