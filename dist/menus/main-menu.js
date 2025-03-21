const showMainMenu = async (chatId, bot) => {
    await bot.sendMessage(chatId, `*⚙️ Manage Your Copperx Account*\n\n` +
        `Easily handle your *USDC transactions* right within Telegram.\n\n` +
        `🔹 *Check Balances* – View your available USDC funds.\n\n` +
        `🔹 *Send Funds* – Transfer USDC securely.\n\n` +
        `🔹 *Withdraw to Bank* – Move funds to your 🏦 linked bank account.\n\n` +
        `🔹 *Receive Notifications* – Get 🔔 real-time deposit alerts.\n\n` +
        `*⚡ Select an option below to get started:*`, {
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
    });
};
export default showMainMenu;
