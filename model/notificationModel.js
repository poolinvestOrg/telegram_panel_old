"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    name: { type: mongoose_1.Schema.Types.String, required: true },
    message: { type: mongoose_1.Schema.Types.String, required: true },
    to: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    timestamp: { type: mongoose_1.Schema.Types.Number, default: Date.now },
    all: { type: mongoose_1.Schema.Types.Boolean, default: false }
});
exports.default = (0, mongoose_1.model)("notification", schema, "notification");
