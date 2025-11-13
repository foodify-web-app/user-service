import express from "express";
import { deleteUser, getAllUsers, getUserById, getUserProfile, updateUser, registerUser, registerAdminUser } from "../controllers/user.controller.js";
import { authMiddleware, adminMiddleware } from "common-utils";

const userRouter = express.Router();

//admin specific routes
userRouter.get("/admin/all", adminMiddleware, getAllUsers);
userRouter.delete("/admin/delete/:id", adminMiddleware, deleteUser);

userRouter.get('/profile', authMiddleware, getUserProfile);
userRouter.get("/:id", authMiddleware, getUserById);
userRouter.post("/update/:id", updateUser);
userRouter.post("/register", registerUser);
userRouter.post("/admin/register", registerAdminUser);
export default userRouter;
