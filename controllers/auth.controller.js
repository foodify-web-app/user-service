// controllers/auth.controller.js
import {
    login,
    register,
    registerAdmin,
    refreshAccessToken,
    logout
} from "../services/auth.service.js";

// ---- LOGIN ----
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await login(email, password);
        res.status(200).json({ success: true, ...data });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

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

// ---- REFRESH TOKEN ----
export const refreshToken = async (req, res) => {
    try {
        const { userId, role, sessionId } = req.body;
        const data = await refreshAccessToken(userId, role, sessionId);        
        return res.status(200).json({ success: true, ...data });
    } catch (err) {
        console.log("Refresh Token Error:", err);
        return res.status(403).json({ success: false, message: err.message });
    }
};

// ---- LOGOUT ----
export const logoutUser = async (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        const result = await logout(userId, sessionId);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("Logout Error:", err);
        res.status(403).json({ success: false, message: err.message });
    }
};
