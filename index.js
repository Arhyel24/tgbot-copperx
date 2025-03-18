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
const { helpOptions } = require("./handlers/others");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const requiredEnvVars = [
  "BOT_TOKEN",
  "COPPERX_API",
  "COPPERX_API_KEY",
  "PUSHER_KEY",
  "PUSHER_CLUSTER",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`${envVar} is missing in .env file!`);
    process.exit(1);
  }
});

const { BOT_TOKEN, COPPERX_API, COPPERX_API_KEY, PUSHER_KEY, PUSHER_CLUSTER } =
  process.env;


const initializePusher = async (organizationId, chatId, token) => {
  // console.log("Org ID:", organizationId);
  // console.log("Chat ID:", chatId);
  // console.log("Token:", token.slice(0, 6) + ".....");

  const pusherClient = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        console.log("Socket ID:", socketId);
        console.log("channel name:", channel.name);

        try {
          const response = await fetch(`${COPPERX_API}/api/notifications/auth`, {
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

          // console.log("Pusher data:", data);

          if (response.ok) {
            callback(null, data);
            // console.log("✅ Pusher connected");
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
    // console.log("✅ Successfully subscribed to private channel");
    bot.sendMessage(chatId, "✅ Successfully subscribed deposit notifications");
  });

  channel.bind("pusher:subscription_error", (error) => {
    console.error("❌ Subscription error:", error);
  });

 channel.bind("deposit", (data) => {
   bot.sendMessage(
     chatId,
     `💰 *Deposit Received*\n\nAmount: ${data.amount} ${data.currency}\nStatus: ${data.status}\nFrom: ${data.sourceCountry} → To: ${data.destinationCountry}`
   );
 });


  // Handle reconnection attempts
  pusherClient.connection.bind("disconnected", () => {
    console.warn("⚠️ Pusher disconnected. Attempting to reconnect...");
    initializePusher(organizationId, chatId, token);
  });
};

console.log("🔹 Bot Token Loaded:", BOT_TOKEN.slice(0, 10) + "");
console.log("API endpoint:", COPPERX_API);
console.log("API Key:", COPPERX_API_KEY.slice(0, 6), "");

const bot = new TelegramBot(BOT_TOKEN, {
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
  session ? showMainMenu(msg.chat.id, bot) : newUserMenu(msg.chat.id, bot);
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
        const res = await fetch(`${COPPERX_API}/api/auth/email-otp/request`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${COPPERX_API_KEY}`,
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
            `${COPPERX_API}/api/auth/email-otp/authenticate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${COPPERX_API_KEY}`,
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

  if (!sessions.get(chatId)) {
    bot.sendMessage(chatId, "Your session expired. Please log in again.", {
      reply_markup: {
        inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
      },
    });
    return
  }

  const { accessToken } = session;

  if (data.startsWith("set_wallet_")) {
    const walletId = data.split("_")[2];

    try {
      const response = await fetch(`${COPPERX_API}/api/wallets/default`, {
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
    
    case "help":
      helpOptions(chatId, bot);
      break;

    default:
      await bot.sendMessage(
        chatId,
        "⚠️ You seem lost!. Please choose a valid option."
      );
      helpOptions(chatId, bot);
  }
});

bot.onText(/\/(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1]; // Extract the command after '/'

  // List of valid commands
  const validCommands = [
    "start",
    "menu",
    "help",
    "logout",
    "wallets",
    "send",
  ];

  if (!validCommands.includes(command)) {
    bot.sendMessage(
      chatId,
      `⚠️ Invalid command: *${command}*.\nType /help to see available commands.`,
      {
        parse_mode: "Markdown",
      }
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
  helpOptions(msg.chat.id, bot)
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
