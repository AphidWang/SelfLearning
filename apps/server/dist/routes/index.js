"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_1 = __importDefault(require("./chat"));
const users_1 = __importDefault(require("./users"));
const auth_1 = __importDefault(require("./auth"));
const report_1 = __importDefault(require("./report"));
const router = (0, express_1.Router)();
router.use('/api', chat_1.default);
router.use('/api/users', users_1.default);
router.use('/api/auth', auth_1.default);
router.use('/api', report_1.default);
exports.default = router;
