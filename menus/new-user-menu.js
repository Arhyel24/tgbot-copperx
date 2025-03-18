export const newUserMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `<b>👋 Welcome to the Copperx USDC Bot!</b>\n\n` +
      `This bot allows you to securely manage your USDC transactions on Copperx directly from Telegram.\n\n` +
      `<b>✨ Features:</b>\n` +
      `- Check your wallet balance\n` +
      `- Send USDC to an email or wallet address\n` +
      `- Withdraw USDC to your bank account\n` +
      `- View transaction history\n` +
      `- Receive real-time deposit notifications\n\n` +
      `<b>To get started, authenticate with Copperx below:</b>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
      },
    }
  );
};
