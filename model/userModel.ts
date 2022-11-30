import {model, Schema} from "mongoose";

const S = new Schema({
    balance: {type: Schema.Types.Number, default: 0},
    name: {type: Schema.Types.String, required: true},
    email: {type: Schema.Types.String, required: true},
    phone: {type: Schema.Types.String, required: true},
    password: {type: Schema.Types.String, required: true},
    profit1 : {type : Schema.Types.Number, default: 0},
    profit2 : {type : Schema.Types.Number, default: 0},
    ref1: {type: Schema.Types.Mixed},
    ref2: {type: Schema.Types.Mixed},
});

export default model("users", S, "users");
