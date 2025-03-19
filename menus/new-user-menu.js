const newUserMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `*👋 Welcome to Copperx USDC Bot!*\n\n` +
      `Manage your *USDC transactions* easily from Telegram.\n` +
      `Send, receive, and withdraw USDC securely—all in one place! 💼💰\n\n` +
      `*🚀 Features:*\n\n` +
      `🔹 *💰 Check Balance*\n\n` +
      `🔹 *💸 Send USDC (Email/Wallet)*\n\n` +
      `🔹 *🏦 Withdraw to Bank*\n\n` +
      `🔹 *📜 View Transactions*\n\n` +
      `🔹 *🔔 Real-Time Alerts*\n\n` +
      `*🔑 Get started by logging in below:*`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔑 Login to Copperx", callback_data: "login" }],
        ],
      },
    }
  );
};

module.exports = { newUserMenu };
