import {Schema, model} from "mongoose";

const schema = new Schema({
    name: {type: Schema.Types.String, required: true},
    message: {type: Schema.Types.String, required: true},
    to: {type: Schema.Types.ObjectId, required: true},
    timestamp: {type: Schema.Types.Number, default: Date.now},
    all : {type : Schema.Types.Boolean, default: false}
})
export default model("notification", schema, "notification");