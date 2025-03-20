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
  showUserPoints,
  handleViewBankAccounts,
} = require("./handlers/profile-handler");
const { showFundsMenu } = require("./menus/funds-menu");
const {
  listTransfers,
  emailTransfer,
  walletTransfer,
  bankWithdrawal,
  bulkTransfer,
} = require("./handlers/funds-handler");
const { helpOptions, initiateDeposit } = require("./handlers/others");
const { showPayeesMenu } = require("./menus/payee-menu");
const {
  editPayee,
  addPayee,
  getPayees,
  editPayees,
  deletePayee,
  confirmDeletePayee,
  listPayeesForDeletion,
} = require("./handlers/payees-handler");
const showTransferSchedulesMenu = require("./menus/schedule-transfer-menu");
const {
  viewTransferSchedules,
  deactivateTransferSchedule,
  confirmDeactivateSchedule,
  handleDeactivateSchedule,
  selectPayeeForSchedule,
  createTransferSchedule,
} = require("./handlers/transfer-schedules-handler");
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

const app = express();
app.use(express.json());

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

const bot = new TelegramBot(BOT_TOKEN);

// {
//   polling: {
//     interval: 300,
//     autoStart: true,
//     params: {
//       timeout: 10,
//     },
//   },
// }

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
    try {
      const loginPrompt = await bot.sendMessage(
        chatId,
        "📧 Please reply with your email to authenticate.\n\n" +
          "🔒 This is required to verify your identity and secure your account.",
        { reply_markup: { force_reply: true } }
      );

      const awaitReply = (promptMessageId) => {
        return new Promise((resolve) => {
          const handler = (msg) => {
            if (
              msg.reply_to_message &&
              msg.reply_to_message.message_id === promptMessageId
            ) {
              bot.removeListener("message", handler);
              resolve(msg.text);
            }
          };
          bot.on("message", handler);
        });
      };

      const email = await awaitReply(loginPrompt.message_id);

      const otpData = await requestOTP(chatId, email);
      if (!otpData) return;

      await authenticateWithOTP(chatId, email, otpData.sid);
    } catch (error) {
      console.error("Login flow error:", error);
      await bot.sendMessage(
        chatId,
        "❌ Authentication process failed. Please try again later."
      );
    }
    return;
  }

  if (data.startsWith("resend_")) {
    const email = data.replace("resend_", "");
    try {
      const otpData = await requestOTP(chatId, email, true);
      if (!otpData) return; 

      await authenticateWithOTP(chatId, email, otpData.sid);
    } catch (error) {
      console.error("Resend OTP error:", error);
      await bot.sendMessage(
        chatId,
        `❌ Failed to resend OTP: ${
          error.message || "Unexpected error occurred."
        }`
      );
    }
    return;
  }

  async function requestOTP(chatId, email, isResend = false) {
    try {
      const res = await fetch(`${COPPERX_API}/api/auth/email-otp/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COPPERX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await handleApiResponse(res);
      if (!responseData) return null;

      await bot.sendMessage(
        chatId,
        `🔄 OTP has been ${isResend ? "**resent**" : "**sent**"} to **${
          responseData.email
        }**.`,
        { parse_mode: "Markdown" }
      );

      return responseData;
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ Failed to ${isResend ? "resend" : "send"} OTP.\n\n` +
          `⚠️ Error: ${error.message || "An unexpected error occurred."}`
      );
      return null;
    }
  }

  async function authenticateWithOTP(chatId, email, sid) {
    let authenticated = false;

    while (!authenticated) {
      try {
        const otpPrompt = await bot.sendMessage(
          chatId,
          "📩 Please reply with the OTP sent to your email:",
          { parse_mode: "Markdown", reply_markup: { force_reply: true } }
        );

        const awaitReply = (promptMessageId) => {
          return new Promise((resolve) => {
            const handler = (msg) => {
              if (
                msg.reply_to_message &&
                msg.reply_to_message.message_id === promptMessageId
              ) {
                bot.removeListener("message", handler);
                resolve(msg.text);
              }
            };
            bot.on("message", handler);
          });
        };

        const otp = await awaitReply(otpPrompt.message_id);

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
          let errorMessage = "Invalid OTP. Please try again.";
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
          }

          await bot.sendMessage(chatId, `❌ ${errorMessage}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Resend OTP 🔄", callback_data: `resend_${email}` }],
              ],
            },
          });
          continue;
        }

        const authData = await res.json();

        await initializePusher(
          authData.user.organizationId,
          chatId,
          authData.accessToken
        );

        await sessions.set(
          chatId,
          authData.user.id,
          authData.accessToken,
          authData.user,
          new Date(authData.expireAt)
        );

        await showWelcomeMenu(chatId, bot);

        authenticated = true;
      } catch (error) {
        console.error("OTP authentication failed:", error);

        await bot.sendMessage(
          chatId,
          `❌ Authentication error: ${
            error.message || "Unexpected error occurred."
          }\n\nPlease try again.`
        );
      }
    }
  }

  async function handleApiResponse(response) {
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error("Error parsing error response:", jsonError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  if (!session) {
    bot.sendMessage(
      chatId,
      "⚠️ Your session has expired or is invalid.\n\n" +
        "🔒 Please log in again to continue.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
        },
      }
    );
    return;
  }

  const { accessToken, userId, data: userdata } = session;

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

  if (data.startsWith("EDIT_PAYEE_")) {
    const payeeId = data.replace("EDIT_PAYEE_", "");
    await editPayee(chatId, bot, accessToken, payeeId);
    return;
  }

  if (data.startsWith("CREATE_SCHEDULE_")) {
    const payeeId = data.replace("CREATE_SCHEDULE_", "");
    await createTransferSchedule(chatId, bot, accessToken, payeeId);
    return;
  }

  if (data.startsWith("CONFIRM_DEACTIVATE_SCHEDULE_")) {
    const scheduleId = data.replace("CONFIRM_DEACTIVATE_SCHEDULE_", "");
    await confirmDeactivateSchedule(chatId, bot, scheduleId);
    return;
  } else if (data.startsWith("DEACTIVATE_SCHEDULE_")) {
    const scheduleId = data.replace("DEACTIVATE_SCHEDULE_", "");
    await handleDeactivateSchedule(chatId, bot, accessToken, scheduleId);
    return;
  }

  if (data.startsWith("DELETE_PAYEE_")) {
    const payeeId = data.replace("DELETE_PAYEE_", "");
    await confirmDeletePayee(chatId, bot, payeeId);
    return;
  } else if (data.startsWith("CONFIRM_DELETE_")) {
    const payeeId = data.replace("CONFIRM_DELETE_", "");
    await deletePayee(chatId, bot, accessToken, payeeId);
    return;
  }

  switch (data) {
    // 🌟 Main Menus
    case "main_menu":
      await showMainMenu(chatId, bot);
      break;

    case "wallet":
      await showWalletMenu(chatId, bot);
      break;

    case "account":
      await showAccountMenu(chatId, bot);
      break;
    
    case "deposit":
      await initiateDeposit(chatId, bot, accessToken);
      break;

    case "funds_transfer":
      await showFundsMenu(chatId, bot);
      break;

    // 💰 Wallet Actions
    case "view_wallets":
      await handleViewWallets(chatId, bot, accessToken);
      break;

    case "check_balances":
      await handleCheckBalances(chatId, bot, accessToken);
      break;

    case "set_default_wallet":
      await handleSetDefaultWallet(chatId, bot, accessToken);
      break;

    // 🏦 Bank Account Actions
    case "view_bank_account":
      await handleViewBankAccounts(chatId, bot, accessToken);
      break;

    // 🔄 Transaction & Transfer Actions
    case "transaction_history":
      await handleTransactionHistory(chatId, bot, accessToken);
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

    // 📅 Transfer Schedules
    case "transfer_schedules":
      await showTransferSchedulesMenu(chatId, bot);
      break;

    case "view_schedules":
      await viewTransferSchedules(chatId, bot, accessToken);
      break;

    case "create_schedule":
      await selectPayeeForSchedule(chatId, bot, accessToken);
      break;

    case "deactivate_schedule":
      await deactivateTransferSchedule(chatId, bot, accessToken);
      break;

    // 👥 Payees Management
    case "payees":
      await showPayeesMenu(chatId, bot, accessToken);
      break;

    case "add_payee":
      await addPayee(chatId, bot, accessToken);
      break;

    case "view_payees":
      await getPayees(chatId, bot, accessToken);
      break;

    case "edit_payee":
      await editPayees(chatId, bot, accessToken);
      break;

    case "delete_payee":
      await listPayeesForDeletion(chatId, bot, accessToken);
      break;

    // 👤 User Profile & Settings
    case "view_profile":
      await handleViewProfile(chatId, bot, accessToken);
      break;

    case "check_kyc":
      await handleCheckKYC(chatId, bot, accessToken);
      break;

    case "points":
      await showUserPoints(chatId, bot, accessToken, userdata.email);
      break;

    // ❓ Help & Logout
    case "help":
      helpOptions(chatId, bot);
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

    // ⚠️ Default Case (Invalid Option)
    // case default:
    //   await bot.sendMessage(
    //     chatId,
    //     "⚠️ Oops! It looks like you've entered an invalid option.\n\n" +
    //       "📌 Please choose a valid option from the menu below or type /help for assistance."
    //   );
    //   await helpOptions(chatId, bot);
  }
});

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://4320-102-91-77-166.ngrok-free.app";

bot
  .setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`)
  .then(() => console.log(`✅ Webhook set at ${WEBHOOK_URL}/bot${BOT_TOKEN}`))
  .catch((err) => console.error("❌ Webhook error:", err.message));

app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
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
