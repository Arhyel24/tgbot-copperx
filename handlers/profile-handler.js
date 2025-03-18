export const handleCheckKYC = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/kycs", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch KYC status");

    const kycData = await response.json();

    if (!kycData.data.length) {
      return bot.sendMessage(
        chatId,
        "🚫 No KYC record found.\n\n🔗 Please complete your KYC verification at <a href='https://payout.copperx.io/app'>Copperx Payout</a>.",
        { parse_mode: "HTML" }
      );
    }

    const kyc = kycData.data[0];
    const status = kyc.status.toUpperCase();

    let message =
      `🛂 <b>KYC Status:</b>\n\n` +
      `📍 <b>Status:</b> ${status}\n` +
      `👥 <b>Type:</b> ${kyc.type}\n` +
      `🌍 <b>Country:</b> ${kyc.country}\n\n`;

    if (status !== "APPROVED") {
      message += `🚨 Your KYC is not approved yet. Please complete verification at:\n🔗 <a href='https://payout.copperx.io/app'>Copperx Payout</a>`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching KYC status.");
  }
};

export const handleViewProfile = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch profile");

    const user = await response.json();
    let message =
      `👤 *Your Profile:*\n\n` +
      `📧 Email: ${user.email}\n\n` +
      `🔹 Status: ${user.status}\n\n` +
      `🎭 Role: ${user.role}\n\n` +
      `🏦 Wallet Address: \`${user.walletAddress}\`\n\n` +
      `🔗 Relayer Address: \`${user.relayerAddress}\``;

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching profile data.");
  }
};
