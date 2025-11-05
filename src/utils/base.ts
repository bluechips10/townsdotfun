import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'

export const BASE_CHAIN_ID = parseInt(process.env.CHAIN_ID || '8453')
export const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
export const BASE_EXPLORER_URL = process.env.BASE_EXPLORER_URL || 'https://basescan.org'
export const TOWNS_TOKEN_ADDRESS = (process.env.TOWNS_TOKEN_ADDRESS || '0x00000000bcA93b25a6694ca3d2109d545988b13B') as `0x${string}`
export const BUYBACK_ROUTER_ADDRESS = (process.env.BUYBACK_ROUTER_ADDRESS || '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24') as `0x${string}`
export const WETH_ADDRESS = (process.env.WETH_ADDRESS || '0x4200000000000000000000000000000000000006') as `0x${string}`

// Gas estimation for token deployment
export const ESTIMATED_DEPLOYMENT_GAS_ETH = parseFloat(process.env.DEPLOYMENT_GAS_ETH || '0.01') // 0.01 ETH default

/**
 * Get the Base chain configuration based on CHAIN_ID
 */
export function getBaseChain() {
    return BASE_CHAIN_ID === 8453 ? base : baseSepolia
}

/**
 * Create a public client for Base network
 * Used for read-only operations (contract reads, transaction monitoring)
 */
export function createBasePublicClient() {
    const chain = getBaseChain()
    
    return createPublicClient({
        chain,
        transport: http(BASE_RPC_URL),
    })
}

/**
 * Get BaseScan explorer URL for a transaction or address
 */
export function getBaseScanUrl(type: 'tx' | 'address' | 'token', hash: string): string {
    return `${BASE_EXPLORER_URL}/${type}/${hash}`
}

