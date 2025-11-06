/**
 * Token deployment parameters
 */
export interface TokenParams {
    name: string
    symbol: string
    decimals: number
    totalSupply: bigint
    creator: `0x${string}` // Creator's Towns wallet address
    creatorBuyAmount?: bigint // Amount creator wants to buy (in ETH/wei)
    initialPrice?: bigint // Initial token price for liquidity pool
    iconUrl?: string // URL to token icon image
}

/**
 * Workflow state for multi-step token deployment
 */
export interface TokenWorkflowState {
    step: 'awaiting_name' | 'awaiting_symbol' | 'awaiting_supply' | 'awaiting_decimals' | 'awaiting_icon' | 'awaiting_creator_buy' | 'awaiting_gas_payment' | 'awaiting_confirm'
    channelId: string
    userId: string
    tokenParams: Partial<TokenParams>
    createdAt: number // Timestamp for timeout
    threadId?: string // Thread ID for keeping deployment flow organized
}

/**
 * Deployment result
 */
export interface DeploymentResult {
    success: boolean
    tokenAddress?: `0x${string}`
    transactionHash?: `0x${string}`
    error?: string
    gasUsed?: bigint
    tokensToCreator?: bigint
    tokensToLP?: bigint
}

