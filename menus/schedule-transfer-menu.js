const showTransferSchedulesMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `*📅 Transfer Schedules*\n\n` +
      `Manage your automated transfers with ease. View existing schedules, create a new one, or deactivate a schedule.\n\n` +
      `*🔹 Options:*`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📜 View All Schedules", callback_data: "view_schedules" },
            { text: "➕ Create Schedule", callback_data: "create_schedule" },
          ],
          [
            {
              text: "🛑 Deactivate Schedule",
              callback_data: "deactivate_schedule",
            },
          ],
          [
            {
              text: "⬅️ Back to Funds Transfer",
              callback_data: "funds_transfer",
            },
          ],
        ],
      },
    }
  );
};

module.exports = showTransferSchedulesMenu