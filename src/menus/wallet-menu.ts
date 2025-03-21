import TelegramBot from "node-telegram-bot-api";

const showWalletMenu = async (chatId: number, bot: TelegramBot): Promise<void> => {
  await bot.sendMessage(
    chatId,
    `*👛 Wallet Management*\n\n` +
      `Stay in control of your *USDC wallets*.\n` +
      `Check balances, set a default wallet, or review transactions—all in one place! 💰📜\n\n` +
      `*🔹 Options:*\n\n` +
      `🔹 *👛 View Wallets*\n\n` +
      `🔹 *💰 Check Balances*\n\n` +
      `🔹 *⭐ Set Default Wallet*\n\n` +
      `🔹 *📜 Transaction History*\n\n` +
      `*Choose an option below:*`,
    {
      parse_mode: "Markdown",
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

export default showWalletMenu ;
