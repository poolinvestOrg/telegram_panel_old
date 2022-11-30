import {model, Schema} from 'mongoose';

const schema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true},
    plan: {type: Schema.Types.ObjectId, required: true},
    coin: {type: Schema.Types.ObjectId, required: true},
    balance: {type: Schema.Types.Number, required: true},
    timestamp: {type: Schema.Types.Number, default: Date.now},
    lastProf : {type: Schema.Types.Number, default : Date.now}
})

export default model("investment", schema, "investment");
