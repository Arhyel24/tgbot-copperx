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
  getNetworkName,
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
  emailTransfer,
  walletTransfer,
  bankWithdrawal,
  bulkTransfer,
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
  const pusherClient = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        console.log("Socket ID:", socketId);
        console.log("channel name:", channel.name);

        try {
          const response = await fetch(
            `${COPPERX_API}/api/notifications/auth`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            callback(null, data);
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
    bot.sendMessage(
      chatId,
      "✅ Successfully subscribed to deposit notifications!\n\n" +
        "📥 You will now receive real-time alerts whenever a new deposit is made to your account. " +
        "Stay updated with your transactions effortlessly!"
    );
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

bot.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "menu", description: "Show the main menu" },
  { command: "wallet", description: "View wallet options" },
  { command: "transfer", description: "Send or receive USDC" },
  { command: "account", description: "Manage account settings" },
  { command: "help", description: "Get help and support" },
  { command: "logout", description: "Log out of your account" },
]);

bot.on("polling_error", (error) => {
  console.error("Polling error:", error.code, error.message);

  if (error.code === "ETIMEDOUT") {
    console.log("Reconnecting...");
    bot.startPolling();
  }
});

const validCommands = {
  start: async (chatId, bot) => {
    const session = await sessions.get(chatId);

    return session ? showMainMenu(chatId, bot) : newUserMenu(chatId, bot);
  },
  logout: async (chatId, bot) => {
    await sessions.delete(chatId);
    bot.sendMessage(chatId, "You've been logged out successfully.");
    await newUserMenu(chatId, bot);
  },
  login: async (chatId, bot) => {
    const session = await sessions.get(chatId);

    if (session) {
      bot.sendMessage(
        chatId,
        "✅ You are already logged in!\n\n" +
          "🎉 Welcome back! You have an active session, so there's no need to log in again.\n" +
          "Use the menu below to access available options."
      );
      return showMainMenu(chatId, bot);
    }

    return newUserMenu(chatId, bot);
  },
  menu: async (chatId, bot) => showMainMenu(chatId, bot),
  wallet: async (chatId, bot) => showWalletMenu(chatId, bot),
  transfer: async (chatId, bot) => showFundsMenu(chatId, bot),
  account: async (chatId, bot) => showAccountMenu(chatId, bot),
  help: async (chatId, bot) => helpOptions(chatId, bot),
};

bot.onText(/\/(\w+)/, async (msg, match) => {
  const command = match[1].toLowerCase();
  const chatId = msg.chat.id;

  if (!validCommands[command]) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid command!\n\n" +
        "⚠️ The command you entered is not recognized.\n" +
        "📌 Use /menu to see the list of available commands and try again."
    );
  }

  await validCommands[command](chatId, bot);
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = await sessions.get(chatId);

  if (data === "login") {
    bot.sendMessage(
      chatId,
      "📧 Please enter your email to authenticate.\n\n" +
        "🔒 This is required to verify your identity and secure your account. " +
        "Make sure to enter a valid email address to proceed."
    );

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
          `✅ OTP has been successfully sent to **${data.email}**.\n\n` +
            "📩 Please check your inbox and enter the OTP below to continue.\n\n" +
            "🔄 If you didn't receive it, you can request a new OTP using the button below.",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Resend OTP 🔄",
                    callback_data: `resend_${data.email}`,
                  },
                ],
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
          `❌ Failed to send OTP.\n\n` +
            `⚠️ Error: ${
              error.message || "An unexpected error occurred."
            }\n\n` +
            "🔄 Please try again or use the 'Resend OTP' option if the issue persists."
        );
      }
    });
    return;
  }

  if (!sessions.get(chatId)) {
    bot.sendMessage(
      chatId,
      "⚠️ Your session has expired.\n\n" +
        "🔒 For security reasons, you'll need to log in again to continue.\n" +
        "Please click the button below to log in.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
        },
      }
    );

    return;
  }

  const { accessToken, userId } = session;

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

      const { network } = await response.json();

      bot.sendMessage(
        chatId,
        `✅ ${getNetworkName(network)} successfully set as default.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
            ],
          },
        }
      );
    } catch (error) {
      bot.sendMessage(chatId, "❌ Failed to set default wallet.", {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
          ],
        },
      });
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
      break;

    case "check_balances":
      await handleCheckBalances(chatId, bot, accessToken);
      break;

    case "set_default_wallet":
      await handleSetDefaultWallet(chatId, bot, accessToken);
      break;

    case "transaction_history":
      await handleTransactionHistory(chatId, bot, accessToken);
      break;

    case "main_menu":
      await showMainMenu(chatId, bot);
      break;

    case "view_profile":
      await handleViewProfile(chatId, bot, accessToken);
      break;

    case "check_kyc":
      await handleCheckKYC(chatId, bot, accessToken);
      break;

    case "transfer_email":
      await emailTransfer(chatId, bot, accessToken, userId);
      break;

    case "transfer_wallet":
      await walletTransfer(chatId, bot, accessToken);
      break;

    case "transfer_bank":
      await bankWithdrawal(chatId, bot, accessToken);
      break;

    case "transfer_bulk":
      await bulkTransfer(chatId, bot, accessToken);
      break;

    case "transfer_list":
      await listTransfers(chatId, bot, accessToken);
      break;

    case "logout":
      await sessions.delete(chatId);

      bot.sendMessage(
        chatId,
        "✅ You have been logged out successfully.\n\n" +
          "🔐 Your session has been securely closed. " +
          "If you wish to log in again, use the menu below."
      );
      await newUserMenu(chatId, bot);
      break;

    case "help":
      helpOptions(chatId, bot);
      break;

    default:
      await bot.sendMessage(
        chatId,
        "⚠️ Oops! It looks like you've entered an invalid option.\n\n" +
          "📌 Please choose a valid option from the menu below or type /help for assistance."
      );
      await helpOptions(chatId, bot);
  }
});

console.log("🚀 Bot is up and running! Listening for incoming messages...");

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Telegram bot is running...");
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// process.once("SIGINT", () => bot.stopPolling());
// process.once("SIGTERM", () => bot.stopPolling());
