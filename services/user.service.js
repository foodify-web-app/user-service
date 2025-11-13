// services/user.service.js
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import validator from "validator";

export const register = async ({ name, email, password, role }) => {
    const exists = await userModel.findOne({ email, isDeleted: false });
    if (exists) throw new Error("User already exists");

    if (!validator.isEmail(email)) throw new Error("Please enter a valid email");
    if (password.length < 8)
        throw new Error("Please enter a strong password (min 8 characters)");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        role,
    });

    const user = await newUser.save();
    return { userId: user._id, role: user.role };
};

export const registerAdmin = async ({ name, email, password }) => {
    const exists = await userModel.findOne({ email });
    if (exists) throw new Error("User already exists");

    if (!validator.isEmail(email)) throw new Error("Please enter a valid email");
    if (password.length < 8)
        throw new Error("Please enter a strong password (min 8 characters)");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        role: "admin",
    });

    const user = await newUser.save();

    return { userId: user._id, role: user.role };
};

export const fetchAllUsers = async (includeDeleted = false) => {
    let users;

    const filter = { role: { $ne: "admin" } };
    if (!includeDeleted) filter.isDeleted = false;
    users = await userModel.find(filter).sort({ createdAt: -1 });
    return users;
};

export const fetchUserById = async (id) => {
    return await userModel.findById(id).select('-password');
};

export const updateUserData = async (id, data) => {
    const { name, email, password } = data;
    const updateData = { isDeleted: false };

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (password) {
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    return updatedUser;
};

export const softDeleteUser = async (id) => {
    const user = await userModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return user;
};

export const fetchUserProfile = async (userId) => {
    return await userModel.findById(userId).select('-password');
};
