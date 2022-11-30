"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    coin: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    wallet: { type: mongoose_1.Schema.Types.String, required: true },
    value: { type: mongoose_1.Schema.Types.Number, required: true },
    description: { type: mongoose_1.Schema.Types.String, required: true },
    timestamp: { type: mongoose_1.Schema.Types.Number, default: Date.now },
});
exports.default = (0, mongoose_1.model)("withdraw", schema, "withdraw");
