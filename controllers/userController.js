import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { createToken } from "../utils/jwt.js";
import redis from "../config/redis.js";

const cache_all_users = 'admin_all_users';


// 1. Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id, user.role);
        res.status(200).json({ success: true, token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('login user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// 2. Register User
const registerUser = async (req, res) => {
    const { name, password, email, role } = req.body; // Can optionally accept a role
    try {
        // Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password (min 8 characters)" });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            role: role
        });

        const user = await newUser.save();
        const token = createToken(user._id, user.role);
        await redis.del(cache_all_users);
        res.status(200).json({ success: true, token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('register user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error", error: error })
    }
}
// 2. Register User
const registerAdminUser = async (req, res) => {
    const { name, password, email } = req.body; // Can optionally accept a role
    try {
        // Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password (min 8 characters)" });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            role: "admin"
        });

        const user = await newUser.save();
        const token = createToken(user._id, user.role);

        res.status(200).json({ success: true, token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('register user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error", error: error })
    }
}

// 3. Get All Users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const ttl = 6 * 24 * 60 * 60; //6 days × 24 hours × 60 minutes × 60 seconds = 518400 seconds
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }
        const exists = await redis.exists(cache_all_users);
        let users = null;
        if (exists) {
            const cacheUsers = await redis.hgetall(cache_all_users);
            users = Object.values(cacheUsers).map(userJson => JSON.parse(userJson));

        } else {
            users = await userModel.find({ role: { $ne: "admin" }, isDeleted : false }).select('-password');
            const pipeline = redis.pipeline(); // efficient batch operation

            for (const user of users) {
                pipeline.hset(cache_all_users, user._id, JSON.stringify(user));
            }

            await pipeline.exec();
            await redis.expire(cache_all_users, ttl); // apply TTL to the hash
        }

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Get User by ID
const getUserById = async (req, res) => {
    try {
        const exists = await redis.exists(cache_all_users);
        let user = null;
        if (exists) {
            user = await getUserFromCache(req.params.id);
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

async function getUserFromCache(userId) {
    const cachedUser = await redis.hget(cache_all_users, userId);
    return cachedUser ? JSON.parse(cachedUser) : null;
}

// 5. Update User (Partial)
const updateUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {isDeleted : false};

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
        await redis.del(cache_all_users);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 6. Delete User
const deleteUser = async (req, res) => {
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
        await redis.del(cache_all_users);
        res.status(200).json({ success: true, message: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 7. Get current logged-in user's profile
// This requires an authentication middleware that adds user's ID to the request object (e.g., req.user.id)
const getUserProfile = async (req, res) => {
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

export {
    loginUser,
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserProfile,
    registerAdminUser
}