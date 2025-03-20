const base_url = "https://income-api.copperx.io";

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
  bot.sendMessage(chatId, "⏳ Fetching your wallets... Please wait.");

  try {
    const response = await fetch(`${base_url}/api/wallets`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to fetch wallets.");
    }

    const wallets = await response.json();

    if (!wallets || wallets.length === 0) {
      return bot.sendMessage(
        chatId,
        "🚫 No wallets found. Please create one.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Create Wallet", callback_data: "create_wallet" }],
              [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
            ],
          },
        }
      );
    }

    let message = "📜 *Your Wallets:*\n\n";
    wallets.forEach((wallet, index) => {
      message +=
        `🔹 *Wallet ${index + 1}*\n` +
        `📍 *Network:* ${getNetworkName(wallet.network)}\n` +
        `🏦 *Address:* \`${wallet.walletAddress || "Not available"}\`\n` +
        `⭐ *Default:* ${wallet.isDefault ? "Yes ✅" : "No ❌"}\n\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⭐ Set Default Wallet",
              callback_data: "set_default_wallet",
            },
            { text: "💰 Check Balances", callback_data: "check_balances" },
          ],
          [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Error fetching wallets.\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
          ],
        },
      }
    );
  }
};

const handleCheckBalances = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Checking your wallet balances... Please wait.");

  try {
    const response = await fetch(`${base_url}/api/wallets/balances`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to fetch balances.");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return bot.sendMessage(chatId, "🚫 No balance information available.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
          ],
        },
      });
    }

    let message = "💰 *Your Wallet Balances:*\n\n";

    data.forEach((wallet) => {
      let balanceInfo = wallet.balances
        .map((b) => {
          const formattedBalance = (BigInt(b.balance) / 10n ** 6n).toString();
          return `💵 *${formattedBalance} ${b.symbol}*`;
        })
        .join("\n");

      message += `📍 *Network:* ${getNetworkName(
        wallet.network
      )}\n${balanceInfo}\n\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Error fetching balances.\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
          ],
        },
      }
    );
  }
};

const handleSetDefaultWallet = async (chatId, bot, jwtToken) => {
  bot.sendMessage(chatId, "⏳ Fetching available wallets... Please wait.");

  try {
    const response = await fetch(`${base_url}/api/wallets`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to retrieve wallets.");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return bot.sendMessage(
        chatId,
        "🚫 No wallets available. Please create one first.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Create Wallet", callback_data: "create_wallet" }],
              [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
            ],
          },
        }
      );
    }

    let buttons = data.map((wallet) => [
      {
        text: `${wallet.isDefault ? "✅ " : "⭐ "} ${getNetworkName(
          wallet.network
        )}`,
        callback_data: wallet.isDefault ? "noop" : `set_wallet_${wallet.id}`,
      },
    ]);

    buttons.push([{ text: "🔙 Back to Wallets", callback_data: "wallet" }]);

    bot.sendMessage(chatId, "🔹 *Select a wallet to set as default:*", {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Error fetching wallets.\n\n⚠️ ${
        error.message || "Please try again later."
      }`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
          ],
        },
      }
    );
  }
};

const handleTransactionHistory = async (chatId, bot, jwtToken) => {
  bot.sendMessage(
    chatId,
    "⏳ Retrieving your latest transactions... Please wait."
  );

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

    if (!data.data.length) {
      return bot.sendMessage(
        chatId,
        "🚫 *No recent transactions found!*\n\nIt looks like you haven’t made any transactions yet. Try sending or receiving funds to see your history here.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
            ],
          },
        }
      );
    }

    let message =
      "📊 *Recent Transactions:*\n\n These are your last 5 transactions, including status and details. If none appear, try sending or receiving funds.\n\n";
    data.data.forEach((txn, index) => {
      const amount =
        txn.currency.toUpperCase() === "USDC"
          ? (txn.amount / 100_000_000).toLocaleString()
          : txn.amount.toLocaleString();

      message +=
        `📌 *Transaction ${index + 1}:*\n` +
        `💰 *Amount:* ${amount} ${txn.currency.toUpperCase()}\n` +
        `🔹 *Transaction Type:* ${txn.type.replace("_", " ").toUpperCase()}\n` +
        `🔹 *Status:* ${txn.status}\n` +
        `📅 *Date:* ${new Date(txn.createdAt).toLocaleString()}\n\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔙 Back to Wallets", callback_data: "wallet" },
            { text: "🔃 Refresh", callback_data: "transaction_history" },
          ],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error fetching transactions.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back to Wallets", callback_data: "wallet" }],
        ],
      },
    });
  }
};

module.exports = {
  handleCheckBalances,
  handleSetDefaultWallet,
  handleTransactionHistory,
  handleViewWallets,
  getNetworkName,
};
