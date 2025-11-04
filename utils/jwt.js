import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import refreshTokenModel from '../models/refreshTokenModel.js';

// Helper function to create JWT
export const createAccessToken = (id, role, sessionId) => { // Also include role in the token
    return jwt.sign({ id, role, sessionId }, process.env.JWT_SECRET, {
        expiresIn: '15m' // Good practice to set an expiration
    });
}
const createRefreshToken = (id, role, sessionId) => { // Also include role in the token
    return jwt.sign({ id, role, sessionId }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Good practice to set an expiration
    });
}

export const createToken = async (id, role) => {
    const sessionId = crypto.randomUUID();
    const accessToken = createAccessToken(id, role, sessionId);
    const refreshToken = createRefreshToken(id, role, sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
        await redis.set(`refresh:${id}:${sessionId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
        await refreshTokenModel.updateOne(
            { userId: id },
            { $set: { token: refreshToken, expiresAt, sessionId } },
            { upsert: true }
        );
    } catch (err) {
        return { success: false, message: `error occured : ${err.message}` }
    }

    return { success: true, token: accessToken }
}