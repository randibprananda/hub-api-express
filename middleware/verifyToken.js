const jwt = require ("jsonwebtoken");

async function  verifyToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token && !req.cookies.refreshToken) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        req.username = decoded.username;
        next();
    })
}

module.exports = verifyToken;