import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'delivery_partner', 'admin'],
      default: 'customer'
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }, // optional: helps for TTL or audits
  },
  { minimize: false, timestamps: true }
);

// ✅ Partial unique index: ensures unique emails only for non-deleted users
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
