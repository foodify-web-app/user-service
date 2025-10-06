import jwt from 'jsonwebtoken';

const adminMiddleware = (req, res, next) => {
    const { token } = req.headers;

    console.log(token);
    console.log(req.headers);
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Not Authorized login Again" });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        req.body.role = token_decode.role;
        if (token_decode.role != 'admin') {
            return res.status(403).json({ success: false, message: "Admin access only" })
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error" })
    }
}

export default adminMiddleware;