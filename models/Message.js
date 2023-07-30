const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    fullName : {
        type : String,
        minLength : [6 , "Minimum 6 characters"],
        maxLength : [255 , "Maximum 255 characters"],
        required : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        trim : true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId, //puts id of reciever in message
        ref : "User"     
    },
    message : {
        type : String,
        trim : true,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }

})

module.exports = mongoose.model("Message" , messageSchema)