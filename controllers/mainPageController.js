const Post = require('../models/Post.js');
const User = require("../models/User.js")
const { convertToShamsi } = require('../utils/helpers.js');
const { truncate } = require('../utils/helpers.js');
const captchapng = require('captchapng');
const Message = require('../models/Message.js');
const Comment = require('../models/Comment.js');
let CAPTCHA_NUM

module.exports.getPosts = async(req , res) => {

    const page = +req.query.page || 1
    const postPerPage = 3
    try {

        const numberOfPosts = await Post.find({ status : "public" }).countDocuments()
        
        const posts = await Post.find({ 
            status : "public", 
        })
        .sort({ createdAt : "desc" })
        .skip((page - 1) * postPerPage)
        .limit(postPerPage)
        
        res.render("./home.ejs" , {
            pageTitle : "صفحه ی اصلی",
            path : "/",
            layout : "./layouts/navbar.ejs",
            posts : posts,
            convertToShamsi,
            truncate,
            req,
            page : page,
            hasPreviousPage : page > 1,
            hasNextPage : page * postPerPage < numberOfPosts,
            lastPage : Math.ceil(numberOfPosts / postPerPage)
        })
    } catch (err) {
        console.log(err);
        return res.redirect("/500")
    }

    
}

module.exports.showPost = async(req , res) => {

    //Finds post by its id
    const post = await Post.findOne({ _id : req.params.id })

    //Finds user by id in the post
    const user = await User.findOne({ _id : post.user.toString() })
    
    //All of the comments of the post in an array
    const comments = await Comment.find({ postId : post._id })
    
    if(!user) return res.redirect("/404")

    res.render("./private/post.ejs" , {
        pageTitle : post.title,
        path : "/post/:id",
        post : post,
        layout : "./layouts/navbar.ejs",
        username : user.username,
        message : req.flash("success_msg"),
        error : req.flash("error"),
        convertToShamsi,      
        req,
        comments
    })

}

module.exports.search = async(req , res) => {
    const page = +req.query.page || 1
    const postPerPage = 3
    try {
        const numberOfPosts = await Post.find({ 
            status : "public",
            $text : { $search : req.body.search } 
        }).countDocuments()
        
        const posts = await Post.find({ 
            status : "public",
            $text : { $search : req.body.search } 
         })
        .sort({ createdAt : "desc" })
        .skip((page - 1) * postPerPage)
        .limit(postPerPage)
        
        res.render("./home.ejs" , {
            pageTitle : "نتایج جستجو",
            path : "/",
            layout : "./layouts/navbar.ejs",
            posts : posts,
            convertToShamsi,
            truncate,
            req,
            page : page,
            hasPreviousPage : page > 1,
            hasNextPage : page * postPerPage < numberOfPosts,
            lastPage : Math.ceil(numberOfPosts / postPerPage)
        })
    } catch (err) {
        console.log(err);
        return res.redirect("/500")
    }

}

module.exports.contactUsPage = (req , res) => {
    res.render("./contact.ejs" , {
        pageTitle : "ارتباط با ما",
        path : "/contact-us",
        layout : "./layouts/navbar.ejs",
        message : req.flash("success_msg"),
        error : req.flash("error"),
        req
    })
}

module.exports.handleContactUs = async(req , res) => {
    const { fullName , email , message , captcha  } = req.body
    
    try {
        if(fullName.length < 6 || fullName.length > 255){
            req.flash("error" , "نام و نام خانوادگی باید حداقل 6 کاراکتر و حداکثر 255 کاراکتر باشد")
            return res.render("./contact.ejs" , {
                pageTitle : "ارتباط با ما",
                path : "/contact-us",
                layout : "./layouts/navbar.ejs",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                req
            })
        }
        if(message.length === 0 || message === ""){
            req.flash("error" , "وارد کردن پیام الزامی است")
            return res.render("./contact.ejs" , {
                pageTitle : "ارتباط با ما",
                path : "/contact-us",
                layout : "./layouts/navbar.ejs",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                req
            })
        }
        if(CAPTCHA_NUM === parseInt(captcha)){
            console.log(message);
            Message.create({ fullName : fullName , email : email , message : message })
            req.flash("success_msg" , "پیام با موفقیت ارسال شد")
            return res.render("./contact.ejs" , {
                pageTitle : "ارتباط با ما",
                path : "/contact-us",
                layout : "./layouts/navbar.ejs",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                req
            })
        }
        req.flash("error" , "کد امنیتی صحیح نیست")
        return res.render("./contact.ejs" , {
            pageTitle : "ارتباط با ما",
            path : "/contact-us",
            layout : "./layouts/navbar.ejs",
            message : req.flash("success_msg"),
            error : req.flash("error"),
            req
        })
    } catch (err) {
        console.log(err);
    }
}

module.exports.getCaptcha = (req , res) => {
    CAPTCHA_NUM = parseInt(Math.random()*9000+1000)
    let p = new captchapng(80 , 30 , CAPTCHA_NUM)
    p.color(0, 0, 0, 0)
    p.color(80, 80, 80, 255)

    let img = p.getBase64()
    let imgbase64 = Buffer.from(img , "base64")
    res.send(imgbase64)
}

module.exports.submitComment = async(req , res) => {
    const { name , comment } = req.body
    try {
        const post = await Post.findOne({ _id : req.params.postId })
        const user = await User.findOne({ _id : post.user.toString() })
        console.log(post)
        //All of the comments of the post in a array
        const comments = await Comment.find({ postId : post._id })

        
        if(!post) return res.redirect("/404")
 
        if(name === "" || comment === ""){
            req.flash("error" , "ارسال نام و نظر الزامی است")
            return res.render("./private/post.ejs" , {
                pageTitle : post.title,
                path : "/post/:id",
                post : post,
                layout : "./layouts/navbar.ejs",
                username : user.username,
                message : req.flash("success_msg"),
                error : req.flash("error"),
                convertToShamsi,      
                req,
                comments
            })
        }
        await Comment.create({ name , comment , postId : post._id })
        return res.redirect(`/post/${post._id}`)
    } catch (err) {
        console.log(err);        
    }    
}

module.exports.deleteComment = async(req , res) => {
    try {
        
        //finds comment by its id     
        const comment = await Comment.findOne({ _id : req.params.commentId })
        
        //finds post by id in the comment
        const post = await Post.findOne({ _id : comment.postId.toString() })

        if(req.user._id == post.user.toString()){
            await Comment.findByIdAndRemove(req.params.commentId)
            return res.redirect(`/post/${post._id}`)
        }
        else if(req.user._id != post.user.toString()) return res.redirect(`/post/${post._id}`)
        
        
    } catch (err) {
        console.log(err);
    }
}