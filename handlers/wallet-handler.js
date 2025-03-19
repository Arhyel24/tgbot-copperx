const base_url = "https://income-api.copperx.io";

console.log(base_url);

function getNetworkName(networkId) {
  switch (networkId) {
    case "137":
      return "Polygon";
    case "42161":
      return "Arbitrum";
    case "8453":
      return "Base";
    case "23434":
      return "Starknet";
    default:
      return "Unknown";
  }
}

const handleViewWallets = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Fetching your wallets...");
  try {
    const response = await fetch(`${base_url}/api/wallets`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (data.length === 0)
      return bot.sendMessage(chatId, "🚫 No wallets found.");

    let message = "📜 *Your Wallets:*\n";
    data.forEach((wallet, index) => {
      message += `🔹 *Wallet ${index + 1}*
📍 Network: ${getNetworkName(wallet.network)}
🏦 Address: \`${wallet.walletAddress}\`
⭐ Default: ${wallet.isDefault ? "Yes" : "No"}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching wallets.");
  }
};

const handleCheckBalances = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Checking your wallet balances...");
  try {
    const response = await fetch(`${base_url}/api/wallets/balances`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (data.length === 0)
      return bot.sendMessage(chatId, "🚫 No balance information available.");

    let message = "💰 *Your Wallet Balances:*\n";
    data.forEach((wallet) => {
      const balanceInfo = wallet.balances
        .map((b) => `💵 ${b.balance} ${b.symbol}`)
        .join("\n");
      message += `📍 *Network:* ${getNetworkName(
        wallet.network
      )}\n${balanceInfo}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching balances.");
  }
};

const handleSetDefaultWallet = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Fetching available wallets...");
  try {
    const response = await fetch(`${base_url}/api/wallets`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (data.length === 0)
      return bot.sendMessage(chatId, "🚫 No wallets available.");

    let buttons = data.map((wallet) => [
      {
        text: `⭐ Set as Default (${wallet.walletAddress.slice(
          0,
          6
        )}...) - ${getNetworkName(wallet.network)}`,
        callback_data: `set_wallet_${wallet.id}`,
      },
    ]);

    bot.sendMessage(chatId, "🔹 *Select a wallet to set as default:*", {
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching wallets.");
  }
};

const handleTransactionHistory = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Fetching your transaction history...");

  try {
    const response = await fetch(`${base_url}/api/transfers?page=1&limit=5`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (!data.data.length)
      return bot.sendMessage(chatId, "🚫 No recent transactions found.");

    let message = "📊 *Recent Transactions:*\n";
    data.data.forEach((txn, index) => {
      message += `📌 *Transaction ${index + 1}*
🔹 Amount: ${txn.amount} ${txn.currency}
🔹 Status: ${txn.status}
🔹 Type: ${txn.type}
🔹 From: ${txn.sourceCountry}
🔹 To: ${txn.destinationCountry}
📅 Date: ${new Date(txn.createdAt).toLocaleString()}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching transactions.");
  }
};

module.exports = { handleCheckBalances, handleSetDefaultWallet, handleTransactionHistory, handleViewWallets };

