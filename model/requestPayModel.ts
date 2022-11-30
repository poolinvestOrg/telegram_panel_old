import {Schema, model} from 'mongoose';
const schema = new Schema({
    investment : {type : Schema.Types.ObjectId, required : true},
    wallet : {type : Schema.Types.String, required : true},
    description: {type: Schema.Types.String, default : "empty"},
    timestamp : {type : Schema.Types.Number, default:  Date.now}
})
export default model("payRequest", schema, "payRequest");