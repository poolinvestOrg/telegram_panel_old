"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schame = new mongoose_1.Schema({
    name: { type: mongoose_1.Schema.Types.String, required: true },
    code: { type: mongoose_1.Schema.Types.String, required: true },
    balance: { type: mongoose_1.Schema.Types.Number, required: true }
});
exports.default = (0, mongoose_1.model)("coin", schame, "coin");
