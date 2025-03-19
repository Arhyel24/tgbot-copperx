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
    console.error("KYC Fetch Error:", error);
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
    console.error("Profile Fetch Error:", error);
  }
};

module.exports = { handleCheckKYC, handleViewProfile };
