import mongoose, { Schema } from "mongoose";
const sessionSchema = new Schema({
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
const Session = mongoose.models.session || mongoose.model("Session", sessionSchema);
export default Session;
