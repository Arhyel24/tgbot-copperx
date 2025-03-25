import TelegramBot from "node-telegram-bot-api";
import { logger } from "@/utils/logger.js";

const showMainMenu = async (chatId: number, bot: TelegramBot) => {
  try {
    await bot.sendMessage(
      chatId,
      `*⚙️ Manage Your Copperx Account*\n\n` +
        `Easily handle your *USDC transactions* right within Telegram.\n\n` +
        `🔹 *Check Balances* – View your available USDC funds.\n` +
        `🔹 *Send Funds* – Transfer USDC securely.\n` +
        `🔹 *Withdraw to Bank* – Move funds to your 🏦 linked bank account.\n` +
        `🔹 *Receive Notifications* – Get 🔔 real-time deposit alerts.\n\n` +
        `📢 *How to Use Commands:*\n` +
        `To ask a question or give a command, start your message with *!*.\n\n` +
        `✅ Example:\n` +
        `👉 *!Check my balance* → Use the command */check_balances* to view your funds.\n\n` +
        `*⚡ Select an option below to get started:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 Account", callback_data: "account" },
              { text: "💼 Wallet", callback_data: "wallet" },
            ],
            [
              { text: "🏧 Deposit Funds", callback_data: "deposit" },
              { text: "💸 Funds Transfer", callback_data: "funds_transfer" },
            ],
            [{ text: "❓ Help & Support", callback_data: "help" }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error("❌ Error sending main menu:", error);
  }
};

export default showMainMenu;
