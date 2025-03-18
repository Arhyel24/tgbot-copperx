const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const Pusher = require("pusher-js");
const { showWelcomeMenu } = require("./menus/welcome-menu");
const sessions = require("./actions/session");
const { showMainMenu } = require("./menus/main-menu");
const { newUserMenu } = require("./menus/new-user-menu");
const {
  handleViewWallets,
  handleCheckBalances,
  handleSetDefaultWallet,
  handleTransactionHistory,
} = require("./handlers/wallet-handler");
const { showWalletMenu } = require("./menus/wallet-menu");
const { showAccountMenu } = require("./menus/account-menu");
const {
  handleViewProfile,
  handleCheckKYC,
} = require("./handlers/profile-handler");
const { showFundsMenu } = require("./menus/funds-menu");
const {
  listTransfers,
  requestEmailTransferData,
  requestWalletTransferData,
  requestBankWithdrawalData,
  requestBulkTransferData,
} = require("./handlers/funds-handler");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

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

const pusher_key = process.env.PUSHER_KEY;
if (!pusher_key) {
  console.error("PUSHER_KEY is missing in .env file!");
  process.exit(1);
}

const pusher_cluster = process.env.PUSHER_CLUSTER;
if (!pusher_cluster) {
  console.error("PUSHER_CLUSTER is missing in .env file!");
  process.exit(1);
}

