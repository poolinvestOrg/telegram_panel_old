import {Schema, model} from "mongoose";

const schema = new Schema({
    title: {type: Schema.Types.String, required: true},
    description: {type: Schema.Types.String, required: true},
    time: {type: Schema.Types.Number, required: true},
    profit : {type: Schema.Types.Number, required: true},
    min : {type: Schema.Types.Number, required: true},
    cancelTime: {type: Schema.Types.Number, required: true}
});

export default model("plan", schema, "plan")

