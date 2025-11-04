// services/user.service.js
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import {redis} from "../config/redis.js";

const cache_all_users = 'admin_all_users';
const ttl = 6 * 24 * 60 * 60; // 6 days in seconds

// --- Redis Helpers ---
export const getUserFromCache = async (userId) => {
    const cachedUser = await redis.hget(cache_all_users, userId);
    return cachedUser ? JSON.parse(cachedUser) : null;
};

export const syncUserToRedis = async (user) => {
    if (user.role !== 'admin' && !user.isDeleted) {
        await redis.hset(cache_all_users, user._id.toString(), JSON.stringify(user));
    } else {
        await redis.hdel(cache_all_users, user._id.toString());
    }
};

// --- Business Logic ---
export const fetchAllUsers = async (includeDeleted = false) => {
    const exists = await redis.exists(cache_all_users);
    let users;

    const filter = { role: { $ne: "admin" } };
    if (!includeDeleted) filter.isDeleted = false;

    if (exists && !includeDeleted) {
        const cacheUsers = await redis.hgetall(cache_all_users);
        users = Object.values(cacheUsers).map(u => JSON.parse(u));
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
        users = await userModel.find(filter).sort({ createdAt: -1 });
        if (!includeDeleted) {
            const pipeline = redis.pipeline();
            for (const user of users) {
                pipeline.hset(cache_all_users, user._id.toString(), JSON.stringify(user));
            }
            await pipeline.exec();
            await redis.expire(cache_all_users, ttl);
        }
    }
    return users;
};

export const fetchUserById = async (id) => {
    const exists = await redis.exists(cache_all_users);
    if (exists) {
        const cachedUser = await getUserFromCache(id);
        if (cachedUser) return cachedUser;
    }
    return await userModel.findById(id).select('-password');
};

export const updateUserData = async (id, data) => {
    const { name, email, password } = data;
    const updateData = { isDeleted: false };

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (password) {
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (updatedUser) await syncUserToRedis(updatedUser);
    return updatedUser;
};

export const softDeleteUser = async (id) => {
    const user = await userModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (user) await syncUserToRedis(user);
    return user;
};

export const fetchUserProfile = async (userId) => {
    return await userModel.findById(userId).select('-password');
};
