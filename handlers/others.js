const helpOptions = (chatId, bot) => {
  const helpMessage =
    `📌 *Copperx Bot Help Guide:*\n\n` +
    `🔹 *Getting Started*\n` +
    `/start - Start the bot\n` +
    `/login - Authenticate with Copperx\n` +
    `/wallet - View & manage wallets\n` +
    `/account - Check your USDC balance\n` +
    `💸 *Send & Withdraw*\n` +
    `/transfer - Transfer USDC to an email or wallet\n\n` +
    `🔐 *Account & Security*\n` +
    `/logout - Log out of your account\n\n` +
    `💬 *Support*\n` +
    `[Support Chat](https://t.me/copperxcommunity/2183) - Get help from the community`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
};

module.exports = { helpOptions };
