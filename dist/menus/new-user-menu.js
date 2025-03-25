import { logger } from "@/utils/logger.js";
const newUserMenu = async (chatId, bot) => {
    try {
        await bot.sendMessage(chatId, `*👋 Welcome to Copperx USDC Bot!*\n\n` +
            `Easily manage your *USDC transactions* right from Telegram.\n\n` +
            `💼 Send, receive, and withdraw USDC securely—all in one place!\n\n` +
            `*🚀 Key Features:*\n` +
            `🔹 *💰 Check Balance* – View your available funds.\n` +
            `🔹 *💸 Send USDC* – Transfer via email or wallet.\n` +
            `🔹 *🏦 Withdraw to Bank* – Move funds to a linked bank account.\n` +
            `🔹 *📜 View Transactions* – Track your transaction history.\n` +
            `🔹 *🔔 Real-Time Alerts* – Get notified of deposits and withdrawals.\n\n` +
            `*🔑 Get started by logging in below:*`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔑 Login to Copperx", callback_data: "login" }],
                ],
            },
        });
    }
    catch (error) {
        logger.error("❌ Error sending new user menu:", error);
    }
};
export default newUserMenu;
