const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    default: {},
  },
  expiresAt: {
    type: String,
    required: true,
  },
});


const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
