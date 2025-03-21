import TelegramBot from "node-telegram-bot-api";

const showMainMenu = async (
  chatId: number,
  bot: TelegramBot
): Promise<void> => {
  await bot.sendMessage(
    chatId,
    `*⚙️ Manage Your Copperx Account*

` +
      `Easily handle your *USDC transactions* right within Telegram.

` +
      `🔹 *Check Balances* – View your available USDC funds.

` +
      `🔹 *Send Funds* – Transfer USDC securely.

` +
      `🔹 *Withdraw to Bank* – Move funds to your 🏦 linked bank account.

` +
      `🔹 *Receive Notifications* – Get 🔔 real-time deposit alerts.

` +
      `📢 *How to Use Commands*:
      To ask a question or give a command, start your message with *!*.` +
      
      `✅ Example: *!Check my balance* → Use the command "/check_balances" to view your funds.` +
      `✅ Example: *!Send money to John* → Use the command "/funds_transfer" to transfer funds.` +
      `✅ Example: *!Withdraw to my bank* → Use the command "/withdraw" to move funds to your linked bank account.

` +
      `*⚡ Select an option below to get started:*`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👤 Account", callback_data: "account" },
            { text: "💼 Wallet", callback_data: "wallet" },
          ],
          [
            { text: "🏧 Deposit funds", callback_data: "deposit" },
            { text: "💸 Funds Transfer", callback_data: "funds_transfer" },
          ],
          [{ text: "❓ Help & Support", callback_data: "help" }],
        ],
      },
    }
  );
};

export default showMainMenu;
