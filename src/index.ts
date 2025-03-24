import mongoose from "mongoose";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

import Pusher from "pusher-js";
import TelegramBot from "node-telegram-bot-api";
import sessions from "./actions/sessions.js";
import newUserMenu from "./menus/new-user-menu.js";
import showMainMenu from "./menus/main-menu.js";
import showWalletMenu from "./menus/wallet-menu.js";
import showFundsMenu from "./menus/funds-menu.js";
import showAccountMenu from "./menus/account-menu.js";
import { helpOptions, initiateDeposit } from "./handlers/other.js";
import showWelcomeMenu from "./menus/welcome-menu.js";
import {
  handleCheckKYC,
  handleViewBankAccounts,
  handleViewProfile,
  showUserPoints,
} from "./handlers/profile-handler.js";
import showPayeesMenu from "./menus/payee-menu.js";
import {
  addPayee,
  confirmDeletePayee,
  deletePayee,
  editPayee,
  editPayees,
  getPayees,
  listPayeesForDeletion,
} from "./handlers/payee-handler.js";
import {
  getNetworkName,
  handleCheckBalances,
  handleSetDefaultWallet,
  handleTransactionHistory,
  handleViewWallets,
} from "./handlers/wallet-handler.js";
import {
  bankWithdrawal,
  bulkTransfer,
  emailTransfer,
  listTransfers,
  walletTransfer,
} from "./handlers/funds-handler.js";
import { handleUserInput } from "./actions/get-ai-response.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err: Error) => console.error("MongoDB connection error:", err));

const requiredEnvVars: string[] = [
  "BOT_TOKEN",
  "COPPERX_API",
  "MONGO_URI",
  "COPPERX_API_KEY",
  "PUSHER_KEY",
  "PUSHER_CLUSTER",
  "GEMINI_API_KEY",
  "ENCRYPTION_KEY",
  "WEBHOOK_URL",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`${envVar} is missing in .env file!`);
    process.exit(1);
  }
});

const BOT_TOKEN: string = process.env.BOT_TOKEN as string;
const COPPERX_API: string = process.env.COPPERX_API as string;
const COPPERX_API_KEY: string = process.env.COPPERX_API_KEY as string;
const PUSHER_KEY: string = process.env.PUSHER_KEY as string;
const PUSHER_CLUSTER: string = process.env.PUSHER_CLUSTER as string;

const app = express();
app.use(express.json());

interface DepositData {
  amount: number;
  currency: string;
  status: string;
  sourceCountry: string;
  destinationCountry: string;
}

const bot = new TelegramBot(BOT_TOKEN);

