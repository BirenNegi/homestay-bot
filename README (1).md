# 🏔️ Mountain Coworking Stay — WhatsApp Bot

> AI-powered WhatsApp chatbot for **Mountain Coworking Stay** homestay, Sarainkhet, Almora, Uttarakhand.  
> Handles guest enquiries, room bookings, payment links, and AI responses — automatically.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp_Cloud_API-25D366?style=flat&logo=whatsapp&logoColor=white)
![Render](https://img.shields.io/badge/Hosted_on-Render-46E3B7?style=flat&logo=render&logoColor=white)
![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-FF6B35?style=flat)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-02042B?style=flat&logo=razorpay&logoColor=white)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Deployment (Render)](#-deployment-render)
- [WhatsApp / Meta Setup](#-whatsapp--meta-setup)
- [Bot Commands](#-bot-commands)
- [Message Flow](#-message-flow)
- [Razorpay Payments](#-razorpay-payments)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 💬 **Auto-replies** to common guest questions (pricing, check-in, availability)
- 🤖 **AI responses** via OpenRouter for any question not matched by keywords
- 💳 **Razorpay payment links** generated on demand for booking advance
- 🌐 **Multilingual** — replies in the same language the guest uses
- ⚡ **Instant** — responds within 1–2 seconds of receiving a message

---

## 🛠 Tech Stack

| Component | Technology | Cost |
|---|---|---|
| WhatsApp API | Meta WhatsApp Cloud API | Free (1,000 conv/month) |
| Hosting | Render.com | Free tier / $7/month paid |
| Bot Logic | Node.js + Express | Free |
| AI Responses | OpenRouter (auto model) | Free tier |
| Payments | Razorpay Payment Links | 2% per transaction |
| HTTP Client | Axios | Free |
| Config | dotenv | Free |

---

## 📁 Project Structure

```
homestay-bot/
├── index.js          # Main bot — Express server, webhook handlers, AI + payment logic
├── package.json      # Dependencies and start script
├── .env              # Secret keys — local dev only, never commit to Git
├── .gitignore        # Excludes .env and node_modules
└── README.md         # This file
```

---

## 🔑 Environment Variables

Set these in **Render Dashboard → homestay-bot → Environment**.  
For local development, create a `.env` file in the project root.

```env
WA_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=1080399551813345
VERIFY_TOKEN=homestay_secret_2024
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
OPENROUTER_API_KEY=sk-or-v1-...
```

| Variable | Where to Get |
|---|---|
| `WA_TOKEN` | Meta Developer Console → API Setup → Generate token |
| `PHONE_NUMBER_ID` | Meta Developer Console → API Setup → Phone Number ID |
| `VERIFY_TOKEN` | Any secret string you choose — must match Facebook Console |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) → Keys |

> ⚠️ **Never commit `.env` to GitHub.** Make sure `.gitignore` includes `.env`.

---

## 💻 Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/homestay-bot.git
cd homestay-bot

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Fill in your keys in .env

# Start the bot locally
npm start
```

To test the webhook locally, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Copy the https URL and set it as your webhook in Meta Console
```

---

## 🚀 Deployment (Render)

### Live URLs

| | URL |
|---|---|
| **App** | https://homestay-bot.onrender.com |
| **Webhook** | https://homestay-bot.onrender.com/webhook |
| **Dashboard** | https://dashboard.render.com → My project → homestay-bot |

### Deploy after code changes

```bash
git add .
git commit -m "describe your change"
git push
```

Render auto-detects the push and redeploys in ~60 seconds. Check **Render → Logs** to confirm the app restarted successfully.

### ⚠️ Free Tier Sleep Warning

Render's free tier **spins down after 15 minutes of inactivity**. This means:
- Facebook webhook verification may **fail** if the app is sleeping
- First message after inactivity may have a ~30 second delay

**Fix:** Set up a free pinger at [uptimerobot.com](https://uptimerobot.com) to ping `https://homestay-bot.onrender.com` every 10 minutes. This keeps the app awake 24/7.

---

## 📱 WhatsApp / Meta Setup

### App Details

| | |
|---|---|
| App Name | mountaincoworkingstay |
| App Type | Business |
| Test Number | +1 555 171 5854 |
| Phone Number ID | 1080399551813345 |

### Webhook Configuration

| Field | Value |
|---|---|
| Callback URL | `https://homestay-bot.onrender.com/webhook` |
| Verify Token | `homestay_secret_2024` |
| Subscribed Fields | `messages`, `message_status` |

### Verify Webhook

Test the webhook is healthy by opening this in your browser:

```
https://homestay-bot.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=homestay_secret_2024&hub.challenge=testchallenge
```

✅ Expected response: `testchallenge`

### Re-verifying after redeploy

1. Open `https://homestay-bot.onrender.com` in browser (wakes app if sleeping)
2. Go to [developers.facebook.com](https://developers.facebook.com) → App → WhatsApp → Configuration
3. Enter Callback URL and Verify Token → click **Verify and save**

---

## 🤖 Bot Commands

| Guest Sends | Bot Responds With |
|---|---|
| `hi` / `hello` / `namaste` | Welcome message + menu |
| `price` / `rate` / `cost` | Room rates (Standard, Deluxe, Suite) |
| `book` / `available` | Asks for check-in, check-out, guests |
| `pay` | Razorpay payment link (Rs.1500 advance) |
| `checkin` / `check-in` / `timing` | Check-in 12PM, Check-out 11AM + location |
| Anything else | OpenRouter AI answers intelligently |

---

## 📊 Message Flow

```
Guest sends WhatsApp message
        │
        ▼
Meta delivers POST to /webhook
        │
        ▼
Bot checks for keywords
   ┌────┴────┐
   │         │
Match     No match
   │         │
Fixed     OpenRouter AI
reply      generates reply
   │         │
   └────┬────┘
        │
        ▼
Bot sends reply via WhatsApp API
        │
        ▼
Guest receives reply (1–2 seconds)
```

---

## 💳 Razorpay Payments

- **Advance amount:** Rs. 1,500 (set in `index.js` as `150000` paise)
- **Fee:** 2% per transaction, no monthly charges
- **Settlement:** 2 business days to your bank account
- **To change amount:** edit the `amount` value in `index.js` (Rs × 100 = paise)

---

## 🔧 Troubleshooting

### Webhook verification fails
- App may be sleeping → open `https://homestay-bot.onrender.com` in browser first, then retry
- Wrong verify token → must be exactly `homestay_secret_2024`
- Check **Render → Logs** for errors

### Bot not replying to messages
- Check `WA_TOKEN` hasn't expired (expires every 24hrs on temp token)
- Check `OPENROUTER_API_KEY` is valid in Render → Environment
- Ensure `messages` field is subscribed in Meta webhook config
- App may be sleeping → set up UptimeRobot pinger

### Checking logs
```
Render Dashboard → homestay-bot → Logs
```
Trigger a test message from Facebook and watch logs simultaneously to debug.

---

## 📞 Contact

**Mountain Coworking Stay**  
Sarainkhet, Almora, Uttarakhand  
📞 8130979874  
📧 Negiveer227@gmail.com

---

*Hosted on [Render.com](https://render.com) · Powered by [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp) · AI by [OpenRouter](https://openrouter.ai)*
