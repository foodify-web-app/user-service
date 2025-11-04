import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import {redis} from "../config/redis.js";

const cache_all_users = 'admin_all_users';
const ttl = 6 * 24 * 60 * 60; //6 days × 24 hours × 60 minutes × 60 seconds = 518400 seconds

export const syncUserToRedis = async (user) => {
    if (user.role !== 'admin' && !user.isDeleted) {
        await redis.hset(cache_all_users, user._id.toString(), JSON.stringify(user));
        console.log(await redis.hgetall(cache_all_users));
    } else {
        await redis.hdel(cache_all_users, user._id.toString());
    }
}

// 3. Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }
        const includeDeleted = req.body.isDeleted === true;

        // 3. Build MongoDB filter
        const filter = { role: { $ne: "admin" } };
        if (!includeDeleted) {
            filter.isDeleted = false;
        }
        const exists = await redis.exists(cache_all_users);
        let users = null;
        if (exists && !includeDeleted) {
            const cacheUsers = await redis.hgetall(cache_all_users);
            users = Object.values(cacheUsers).map(userJson => JSON.parse(userJson));
            users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            users = await userModel.find(filter).sort({ createdAt: -1 });

            // Only cache non-deleted users
            if (!includeDeleted) {
                const pipeline = redis.pipeline();
                for (const user of users) {
                    pipeline.hset(cache_all_users, user._id.toString(), JSON.stringify(user));
                }
                await pipeline.exec();
                await redis.expire(cache_all_users, ttl);
            }
        }

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Get User by ID
export const getUserById = async (req, res) => {
    try {
        const exists = await redis.exists(cache_all_users);
        let user = null;
        if (exists) {
            user = await getUserFromCache(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
        } else {
            user = await userModel.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getUserFromCache = async (userId) => {
    const cachedUser = await redis.hget(cache_all_users, userId);
    return cachedUser ? JSON.parse(cachedUser) : null;
}

// 5. Update User (Partial)
export const updateUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = { isDeleted: false };

        if (name) updateData.name = name;
        if (email) updateData.email = email;

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
            }
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await userModel.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // await redis.del(cache_all_users);
        await syncUserToRedis(updatedUser);

        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 6. Delete User
export const deleteUser = async (req, res) => {
    try {
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }

        const user = await userModel.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true } // return updated document
        );
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // await redis.del(cache_all_users);
        await syncUserToRedis(user);

        res.status(200).json({ success: true, message: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 7. Get current logged-in user's profile
// This requires an authentication middleware that adds user's ID to the request object (e.g., req.user.id)
export const getUserProfile = async (req, res) => {
    try {
        // Assuming your auth middleware sets req.body.userId
        const user = await userModel.findById(req.body.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
