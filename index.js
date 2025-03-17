const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const { showWelcomeMenu } = require("./menus/welcome-menu");
const sessions = require("./actions/session");
const { showMainMenu } = require("./menus/main-menu");
const { newUserMenu } = require("./menus/new-user-menu");
const { handleViewWallets, handleCheckBalances, handleSetDefaultWallet, handleTransactionHistory } = require("./handlers/wallet-handler");
const { showWalletMenu } = require("./menus/wallet-menu");
require("dotenv").config()

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is missing in .env file!");
  process.exit(1);
}

const base_url = process.env.COPPERX_API;
if (!base_url) {
  console.error("COPPERX_BASE_URL is missing in .env file!");
  process.exit(1);
}

const api_key = process.env.COPPERX_API_KEY;
if (!api_key) {
  console.error("COPPERX_API_KEY is missing in .env file!");
  process.exit(1);
}

console.log("🔹 Bot Token Loaded:", token.slice(0, 10) + "");
console.log("API endpoint:", base_url);
console.log("API Key:", api_key.slice(0,6),"");


const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

bot.on('polling_error', (error) => {
  console.error("Polling error:", error.code, error.message);

  if (error.code === 'ETIMEDOUT') {
    console.log("Reconnecting...");
    bot.startPolling();
  }
});

bot.onText(/\/start/, async (msg) => {
  const session = await sessions.get(msg.chat.id)

  if (session) {
    showMainMenu(msg.chat.id, bot)
    return
  }
  await newUserMenu(msg.chat.id, bot)
});


// Handle Login Button Click
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id
  const data = query.data;
  const { accessToken } = await sessions.get(chatId)
  

  if (data.startsWith("set_wallet_")) {
    const walletId = data.split("_")[2];

    try {
      await axios.post(`${base_url}/api/wallets/default`, { walletId }, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });

      bot.sendMessage(chatId, "✅ Wallet successfully set as default.");
    } catch (error) {
      bot.sendMessage(chatId, "❌ Failed to set default wallet.");
    }
  }

  switch (data) {
    case "login":
        bot.sendMessage(chatId, "📧 Please enter your email to authenticate:");

        bot.once("message", async (emailMsg) => {
          const email = emailMsg.text;
          let sid = "";

          try {
              const res = await fetch(`${base_url}/api/auth/email-otp/request`, {
                  method: "POST",
                  headers: {
                      "Authorization": `Bearer ${api_key}`,
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ email })
              });

              if (!res.ok) {
                  let errorMessage = `Error ${res.status}: ${res.statusText}`;
                  try {
                      const errorData = await res.json();
                      errorMessage = errorData.message || errorMessage; 
                  } catch (jsonError) {
                      console.error("Error parsing JSON response", jsonError);
                  }
                  throw new Error(errorMessage);
              }

            const data = await res.json();
            sid = data.sid

            bot.sendMessage(chatId, `OTP successfully sent to: ${data.email}, Please enter it below.`, {
                reply_markup: {
                  inline_keyboard: [[{ text: "Resend OTP 🔄", callback_data: `resend_${email}` }]],
                },
            });
            
            bot.once("message", async (otpMsg) => {
              const otp = otpMsg.text;

              const res = await fetch(`${base_url}/api/auth/email-otp/authenticate`, {
                  method: "POST",
                  headers: {
                      "Authorization": `Bearer ${api_key}`,
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ email, otp, sid })
              });

              if (!res.ok) {
                  let errorMessage = `Error ${res.status}: ${res.statusText}`;
                  try {
                      const errorData = await res.json();
                      errorMessage = errorData.message || errorMessage;
                  } catch (jsonError) {
                      console.error("Error parsing JSON response", jsonError);
                  }
                  throw new Error(errorMessage);
              }

              const data = await res.json();

              console.log("Data:", data);
              console.log("Converted expireAt:", new Date(data.expireAt));
              

              await sessions.set(chatId, data.user.id, data.accessToken, data.user, new Date(data.expireAt)).then(() => {
                bot.sendMessage(query.message.chat.id, "✅ Authentication successful!", {
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: "🏦 View Balance", callback_data: "balance" }],
                          [{ text: "💸 Send USDC", callback_data: "send" }],
                          [{ text: "📜 Transaction History", callback_data: "history" }],
                        ],
                      },
                    });
              })
                    
            })

          } catch (error) {
              console.error("Request failed:", error);
              bot.sendMessage(query.message.chat.id, `Failed to send OTP: ${error.message || "An unexpected error occurred."}`);
          }
        });
      break;
    
      case "wallet":
      await showWalletMenu(chatId, bot)
      break;
    
      case "view_wallets":
        await handleViewWallets(chatId, bot, accessToken).then(async () => {
          await showWalletMenu(chatId, bot)
        });
        break;

      case "check_balances":
        await handleCheckBalances(chatId, bot, accessToken).then(async () => {
          await showWalletMenu(chatId, bot)
        });
        break;

      case "set_default_wallet":
        await handleSetDefaultWallet(chatId, bot, accessToken).then(async () => {
          await showWalletMenu(chatId, bot)
        });
        break;

      case "transaction_history":
        await handleTransactionHistory(chatId, bot, accessToken).then(async () => {
          await showWalletMenu(chatId, bot)
        });
        break;

      case "main_menu":
        await showWelcomeMenu(chatId, bot, accessToken);
        break;

      default:
        await bot.sendMessage(chatId, "⚠️ Invalid selection. Please choose a valid option.");
    }

});

bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id;
  await sessions.delete(chatId);
  
  bot.sendMessage(chatId, "You've been logged out successfully.");
  await showWelcomeMenu(chatId, bot);
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;

   bot.sendMessage(chatId, "Here is the menu.");
  await showMainMenu(chatId, bot);
})


bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
  msg.chat.id,
  `📌 Copperx Bot Help Guide:\n` +
  `\n🔹 Getting Started\n` +
  `/start - Start the bot\n` +
  `/login - Authenticate with Copperx\n` +
  `/wallets - View & manage wallets\n` +
  `/balance - Check your USDC balance\n` +
  `/transactions - View recent transactions\n` +
  `\n💸 Send & Withdraw\n` +
  `/send - Transfer USDC to email or wallet\n` +
  `/withdraw - Withdraw USDC to a bank\n` +
  `\n🔔 Notifications\n` +
  `/notifications - Enable/disable deposit alerts\n` +
  `\n🔐 Account & Security\n` +
  `/kyc - Check KYC/KYB status\n` +
  `/logout - Log out of your account\n` +
  `\n💬 Support\n` +
  `Support Chat - https://t.me/copperxcommunity/2183`
);

});

console.log("Bot is running...");
