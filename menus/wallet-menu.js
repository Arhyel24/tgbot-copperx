export const showWalletMenu = async (chatId, bot) => {
  await bot.sendMessage(
    chatId,
    `<b>👛 Wallet Management</b>\n\n
Manage your wallets, check 💰 balances, set ⭐ a default wallet, and track 📜 transaction history.\n\n
<b>Choose an option below:</b>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👛 View Wallets", callback_data: "view_wallets" },
            { text: "💰 Check Balances", callback_data: "check_balances" },
          ],
          [
            {
              text: "⭐ Set Default Wallet",
              callback_data: "set_default_wallet",
            },
            {
              text: "📜 Transaction History",
              callback_data: "transaction_history",
            },
          ],
          [{ text: "⬅️ Back to Main Menu", callback_data: "main_menu" }],
        ],
      },
    }
  );
};
