"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    title: { type: mongoose_1.Schema.Types.String, required: true },
    description: { type: mongoose_1.Schema.Types.String, required: true },
    image: { type: mongoose_1.Schema.Types.String, required: true },
    link: { type: mongoose_1.Schema.Types.String, required: true }
});
exports.default = (0, mongoose_1.model)("headers", schema, "header");
