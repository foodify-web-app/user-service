import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionId: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
},
    { minimize: false, timestamps: true }
);

const refreshTokenModel = mongoose.models.refreshToken || mongoose.model("refreshToken", refreshTokenSchema);
export default refreshTokenModel;