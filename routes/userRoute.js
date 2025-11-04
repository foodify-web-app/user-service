import express from "express";
import { deleteUser, getAllUsers, getUserById, getUserProfile, updateUser } from "../controllers/user.controller.js";
import {authMiddleware, adminMiddleware} from "../middleware/auth.js";
import { loginUser, logoutUser, refreshToken, registerAdminUser, registerUser } from "../controllers/auth.controller.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/admin/register", registerAdminUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", authMiddleware, refreshToken);
userRouter.post("/logout", authMiddleware, logoutUser);
userRouter.post("/admin/logout", adminMiddleware, logoutUser);

//admin specific routes
userRouter.get("/admin/all", adminMiddleware, getAllUsers);
userRouter.delete("/admin/delete/:id", adminMiddleware, deleteUser);


userRouter.get('/profile', authMiddleware, getUserProfile);
userRouter.get("/:id", authMiddleware, getUserById);
userRouter.post("/update/:id", updateUser);
export default userRouter;
