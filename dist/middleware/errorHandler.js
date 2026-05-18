export const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'PrismaClientKnownRequestError') {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Unique constraint violation' });
        }
    }
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};
