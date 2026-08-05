import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_here";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Access denied. Please log in." });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Contains user id
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};