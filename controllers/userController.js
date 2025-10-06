import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { createToken } from "../utils/jwt.js";

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

        res.status(200).json({ success: true, token, userId: user._id, role: user.role });

    } catch (error) {
        console.log('register user server error : ', error);
        res.status(500).json({ success: false, message: "Server Error" })
    }
}

// 3. Get All Users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }
        const users = await userModel.find({}).select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Get User by ID
const getUserById = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 5. Update User (Partial)
const updateUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {};

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

        const user = await userModel.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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
    getUserProfile
}