const initializePusher = async (
  organizationId: string,
  chatId: number,
  token: string
): Promise<void> => {
  const pusherClient = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    authorizer: (channel) => ({
      authorize: async (socketId: string, callback: Function) => {
        console.log("Socket ID:", socketId);
        console.log("Channel name:", channel.name);

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

  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("❌ Subscription error:", error);
  });

  channel.bind("deposit", (data: DepositData) => {
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

console.log("🔹 Bot Token Loaded:", BOT_TOKEN.slice(0, 10) + "...");
console.log("API endpoint:", COPPERX_API);
console.log("API Key:", COPPERX_API_KEY.slice(0, 6) + "...");

bot.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "menu", description: "Show the main menu" },
  { command: "wallet", description: "View wallet options" },
  { command: "transfer", description: "Send or receive USDC" },
  { command: "account", description: "Manage account settings" },
  { command: "help", description: "Get help and support" },
  { command: "logout", description: "Log out of your account" },
  { command: "main_menu", description: "Return to main menu" },
  { command: "deposit", description: "Initiate a deposit" },
  { command: "funds_transfer", description: "Show funds transfer options" },
  { command: "view_wallets", description: "View your wallets" },
  { command: "check_balances", description: "Check your wallet balances" },
  { command: "set_default_wallet", description: "Set your default wallet" },
  { command: "view_bank_account", description: "View your bank accounts" },
  { command: "transaction_history", description: "View transaction history" },
  { command: "transfer_email", description: "Transfer via email" },
  { command: "transfer_wallet", description: "Transfer to a wallet" },
  { command: "transfer_bank", description: "Withdraw to bank" },
  { command: "transfer_bulk", description: "Make bulk transfers" },
  { command: "transfer_list", description: "List your transfers" },
  { command: "payees", description: "Manage your payees" },
  { command: "add_payee", description: "Add a new payee" },
  { command: "view_payees", description: "View your payees" },
  { command: "edit_payee", description: "Edit an existing payee" },
  { command: "delete_payee", description: "Delete a payee" },
  { command: "view_profile", description: "View your profile" },
  { command: "check_kyc", description: "Check KYC status" },
  { command: "points", description: "View your reward points" },
]);

bot.on("polling_error", (error: any) => {
  if (error.code === "ETIMEDOUT") {
    bot.startPolling();
  }
});

const validCommands: Record<
  string,
  (chatId: number, bot: TelegramBot) => Promise<void>
> = {
  start: async (chatId, bot) => {
    const session = await sessions.get(chatId);
    return session ? showMainMenu(chatId, bot) : newUserMenu(chatId, bot);
  },
  logout: async (chatId, bot) => {
    await sessions.delete(chatId);
    await bot.sendMessage(chatId, "You've been logged out successfully.");
    return newUserMenu(chatId, bot);
  },
  login: async (chatId, bot) => {
    const session = await sessions.get(chatId);
    if (session) {
      await bot.sendMessage(
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
  main_menu: async (chatId, bot) => showMainMenu(chatId, bot),
  deposit: async (chatId, bot) => {
    const session = await sessions.get(chatId);
    if (!session) {
      await bot.sendMessage(
        chatId,
        "❌ Authentication required! Please login first."
      );
      return newUserMenu(chatId, bot);
    }
    return initiateDeposit(chatId, bot, session.accessToken);
  },
  funds_transfer: async (chatId, bot) => showFundsMenu(chatId, bot),
  view_wallets: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleViewWallets),
  check_balances: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleCheckBalances),
  set_default_wallet: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleSetDefaultWallet),
  view_bank_account: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleViewBankAccounts),
  transaction_history: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleTransactionHistory),
  transfer_email: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, emailTransfer, true),
  transfer_wallet: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, walletTransfer),
  transfer_bank: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, bankWithdrawal),
  transfer_bulk: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, bulkTransfer, true),
  transfer_list: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, listTransfers),
  payees: async (chatId, bot) => showPayeesMenu(chatId, bot),
  add_payee: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, addPayee),
  view_payees: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, getPayees),
  edit_payee: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, editPayees),
  delete_payee: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, listPayeesForDeletion),
  view_profile: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleViewProfile),
  check_kyc: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, handleCheckKYC),
  points: async (chatId, bot) =>
    handleAuthenticatedCommand(chatId, bot, showUserPoints, false),
};

async function handleAuthenticatedCommand(
  chatId: number,
  bot: TelegramBot,
  commandHandler: (
    chatId: number,
    bot: TelegramBot,
    accessToken: string,
    userId?: string,
    email?: string
  ) => Promise<any>,
  includeUserId = false
) {
  const session = await sessions.get(chatId);
  if (!session) {
    await bot.sendMessage(
      chatId,
      "❌ Authentication required! Please login first."
    );
    return newUserMenu(chatId, bot);
  }

  if (includeUserId && !session.userId) {
    await bot.sendMessage(chatId, "❌ User ID is required for this operation.");
    return;
  }

  return commandHandler(
    chatId,
    bot,
    session.accessToken,
    includeUserId ? session.userId : undefined
  );
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || "";

  if (text.startsWith("/")) {
    const command = text.slice(1).toLowerCase();

    if (validCommands[command]) {
      return await validCommands[command](chatId, bot);
    } else {
      return bot.sendMessage(
        chatId,
        "❌ Invalid command!\n\n" +
          "⚠️ The command you entered is not recognized.\n" +
          "📌 Use /menu to see the list of available commands and try again."
      );
    }
  }

  if (/^[!]/.test(text)) {
    const aiResponse = await handleUserInput(text);

    if (aiResponse.command && validCommands[aiResponse.command]) {
      return await validCommands[aiResponse.command](chatId, bot);
    }

    return bot.sendMessage(
      chatId,
      `🤖 I understand that you're trying to: *${aiResponse.intent}*\n\n` +
        "❌ But I couldn't find a matching command.\n" +
        "📌 Use /menu to see the list of available commands and try again."
    );
  }
});

