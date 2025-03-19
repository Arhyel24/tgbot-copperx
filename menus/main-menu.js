const showMainMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `<b>⚙️ Manage your Copperx Account</b>\n\n
Manage your USDC transactions directly in Telegram. Check 💰 balances, send 💸 funds, withdraw to 🏦 a bank, and receive 🔔 real-time deposit notifications.\n\n
<b>Select an option below to get started:</b>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👤 Account", callback_data: "account" },
            { text: "💼 Wallet", callback_data: "wallet" },
          ],
          [{ text: "💸 Funds Transfer", callback_data: "funds_transfer" }],
          [{ text: "❓ Help & Support", callback_data: "help" }],
        ],
      },
    }
  );
};

module.exports = { showMainMenu };
