import jwt from 'jsonwebtoken';

// Helper function to create JWT
export const createAccessToken = (id, role) => { // Also include role in the token
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '15m' // Good practice to set an expiration
    });
}
const createRefreshToken = (id, role) => { // Also include role in the token
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Good practice to set an expiration
    });
}

export const createToken = (id, role) =>{

    return {
        accessToken : createAccessToken(id, role),
        refreshToken : createRefreshToken(id, role)
    }
}