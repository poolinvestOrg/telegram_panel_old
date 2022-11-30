import {model, Schema} from 'mongoose';

const schema = new Schema({
    title: {type: Schema.Types.String, required: true},
    description: {type: Schema.Types.String, required: true},
    image: {type: Schema.Types.String, required: true},
    link: {type: Schema.Types.String, required: true}
})
export default model("headers", schema, "header")