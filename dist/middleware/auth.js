import jwt from 'jsonwebtoken';
export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('[Auth Middleware] No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        console.log('[Auth Middleware] Token verified for user:', req.userId);
        next();
    }
    catch (err) {
        console.log('[Auth Middleware] Invalid token:', err.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};
