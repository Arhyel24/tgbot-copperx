import TelegramBot from "node-telegram-bot-api";

const showWalletMenu = async (
  chatId: number,
  bot: TelegramBot
): Promise<void> => {
  try {
    await bot.sendMessage(
      chatId,
      `*👛 Wallet Management*\n\n` +
        `Stay in control of your *USDC wallets* effortlessly.\n` +
        `Check balances, set a default wallet, or review transactions—all in one place! 💰📜\n\n` +
        `*🔹 Available Actions:*\n\n` +
        `👛 *View Wallets* – See all linked wallets.\n` +
        `💰 *Check Balances* – View available USDC funds.\n` +
        `⭐ *Set Default Wallet* – Choose your primary wallet.\n` +
        `📜 *Transaction History* – Track past transactions.\n\n` +
        `*⚡ Select an option below:*`,
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
  } catch (error) {
    console.error("❌ Error sending wallet menu:", error);
  }
};

export default showWalletMenu;
