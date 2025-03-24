import crypto from "crypto";
import dotenv from "dotenv";
import Session from "../models/session.js";
dotenv.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error("❌ ENCRYPTION_KEY is missing. Please set it in your environment variables.");
}
const key = crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();
const ALGORITHM = "aes-256-cbc";
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted,
    };
}
function decrypt(encryptedData, iv) {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
const sessions = {
    async get(chatId) {
        try {
            const session = await Session.findOne({ chatId });
            if (session && new Date(session.expiresAt) > new Date()) {
                session.accessToken = decrypt(session.accessToken, session.iv);
                return session;
            }
            await Session.deleteOne({ chatId });
            return null;
        }
        catch (error) {
            console.error("❌ Error getting session:", error);
            return null;
        }
    },
    async set(chatId, userId, accessToken, data, expiresAt) {
        try {
            const { iv, encryptedData } = encrypt(accessToken);
            await Session.findOneAndUpdate({ chatId }, {
                chatId,
                userId,
                accessToken: encryptedData,
                iv,
                data,
                expiresAt,
            }, { upsert: true, new: true });
        }
        catch (error) {
            console.error("❌ Error setting session:", error);
        }
    },
    async delete(chatId) {
        try {
            await Session.deleteOne({ chatId });
        }
        catch (error) {
            console.error("❌ Error deleting session:", error);
        }
    },
};
export default sessions;
