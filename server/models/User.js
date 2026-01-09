import mongoose from "mongoose";
import { use } from "react";

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    image: {type: String, required: true}
})

const user = mongoose.model('User', userSchema)

export default User;