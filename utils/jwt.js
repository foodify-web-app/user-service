import jwt from 'jsonwebtoken';

// Helper function to create JWT
export const createToken = (id, role) => { // Also include role in the token
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d' // Good practice to set an expiration
    });
}