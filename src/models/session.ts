import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISession extends Document {
  chatId: number;
  userId: string;
  accessToken: string;
  iv: string;
  data?: Record<string, any>;
  expiresAt: string;
}

const sessionSchema = new Schema<ISession>({
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

const Session: Model<ISession> = mongoose.models.session || mongoose.model<ISession>("Session", sessionSchema);

export default Session;
