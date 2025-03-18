export const showAccountMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `<b>🔑 Account Management</b>\n\n
Manage your profile, check ✅ verification status, or log out securely. \n\n
Select an option below:
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👤 View Profile", callback_data: "view_profile" },
            { text: "✅ KYC/KYB Status", callback_data: "check_kyc" },
          ],
          [{ text: "🚪 Log Out", callback_data: "logout" }],
          [{ text: "⬅️ Back to Main Menu", callback_data: "main_menu" }],
        ],
      },
    }
  );
};
