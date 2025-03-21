import TelegramBot from "node-telegram-bot-api";

const showPayeesMenu = async (chatId: number, bot: TelegramBot): Promise<void> => {
  await bot.sendMessage(
    chatId,
    `*📋 Manage Payees*\n\n` +
      `Easily manage your saved payees for quick and secure transactions.\n\n` +
      `*🔹 Options:*\n\n` +
      `🔹 *➕ Add Payee* – Save a new recipient for faster payments.\n\n` +
      `🔹 *📜 View Payees* – See a list of your saved payees.\n\n` +
      `🔹 *✏️ Edit Payee* – Update payee details when needed.\n\n` +
      `🔹 *🗑️ Delete Payee* – Remove a payee from your list.\n\n` +
      `*Select an option below:*`,
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
};

export default showPayeesMenu;
