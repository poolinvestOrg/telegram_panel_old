import {model,Schema} from 'mongoose';
const schema = new Schema({
    session : {type : Schema.Types.String, required : true},
    userId : {type : Schema.Types.ObjectId, required: true},
    lastLogin : {type : Schema.Types.Number, default : Date.now},
})
export default model("session", schema, "session");