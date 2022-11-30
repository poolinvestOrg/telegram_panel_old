import {model, Schema} from "mongoose";

const schema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true},
    coin: {type: Schema.Types.ObjectId, required: true},
    plan: {type: Schema.Types.ObjectId, required: true},
    value: {type: Schema.Types.Number, required: true},
    description: {type: Schema.Types.String, required: true},
    link: {type: Schema.Types.String, required: true},
    timestamp: {type: Schema.Types.Number, default: Date.now},
})

export default model("pay", schema, "pay")