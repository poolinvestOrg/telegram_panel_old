"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    wallets: [
        {
            coinId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            wallet: { type: mongoose_1.Schema.Types.String, required: true },
            qrCode: { type: mongoose_1.Schema.Types.String, required: true },
        }
    ],
});
exports.default = (0, mongoose_1.model)("config", schema, "config");
