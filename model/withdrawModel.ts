import {Schema, model} from 'mongoose';

const schema = new Schema({
    user : {type: Schema.Types.ObjectId, required: true},
    coin: {type: Schema.Types.ObjectId, required: true},
    wallet : {type :Schema.Types.String, required : true},
    value: {type: Schema.Types.Number, required: true},
    description: {type: Schema.Types.String, required: true},
    timestamp : {type : Schema.Types.Number, default : Date.now},
})

export default model("withdraw", schema, "withdraw");