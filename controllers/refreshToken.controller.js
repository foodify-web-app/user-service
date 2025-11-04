import { createOrUpdateToken, getAllTokens, getTokenById, getTokensByUserId } from "../services/refreshToken.service.js";
import refreshTokenModel from "./refreshToken.model.js"; // Assuming the model is in a sibling file

export const createRefreshToken = async (req, res) => {
    try {
        const { userId, sessionId, token, expiresAt } = req.body;

        // Basic validation
        if (!userId || !sessionId || !token || !expiresAt) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        await createOrUpdateToken({ userId, sessionId, token, expiresAt });

        res.status(200).json({ success: true, message: "Refresh token created successfully" });

    } catch (error) {
        console.log(error);
        // Handle potential duplicate key errors if you add a unique index
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A refresh token with this session ID or token already exists." });
        }
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getAllRefreshTokens = async (req, res) => {
    try {
        // Example admin check, similar to your provided code
        // Assumes user role is passed in req.body or (more commonly) req.user
        const userRole = req.body.role || (req.user ? req.user.role : null);
        if (userRole !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }

        // Find all tokens and sort by most recent
        const tokens = await getAllTokens();

        res.status(200).json({ success: true, data: tokens });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getRefreshTokensByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // You might want to add auth check here to ensure
        // the request is from the user themselves or an admin

        const tokens = await getTokensByUserId(userId);

        if (!tokens || tokens.length === 0) {
            return res.status(404).json({ success: false, message: "No refresh tokens found for this user" });
        }

        res.status(200).json({ success: true, data: tokens });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getRefreshTokenById = async (req, res) => {
    try {
        const { id } = req.params;

        const token = await getTokenById(id);

        if (!token) {
            return res.status(404).json({ success: false, message: "Refresh token not found" });
        }

        // Add auth check here: is this user allowed to see this token?

        res.status(200).json({ success: true, data: token });

    } catch (error) {
        console.log(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: "Invalid token ID format" });
        }
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateRefreshToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { token, expiresAt } = req.body;

        // Find the token first
        let existingToken = await getTokenById(id);

        if (!existingToken) {
            return res.status(404).json({ success: false, message: "Refresh token not found" });
        }

        // Add auth check here

        // Update fields
        if (token) existingToken.token = token;
        if (expiresAt) existingToken.expiresAt = expiresAt;

        const updatedToken = await existingToken.save();

        res.status(200).json({ success: true, data: updatedToken, message: "Token updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: "Invalid token ID format" });
        }
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc Delete a refresh token (e.g., on logout)
 * @route DELETE /api/refresh-tokens/:id
 * @access Private
 */
export const deleteRefreshToken = async (req, res) => {
    try {
        const { id } = req.params;

        const token = await refreshTokenModel.findByIdAndDelete(id);

        if (!token) {
            return res.status(404).json({ success: false, message: "Refresh token not found" });
        }

        // Add auth check here

        res.status(200).json({ success: true, message: "Refresh token deleted successfully" });

    } catch (error) {
        console.log(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: "Invalid token ID format" });
        }
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc Delete all refresh tokens for a specific user (e.g., "log out all devices")
 * @route DELETE /api/refresh-tokens/user/:userId
 * @access Private
 */
export const deleteAllRefreshTokensForUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Add auth check: only user or admin should do this

        const result = await refreshTokenModel.deleteMany({ userId: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "No refresh tokens found for this user to delete" });
        }

        res.status(200).json({ success: true, message: `${result.deletedCount} tokens deleted for user ${userId}` });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
