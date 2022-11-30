"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    session: { type: mongoose_1.Schema.Types.String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    lastLogin: { type: mongoose_1.Schema.Types.Number, default: Date.now },
});
exports.default = (0, mongoose_1.model)("session", schema, "session");
