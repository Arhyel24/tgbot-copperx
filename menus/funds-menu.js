export const showFundsMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `<b>💸 Funds Transfer</b>\n\n
Send USDC, withdraw to 🏦 a bank, or check 📜 recent transactions.\n\n
Select an option below:
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📧 Send via Email", callback_data: "transfer_email" },
            { text: "💳 Send to Wallet", callback_data: "transfer_wallet" },
          ],
          [
            { text: "🏦 Withdraw to Bank", callback_data: "transfer_bank" },
            { text: "📑 Bulk Transfers", callback_data: "transfer_bulk" },
          ],
          [{ text: "📜 View Transactions", callback_data: "transfer_list" }],
          [{ text: "⬅️ Back to Main Menu", callback_data: "main_menu" }],
        ],
      },
    }
  );
};
