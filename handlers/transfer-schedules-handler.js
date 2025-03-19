const minAmount = BigInt(100_000_000);
const maxAmount = BigInt(5_000_000_000_000);

const viewTransferSchedules = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch(
      "https://income-api.copperx.io/api/transfer-schedules",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to retrieve your transfer schedules. Please try again later."
      );
    }

    let message = `*📅 Your Scheduled Transfers:*\n\n`;

    if (result.data.length === 0) {
      message +=
        "📭 *No active transfer schedules found.*\n\n" +
        "You can set up automatic transfers to streamline your payments and fund movements. " +
        "Click below to create a new schedule! ⬇️";
    } else {
      result.data.forEach((schedule, index) => {
        message += `🔹 *Schedule ${index + 1}:*\n`;
        message += `  - **Status:** ${
          schedule.status === "active" ? "✅ Active" : "⛔ Inactive"
        }\n`;
        message += `  - **Transfer Type:** ${schedule.type
          .replace("_", " ")
          .toUpperCase()}\n`;
        message += `  - **Amount:** 💰 ${schedule.amount} ${schedule.currency}\n`;
        message += `  - **Frequency:** 🔄 ${
          schedule.repeatType.charAt(0).toUpperCase() +
          schedule.repeatType.slice(1)
        }\n`;
        message += `  - **Recipient:** 👤 ${
          schedule.payee.nickName || schedule.payee.email
        }\n`;
        message += `  - **Created On:** 🗓️ ${new Date(
          schedule.createdAt
        ).toDateString()}\n\n`;
      });

      message +=
        "✅ *Managing your schedules ensures seamless transactions without manual intervention.*\n\n" +
        "You can create new schedules, deactivate existing ones, or update payment details anytime.";
    }

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Create New Schedule",
              callback_data: "create_schedule",
            },
          ],
          [
            {
              text: "⬅️ Back to Transfer Schedules",
              callback_data: "transfer_schedules",
            },
          ],
        ],
      },
    });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Error Fetching Transfer Schedules:*\n\n` +
        `${error.message}\n\n` +
        "Please check your network connection and try again. If the issue persists, contact support.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Back to Transfer Schedules",
                callback_data: "transfer_schedules",
              },
            ],
          ],
        },
      }
    );
  }
};

const deactivateTransferSchedule = async (chatId, bot, jwtToken) => {
  try {
    const response = await fetch(
      "https://income-api.copperx.io/api/transfer-schedules",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to retrieve transfer schedules."
      );
    }

    if (result.data.length === 0) {
      return await bot.sendMessage(
        chatId,
        `📭 *No active transfer schedules found.*\n\nYou can create a new schedule anytime for automated transfers.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "➕ Create New Schedule",
                  callback_data: "create_schedule",
                },
              ],
              [
                {
                  text: "⬅️ Back to Transfer Schedules",
                  callback_data: "transfer_schedules",
                },
              ],
            ],
          },
        }
      );
    }

    const scheduleButtons = result.data.map((schedule) => [
      {
        text: `🔹 ${schedule.payee.nickName || schedule.payee.email} - ${
          schedule.amount
        } ${schedule.currency}`,
        callback_data: `CONFIRM_DEACTIVATE_SCHEDULE_${schedule.id}`,
      },
    ]);

    await bot.sendMessage(
      chatId,
      `*Select a transfer schedule to deactivate:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            ...scheduleButtons,
            [
              {
                text: "⬅️ Back to Transfer Schedules",
                callback_data: "transfer_schedules",
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Error Fetching Schedules:*\n\n${error.message}\n\nPlease try again later.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Back to Transfer Schedules",
                callback_data: "transfer_schedules",
              },
            ],
          ],
        },
      }
    );
  }
};

const confirmDeactivateSchedule = async (chatId, bot, scheduleId) => {
  await bot.sendMessage(
    chatId,
    `⚠️ *Are you sure you want to deactivate this transfer schedule?*\n\nThis action cannot be undone.`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Yes, Deactivate",
              callback_data: `DEACTIVATE_SCHEDULE_${scheduleId}`,
            },
            { text: "❌ No, Cancel", callback_data: "transfer_schedules" },
          ],
        ],
      },
    }
  );
};

const handleDeactivateSchedule = async (chatId, bot, jwtToken, scheduleId) => {
  try {
    const response = await fetch(
      `https://income-api.copperx.io/api/transfer-schedules/${scheduleId}/deactivate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to deactivate transfer schedule."
      );
    }

    await bot.sendMessage(
      chatId,
      `✅ *Transfer Schedule Deactivated Successfully!*\n\n` +
        `The selected transfer schedule has been successfully deactivated. You can always create a new one whenever needed.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Back to Transfer Schedules",
                callback_data: "transfer_schedules",
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Error Deactivating Schedule:*\n\n${error.message}\n\nPlease check your connection and try again.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Back to Transfer Schedules",
                callback_data: "transfer_schedules",
              },
            ],
          ],
        },
      }
    );
  }
};

const selectPayeeForSchedule = async (chatId, bot, jwtToken) => {
  //   try {
  //     const response = await fetch("https://income-api.copperx.io/api/payees", {
  //       method: "GET",
  //       headers: { Authorization: `Bearer ${jwtToken}` },
  //     });

  //     const data = await response.json();

  //     if (!response.ok)
  //       throw new Error(data.message || "Failed to fetch payees.");

  //     if (!data.data || data.data.length === 0) {
  //       return bot.sendMessage(chatId, "❌ *No payees found.*", {
  //         parse_mode: "Markdown",
  //         reply_markup: {
  //           inline_keyboard: [
  //             [{ text: "➕ Add Payee", callback_data: "add_payee" }],
  //             [
  //               {
  //                 text: "⬅️ Back to Transfer Schedules",
  //                 callback_data: "transfer_schedules",
  //               },
  //             ],
  //           ],
  //         },
  //       });
  //     }

  //     let message = `📜 *Select a Payee to Schedule Transfers:*\n\n`;

  //     const payeeButtons = data.data.map((payee) => [
  //       {
  //         text: `🔹 ${payee.displayName || payee.nickName || "Unnamed"}`,
  //         callback_data: `CREATE_SCHEDULE_${payee.id}`,
  //       },
  //     ]);

  //     await bot.sendMessage(chatId, message, {
  //       parse_mode: "Markdown",
  //       reply_markup: {
  //         inline_keyboard: [
  //           ...payeeButtons,
  //           [{ text: "➕ Add Payee", callback_data: "add_payee" }],
  //           [
  //             {
  //               text: "⬅️ Back to Transfer Schedules",
  //               callback_data: "transfer_schedules",
  //             },
  //           ],
  //         ],
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching payees:", error.message);
  //     await bot.sendMessage(chatId, `❌ *Error: ${error.message}*`, {
  //       parse_mode: "Markdown",
  //       reply_markup: {
  //         inline_keyboard: [
  //           [
  //             {
  //               text: "⬅️ Back to Transfer Schedules",
  //               callback_data: "transfer_schedules",
  //             },
  //           ],
  //         ],
  //       },
  //     });
  //     }
  await bot.sendMessage(
    chatId,
    `🚀 *Exciting Update Coming Soon!* 🎉\n\nWe're working hard to bring you the ability to create transfer schedules seamlessly. Stay tuned—it's almost here! 😉`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ Back to Transfer Schedules",
              callback_data: "transfer_schedules",
            },
          ],
        ],
      },
    }
  );
};

// const selectDateForSchedule = async (chatId, bot) => {
//   return new Promise(async (resolve) => {
//     const now = new Date();
//     let year = now.getFullYear();
//     let month = now.getMonth() + 1; // JavaScript months are 0-based
//     let selectedDay = null;
//     let selectedHour = null;
//     let selectedMinute = null;
//     let messageId = null;

//     // Generate months dynamically (next 6 months)
//     const generateMonthButtons = () => {
//       let buttons = [];
//       for (let i = 0; i < 6; i++) {
//         let m = month + i;
//         let y = year;
//         if (m > 12) {
//           m -= 12;
//           y += 1;
//         }
//         buttons.push([
//           {
//             text: `📅 ${y}-${String(m).padStart(2, "0")}`,
//             callback_data: `month_${y}_${m}`,
//           },
//         ]);
//       }
//       return buttons;
//     };

//     // Generate days in groups of 7
//     const generateDayButtons = () => {
//       let daysInMonth = new Date(year, month, 0).getDate();
//       let buttons = [];
//       let row = [];
//       for (let day = 1; day <= daysInMonth; day++) {
//         row.push({ text: `${day}`, callback_data: `select_day_${day}` });
//         if (row.length === 7 || day === daysInMonth) {
//           buttons.push(row);
//           row = [];
//         }
//       }
//       return buttons;
//     };

//     const generateTimeButtons = () => {
//       return [
//         [{ text: "09:00 AM", callback_data: "time_09:00" }],
//         [{ text: "12:00 PM", callback_data: "time_12:00" }],
//         [{ text: "03:00 PM", callback_data: "time_15:00" }],
//         [{ text: "06:00 PM", callback_data: "time_18:00" }],
//         [{ text: "09:00 PM", callback_data: "time_21:00" }],
//       ];
//     };

//     // Initial message with months
//     const initialMessage = await bot.sendMessage(
//       chatId,
//       `📆 *Select a Date for the Schedule:*`,
//       {
//         parse_mode: "Markdown",
//         reply_markup: { inline_keyboard: generateMonthButtons() },
//       }
//     );

//     messageId = initialMessage.message_id;

//     bot.on("callback_query", async (callbackQuery) => {
//       const { data, message } = callbackQuery;
//       if (message.message_id !== messageId) return; // Ignore if it's not the same message

//       if (data.startsWith("month_")) {
//         [year, month] = data.split("_").slice(1).map(Number);
//         await bot.editMessageText("📅 *Select a day:*", {
//           chat_id: chatId,
//           message_id: messageId,
//           parse_mode: "Markdown",
//           reply_markup: { inline_keyboard: generateDayButtons() },
//         });
//       } else if (data.startsWith("select_day_")) {
//         selectedDay = parseInt(data.split("_")[2]);
//         await bot.editMessageText("⏰ *Select an hour:*", {
//           chat_id: chatId,
//           message_id: messageId,
//           parse_mode: "Markdown",
//           reply_markup: { inline_keyboard: generateTimeButtons() },
//         });
//       } else if (data.startsWith("time_")) {
//         const timeParts = data.split("_")[1];
//         selectedHour = timeParts.split(":")[0];
//         selectedMinute = timeParts.split(":")[1];

//         const selectedDateTime = `${year}-${String(month).padStart(
//           2,
//           "0"
//         )}-${String(selectedDay).padStart(
//           2,
//           "0"
//         )} ${selectedHour}:${selectedMinute}`;

//         await bot.editMessageText(
//           `✅ *Scheduled Date & Time:* ${selectedDateTime}`,
//           {
//             chat_id: chatId,
//             message_id: messageId,
//             parse_mode: "Markdown",
//           }
//         );

//         resolve(selectedDateTime);
//       }
//     });
//   });
// };

// const createTransferSchedule = async (chatId, bot, jwtToken, payeeId) => {
//   try {
//     const payeeResponse = await fetch(
//       `https://income-api.copperx.io/api/payees/${payeeId}`,
//       {
//         method: "GET",
//         headers: { Authorization: `Bearer ${jwtToken}` },
//       }
//     );

//     const payee = await payeeResponse.json();
//     if (!payeeResponse.ok)
//       throw new Error(payee.message || "Failed to fetch payee details.");

//     await bot.sendMessage(
//       chatId,
//       `📌 *Creating Transfer Schedule for:*\n\n👤 *Payee:* ${
//         payee.displayName || payee.nickName
//       }\n📧 *Email:* ${payee.email}`,
//       { parse_mode: "Markdown" }
//     );

//     const amount = await captureValidAmount(bot, chatId, minAmount, maxAmount);

//     await bot.sendMessage(chatId, "🔁 *Select a Repeat Type:*", {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "Daily", callback_data: "repeatType_daily" },
//             { text: "Weekly", callback_data: "repeatType_weekly" },
//           ],
//           [
//             { text: "Monthly", callback_data: "repeatType_monthly" },
//             { text: "One Time", callback_data: "repeatType_one_time" },
//           ],
//         ],
//       },
//     });

//     const repeatType = await new Promise((resolve) => {
//       bot.on("callback_query", (callbackQuery) => {
//         const { data, message } = callbackQuery;
//         if (data.startsWith("repeatType_")) {
//           bot.answerCallbackQuery(callbackQuery.id);
//           resolve(data.replace("repeatType_", ""));
//         }
//         return;
//       });
//     });

//     await bot.sendMessage(chatId, "🎯 *Select a Purpose Code:*", {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "Self", callback_data: "purpose_self" },
//             { text: "Salary", callback_data: "purpose_salary" },
//             { text: "Gift", callback_data: "purpose_gift" },
//           ],
//           [
//             { text: "Income", callback_data: "purpose_income" },
//             { text: "Saving", callback_data: "purpose_saving" },
//             { text: "Family", callback_data: "purpose_family" },
//           ],
//           [
//             {
//               text: "Home",
//               callback_data: "purpose_home_improvement",
//             },
//             {
//               text: "Education",
//               callback_data: "purpose_education_support",
//             },
//             { text: "Reimbursement", callback_data: "purpose_reimbursement" },
//           ],
//         ],
//       },
//     });

//     // Handle purpose code selection
//     const purposeCode = await new Promise((resolve) => {
//       bot.on("callback_query", (callbackQuery) => {
//         const { data, message } = callbackQuery;
//         if (data.startsWith("purpose_")) {
//           bot.answerCallbackQuery(callbackQuery.id);
//           resolve(data.replace("purpose_", ""));
//         }
//         return;
//       });
//     });

//     // Prompt for date (Date Picker)
//     const schedule = await selectDateForSchedule(chatId, bot);

//     // Prepare payload
//     const payload = {
//       amount,
//       purposeCode,
//       email: payee.email,
//       payeeId,
//       repeatType,
//       schedule,
//     };

//     console.log("Payload:", payload);

//     // Send request to create schedule
//     const response = await fetch(
//       "https://income-api.copperx.io/api/transfer-schedules",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${jwtToken}`,
//         },
//         body: JSON.stringify(payload),
//       }
//     );

//     const result = await response.json();

//     console.log("Result:", result);

//     if (!response.ok)
//       throw new Error(result.message || "Failed to create transfer schedule.");

//     await bot.sendMessage(
//       chatId,
//       `✅ *Transfer Schedule Created Successfully!*\n\n📌 *Details:*\n` +
//         `💰 Amount: *${amount} USD*\n` +
//         `🔗 Email: *${payee.email}*\n` +
//         `🔁 Frequency: *${repeatType}*\n` +
//         `🎯 Purpose: *${purposeCode}*\n` +
//         `📅 Schedule: *${schedule}*\n\n` +
//         `Your transfer schedule has been set up successfully! 🚀`,
//       {
//         parse_mode: "Markdown",
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: "⬅️ Back to Transfer Schedules",
//                 callback_data: "transfer_schedules",
//               },
//             ],
//           ],
//         },
//       }
//     );
//   } catch (error) {
//     console.error("Error creating schedule:", error.message);
//     await bot.sendMessage(chatId, `❌ *Error: ${error.message}*`, {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: "⬅️ Back to Transfer Schedules",
//               callback_data: "transfer_schedules",
//             },
//           ],
//         ],
//       },
//     });
//   }
// };

// const promptUser = (bot, chatId, message) => {
//   return new Promise((resolve) => {
//     bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

//     const listener = (msg) => {
//       if (msg.chat.id === chatId) {
//         bot.removeListener("message", listener);
//         const text = msg.text.trim();
//         resolve(text);
//       }
//     };

//     bot.on("message", listener);
//   });
// };

// const captureValidAmount = async (bot, chatId, minAmount, maxAmount) => {
//   while (true) {
//     let amountInput = await promptUser(
//       bot,
//       chatId,
//       "💰 *Enter the transfer amount (USDC) - Min: 100, Max: 5,000,000:*\n_(Type 'cancel' to return to the transfer menu)_"
//     );
//     if (amountInput.toLowerCase() === "cancel")
//       return cancelTransfer(chatId, bot);

//     let amount = parseFloat(amountInput);

//     if (isNaN(amount) || amount <= 0) {
//       await bot.sendMessage(
//         chatId,
//         "❌ *Invalid amount! Please enter a valid number.*"
//       );
//       continue;
//     }

//     let amountInUSDC = BigInt(Math.round(amount * 10 ** 6));

//     if (amountInUSDC < minAmount || amountInUSDC > maxAmount) {
//       await bot.sendMessage(
//         chatId,
//         `❌ *Amount must be between 100 USDC and 5,000,000 USDC.*`
//       );
//     } else {
//       return amountInUSDC.toString();
//     }
//   }
// };

// const cancelTransfer = (chatId, bot) => {
//   bot.sendMessage(
//     chatId,
//     "🔙 *Transfer process cancelled. Returning to the menu...*",
//     getBackToMenuOptions()
//   );
// };

// const getBackToMenuOptions = () => ({
//   reply_markup: {
//     inline_keyboard: [
//       [
//         {
//           text: "⬅️ Back to Transfer Schedules",
//           callback_data: "transfer_schedules",
//         },
//       ],
//     ],
//   },
//   parse_mode: "Markdown",
// });

module.exports = {
  viewTransferSchedules,
  deactivateTransferSchedule,
  confirmDeactivateSchedule,
  handleDeactivateSchedule,
  selectPayeeForSchedule,
//   createTransferSchedule,
};