bot.on("callback_query", async (query: TelegramBot.CallbackQuery) => {
  const chatId: number = query.message?.chat.id ?? 0;
  const data: string = query.data ?? "";
  const session = await sessions.get(chatId);

  if (data === "login") {
    try {
      const loginPrompt = await bot.sendMessage(
        chatId,
        "📧 Please reply with your email to authenticate.\n\n" +
          "🔒 This is required to verify your identity and secure your account.",
        { reply_markup: { force_reply: true } }
      );

      const awaitReply = (promptMessageId: number): Promise<string> => {
        return new Promise((resolve) => {
          const handler = (msg: TelegramBot.Message) => {
            if (
              msg.reply_to_message &&
              msg.reply_to_message.message_id === promptMessageId
            ) {
              bot.removeListener("message", handler);
              resolve(msg.text ?? "");
            }
          };
          bot.once("message", handler);
        });
      };

      const email: string = await awaitReply(loginPrompt.message_id);
      const otpData = await requestOTP(chatId, email);
      if (!otpData) return;
      await authenticateWithOTP(chatId, email, otpData.sid);
    } catch (error) {
      await bot.sendMessage(
        chatId,
        "❌ Authentication process failed. Please try again later."
      );
    }
    return;
  }

  if (data.startsWith("resend_")) {
    const email: string = data.replace("resend_", "");
    try {
      const otpData = await requestOTP(chatId, email, true);
      if (!otpData) return;
      await authenticateWithOTP(chatId, email, otpData.sid);
    } catch (error: any) {
      await bot.sendMessage(
        chatId,
        `❌ Failed to resend OTP: ${
          error.message || "Unexpected error occurred."
        }`
      );
    }
    return;
  }

  async function requestOTP(
    chatId: number,
    email: string,
    isResend = false
  ): Promise<any> {
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
        { parse_mode: "Markdown" as TelegramBot.ParseMode }
      );
      return responseData;
    } catch (error: any) {
      await bot.sendMessage(
        chatId,
        `❌ Failed to ${isResend ? "resend" : "send"} OTP.\n\n⚠️ Error: ${
          error.message || "An unexpected error occurred."
        }`
      );
      return null;
    }
  }

  async function authenticateWithOTP(
    chatId: number,
    email: string,
    sid: string
  ) {
    let authenticated = false;

    while (!authenticated) {
      try {
        const otpPrompt = await bot.sendMessage(
          chatId,
          "📩 Please reply with the OTP sent to your email:",
          {
            parse_mode: "Markdown" as TelegramBot.ParseMode,
            reply_markup: { force_reply: true },
          }
        );

        const awaitReply = (promptMessageId: number): Promise<string> => {
          return new Promise((resolve) => {
            const handler = (msg: TelegramBot.Message) => {
              if (
                msg.reply_to_message &&
                msg.reply_to_message.message_id === promptMessageId
              ) {
                bot.removeListener("message", handler);
                resolve(msg.text ?? "");
              }
            };
            bot.once("message", handler);
          });
        };

        const otp: string = await awaitReply(otpPrompt.message_id);

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
            throw new Error(`Error parsing error response: ${jsonError}`);
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
      } catch (error: any) {
        await bot.sendMessage(
          chatId,
          `❌ Authentication error: ${
            error.message || "Unexpected error occurred."
          }\n\nPlease try again.`
        );
      }
    }
  }

  async function handleApiResponse(
    response: globalThis.Response
  ): Promise<any> {
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        throw new Error(`Error parsing error response: ${jsonError}`);
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
    // Main Menus
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

    // Wallet Actions
    case "view_wallets":
      await handleViewWallets(chatId, bot, accessToken);
      break;

    case "check_balances":
      await handleCheckBalances(chatId, bot, accessToken);
      break;

    case "set_default_wallet":
      await handleSetDefaultWallet(chatId, bot, accessToken);
      break;

    // Bank Account Actions
    case "view_bank_account":
      await handleViewBankAccounts(chatId, bot, accessToken);
      break;

    // Transaction & Transfer Actions
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
      await bulkTransfer(chatId, bot, accessToken, userId);
      break;

    case "transfer_list":
      await listTransfers(chatId, bot, accessToken);
      break;

    // Payees Management
    case "payees":
      await showPayeesMenu(chatId, bot);
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

    // User Profile & Settings
    case "view_profile":
      await handleViewProfile(chatId, bot, accessToken);
      break;

    case "check_kyc":
      await handleCheckKYC(chatId, bot, accessToken);
      break;

    case "points":
      await showUserPoints(chatId, bot, accessToken);
      break;

    // Help & Logout
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
  }
});

//Webhook setup and server initialization
const WEBHOOK_URL = process.env.WEBHOOK_URL as string;
const PORT = parseInt(process.env.PORT || "3000", 10);

const SECRET_PATH = `/webhook/${BOT_TOKEN.slice(0, 10)}`;

bot
  .setWebHook(`${WEBHOOK_URL}${SECRET_PATH}`)
  .then(() => console.log(`✅ Webhook set at ${WEBHOOK_URL}${SECRET_PATH}`))
  .catch((err: Error) => console.error("❌ Webhook error:", err.message));

app.get("/", (res: Response) => {
  res.send("🚀 Bot is up and running! Listening for incoming messages...");
});

app.post(SECRET_PATH, (req: Request, res: Response) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
