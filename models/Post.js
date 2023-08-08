const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title : {
        type : String,
        required : [true , "انتخاب موضوع الزامی است"],
        minLength : [5 , "موضوع باید حداقل 5 کاراکتر باشد"],
        maxLength : [60 , "موضوع باید حداکثر 60 کاراکتر باشد"],
        trim : true
    },
    thumbnail : {
        type : String, 
        required : [true , "قرار دادن تصویر برای پست الزامی است"]
    },
    body : {
        type : String,
        required : [true , "انتخاب بدنه برای پست الزامی است"]
    },
    status : {
        type : String,
        required : [true , "انتخاب وضعیت برای پست الزامی است"],
        default : "public",
        enum : ["public" , "private"]
    },
    user : {
        type : mongoose.Schema.Types.ObjectId, //puts id of user in the post
        ref : "User"
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

//search blog by title
postSchema.index({ title : "text" })

module.exports = mongoose.model("Post" , postSchema)