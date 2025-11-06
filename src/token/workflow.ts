import type { TokenWorkflowState, TokenParams } from './types'
import { validateTokenName, validateTokenSymbol, validateTotalSupply, validateDecimals, validateIconUrl, validateCreatorBuyAmount } from '../utils/validation'

/**
 * In-memory storage for token deployment workflows
 * Key: userId, Value: workflow state
 */
const workflows = new Map<string, TokenWorkflowState>()

/**
 * Workflow timeout: 30 minutes
 */
const WORKFLOW_TIMEOUT = 30 * 60 * 1000

/**
 * Clean up expired workflows
 */
function cleanupExpiredWorkflows() {
    const now = Date.now()
    for (const [userId, workflow] of workflows.entries()) {
        if (now - workflow.createdAt > WORKFLOW_TIMEOUT) {
            workflows.delete(userId)
        }
    }
}

/**
 * Get workflow state for a user
 */
export function getWorkflow(userId: string): TokenWorkflowState | undefined {
    cleanupExpiredWorkflows()
    return workflows.get(userId)
}

/**
 * Find any user in a channel with an active workflow waiting for gas payment
 */
export function findAwaitingGasPaymentInChannel(channelId: string): { userId: string; workflow: TokenWorkflowState } | undefined {
    cleanupExpiredWorkflows()
    
    for (const [userId, workflow] of workflows.entries()) {
        if (workflow.channelId === channelId && workflow.step === 'awaiting_gas_payment') {
            return { userId, workflow }
        }
    }
    
    return undefined
}

/**
 * Start a new workflow
 */
export function startWorkflow(channelId: string, userId: string): TokenWorkflowState {
    const workflow: TokenWorkflowState = {
        step: 'awaiting_name',
        channelId,
        userId,
        tokenParams: {},
        createdAt: Date.now(),
    }
    
    workflows.set(userId, workflow)
    return workflow
}

/**
 * Update workflow with token name
 */
export function setTokenName(userId: string, name: string): { success: boolean; error?: string } {
    const validation = validateTokenName(name)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    if (!workflow || workflow.step !== 'awaiting_name') {
        return { success: false, error: 'No active workflow or wrong step' }
    }
    
    workflow.tokenParams.name = name.trim()
    workflow.step = 'awaiting_symbol'
    workflow.createdAt = Date.now() // Reset timeout
    
    return { success: true }
}

/**
 * Update workflow with token symbol
 */
export function setTokenSymbol(userId: string, symbol: string): { success: boolean; error?: string } {
    const validation = validateTokenSymbol(symbol)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    if (!workflow || workflow.step !== 'awaiting_symbol') {
        return { success: false, error: 'No active workflow or wrong step' }
    }
    
    workflow.tokenParams.symbol = symbol.trim().toUpperCase()
    workflow.step = 'awaiting_supply'
    workflow.createdAt = Date.now()
    
    return { success: true }
}

/**
 * Update workflow with total supply
 */
export function setTotalSupply(userId: string, supply: string | undefined): { success: boolean; error?: string } {
    const validation = validateTotalSupply(supply)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    if (!workflow || workflow.step !== 'awaiting_supply') {
        return { success: false, error: 'No active workflow or wrong step' }
    }
    
    workflow.tokenParams.totalSupply = validation.value!
    workflow.step = 'awaiting_decimals'
    workflow.createdAt = Date.now()
    
    return { success: true }
}

/**
 * Update workflow with decimals (optional)
 */
export function setDecimals(userId: string, decimals: string | undefined): { success: boolean; error?: string } {
    const validation = validateDecimals(decimals)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    if (!workflow || workflow.step !== 'awaiting_decimals') {
        return { success: false, error: 'No active workflow or wrong step' }
    }
    
    workflow.tokenParams.decimals = validation.value!
    workflow.step = 'awaiting_icon'
    workflow.createdAt = Date.now()
    
    return { success: true }
}

/**
 * Update workflow with token icon URL (optional)
 */
export function setIconUrl(userId: string, url: string | undefined): { success: boolean; error?: string } {
    console.log('🎨 setIconUrl called for user:', userId)
    console.log('   Input URL:', url)
    
    const validation = validateIconUrl(url)
    console.log('   Validation result:', validation)
    
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    console.log('   Workflow found:', workflow ? `step: ${workflow.step}` : 'null')
    
    if (!workflow || workflow.step !== 'awaiting_icon') {
        return { success: false, error: `No active workflow or wrong step (current: ${workflow?.step})` }
    }
    
    workflow.tokenParams.iconUrl = validation.url
    workflow.step = 'awaiting_creator_buy'
    workflow.createdAt = Date.now()
    
    console.log('   Icon URL set to:', validation.url)
    console.log('   Next step:', workflow.step)
    
    return { success: true }
}

/**
 * Update workflow with creator buy amount (optional)
 */
export function setCreatorBuyAmount(userId: string, amount: string | undefined): { success: boolean; error?: string } {
    const validation = validateCreatorBuyAmount(amount)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }
    
    const workflow = workflows.get(userId)
    if (!workflow || workflow.step !== 'awaiting_creator_buy') {
        return { success: false, error: 'No active workflow or wrong step' }
    }
    
    workflow.tokenParams.creatorBuyAmount = validation.value!
    workflow.step = 'awaiting_confirm'
    workflow.createdAt = Date.now()
    
    return { success: true }
}

/**
 * Get completed token parameters (ready for deployment)
 */
export function getTokenParams(userId: string, creator: `0x${string}`): TokenParams | null {
    const workflow = workflows.get(userId)
    
    // Allow getting params from either awaiting_confirm or awaiting_gas_payment steps
    if (!workflow || (workflow.step !== 'awaiting_confirm' && workflow.step !== 'awaiting_gas_payment')) {
        return null
    }
    
    const params = workflow.tokenParams
    
    if (!params.name || !params.symbol || !params.totalSupply || params.decimals === undefined) {
        return null
    }
    
    return {
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        totalSupply: params.totalSupply,
        creator,
        creatorBuyAmount: params.creatorBuyAmount,
    }
}

/**
 * Complete workflow (delete after deployment)
 */
export function completeWorkflow(userId: string): void {
    workflows.delete(userId)
}

/**
 * Cancel workflow
 */
export function cancelWorkflow(userId: string): boolean {
    return workflows.delete(userId)
}

