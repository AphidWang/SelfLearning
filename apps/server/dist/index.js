"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// 必須在所有其他 import 之前載入環境變數
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const users_1 = __importDefault(require("./routes/users"));
const report_1 = __importDefault(require("./routes/report"));
const path_1 = __importDefault(require("path"));
exports.app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// CORS 設置必須在其他 middleware 之前
exports.app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parser middleware
exports.app.use(express_1.default.json());
// 測試路由
exports.app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// 添加一些日誌
exports.app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
exports.app.use('/api/auth', auth_1.default);
exports.app.use('/api/chat', chat_1.default);
exports.app.use('/api/users', users_1.default);
exports.app.use('/api', report_1.default);
exports.app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/dist')));
// 確保所有路由都返回 index.html
exports.app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../client/dist/index.html'));
});
if (process.env.NODE_ENV !== 'test') {
    exports.app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