const initializePusher = async (organizationId, chatId, token) => {
  console.log("Org ID:", organizationId);
  console.log("Chat ID:", chatId);
  console.log("Token:", token.slice(0, 6) + ".....");

  const pusherClient = new Pusher(pusher_key, {
    cluster: pusher_cluster,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        console.log("Socket ID:", socketId);
        console.log("channel name:", channel.name);

        try {
          const response = await fetch(`${base_url}/api/notifications/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          const data = await response.json();

          console.log("Pusher data:", data);

          if (response.ok) {
            callback(null, data);
            console.log("✅ Pusher connected");
          } else {
            callback(new Error("Pusher authentication failed"), null);
          }
        } catch (error) {
          console.error("❌ Pusher authorization error:", error);
          callback(error, null);
        }
      },
    }),
  });

  const channel = pusherClient.subscribe(`private-org-${organizationId}`);

  channel.bind("pusher:subscription_succeeded", () => {
    console.log("✅ Successfully subscribed to private channel");
  });

  channel.bind("pusher:subscription_error", (error) => {
    console.error("❌ Subscription error:", error);
  });

  channel.bind("deposit", (data) => {
    bot.sendMessage(
      chatId,
      `💰 *New Deposit Received*\n\n${data.amount} USDC deposited on Solana`
    );
  });

  // Handle reconnection attempts
  pusherClient.connection.bind("disconnected", () => {
    console.warn("⚠️ Pusher disconnected. Attempting to reconnect...");
    initializePusher(organizationId, chatId, token);
  });
};

console.log("🔹 Bot Token Loaded:", token.slice(0, 10) + "");
console.log("API endpoint:", base_url);
console.log("API Key:", api_key.slice(0, 6), "");

const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error.code, error.message);

  if (error.code === "ETIMEDOUT") {
    console.log("Reconnecting...");
    bot.startPolling();
  }
});

bot.onText(/\/start/, async (msg) => {
  const session = await sessions.get(msg.chat.id);

  if (session) {
    showMainMenu(msg.chat.id, bot);
    return;
  }
  await newUserMenu(msg.chat.id, bot);
});

// Handle Login Button Click
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = await sessions.get(chatId);

  if (data === "login") {
    bot.sendMessage(chatId, "📧 Please enter your email to authenticate:");

    bot.once("message", async (emailMsg) => {
      const email = emailMsg.text;
      let sid = "";

      try {
        const res = await fetch(`${base_url}/api/auth/email-otp/request`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
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
        sid = data.sid;

        bot.sendMessage(
          chatId,
          `OTP successfully sent to: ${data.email}, Please enter it below.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Resend OTP 🔄", callback_data: `resend_${email}` }],
              ],
            },
          }
        );

        bot.once("message", async (otpMsg) => {
          const otp = otpMsg.text;

          const res = await fetch(
            `${base_url}/api/auth/email-otp/authenticate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${api_key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, otp, sid }),
            }
          );

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

          await initializePusher(
            data.user.organizationId,
            chatId,
            data.accessToken
          );

          await sessions
            .set(
              chatId,
              data.user.id,
              data.accessToken,
              data.user,
              new Date(data.expireAt)
            )
            .then(async () => {
              await showWelcomeMenu(chatId, bot);
            });
        });
      } catch (error) {
        console.error("Request failed:", error);
        bot.sendMessage(
          query.message.chat.id,
          `Failed to send OTP: ${
            error.message || "An unexpected error occurred."
          }`
        );
      }
    });
    return;
  }

  if (!session) {
    bot.sendMessage(
      chatId,
      "Oops!, Your session has expired, please login again.",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
        },
      }
    );

    return;
  }

  const { accessToken } = session;

  if (data.startsWith("set_wallet_")) {
    const walletId = data.split("_")[2];

    try {
      const response = await fetch(`${base_url}/api/wallets/default`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletId }),
      });

      if (!response.ok) throw new Error("Failed to set default wallet");

      bot.sendMessage(chatId, "✅ Wallet successfully set as default.");
      await showWalletMenu(chatId, bot);
    } catch (error) {
      bot.sendMessage(chatId, "❌ Failed to set default wallet.");
      await showWalletMenu(chatId, bot);
    }
    return;
  }

  switch (data) {
    case "wallet":
      await showWalletMenu(chatId, bot);
      break;

    case "account":
      await showAccountMenu(chatId, bot);
      break;

    case "funds_transfer":
      await showFundsMenu(chatId, bot);
      break;

    case "view_wallets":
      await handleViewWallets(chatId, bot, accessToken);
      await showWalletMenu(chatId, bot);
      break;

    case "check_balances":
      await handleCheckBalances(chatId, bot, accessToken);
      await showWalletMenu(chatId, bot);
      break;

    case "set_default_wallet":
      await handleSetDefaultWallet(chatId, bot, accessToken);
      break;

    case "transaction_history":
      await handleTransactionHistory(chatId, bot, accessToken);
      await showWalletMenu(chatId, bot);
      break;

    case "main_menu":
      await showWelcomeMenu(chatId, bot, accessToken);
      break;

    case "view_profile":
      await handleViewProfile(chatId, bot, accessToken);
      await showAccountMenu(chatId, bot);
      break;

    case "check_kyc":
      await handleCheckKYC(chatId, bot, accessToken);
      await showAccountMenu(chatId, bot);
      break;

    case "transfer_email":
      await requestEmailTransferData(chatId, bot, accessToken);
      break;

    case "transfer_wallet":
      await requestWalletTransferData(chatId, bot, accessToken);
      break;

    case "transfer_bank":
      await requestBankWithdrawalData(chatId, bot, accessToken);
      break;

    case "transfer_bulk":
      await requestBulkTransferData(chatId, bot, accessToken);
      break;

    case "transfer_list":
      await listTransfers(chatId, bot, accessToken);
      break;

    case "logout":
      await sessions.delete(chatId);

      bot.sendMessage(chatId, "You've been logged out successfully.");
      await newUserMenu(chatId, bot);
      break;

    default:
      await bot.sendMessage(
        chatId,
        "⚠️ Invalid selection. Please choose a valid option."
      );
  }
});

bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id;
  await sessions.delete(chatId);

  bot.sendMessage(chatId, "You've been logged out successfully.");
  await newUserMenu(chatId, bot);
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Here is the menu.");
  await showMainMenu(chatId, bot);
});

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

const app = express();

app.get("/", (req, res) => {
  res.send("Telegram bot is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.once("SIGINT", () => bot.stopPolling());
process.once("SIGTERM", () => bot.stopPolling());
