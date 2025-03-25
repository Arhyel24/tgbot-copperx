import TelegramBot from "node-telegram-bot-api";
import { logger } from "@/utils/logger.js";

const showAccountMenu = async (
  chatId: number,
  bot: TelegramBot
): Promise<void> => {
  try {
    await bot.sendMessage(
      chatId,
      `*🔑 Account Management*\n\n` +
        `Manage your profile settings, check your verification ✅ status, or securely log out of your account.\n\n` +
        `🔹 *View Profile* – See your registered details and account information.\n` +
        `🔹 *KYC/KYB Status* – Check the status of your identity verification process.\n` +
        `🔹 *Manage Payees* – Add or remove trusted payees.\n` +
        `🔹 *My Points* – Check your earned points and rewards.\n` +
        `🔹 *View Bank Accounts* – See linked bank accounts for transactions.\n` +
        `🔹 *Log Out* – Safely exit your account to prevent unauthorized access.\n\n` +
        `*⚡ Select an option below:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 View Profile", callback_data: "view_profile" },
              { text: "✅ KYC/KYB Status", callback_data: "check_kyc" },
            ],
            [
              { text: "✅ Manage Payees", callback_data: "payees" },
              { text: "⭐ My Points", callback_data: "points" },
            ],
            [
              {
                text: "🏦 View Bank Accounts",
                callback_data: "view_bank_account",
              },
            ],
            [{ text: "🚪 Log Out", callback_data: "logout" }],
            [{ text: "⬅️ Back to Main Menu", callback_data: "main_menu" }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error("❌ Error sending account menu:", error);
  }
};

export default showAccountMenu;
