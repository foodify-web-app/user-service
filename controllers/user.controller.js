// controllers/user.controller.js
import {
    fetchAllUsers,
    fetchUserById,
    fetchUserProfile,
    updateUserData,
    softDeleteUser,
    register,
    registerAdmin
} from "../services/user.service.js";

// ---- REGISTER ----
export const registerUser = async (req, res) => {
    try {
        const data = await register(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ---- REGISTER ADMIN ----
export const registerAdminUser = async (req, res) => {
    try {
        const data = await registerAdmin(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (err) {
        console.error("Register Admin Error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};


// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }
        const includeDeleted = req.body.isDeleted === true;
        const users = await fetchAllUsers(includeDeleted);
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await fetchUserById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const updatedUser = await updateUserData(req.params.id, req.body);
        if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (err) {
        console.error(err);
        const msg = err.message?.includes("Password") ? err.message : "Server Error";
        res.status(400).json({ success: false, message: msg });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        if (req.body.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }
        const user = await softDeleteUser(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get profile of logged-in user
export const getUserProfile = async (req, res) => {
    try {
        const user = await fetchUserProfile(req.body.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
