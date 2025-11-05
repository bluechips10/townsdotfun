# Gas Payment Model - Hybrid Approach

## Overview

The bot uses a **hybrid gas payment model** where creators pay for their own deployments through two flexible options.

---

## How Gas Payment Works

### Gas Requirement
- **Estimated Cost:** ~0.01 ETH per token deployment
- **Configurable:** Set via `DEPLOYMENT_GAS_ETH` env variable
- **Network:** Base mainnet (cheaper than Ethereum mainnet)

### Who Pays?
**Creator always pays** - not the bot owner. The bot just facilitates the transaction.

---

## Option 1: Buy Tokens on Deployment (Recommended)

**How it works:**
1. Creator specifies `buy=0.02` (or any amount ≥ 0.01 ETH)
2. Bot deducts ~0.01 ETH for gas automatically
3. Remaining ETH (0.01 ETH) is used to buy tokens
4. Creator receives tokens immediately
5. Remaining tokens go to liquidity pool

**Example:**
```
/deploy-token name=MyToken symbol=MTK supply=1000000 buy=0.05
```

**Breakdown:**
- Total: 0.05 ETH
- Gas: 0.01 ETH (deducted)
- Token purchase: 0.04 ETH (remaining)
- Creator receives: Tokens worth 0.04 ETH
- LP receives: All remaining tokens

**Pros:**
- ✅ Single transaction
- ✅ Simple UX
- ✅ Get tokens immediately
- ✅ One-step process

**Cons:**
- ❌ Minimum 0.01 ETH required

---

## Option 2: Prepay Gas via Tip

**How it works:**
1. Creator tips the bot 0.01 ETH (or more)
2. Bot tracks prepayment balance per user
3. Creator runs `/deploy-token` with `buy=0`
4. Bot uses prepaid balance for gas
5. All tokens go to liquidity pool

**Example:**
```
# Step 1: Tip bot for gas
(Tip bot 0.01 ETH in Towns)

# Step 2: Check balance
/gas-balance

# Step 3: Deploy
/deploy-token name=MyToken symbol=MTK supply=1000000
```

**Prepayment Features:**
- Balance tracked per user
- Can accumulate multiple tips
- 1 hour timeout (unused balance expires)
- Check balance anytime with `/gas-balance`

**Pros:**
- ✅ Deploy without buying tokens
- ✅ All tokens to LP
- ✅ Can prepay for multiple deployments

**Cons:**
- ❌ Two-step process
- ❌ Prepayments expire after 1 hour

---

## Gas Validation Logic

### If `buy > 0` (Option 1):
```typescript
if (buy >= 0.01 ETH) {
    ✅ Proceed with deployment
    Gas: 0.01 ETH
    Tokens: (buy - 0.01) ETH worth
} else {
    ❌ Error: "Minimum 0.01 ETH needed for gas"
}
```

### If `buy = 0` (Option 2):
```typescript
if (prepaidBalance >= 0.01 ETH) {
    ✅ Proceed with deployment
    Deduct 0.01 ETH from balance
    All tokens → LP
} else {
    ❌ Error: "Prepay gas first or use buy parameter"
}
```

---

## Implementation Details

### Prepayment Tracking
- **Storage:** In-memory Map (userId → balance)
- **Timeout:** 1 hour of inactivity
- **Persistence:** Lost on bot restart (use database for production)

### Gas Deduction
- **From buy amount:** Automatic (before token calculation)
- **From prepayment:** Manual deduction on deployment
- **Refunds:** No refunds for unused gas (simplified model)

### Token Distribution Calculation
```typescript
// After gas deduction
const remainingETH = buyAmount - gasAmount
const tokensToCreator = (remainingETH / initialPrice) * totalSupply
const tokensToLP = totalSupply - tokensToCreator
```

---

## Commands

### `/deploy-token` - Deploy with Buy
```
/deploy-token name=MyToken symbol=MTK supply=1000000 buy=0.05
```
- Minimum: `buy=0.01` (just gas, no tokens)
- Recommended: `buy=0.02+` (gas + tokens)

### `/deploy-token` - Deploy with Prepayment
```
# First, tip bot 0.01 ETH
# Then:
/deploy-token name=MyToken symbol=MTK supply=1000000
```

### `/gas-balance` - Check Prepayment
```
/gas-balance
```
Shows your prepaid balance and deployment eligibility.

---

## User Flow Examples

### Scenario 1: Creator Buys Tokens
```
User: /deploy-token name=MyToken symbol=MTK supply=1000000 buy=0.1

Bot: 🚀 Deploying your token...

Bot: ✅ Token Deployed Successfully!
     • Your tokens: 900,000 MTK (from 0.09 ETH)
     • LP tokens: 100,000 MTK
     • Gas paid: 0.01 ETH
```

### Scenario 2: Creator Prepays, All to LP
```
User: (Tips bot 0.01 ETH)

Bot: ✅ Gas Prepayment Received
     You have enough! Deploy with /deploy-token

User: /deploy-token name=MyToken symbol=MTK supply=1000000

Bot: ✅ Token Deployed Successfully!
     • All tokens (1,000,000 MTK) → Liquidity Pool
     • Gas paid: 0.01 ETH (from prepayment)
```

### Scenario 3: Insufficient Gas
```
User: /deploy-token name=MyToken symbol=MTK supply=1000000 buy=0.005

Bot: ❌ Deployment Failed
     Insufficient ETH. Minimum 0.01 ETH needed for gas.
     You provided 0.005 ETH.
```

---

## Future Enhancements

### 1. Exact Gas Calculation
- Calculate actual gas used
- Refund excess to creator
- Dynamic gas pricing based on network

### 2. Database Persistence
- Store prepayments in database
- Survive bot restarts
- Historical tracking

### 3. Batch Deployments
- Prepay once, deploy multiple tokens
- Bulk discount on gas

### 4. Gasless Deployments (Meta-transactions)
- ERC-4337 Account Abstraction
- Sponsor gas for specific users
- Promotional free deployments

---

## Configuration

### Environment Variables
```bash
# Gas estimation (default: 0.01 ETH)
DEPLOYMENT_GAS_ETH=0.01

# If you want to subsidize gas (bot pays)
SUBSIDIZE_GAS=false
```

### Adjusting Gas Estimates
```typescript
// In src/utils/base.ts
export const ESTIMATED_DEPLOYMENT_GAS_ETH = 0.015 // Increase if needed
```

---

## Security Considerations

1. **Prepayment Expiry:** 1 hour timeout prevents indefinite balance accumulation
2. **No Refunds:** Simplifies accounting, prevents gaming system
3. **Minimum Buy:** 0.01 ETH prevents spam deployments
4. **Rate Limiting:** Consider adding per-user deployment limits

---

## Summary

**Hybrid gas model = Creator always pays, but chooses how:**
- Buy tokens → Gas auto-deducted
- Prepay gas → Deploy later, all to LP

No central wallet needed. Bot owner doesn't subsidize anything. Scalable and sustainable. 🚀

