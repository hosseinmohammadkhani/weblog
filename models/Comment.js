const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({ 
    name : {
        type : String,
        required : [true , "وارد کردن نام الزامی است"]
    },
    comment : {
        type : String,
        required : [true , "وارد کردن نظر الزامی است"]
    },
    postId : {
        type : mongoose.Schema.Types.ObjectId, //puts id of post in comment
        ref : "Post"
    }

})

module.exports = mongoose.model("Comment" , commentSchema)