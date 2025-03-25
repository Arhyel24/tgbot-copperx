import TelegramBot from "node-telegram-bot-api";
import { logger } from "@/utils/logger.js";

const showPayeesMenu = async (
  chatId: number,
  bot: TelegramBot
): Promise<void> => {
  try {
    await bot.sendMessage(
      chatId,
      `*📋 Manage Payees*\n\n` +
        `Quickly manage your saved payees for fast and secure transactions.\n\n` +
        `*🔹 Available Actions:*\n\n` +
        `➕ *Add Payee* – Save a new recipient for future payments.\n` +
        `📜 *View Payees* – Check your list of saved payees.\n` +
        `✏️ *Edit Payee* – Update a payee’s details if needed.\n` +
        `🗑️ *Delete Payee* – Remove a payee from your list.\n\n` +
        `*⚡ Select an option below:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "➕ Add Payee", callback_data: "add_payee" },
              { text: "📜 View Payees", callback_data: "view_payees" },
            ],
            [
              { text: "✏️ Edit Payee", callback_data: "edit_payee" },
              { text: "🗑️ Delete Payee", callback_data: "delete_payee" },
            ],
            [{ text: "⬅️ Back to Account", callback_data: "account" }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error("❌ Error sending payees menu:", error);
  }
};

export default showPayeesMenu;
