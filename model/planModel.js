"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    title: { type: mongoose_1.Schema.Types.String, required: true },
    description: { type: mongoose_1.Schema.Types.String, required: true },
    time: { type: mongoose_1.Schema.Types.Number, required: true },
    profit: { type: mongoose_1.Schema.Types.Number, required: true },
    min: { type: mongoose_1.Schema.Types.Number, required: true },
    cancelTime: { type: mongoose_1.Schema.Types.Number, required: true }
});
exports.default = (0, mongoose_1.model)("plan", schema, "plan");
