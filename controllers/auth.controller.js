import bcrypt from "bcryptjs";
import redis from "../config/redis.js";
import validator from "validator";
import userModel from "../models/userModel.js";
import { createAccessToken, createToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
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

        const response = await createToken(user._id, user.role);

        if (!response.success) {
            return res.status(400).json(response);
        }

        res.status(200).json({ success: true, token: response.token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('login user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// 2. Register User
export const registerUser = async (req, res) => {
    const { name, password, email, role } = req.body; // Can optionally accept a role
    try {
        // Check if user already exists
        const exists = await userModel.findOne({ email, isDeleted: false });
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
        const response = await createToken(user._id, user.role);

        if (!response.success) {
            return res.status(400).json(response);
        }
        await syncUserToRedis(user);
        res.status(200).json({ success: true, token: response.token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('register user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error", error: error })
    }
}
// 2. Register User
export const registerAdminUser = async (req, res) => {
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
        const response = await createToken(user._id, user.role);

        if (!response.success) {
            return res.status(400).json(response);
        }

        res.status(200).json({ success: true, token: response.token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('register user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error", error: error })
    }
}

export const refreshToken = async (req, res) => {
    const { userId, role } = req.body;
    const refreshtoken = await redis.get(`refresh:${userId}`);
    console.log("stored" + refreshtoken)

    // if (!refreshtoken) return res.status(401).json({ message: "Missing token" });
    try {

        if (!refreshtoken)
            return res.status(403).json({ message: "Invalid or expired refresh token" });

        const newAccessToken = createAccessToken(userId, role);
        res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Invalid Refresh token", err });
    }
}

export const logoutUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        await redis.del(`refresh:${userId}`);
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(403).json({ message: `error while logout ${error.message}` });
    }
}