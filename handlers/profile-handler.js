const handleCheckKYC = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/kycs", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to fetch KYC status.");
    }

    const kycData = await response.json();

    if (!kycData.data.length) {
      return bot.sendMessage(
        chatId,
        "🚫 No KYC record found.\n\n" +
          "🔍 It looks like you haven’t completed your KYC verification yet.\n" +
          "🔗 <a href='https://payout.copperx.io/app'>Click here to complete your KYC</a>.",
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Back to Profile", callback_data: "account" }],
            ],
          },
        }
      );
    }

    const kycList = kycData.data
      .map((kyc) => {
        const status = kyc.status.toUpperCase();
        return (
          `🛂 <b>KYC Status:</b>\n\n` +
          `📍 <b>Status:</b> ${status}\n` +
          `👥 <b>Type:</b> ${kyc.type}\n` +
          `🌍 <b>Country:</b> ${kyc.country.toUpperCase()}\n\n`
        );
      })
      .join("\n");

    const isApproved = kycData.data.every(
      (kyc) => kyc.status.toUpperCase() === "APPROVED"
    );

    let message = kycList;
    if (!isApproved) {
      message +=
        "🚨 <b>Your KYC is not approved yet.</b>\n" +
        "⚠️ Please complete your verification as soon as possible to avoid restrictions.\n" +
        "🔗 <a href='https://payout.copperx.io/app'>Click here to verify your KYC</a>.";
    } else {
      message +=
        "✅ <b>Your KYC is fully approved!</b>\n🎉 You can now use all features without restrictions.";
    }

    bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Profile", callback_data: "account" }],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Error fetching KYC status.\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Profile", callback_data: "account" }],
          ],
        },
      }
    );
  }
};

const handleViewProfile = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to fetch profile data.");
    }

    const user = await response.json();

    let message =
      `👤 *Your Profile Details:*\n\n` +
      `📧 *Email:* ${user.email}\n` +
      `🔹 *Status:* ${user.status.toUpperCase()}\n` +
      `🎭 *Role:* ${user.role.toUpperCase()}\n\n` +
      `💰 *Wallet Address:*\n\`${user.walletAddress || "Not linked"}\`\n\n` +
      `🔗 *Relayer Address:*\n\`${user.relayerAddress || "Not available"}\``;

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Profile", callback_data: "account" }],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Error fetching profile data.\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Profile", callback_data: "account" }],
          ],
        },
      }
    );
  }
};

const showUserPoints = async (chatId, bot, jwtToken, email) => {
  try {
    const response = await fetch(
      "https://income-api.copperx.io/api/points/total",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Failed to fetch points.");

    const message =
      `📊 *Your Points Summary*\n\n` +
      `👤 *Email:* ${email}\n` +
      `⭐ *Total Points:* ${result.total}\n\n` +
      `🔹 Earn more points by increasing your transactions, offramps, and deposits! 🚀`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Account", callback_data: "account" }],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ ${error.message}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Account", callback_data: "account" }],
        ],
      },
    });
  }
};

const handleViewBankAccounts = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Fetching your bank accounts... Please wait.");

  try {
    const response = await fetch("https://income-api.copperx.io/api/accounts", {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to fetch bank accounts.");
    }

    const { data: accounts } = await response.json();
    const bankAccounts = accounts.filter(
      (account) => account.type === "bank_account"
    );

    if (bankAccounts.length === 0) {
      return bot.sendMessage(
        chatId,
        "🚫 No bank accounts found. You can add a new one below.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "➕ Add Bank Account",
                  callback_data: "add_bank_account",
                },
              ],
              [{ text: "🔙 Back to Accounts", callback_data: "account" }],
            ],
          },
        }
      );
    }

    let message = "🏦 *Your Linked Bank Accounts:*\n\n";
    bankAccounts.forEach((account, index) => {
      message += `🔹 *Account ${index + 1}*\n`;
      message += `🏛 *Bank Name:* ${account.bankAccount.bankName}\n`;
      message += `🏦 *Account Number:* \`${account.bankAccount.bankAccountNumber}\`\n`;
      message += `📍 *Bank Address:* ${account.bankAccount.bankAddress}\n`;
      message += `⭐ *Default Account:* ${
        account.isDefault ? "Yes" : "No"
      }\n\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Accounts", callback_data: "account" }],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ *Error fetching bank accounts.*\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Accounts", callback_data: "account" }],
          ],
        },
      }
    );
  }
};


module.exports = {
  handleCheckKYC,
  handleViewProfile,
  showUserPoints,
  handleViewBankAccounts,
};
