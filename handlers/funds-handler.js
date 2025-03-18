const base_url = "https://income-api.copperx.io/api/transfers";

const emailTransfer = async (chatId, bot, accessToken, transferData) => {
  try {
    const response = await fetch(`${base_url}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Transfer failed");

    bot.sendMessage(
      chatId,
      `✅ Email Transfer Initiated!\nStatus: ${data.status}`
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Email Transfer Failed: ${error.message}`);
  }
};

const walletTransfer = async (chatId, bot, accessToken, transferData) => {
  try {
    const response = await fetch(`${base_url}/wallet-withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Transfer failed");

    bot.sendMessage(
      chatId,
      `✅ Wallet Transfer Successful!\nStatus: ${data.status}`
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Wallet Transfer Failed: ${error.message}`);
  }
};

const bankWithdrawal = async (chatId, bot, accessToken, withdrawalData) => {
  try {
    const response = await fetch(`${base_url}/offramp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withdrawalData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Withdrawal failed");

    bot.sendMessage(
      chatId,
      `✅ Bank Withdrawal Initiated!\nStatus: ${data.status}`
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Bank Withdrawal Failed: ${error.message}`);
  }
};

const bulkTransfer = async (chatId, bot, accessToken, bulkData) => {
  try {
    const response = await fetch(`${base_url}/send-batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bulkData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Bulk Transfer failed");

    bot.sendMessage(chatId, `✅ Bulk Transfer Completed!`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Bulk Transfer Failed: ${error.message}`);
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

    let message = "📊 Recent Transfers:\n\n";
    data.data.forEach((txn, index) => {
      message += `📌 ${index + 1}. Amount: ${txn.amount} ${
        txn.currency
      } | Status: ${txn.status}\n`;
    });

    bot.sendMessage(chatId, message || "No recent transfers found.");
  } catch (error) {
    bot.sendMessage(
      chatId,
      `❌ Failed to retrieve transfers: ${error.message}`
    );
  }
};

module.exports = {
  emailTransfer,
  walletTransfer,
  bankWithdrawal,
  bulkTransfer,
  listTransfers,
};
