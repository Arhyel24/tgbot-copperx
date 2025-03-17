export const newUserMenu = async (chatId, bot) => {
    await bot.sendMessage(
    msg.chat.id,
    `👋 Welcome to the Copperx USDC Bot!  

This bot allows you to securely manage your USDC transactions on Copperx directly from Telegram.

✨ Features:  
- 🔍 Check your wallet balance  
- 💸 Send USDC to an email or wallet address
- 🏦 Withdraw USDC to your bank account  
- 📜 View transaction history  
- 🔔 Receive real-time deposit notifications  

To get started, authenticate with Copperx below:  
  `,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔑 Login", callback_data: "login" }]],
      },
    }
  );
}