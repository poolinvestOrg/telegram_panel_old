"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    plan: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    coin: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    balance: { type: mongoose_1.Schema.Types.Number, required: true },
    timestamp: { type: mongoose_1.Schema.Types.Number, default: Date.now },
    lastProf: { type: mongoose_1.Schema.Types.Number, default: Date.now }
});
exports.default = (0, mongoose_1.model)("investment", schema, "investment");
