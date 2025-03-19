const base_url = "https://income-api.copperx.io/api/transfers";

const purposeOptions = [
  "self",
  "salary",
  "gift",
  "income",
  "saving",
  "education_support",
  "family",
  "home_improvement",
  "reimbursement",
];
const minAmount = BigInt(100_000_000);
const maxAmount = BigInt(5_000_000_000_000);

const emailTransfer = async (chatId, bot, accessToken, userId) => {
  try {
    let transferData = { currency: "USDC", payeeId: userId };

    transferData.email = await promptUser(
      bot,
      chatId,
      "📧 *Please enter the recipient's email:*\n_(Type 'cancel' to return to the transfer menu)_"
    );
    if (transferData.email.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    transferData.amount = await captureValidAmount(
      bot,
      chatId,
      minAmount,
      maxAmount
    );
    if (transferData.amount.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    transferData.purposeCode = await captureValidPurpose(
      bot,
      chatId,
      purposeOptions
    );
    if (transferData.purposeCode.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    const confirmationMessage = `⚡ *Confirm Transfer:*\n
    - 📧 *Email:* ${transferData.email}\n
    - 🆔 *Payee ID:* ${transferData.payeeId}\n
    - 💰 *Amount:* ${BigInt(transferData.amount) / 10n ** 6n} USDC\n
    - 🎯 *Purpose:* ${transferData.purposeCode}\n
    \n_Reply 'YES' to proceed, 'NO' to cancel, or 'cancel' to return to the transfer menu._`;

    const confirmation = await promptUser(bot, chatId, confirmationMessage);
    if (confirmation.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);
    if (confirmation.toLowerCase() !== "yes") {
      return bot.sendMessage(
        chatId,
        "🚫 *Transfer cancelled.*",
        getBackToMenuOptions()
      );
    }

    const response = await fetch(`${base_url}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Transfer failed");

    bot.sendMessage(
      chatId,
      `✅ *Email Transfer Initiated!*\nStatus: ${data.status}`,
      getBackToMenuOptions()
    );
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ *Transfer Failed:*\n${error.message}`,
      getBackToMenuOptions()
    );
    console.error("Transfer Error:", error);
  }
};

const walletTransfer = async (chatId, bot, accessToken) => {
  try {
    let transferData = { currency: "USDC" };

    transferData.walletAddress = await promptUser(
      bot,
      chatId,
      "🔗 *Please enter the recipient's wallet address:*\n_(Type 'cancel' to return to the transfer menu)_"
    );
    if (transferData.walletAddress.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    transferData.amount = await captureValidAmount(
      bot,
      chatId,
      minAmount,
      maxAmount
    );
    if (transferData.amount.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    transferData.purposeCode = await captureValidPurpose(
      bot,
      chatId,
      purposeOptions
    );
    if (transferData.purposeCode.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    const confirmationMessage = `⚡ *Confirm Wallet Transfer:*\n
    - 🔗 *Wallet Address:* ${transferData.walletAddress}\n
    - 💰 *Amount:* ${BigInt(transferData.amount) / 10n ** 6n} USDC\n
    - 🎯 *Purpose:* ${transferData.purposeCode}\n
    \n_Reply 'YES' to proceed, 'NO' to cancel, or 'cancel' to return to the transfer menu._`;

    const confirmation = await promptUser(bot, chatId, confirmationMessage);
    if (confirmation.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);
    if (confirmation.toLowerCase() !== "yes") {
      return bot.sendMessage(
        chatId,
        "🚫 *Transfer cancelled.*",
        getBackToMenuOptions()
      );
    }

    const response = await fetch(`${base_url}/wallet-withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Transfer failed");

    bot.sendMessage(
      chatId,
      `✅ *Wallet Transfer Successful!*\nStatus: ${data.status}`,
      getBackToMenuOptions()
    );
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ *Wallet Transfer Failed:*\n${error.message}`,
      getBackToMenuOptions()
    );
    console.error("Wallet Transfer Error:", error);
  }
};

const bankWithdrawal = async (chatId, bot, accessToken) => {
  try {
    let amountInUSD;
    while (true) {
      const amountInput = await promptUser(
        bot,
        chatId,
        "💰 *Enter the withdrawal amount (USD):*\n_(Type 'cancel' to return to the transfer menu)_"
      );
      if (amountInput.toLowerCase() === "cancel")
        return cancelTransfer(chatId, bot);

      const amount = parseFloat(amountInput);
      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(
          chatId,
          "❌ *Invalid amount! Please enter a valid number.*"
        );
        continue;
      }

      amountInUSD = BigInt(Math.round(amount * 10 ** 6));
      if (amountInUSD < minAmount || amountInUSD > maxAmount) {
        await bot.sendMessage(
          chatId,
          `❌ *Amount must be between 100 USD and 5,000,000 USD.*`
        );
      } else {
        break;
      }
    }

    const preferredBankAccountId = await promptUser(
      bot,
      chatId,
      "🏦 *Enter Preferred Bank Account ID:*"
    );
    if (preferredBankAccountId.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    const payeeId = await promptUser(bot, chatId, "👤 *Enter Payee ID:*");
    if (payeeId.toLowerCase() === "cancel") return cancelTransfer(chatId, bot);

    const quoteRequest = {
      sourceCountry: "usa",
      destinationCountry: "usa",
      amount: amountInUSD.toString(),
      currency: "USD",
      preferredDestinationPaymentMethods: ["string"],
      preferredProviderId: "string",
      thirdPartyPayment: true,
      destinationCurrency: "USD",
      onlyRemittance: true,
      preferredBankAccountId,
      payeeId,
    };

    const quoteResponse = await fetchQuote(accessToken, quoteRequest);
    if (!quoteResponse || quoteResponse.error) {
      throw new Error(quoteResponse?.error || "Failed to fetch quote.");
    }

    const withdrawalData = {
      invoiceNumber: await promptUser(
        bot,
        chatId,
        "📜 *Enter Invoice Number:*"
      ),
      invoiceUrl: await promptUser(bot, chatId, "🔗 *Enter Invoice URL:*"),
      purposeCode: "self",
      sourceOfFunds: "salary",
      recipientRelationship: "self",
      quotePayload: quoteResponse.quotePayload,
      quoteSignature: quoteResponse.quoteSignature,
      preferredWalletId: preferredBankAccountId,
      customerData: await captureCustomerData(bot, chatId),
      sourceOfFundsFile: await promptUser(
        bot,
        chatId,
        "📁 *Enter Source of Funds File URL:*"
      ),
      note: await promptUser(
        bot,
        chatId,
        "📝 *Enter a Note for the withdrawal:*"
      ),
    };

    if (
      withdrawalData.invoiceNumber.toLowerCase() === "cancel" ||
      withdrawalData.invoiceUrl.toLowerCase() === "cancel" ||
      withdrawalData.sourceOfFundsFile.toLowerCase() === "cancel" ||
      withdrawalData.note.toLowerCase() === "cancel"
    ) {
      return cancelTransfer(chatId, bot);
    }

    const confirmationMessage = `⚡ *Confirm Bank Withdrawal:*\n
    - 📜 *Invoice Number:* ${withdrawalData.invoiceNumber}
    - 🔗 *Invoice URL:* ${withdrawalData.invoiceUrl}
    - 💰 *Amount:* ${amountInUSD} USD
    - ⏳ *Estimated Arrival:* ${quoteResponse.arrivalTimeMessage}
    - 🏦 *Preferred Bank Account:* ${withdrawalData.preferredWalletId}
    - 👤 *Name:* ${withdrawalData.customerData.name}
    - 🏢 *Business Name:* ${withdrawalData.customerData.businessName}
    - 📧 *Email:* ${withdrawalData.customerData.email}
    - 🌍 *Country:* ${withdrawalData.customerData.country}
    \n_Reply 'YES' to proceed, 'NO' to cancel, or 'cancel' to return to the transfer menu._`;

    const confirmation = await promptUser(bot, chatId, confirmationMessage);
    if (confirmation.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);
    if (confirmation.toLowerCase() !== "yes") {
      return bot.sendMessage(
        chatId,
        "🚫 *Withdrawal cancelled.*",
        getBackToMenuOptions()
      );
    }

    const response = await fetch(`${base_url}/offramp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withdrawalData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Withdrawal failed");

    bot.sendMessage(
      chatId,
      `✅ *Bank Withdrawal Initiated!*\nStatus: ${data.status}`,
      getBackToMenuOptions()
    );
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ *Bank Withdrawal Failed:*\n${error.message}`,
      getBackToMenuOptions()
    );
    console.error("Bank Withdrawal Error:", error);
  }
};

const bulkTransfer = async (chatId, bot, accessToken, userId) => {
  try {
    let bulkData = { requests: [] };

    let recipientCount = await promptUser(
      bot,
      chatId,
      "📌 *How many recipients do you want to send funds to?*\n_(Type 'cancel' to return to the transfer menu)_"
    );

    if (recipientCount.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    recipientCount = parseInt(recipientCount, 10);
    if (isNaN(recipientCount) || recipientCount <= 0) {
      return bot.sendMessage(
        chatId,
        "❌ *Invalid number! Please start the process again.*",
        getBackToMenuOptions()
      );
    }

    for (let i = 0; i < recipientCount; i++) {
      await bot.sendMessage(
        chatId,
        `👤 *Enter details for recipient ${i + 1}:*`
      );

      let walletAddress = await promptUser(
        bot,
        chatId,
        "🔗 *Enter recipient's wallet address (or press Enter to skip):*\n_(Type 'cancel' to stop)_"
      );
      if (walletAddress.toLowerCase() === "cancel")
        return cancelTransfer(chatId, bot);

      let email = "";
      if (!walletAddress) {
        email = await promptUser(
          bot,
          chatId,
          "📧 *Enter recipient's email:*\n_(Type 'cancel' to stop)_"
        );
        if (email.toLowerCase() === "cancel")
          return cancelTransfer(chatId, bot);

        if (!email) {
          await bot.sendMessage(
            chatId,
            "❌ *You must provide either a wallet address or an email.*"
          );
          i--;
          continue;
        }
      }

      let amount = await captureValidAmount(bot, chatId, minAmount, maxAmount);
      if (amount.toLowerCase() === "cancel") return 

      let purpose = await captureValidPurpose(bot, chatId, purposeOptions);
      if (purpose.toLowerCase() === "cancel")
        return cancelTransfer(chatId, bot);

      bulkData.requests.push({
        requestId: `txn-${Date.now()}-${i}`,
        request: {
          walletAddress: walletAddress || null,
          email: email || null,
          payeeId: userId,
          amount,
          purposeCode: purpose,
          currency: "USDC",
        },
      });
    }

    let confirmationMessage = `⚡ *Confirm Bulk Transfer:*\n\n`;
    bulkData.requests.forEach((req, index) => {
      confirmationMessage += `🔹 *Recipient ${index + 1}:*\n  - ${
        req.request.walletAddress
          ? `*Wallet:* ${req.request.walletAddress}`
          : `*Email:* ${req.request.email}`
      }\n  - *Amount:* ${
        BigInt(req.request.amount) / 10n ** 6n
      } USD\n  - *Purpose:* ${req.request.purposeCode}\n\n`;
    });
    confirmationMessage +=
      "*Reply 'YES' to proceed, 'NO' to cancel, or 'cancel' to return to the transfer menu.*";

    const confirmation = await promptUser(bot, chatId, confirmationMessage);
    if (confirmation.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);
    if (confirmation.toLowerCase() !== "yes") {
      return bot.sendMessage(
        chatId,
        "🚫 *Bulk transfer cancelled.*",
        getBackToMenuOptions()
      );
    }

    console.log("Payload:", bulkData);

    const response = await fetch(`${base_url}/send-batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bulkData),
    });

    const data = await response.json();

    console.log("Data:", data);

    if (!response.ok) throw new Error(data.error || "Bulk Transfer failed");

    bot.sendMessage(
      chatId,
      `✅ *Bulk Transfer Completed Successfully!*`,
      getBackToMenuOptions()
    );
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ *Bulk Transfer Failed:*\n${error.message}`,
      getBackToMenuOptions()
    );
    console.error("Bulk Transfer Error:", error);
  }
};

const promptUser = (bot, chatId, message) => {
  return new Promise((resolve) => {
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

    const listener = (msg) => {
      if (msg.chat.id === chatId) {
        bot.removeListener("message", listener);
        const text = msg.text.trim();
        resolve(text);
      }
    };

    bot.on("message", listener);
  });
};

const captureCustomerData = async (bot, chatId) => {
  return {
    name: await promptUser(bot, chatId, "👤 Enter Customer Name:"),
    businessName: await promptUser(bot, chatId, "🏢 Enter Business Name:"),
    email: await promptUser(bot, chatId, "📧 Enter Customer Email:"),
    country: await promptUser(bot, chatId, "🌍 Enter Customer Country:"),
  };
};

const fetchQuote = async (accessToken, quoteRequest) => {
  try {
    const response = await fetch(`${base_url}/api/quotes/offramp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) throw new Error("Failed to fetch quote");

    return await response.json();
  } catch (error) {
    console.error("Quote Fetch Error:", error);
    return null;
  }
};

const captureValidAmount = async (bot, chatId, minAmount, maxAmount) => {
  while (true) {
    let amountInput = await promptUser(
      bot,
      chatId,
      "💰 *Enter the transfer amount (USDC) - Min: 100, Max: 5,000,000:*\n_(Type 'cancel' to return to the transfer menu)_"
    );
    if (amountInput.toLowerCase() === "cancel")
      return cancelTransfer(chatId, bot);

    let amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid amount! Please enter a valid number.*"
      );
      continue;
    }

    let amountInUSDC = BigInt(Math.round(amount * 10 ** 6));

    if (amountInUSDC < minAmount || amountInUSDC > maxAmount) {
      await bot.sendMessage(
        chatId,
        `❌ *Amount must be between 100 USDC and 5,000,000 USDC.*`
      );
    } else {
      return amountInUSDC.toString();
    }
  }
};

const captureValidPurpose = async (bot, chatId, purposeOptions) => {
  let purposeMessage = `🎯 *Select the purpose of the transfer:*\n\n${purposeOptions
    .map((p) => `👉 *${p}*`)
    .join("\n")}`;

  await bot.sendMessage(chatId, purposeMessage, { parse_mode: "Markdown" });

  while (true) {
    let response = (
      await promptUser(bot, chatId, "Type the option as shown above.")
    ).trim();

    if (purposeOptions.includes(response)) {
      return response;
    }

    await bot.sendMessage(
      chatId,
      "❌ Invalid option! Please type the option exactly as shown."
    );
  }
};

const listTransfers = async (chatId, bot, accessToken) => {
  try {
    const response = await fetch(`${base_url}?page=1&limit=10`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Failed to retrieve transfers");

    let message = "📊 *Recent Transfers:*\n\n";

    if (data.data.length === 0) {
      message += "No recent transfers found.";
    } else {
      data.data.forEach((txn, index) => {
        const amount =
          txn.currency.toUpperCase() === "USDC"
            ? (txn.amount / 100_000_000).toLocaleString()
            : txn.amount.toLocaleString();

        message += `📌 *${index + 1}.* Amount: *${amount}* ${
          txn.currency
        } | Status: *${txn.status}*\n`;
      });
    }

    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Transfers", callback_data: "funds_transfer" }],
        ],
      },
      parse_mode: "Markdown",
    };

    bot.sendMessage(chatId, message, options);
  } catch (error) {
    const errorMessage = `❌ *Error:*\nFailed to retrieve transfers. Please try again later.\n\n*Details:* ${error.message}`;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Transfers", callback_data: "funds_transfer" }],
        ],
      },
      parse_mode: "Markdown",
    };

    bot.sendMessage(chatId, errorMessage, options);
  }
};

const cancelTransfer = (chatId, bot) => {
  bot.sendMessage(
    chatId,
    "🔙 *Transfer process cancelled. Returning to the menu...*",
    getBackToMenuOptions()
  );
};

const getBackToMenuOptions = () => ({
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔙 Back to Transfers", callback_data: "funds_transfer" }],
    ],
  },
  parse_mode: "Markdown",
});

module.exports = {
  emailTransfer,
  walletTransfer,
  bankWithdrawal,
  bulkTransfer,
  listTransfers,
};
