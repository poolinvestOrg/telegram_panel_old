import {model, Schema} from 'mongoose';

const schema = new Schema({
    wallets : [
        {
            coinId : {type: Schema.Types.ObjectId,required: true},
            wallet : {type :Schema.Types.String, required: true},
            qrCode : {type: Schema.Types.String,required: true},
        }
    ],
})

export default model("config", schema, "config")