import TelegramBot, {
  ParseMode,
  SendMessageOptions,
} from "node-telegram-bot-api";

// Help Options
const helpOptions = (chatId: number, bot: TelegramBot): void => {
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

// Initiate Deposit
const initiateDeposit = async (
  chatId: number,
  bot: TelegramBot,
  accessToken: string
): Promise<void> => {
  try {
    const amount = await captureValidAmount(bot, chatId);
    const sourceOfFunds = await captureValidSource(bot, chatId);

    const processingPrompt = await bot.sendMessage(
      chatId,
      "⏳ Processing your deposit request..."
    );

    const res = await fetch(
      "https://income-api.copperx.io/api/transfers/deposit",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, sourceOfFunds, depositChainId: 8453 }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Transfer failed");

    await bot.deleteMessage(chatId, processingPrompt.message_id);

    await bot.sendMessage(
      chatId,
      `✅ Deposit initiated successfully!\n\n` +
        `📝 **Details**:\n` +
        `- **Amount**: ${(
          data.amountSubtotal / 100_000_000
        ).toLocaleString()} ${data.feeCurrency}\n` +
        `- **Status**: ${data.status}\n` +
        `- **ID**: ${data.id}\n\n` +
        `💰 **You'll pay**: ${(
          data.transactions[0].fromAmount / 100_000_000
        ).toLocaleString()} ${data.feeCurrency}\n` +
        `💵 **You'll receive**: ${(
          data.transactions[0].toAmount / 100_000_000
        ).toLocaleString()} ${data.feeCurrency}\n\n` +
        `🔗 **Complete your deposit**: [Complete](${data.transactions[0].depositUrl})`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🌐 Proceed to Deposit",
                url: data.transactions[0].depositUrl,
              },
            ],
            [{ text: "🔙 Back to main menu", callback_data: "main_menu" }],
          ],
        },
      }
    );
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Failed to process deposit: ${error.message}`,
      getBackToMenuOptions()
    );
  }
};

// Capture valid source of funds
const captureValidSource = async (
  bot: TelegramBot,
  chatId: number
): Promise<string> => {
  const validSources = [
    "salary",
    "savings",
    "lottery",
    "investment",
    "loan",
    "business_income",
    "others",
  ];

  while (true) {
    const sourcePrompt = await bot.sendMessage(
      chatId,
      `🔍 What is the source of these funds?\n\n${validSources
        .map((s) => `- ${s}`)
        .join("\n")}`,
      { reply_markup: { force_reply: true } }
    );

    const source = await awaitReply(bot, sourcePrompt.message_id);

    if (validSources.includes(source.toLowerCase())) return source;
    await bot.sendMessage(
      chatId,
      "❌ Invalid source. Please choose one from the list."
    );
  }
};

// Capture valid deposit amount
const captureValidAmount = async (
  bot: TelegramBot,
  chatId: number
): Promise<string> => {
  const minAmount = BigInt(1 * 10 ** 6);
  const maxAmount = BigInt(5000000 * 10 ** 6);

  while (true) {
    const amountInput = await promptUser(
      bot,
      chatId,
      "💰 Enter amount (USDC) - Min: 1, Max: 5,000,000:\n_(Type 'cancel' to return to the transfer menu)_"
    );

    if (amountInput.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    const amount = BigInt(Math.round(parseFloat(amountInput) * 10 ** 8));

    if (amount >= minAmount && amount <= maxAmount) return amount.toString();
    await bot.sendMessage(
      chatId,
      `❌ Amount must be between 100 and 5,000,000 USDC.\n_(Type 'cancel' to return to the transfer menu)_`
    );
  }
};

// Prompt user for input
const promptUser = (
  bot: TelegramBot,
  chatId: number,
  message: string
): Promise<string> => {
  return new Promise((resolve) => {
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

    const listener = (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        bot.removeListener("message", listener);
        resolve(msg.text?.trim() || "");
      }
    };

    bot.on("message", listener);
  });
};

// Await a reply from the user
const awaitReply = (
  bot: TelegramBot,
  promptMessageId: number
): Promise<string> => {
  return new Promise((resolve) => {
    const handler = (msg: TelegramBot.Message) => {
      if (msg.reply_to_message?.message_id === promptMessageId) {
        bot.removeListener("message", handler);
        resolve(msg.text || "");
      }
    };
    bot.on("message", handler);
  });
};

// Cancel transfer
const cancelTransfer = (chatId: number, bot: TelegramBot): string => {
  bot.sendMessage(chatId, "🔙 Transfer cancelled.", getBackToMenuOptions());
  return "cancelled";
};

// Get back to main menu options
const getBackToMenuOptions = (): SendMessageOptions => ({
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔙 Back to main menu", callback_data: "main_menu" }],
    ],
  },
  parse_mode: "Markdown" as ParseMode,
});

export { initiateDeposit, helpOptions };
