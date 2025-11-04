import refreshTokenModel from "./refreshToken.model.js"; // Assuming the model is in a sibling file

export const createOrUpdateToken = async (tokenData) => {
    const { userId, sessionId, token, expiresAt } = tokenData;

    const savedToken = await refreshTokenModel.findOneAndUpdate(
        { userId: userId }, // Filter by userId as in your example
        { $set: { token: token, expiresAt: expiresAt, sessionId: sessionId } }, // The update
        { upsert: true } // Options
    );
    return savedToken;
};

export const getAllTokens = async () => {
    return refreshTokenModel.find({}).sort({ createdAt: -1 });
};

export const getTokensByUserId = async (userId) => {
    return refreshTokenModel.find({ userId: userId }).sort({ createdAt: -1 });
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
