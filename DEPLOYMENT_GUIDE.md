# Deployment Guide - Getting Your Bot Active on Towns

## Prerequisites

Before deploying, you need:
1. ✅ Bot code (you have this!)
2. ⏭️ Towns bot credentials (APP_PRIVATE_DATA)
3. ⏭️ JWT secret for webhook security
4. ⏭️ Hosting environment with public URL
5. ⏭️ ETH on Base network (for the bot's wallet to execute transactions)

---

## Step 1: Create a Bot on Towns

### Option A: Via Towns App (Recommended)
1. Go to Towns app (https://towns.com)
2. Navigate to your space settings
3. Go to "Apps" or "Bots" section
4. Click "Create Bot" or "New App"
5. Fill in bot details:
   - Name: "Token Deployer" (or your choice)
   - Description: "Deploy custom ERC20 tokens on Base"
   - Forwarding: Select "ALL_MESSAGES" (to receive all messages for workflow)
6. Save and copy your credentials:
   - `APP_PRIVATE_DATA` (base64 encoded)
   - `JWT_SECRET` (for webhook verification)

### Option B: Via Towns CLI (if available)
```bash
towns-cli create-bot \
  --name "Token Deployer" \
  --description "Deploy custom ERC20 tokens on Base" \
  --forwarding ALL_MESSAGES
```

---

## Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Bot Credentials (from Towns)
APP_PRIVATE_DATA=<your_base64_encoded_bot_credentials>
JWT_SECRET=<your_jwt_secret>

# Server Configuration
PORT=5123

# Base Network Configuration
CHAIN_ID=8453  # Use 84532 for Base Sepolia testnet
BASE_RPC_URL=https://mainnet.base.org  # Or use Alchemy/Infura RPC
BASE_EXPLORER_URL=https://basescan.org

# Fee Mechanism
TOWNS_TOKEN_ADDRESS=0x00000000bcA93b25a6694ca3d2109d545988b13B
BUYBACK_ROUTER_ADDRESS=0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24
WETH_ADDRESS=0x4200000000000000000000000000000000000006

# Gas Estimation
DEPLOYMENT_GAS_ETH=0.01  # Estimated gas cost in ETH
```

**Important:** Never commit `.env` to git! Add it to `.gitignore`.

---

## Step 3: Choose a Hosting Option

### Option A: Local Testing (Development)

**Best for:** Testing and development

```bash
# Install dependencies
bun install

# Compile the token contract
bun run compile

# Start the bot
bun run dev
```

**Then expose to internet using ngrok or similar:**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5123
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) - you'll need this for the webhook.

**Pros:**
- ✅ Free
- ✅ Instant setup
- ✅ Good for testing

**Cons:**
- ❌ URL changes on restart
- ❌ Not for production

---

### Option B: Cloud Hosting (Production)

#### Render.com (Recommended - Free Tier Available)

1. **Create account:** https://render.com
2. **New Web Service:**
   - Connect your GitHub repo
   - Build Command: `bun install && bun run compile`
   - Start Command: `bun run start`
   - Environment: Add all env variables from `.env`
3. **Get webhook URL:** `https://your-app.onrender.com/webhook`

**Pros:**
- ✅ Free tier available
- ✅ Auto-deploy on git push
- ✅ Persistent URL
- ✅ SSL included

**Cons:**
- ⚠️ May sleep on free tier (first request takes time)

---

#### Railway.app

1. **Create account:** https://railway.app
2. **New Project:**
   - Deploy from GitHub
   - Railway auto-detects and builds
   - Add environment variables
3. **Get webhook URL:** `https://your-app.railway.app/webhook`

**Pros:**
- ✅ $5 free credit/month
- ✅ Fast deployments
- ✅ No sleep on free tier

---

#### DigitalOcean App Platform

1. **Create account:** https://www.digitalocean.com
2. **App Platform:**
   - Create app from GitHub
   - Set build/run commands
   - Add env variables
3. **Get webhook URL:** `https://your-app.ondigitalocean.app/webhook`

**Cost:** ~$5/month

---

#### VPS (Advanced - Always On)

Best for production with high traffic.

1. **Get VPS:** DigitalOcean, Linode, AWS EC2, etc.
2. **SSH in and setup:**
   ```bash
   # Install bun
   curl -fsSL https://bun.sh/install | bash
   
   # Clone repo
   git clone <your-repo>
   cd innes
   
   # Install dependencies
   bun install
   
   # Create .env file
   nano .env  # Add your credentials
   
   # Compile contract
   bun run compile
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Start bot with PM2
   pm2 start "bun run start" --name token-bot
   pm2 save
   pm2 startup  # Auto-start on server reboot
   ```

3. **Setup reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /webhook {
           proxy_pass http://localhost:5123/webhook;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

4. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

**Webhook URL:** `https://your-domain.com/webhook`

---

## Step 4: Configure Webhook in Towns

Once your bot is hosted and accessible:

1. **Go to Towns bot settings**
2. **Set Webhook URL:** 
   - Enter: `https://your-deployed-url.com/webhook`
   - Example: `https://token-deployer.onrender.com/webhook`
3. **Save webhook configuration**
4. **Test the webhook:**
   - Towns may send a test event
   - Check your bot logs for incoming requests

---

## Step 5: Fund the Bot's Wallet

The bot needs ETH on Base to execute transactions:

1. **Get bot's wallet address:**
   - Check your `APP_PRIVATE_DATA` or bot settings in Towns
   - The bot's `appAddress` is its wallet

2. **Send ETH to bot's wallet:**
   - Send Base ETH to the bot's address
   - Recommended: 0.1-1.0 ETH to start
   - This covers gas for contract deployments

3. **Verify balance:**
   ```bash
   # Check bot's balance on BaseScan
   https://basescan.org/address/<bot-wallet-address>
   ```

**Note:** With the hybrid model, creators pay gas, but the bot still needs a small amount for transaction signing.

---

## Step 6: Test Your Bot

### In Towns App:

1. **Add bot to a channel**
2. **Test help command:**
   ```
   /help
   ```
3. **Test deployment (interactive mode):**
   ```
   /start
   ```
4. **Test quick deploy:**
   ```
   /start name=TestToken symbol=TEST buy=0.02
   ```

### Check Logs:

Monitor your bot logs for:
- Incoming webhook calls
- Message processing
- Deployment attempts
- Errors or issues

---

## Deployment Checklist

- [ ] Bot created in Towns
- [ ] `APP_PRIVATE_DATA` obtained
- [ ] `JWT_SECRET` obtained
- [ ] `.env` file configured with all variables
- [ ] Contract compiled (`bun run compile`)
- [ ] Bot hosted on public URL
- [ ] Webhook URL configured in Towns
- [ ] Bot wallet funded with Base ETH
- [ ] Bot added to a Towns channel
- [ ] Commands tested (`/help`, `/start`)
- [ ] Deployment flow tested

---

## Recommended Hosting for Your Use Case

**For testing/development:**
→ Use **ngrok** + local dev

**For production:**
→ Use **Render.com** or **Railway.app**
- Free/cheap tier available
- Auto-deploy from GitHub
- Persistent URLs
- Easy environment variables

**For high traffic:**
→ Use **VPS** (DigitalOcean, AWS, etc.)
- Always-on
- More control
- Better performance

---

## Environment Configuration Summary

Here's your complete `.env.sample`:

```bash
# ===================
# BOT CREDENTIALS
# ===================
APP_PRIVATE_DATA=towns-bot-<your_credentials_here>
JWT_SECRET=<your_jwt_secret_here>

# ===================
# SERVER CONFIG
# ===================
PORT=5123

# ===================
# BASE NETWORK
# ===================
CHAIN_ID=8453
BASE_RPC_URL=https://mainnet.base.org
BASE_EXPLORER_URL=https://basescan.org

# ===================
# TOKEN FEES
# ===================
TOWNS_TOKEN_ADDRESS=0x00000000bcA93b25a6694ca3d2109d545988b13B
BUYBACK_ROUTER_ADDRESS=0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24
WETH_ADDRESS=0x4200000000000000000000000000000000000006

# ===================
# GAS ESTIMATION
# ===================
DEPLOYMENT_GAS_ETH=0.01
```

---

## Troubleshooting

### Bot doesn't respond to commands
- ✅ Check webhook URL is correct in Towns settings
- ✅ Verify bot is running (check logs)
- ✅ Check `APP_PRIVATE_DATA` and `JWT_SECRET` are correct
- ✅ Ensure bot is added to the channel
- ✅ Verify forwarding is set to "ALL_MESSAGES"

### Deployment fails
- ✅ Check bot wallet has ETH on Base
- ✅ Verify contract is compiled (`bun run compile`)
- ✅ Check Base RPC URL is accessible
- ✅ Verify creator has enough ETH (if using buy parameter)

### Webhook errors
- ✅ Check logs for JWT verification errors
- ✅ Ensure webhook endpoint is `/webhook`
- ✅ Verify URL is publicly accessible (test with curl)

---

## Next Steps After Deployment

Once bot is live:

1. **Monitor gas usage** - Track bot's ETH balance
2. **Test with real users** - Deploy tokens on testnet first
3. **Implement token distribution** - Transfer tokens to creator & create LP
4. **Add analytics** - Track deployments, fees, etc.
5. **Optimize gas** - Fine-tune DEPLOYMENT_GAS_ETH estimate

---

## Quick Start Commands

```bash
# Local development
bun install
bun run compile
bun run dev

# Production deployment
bun install
bun run compile
bun run start
```

Your bot is ready to go live! 🚀

