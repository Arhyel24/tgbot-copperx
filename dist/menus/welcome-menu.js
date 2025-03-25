const showWelcomeMenu = async (chatId, bot) => {
    try {
        await bot.sendMessage(chatId, `*🤖 Welcome to Copperx Bot!*\n\n` +
            `Easily *manage your USDC transactions* right from Telegram.\n` +
            `Check balances, send funds, or withdraw to your bank—all in a few taps! 💸🏦\n\n` +
            `*🔹 What You Can Do:*\n\n` +
            `👤 *Account Management* – Profile, verification & logout.\n` +
            `💼 *Wallet* – View balances & track transactions.\n` +
            `💸 *Funds Transfer* – Send USDC or withdraw to a bank.\n` +
            `❓ *Help & Support* – Need assistance? We’re here to help.\n\n` +
            `*⚡ Choose an option below to begin:*`, {
            parse_mode: "Markdown",
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
        });
    }
    catch (error) {
        console.error("❌ Error sending welcome menu:", error);
    }
};
export default showWelcomeMenu;
