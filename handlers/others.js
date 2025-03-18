export const helpOptions = (chatId, bot) => {
    bot.sendMessage(
     chatId,
      `📌 Copperx Bot Help Guide:\n` +
        `\n🔹 Getting Started\n` +
        `/start - Start the bot\n` +
        `/login - Authenticate with Copperx\n` +
        `/wallets - View & manage wallets\n` +
        `/balance - Check your USDC balance\n` +
        `\n💸 Send & Withdraw\n` +
        `/send - Transfer USDC to email or wallet\n` +
        `\n🔔 Notifications\n` +
        `\n🔐 Account & Security\n` +
        `/kyc - Check KYC/KYB status\n` +
        `/logout - Log out of your account\n` +
        `\n💬 Support\n` +
        `Support Chat - https://t.me/copperxcommunity/2183`
    );
}