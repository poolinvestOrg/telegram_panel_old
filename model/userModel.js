"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const S = new mongoose_1.Schema({
    balance: { type: mongoose_1.Schema.Types.Number, default: 0 },
    name: { type: mongoose_1.Schema.Types.String, required: true },
    email: { type: mongoose_1.Schema.Types.String, required: true },
    phone: { type: mongoose_1.Schema.Types.String, required: true },
    password: { type: mongoose_1.Schema.Types.String, required: true },
    profit1: { type: mongoose_1.Schema.Types.Number, default: 0 },
    profit2: { type: mongoose_1.Schema.Types.Number, default: 0 },
    ref1: { type: mongoose_1.Schema.Types.Mixed },
    ref2: { type: mongoose_1.Schema.Types.Mixed },
});
exports.default = (0, mongoose_1.model)("users", S, "users");
