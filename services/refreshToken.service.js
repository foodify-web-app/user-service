import refreshTokenModel from "../models/refreshTokenModel.js";
import { publishTokenUpdateEvent, getRefreshTokenPayload } from "../utils/redis.js";

export const createOrUpdateToken = async (tokenData) => {
    const { userId, sessionId, token, expiresAt } = tokenData;

    const newToken = await new refreshTokenModel(
        {
            token, sessionId, expiresAt, userId
        }
    );
    const savedToken = newToken.save();

    const refreshTokenPayload = getRefreshTokenPayload(tokenData);
    await publishTokenUpdateEvent("TOKEN_EVENTS", refreshTokenPayload);

    return savedToken;
};

export const getAllTokens = async () => {
    return refreshTokenModel.find({}).sort({ createdAt: -1 });
};

export const getTokensByUserId = async (userId) => {
    return refreshTokenModel.find({ userId: userId }).sort({ createdAt: -1 });
};

export const getTokensBySessionId = async (sessionId) => {
    return refreshTokenModel.findOne({ sessionId });
};

export const getTokenById = async (id) => {
    return refreshTokenModel.findById(id);
};

export const updateTokenById = async (id, updateData) => {
    const { token, expiresAt } = updateData;

    let existingToken = await refreshTokenModel.findById(id);

    if (!existingToken) {
        return null;
    }

    // Update fields
    if (token) existingToken.token = token;
    if (expiresAt) existingToken.expiresAt = expiresAt;

    return existingToken.save();
};

export const deleteTokenById = async (id) => {
    return refreshTokenModel.findByIdAndDelete(id);
};

export const deleteTokensForUser = async (userId) => {
    return refreshTokenModel.deleteMany({ userId: userId });
};

export const deleteTokenBySessionId = async (sessionId) => {
    
    return refreshTokenModel.findOneAndDelete({ sessionId });

};
