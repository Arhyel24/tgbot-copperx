export const showWelcomeMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `🤖 *Welcome to Copperx Bot!*\n\n` +
    `Manage your USDC transactions directly in Telegram. You can check balances, send funds, withdraw to a bank, and get real-time deposit notifications.\n\n` +
    `🔹 *Select an option below to get started:*`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔐 Account", callback_data: "account" }, { text: "👛 Wallet", callback_data: "wallet" }],
          [{ text: "💸 Funds Transfer", callback_data: "funds_transfer" }],
          [{ text: "❓ Help & Support", callback_data: "help" }]
        ]
      }
    }
  );
};
