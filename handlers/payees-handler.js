const promptUser = (bot, chatId, message) => {
  return new Promise((resolve) => {
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

    const listener = (msg) => {
      if (msg.chat.id === chatId) {
        bot.removeListener("message", listener);
        resolve(msg.text.trim());
      }
    };

    bot.on("message", listener);
  });
};

const getPayees = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/payees", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch payees.");
    }

    if (!data.data || data.data.length === 0) {
      return bot.sendMessage(chatId, "❌ *No payees found.*", {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "➕ Add Payee", callback_data: "add_payee" }],
            [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
          ],
        },
      });
    }

    let message = `📜 *Your Payees:*\n\n`;

    data.data.forEach((payee, index) => {
      message += `*${index + 1}. ${
        payee.displayName || payee.nickName || "Unnamed"
      }*\n`;
      message += `📧 *Email:* ${payee.email}\n`;
      if (payee.phoneNumber) message += `📞 *Phone:* ${payee.phoneNumber}\n`;
      if (payee.hasBankAccount) {
        message += `🏦 *Bank:* ${
          payee.bankAccount.bankName || "N/A"
        } (${payee.bankAccount.country.toUpperCase()})\n`;
        message += `💳 *Account Type:* ${payee.bankAccount.bankAccountType}\n`;
      }
      message += `🕒 *Added On:* ${new Date(
        payee.createdAt
      ).toLocaleDateString()}\n\n`;
    });

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Add Payee", callback_data: "add_payee" }],
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ *${error.message}*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

const addPayee = async (chatId, bot, jwtToken) => {
  try {
    const email = await promptUser(
      bot,
      chatId,
      "📧 *Enter the payee's email address:*"
    );

    if (!/\S+@\S+\.\S+/.test(email)) {
      return bot.sendMessage(chatId, "❌ *Invalid email format. Try again.*", {
        parse_mode: "Markdown",
      });
    }

    const nickName = await promptUser(
      bot,
      chatId,
      "🏷️ *Enter a nickname for this payee:*"
    );

    if (!nickName) {
      return bot.sendMessage(chatId, "❌ *Nickname cannot be empty.*", {
        parse_mode: "Markdown",
      });
    }

    const response = await fetch("https://income-api.copperx.io/api/payees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ email, nickName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add payee");
    }

    await bot.sendMessage(
      chatId,
      `✅ *Payee added successfully!*\n\n📧 Email: ${email}\n🏷️ Nickname: ${nickName}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
          ],
        },
      }
    );
  } catch (error) {
    await bot.sendMessage(chatId, `❌ *${error.message}*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

const editPayees = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/payees", {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to fetch payees.");

    if (!data.data || data.data.length === 0) {
      return bot.sendMessage(chatId, "❌ *No payees found to edit.*", {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
          ],
        },
      });
    }

    const buttons = data.data.map((payee) => [
      {
        text: `${payee.displayName || payee.nickName || "Unnamed"}`,
        callback_data: `EDIT_PAYEE_${payee.id}`,
      },
    ]);

    await bot.sendMessage(chatId, "✏️ *Select a payee to edit:*", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          ...buttons,
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ *${error.message}*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

const editPayee = async (chatId, bot, jwtToken, payeeId) => {
  try {
    const nickName = await promptUser(bot, chatId, "✏️ *Enter new nickname:*");
    const firstName = await promptUser(bot, chatId, "👤 *Enter first name:*");
    const lastName = await promptUser(bot, chatId, "👤 *Enter last name:*");
    const phoneNumber = await promptUser(
      bot,
      chatId,
      "📞 *Enter phone number:*"
    );

    const updatedPayee = { nickName, firstName, lastName, phoneNumber };

    const response = await fetch(
      `https://income-api.copperx.io/api/payees/${payeeId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(updatedPayee),
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to update payee.");

    await bot.sendMessage(
      chatId,
      `✅ *Payee updated successfully!*\n\n📛 *Nickname:* ${nickName}\n👤 *Name:* ${firstName} ${lastName}\n📞 *Phone:* ${phoneNumber}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
          ],
        },
      }
    );
  } catch (error) {
    await bot.sendMessage(chatId, `❌ *${error.message}*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

const listPayeesForDeletion = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch("https://income-api.copperx.io/api/payees", {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to fetch payees.");
    if (!data.data.length) {
      return bot.sendMessage(chatId, "⚠️ No payees found.");
    }

    const payeeButtons = data.data.map((payee) => [
      {
        text: `🗑️ ${payee.nickName} (${payee.email})`,
        callback_data: `DELETE_PAYEE_${payee.id}`,
      },
    ]);

    await bot.sendMessage(chatId, "*Select a payee to delete:*", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          ...payeeButtons,
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ ${error.message}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

const confirmDeletePayee = async (chatId, bot, payeeId) => {
  await bot.sendMessage(
    chatId,
    "⚠️ *Are you sure you want to delete this payee?*",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Yes, Delete",
              callback_data: `CONFIRM_DELETE_${payeeId}`,
            },
          ],
          [{ text: "❌ Cancel", callback_data: "payees" }],
        ],
      },
    }
  );
};

const deletePayee = async (chatId, bot, jwtToken, payeeId) => {
  try {
    const response = await fetch(
      `https://income-api.copperx.io/api/payees/${payeeId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );

    if (!response.ok) throw new Error("Failed to delete payee.");

    await bot.sendMessage(chatId, "✅ *Payee deleted successfully!*", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ ${error.message}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Back to Payees", callback_data: "payees" }],
        ],
      },
    });
  }
};

module.exports = {
  getPayees,
  addPayee,
  editPayees,
  editPayee,
  listPayeesForDeletion,
  confirmDeletePayee,
  deletePayee,
};
