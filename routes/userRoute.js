import express from "express";
import { deleteUser, getAllUsers, getUserById, getUserProfile, loginUser, registerAdminUser, registerUser, updateUser } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/admin/register", registerAdminUser);
userRouter.post("/login", loginUser);

//admin specific routes
userRouter.get("/admin/all", adminMiddleware, getAllUsers);
userRouter.delete("/admin/delete/:id", adminMiddleware, deleteUser);


userRouter.get('/profile', authMiddleware, getUserProfile);
userRouter.get("/:id", getUserById);
userRouter.post("/update/:id", updateUser);
export default userRouter;
