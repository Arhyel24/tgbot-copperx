import { logger } from "../utils/logger.js";
const showFundsMenu = async (chatId, bot) => {
    try {
        await bot.sendMessage(chatId, `*💸 Funds Transfer*\n\n` +
            `Easily send *USDC*, withdraw funds to a 🏦 bank account, or review your 📜 recent transactions.\n\n` +
            `🔹 *Send via Email* – Transfer USDC to a recipient's email address.\n` +
            `🔹 *Send to Wallet* – Transfer USDC directly to a blockchain wallet.\n` +
            `🔹 *Withdraw to Bank* – Move funds from your wallet to a linked bank account.\n` +
            `🔹 *Bulk Transfers* – Send payments to multiple recipients at once.\n` +
            `🔹 *View Transactions* – Check your recent fund transfers and withdrawals.\n\n` +
            `*⚡ Select an option below:*`, {
            parse_mode: "Markdown",
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
        });
    }
    catch (error) {
        logger.error("❌ Error sending funds menu:", error);
    }
};
export default showFundsMenu;
