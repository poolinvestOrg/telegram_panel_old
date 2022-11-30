import {Schema, model} from 'mongoose';

const schame = new Schema({
    name: {type: Schema.Types.String, required: true},
    code: {type: Schema.Types.String, required: true},
    balance: {type: Schema.Types.Number, required: true}
})

export default model("coin", schame, "coin")