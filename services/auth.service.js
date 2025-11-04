// services/auth.service.js
import bcrypt from "bcryptjs";
import validator from "validator";
import {redis} from "../config/redis.js";
import userModel from "../models/userModel.js";
import { createAccessToken, createToken, verifyJwt } from "../utils/jwt.js";
import { syncUserToRedis } from "./user.service.js"; // reuse existing redis sync
import { deleteTokenBySessionId, getTokensBySessionId } from "./refreshToken.service.js";
import { response } from "express";

// ---- LOGIN ----
export const login = async (email, password) => {
    const user = await userModel.findOne({ email });
    if (!user) throw new Error("User does not exist");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const response = await createToken(user._id, user.role);
    if (!response.success) throw new Error("Token generation failed");

    return { token: response.token, userId: user._id, role: user.role };
};

// ---- REGISTER (Normal User) ----
export const register = async ({ name, email, password, role }) => {
    const exists = await userModel.findOne({ email, isDeleted: false });
    if (exists) throw new Error("User already exists");

    if (!validator.isEmail(email)) throw new Error("Please enter a valid email");
    if (password.length < 8)
        throw new Error("Please enter a strong password (min 8 characters)");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        role,
    });

    const user = await newUser.save();
    const response = await createToken(user._id, user.role);
    if (!response.success) throw new Error("Token generation failed");

    await syncUserToRedis(user);

    return { token: response.token, userId: user._id, role: user.role };
};

// ---- REGISTER ADMIN ----
export const registerAdmin = async ({ name, email, password }) => {
    const exists = await userModel.findOne({ email });
    if (exists) throw new Error("User already exists");

    if (!validator.isEmail(email)) throw new Error("Please enter a valid email");
    if (password.length < 8)
        throw new Error("Please enter a strong password (min 8 characters)");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        role: "admin",
    });

    const user = await newUser.save();
    const response = await createToken(user._id, user.role);
    if (!response.success) throw new Error("Token generation failed");

    return { token: response.token, userId: user._id, role: user.role };
};

// ---- REFRESH TOKEN ----
export const refreshAccessToken = async (userId, role, sessionId) => {
    let storedToken = await redis.get(`refresh:${userId}:${sessionId}`);

    if (!storedToken) {
        const response = await getTokensBySessionId(sessionId);
        if (!response) throw new Error("Invalid or expired refresh token");
        storedToken = response.token;
        await redis.set(`refresh:${id}:${sessionId}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    }
    const jwt_decoded = verifyJwt(storedToken);

    if (!jwt_decoded) throw new Error("Refresh Token Expired")
    const newAccessToken = createAccessToken(userId, role, sessionId);

    return { accessToken: newAccessToken };
};

// ---- LOGOUT ----
export const logout = async (userId, sessionId) => {
    const storedToken = await redis.get(`refresh:${userId}:${sessionId}`);
    if (!storedToken) throw new Error("No active session found");
    await redis.del(`refresh:${userId}:${sessionId}`);
    await deleteTokenBySessionId(sessionId);
    return { message: "Logged out successfully" };
};
