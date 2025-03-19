const showAccountMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `*🔑 Account Management*\n\n
Manage your profile settings, check your verification ✅ status, or securely log out of your account. \n\n
🔹 *View Profile*: See your registered details and account information.\n
🔹 *KYC/KYB Status*: Check the status of your identity verification process.\n
🔹 *Log Out*: Safely exit your account to prevent unauthorized access.\n\n
*⚡ Select an option below:*`,
    {
      parse_mode: "Markdown",
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

module.exports = { showAccountMenu };
