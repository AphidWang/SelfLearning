"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
// 驗證 token 的中間件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth middleware:', { authHeader, token });
    if (!token) {
        return res.status(401).json({ message: '未提供 token' });
    }
    const decoded = (0, jwt_1.verifyToken)(token);
    console.log('Token verification:', { decoded });
    if (!decoded) {
        return res.status(401).json({ message: '無效的 token' });
    }
    next();
};
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Demo 帳號處理
    if (email.includes('demo')) {
        const user = email.includes('student')
            ? {
                id: '1',
                name: 'Alex Student',
                role: 'student',
                avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150'
            }
            : {
                id: '2',
                name: 'Sam Mentor',
                role: 'mentor',
                avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150'
            };
        const token = (0, jwt_1.generateToken)(user);
        return res.json({ user, token });
    }
    // TODO: 實作真正的登入邏輯
    res.status(401).json({ message: '無效的帳號或密碼' });
});
router.get('/me', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const decoded = (0, jwt_1.verifyToken)(token);
    console.log('GET /me:', { decoded });
    if (!decoded || typeof decoded === 'string') {
        return res.status(401).json({ message: '無效的 token' });
    }
    // 這裡 decoded 一定是 JwtPayload
    const user = {
        id: decoded.userId,
        name: decoded.role === 'student' ? 'Alex Student' : 'Sam Mentor',
        role: decoded.role,
        avatar: decoded.role === 'student'
            ? 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150'
            : 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150'
    };
    res.json(user);
});
router.post('/logout', (req, res) => {
    // 在這裡可以添加 token 黑名單等邏輯
    res.json({ message: '登出成功' });
});
exports.default = router;
