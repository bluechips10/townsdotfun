# Quick Start - Get Bot Running in 5 Minutes

## For Testing (Local + ngrok)

### 1. Setup Environment
```bash
# Copy and edit .env
cp .env.sample .env
# Add your APP_PRIVATE_DATA and JWT_SECRET from Towns
```

### 2. Install & Compile
```bash
bun install
bun run compile
```

### 3. Start Bot Locally
```bash
bun run dev
```

### 4. Expose to Internet
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5123
```

### 5. Configure Webhook in Towns
- Copy your ngrok URL (e.g., `https://abc123.ngrok-free.app`)
- Go to Towns bot settings
- Set webhook URL to: `https://abc123.ngrok-free.app/webhook`

### 6. Test in Towns
```
/help
/start
```

---

## For Production (Render.com)

### 1. Push to GitHub
```bash
git add .
git commit -m "Token deployer bot"
git push
```

### 2. Deploy on Render
1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `bun install && bun run compile`
   - **Start Command:** `bun run start`
   - **Environment Variables:** Add all from `.env`

### 3. Configure Webhook
- Copy your Render URL (e.g., `https://your-bot.onrender.com`)
- Set webhook in Towns: `https://your-bot.onrender.com/webhook`

### 4. Fund Bot Wallet (Important!)
- Get bot's wallet address from Towns
- Send 0.1 ETH on Base to the wallet
- Check balance: https://basescan.org/address/<bot-address>

### 5. Test
```
/help
/start name=MyToken symbol=MTK buy=0.02
```

---

## What You Need from Towns

When creating the bot, you'll receive:

1. **APP_PRIVATE_DATA** - Long base64 string starting with `towns-bot-`
2. **JWT_SECRET** - Used to verify webhook requests
3. **Bot Wallet Address** - Where to send Base ETH for gas

These go in your `.env` file.

---

## Commands to Test

Once live, test these in order:

```
/help
→ Should show all commands

/start
→ Should start interactive token deployment

/start name=Test symbol=TEST buy=0.02
→ Should deploy token (once contract works)
```

---

## Current Status

Your bot code is ready! You just need:
1. ✅ Create bot in Towns (get credentials)
2. ✅ Host it somewhere (local + ngrok for testing)
3. ✅ Configure webhook URL in Towns
4. ✅ Fund bot wallet with Base ETH
5. ✅ Test in Towns channel

The hard part (code) is done! 🎉

