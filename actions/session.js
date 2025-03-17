const Session = require("../models/session");

const sessions = {
  async get(chatId) {
    try {
      const session = await Session.findOne({ chatId });
      if (session && new Date(session.expiresAt) > new Date()) {
        return session;
      }

      // delete available one
      await Session.deleteOne({ chatId });
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },
  
  async set(chatId, userId, accessToken, data, expiresAt = {}) {
    try {      
      await Session.findOneAndUpdate(
        { chatId },
        { chatId, userId, accessToken, data, expiresAt },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error setting session:', error);
    }
  },
  
  async delete(chatId) {
    try {
      await Session.deleteOne({ chatId });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }
};

module.exports = sessions