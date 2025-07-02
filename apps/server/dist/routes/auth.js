"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenHealthCheck = exports.requireAdmin = exports.authenticateSupabaseToken = void 0;
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../services/supabase");
const router = express_1.default.Router();
// 增強的 Supabase token 驗證中間件
const authenticateSupabaseToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: '未提供 token',
            code: 'NO_TOKEN',
            expired: false
        });
    }
    try {
        // 使用 Supabase 驗證 token
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error) {
            console.error('Token 驗證錯誤:', error);
            // 檢查是否為 token 過期
            const isExpired = error.message?.includes('expired') ||
                error.message?.includes('JWT') ||
                error.message?.includes('invalid');
            return res.status(401).json({
                message: isExpired ? 'Token 已過期' : '無效的 token',
                code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                expired: isExpired,
                details: error.message
            });
        }
        if (!user) {
            return res.status(401).json({
                message: '找不到用戶',
                code: 'USER_NOT_FOUND',
                expired: false
            });
        }
        // 將用戶信息添加到 req 中
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        console.error('Token 驗證異常:', error);
        return res.status(401).json({
            message: 'Token 驗證失敗',
            code: 'VERIFICATION_FAILED',
            expired: false,
            details: String(error)
        });
    }
};
exports.authenticateSupabaseToken = authenticateSupabaseToken;
// 檢查管理員權限的中間件
const requireAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: '未認證',
            code: 'NOT_AUTHENTICATED'
        });
    }
    try {
        // 從 user_metadata 獲取用戶角色 - 支援多角色系統
        const roles = user.user_metadata?.roles ||
            (user.user_metadata?.role ? [user.user_metadata.role] : ['student']);
        if (!roles.includes('admin')) {
            return res.status(403).json({
                message: '需要管理員權限',
                code: 'INSUFFICIENT_PERMISSIONS',
                userRoles: roles
            });
        }
        next();
    }
    catch (error) {
        console.error('權限檢查異常:', error);
        return res.status(500).json({
            message: '權限檢查失敗',
            code: 'PERMISSION_CHECK_FAILED',
            details: String(error)
        });
    }
};
exports.requireAdmin = requireAdmin;
// Token 健康檢查中間件
const tokenHealthCheck = async (req, res, next) => {
    const user = req.user;
    const token = req.token;
    if (!user || !token) {
        return next();
    }
    try {
        // 檢查 token 即將過期的情況（提前 10 分鐘警告）
        const { data: { session } } = await supabase_1.supabaseAdmin.auth.getSession();
        if (session && session.expires_at) {
            const expiresAt = session.expires_at;
            const now = Math.floor(Date.now() / 1000);
            const timeToExpiry = expiresAt - now;
            // 如果 token 在 10 分鐘內過期，添加警告 header
            if (timeToExpiry < 10 * 60) {
                res.setHeader('X-Token-Warning', 'TOKEN_EXPIRING_SOON');
                res.setHeader('X-Token-Expires-In', timeToExpiry.toString());
            }
        }
        next();
    }
    catch (error) {
        console.error('Token 健康檢查失敗:', error);
        // 健康檢查失敗不影響正常流程
        next();
    }
};
exports.tokenHealthCheck = tokenHealthCheck;
// 獲取當前用戶信息
router.get('/me', authenticateSupabaseToken, tokenHealthCheck, async (req, res) => {
    try {
        const supabaseUser = req.user;
        // 從 user_metadata 獲取用戶資料 - 支援多角色系統
        const roles = supabaseUser.user_metadata?.roles ||
            (supabaseUser.user_metadata?.role ? [supabaseUser.user_metadata.role] : ['student']);
        const userData = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email,
            avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.id}&backgroundColor=ffd5dc`,
            color: supabaseUser.user_metadata?.color || '#FF6B6B',
            roles: roles,
            role: roles[0],
            created_at: supabaseUser.created_at,
            last_sign_in_at: supabaseUser.last_sign_in_at
        };
        res.json({
            success: true,
            user: userData,
            tokenStatus: 'valid'
        });
    }
    catch (error) {
        console.error('獲取用戶信息失敗:', error);
        res.status(500).json({
            message: '獲取用戶信息失敗',
            code: 'USER_INFO_FAILED',
            details: String(error)
        });
    }
});
// 增強的 token 驗證路由
router.get('/verify-token', authenticateSupabaseToken, tokenHealthCheck, (req, res) => {
    const user = req.user;
    res.json({
        valid: true,
        user: {
            id: user.id,
            email: user.email,
            roles: user.user_metadata?.roles || [user.user_metadata?.role || 'student']
        },
        message: 'Token 有效',
        timestamp: new Date().toISOString()
    });
});
// Token 刷新狀態檢查
router.get('/token-status', authenticateSupabaseToken, async (req, res) => {
    try {
        const token = req.token;
        const user = req.user;
        // 嘗試解析 JWT 來獲取過期時間
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const expiresAt = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = expiresAt - now;
        res.json({
            valid: true,
            expiresAt: expiresAt,
            timeToExpiry: timeToExpiry,
            needsRefresh: timeToExpiry < 15 * 60,
            user: {
                id: user.id,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Token 狀態檢查失敗:', error);
        res.status(500).json({
            message: 'Token 狀態檢查失敗',
            code: 'TOKEN_STATUS_CHECK_FAILED'
        });
    }
});
// 錯誤處理中間件
const authErrorHandler = (error, req, res, next) => {
    console.error('認證錯誤:', error);
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
            expired: false
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
            expired: true
        });
    }
    res.status(500).json({
        message: '認證系統錯誤',
        code: 'AUTH_SYSTEM_ERROR'
    });
};
// 應用錯誤處理中間件
router.use(authErrorHandler);
exports.default = router;
