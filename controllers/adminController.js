const Post = require('../models/Post.js');
const User = require('../models/User.js');
const Message = require('../models/Message.js');
const fs = require('fs');
const sharp = require('sharp');
const appRoot = require('app-root-path');
const { nanoid } = require('nanoid');
const { convertToShamsi } = require('../utils/helpers.js');
const { truncate } = require('../utils/helpers.js');

module.exports.getDashboard = async(req , res) => {

    //Prevent from back after logging out
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    //تبدیل استرینگ به نامبر با یک حرکت
    const page = +req.query.page || 1
    const postPerPage = 3

    const numberOfPosts = await Post.find({ user : req.user._id }).countDocuments()
    
    //All of the posts of logged-in user - finds post by user
    const posts = await Post.find({ user : req.user._id })
    .sort({ createdAt : "desc" })
    .skip((page - 1) * postPerPage)
    .limit(postPerPage)
    
    const user = await User.findOne({ user : req.params.id })
    res.render("./private/posts.ejs" , {
        pageTitle : "داشبورد",
        path : "/dashboard",
        layout : "./layouts/dashLayout.ejs",
        posts : posts,
        email : user.email,
        username : user.username,
        convertToShamsi,
        page : page,
        hasNextPage : page * postPerPage < numberOfPosts,
        hasPreviousPage : page > 1,
        lastPage : Math.ceil(numberOfPosts / postPerPage)
    })
}

module.exports.search = async(req , res) => {

    

    //Prevent from back after logging out
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    //تبدیل استرینگ به نامبر با یک حرکت
    const page = +req.query.page || 1
    const postPerPage = 3

    const numberOfPosts = await Post.find({ 
        user : req.user._id,
        $text : { $search : req.body.search }
    }).countDocuments()
    
    //All of the posts of logged-in user - finds post by user
    const posts = await Post.find({ 
        user : req.user._id,
        $text : { $search : req.body.search }
    })
    .sort({ createdAt : "desc" })
    .skip((page - 1) * postPerPage)
    .limit(postPerPage)
    
    const user = await User.findOne({ user : req.params.id })
    res.render("./private/posts.ejs" , {
        pageTitle : "داشبورد",
        path : "/dashboard",
        layout : "./layouts/dashLayout.ejs",
        posts : posts,
        email : user.email,
        username : user.username,
        convertToShamsi,
        page : page,
        hasNextPage : page * postPerPage < numberOfPosts,
        hasPreviousPage : page > 1,
        lastPage : Math.ceil(numberOfPosts / postPerPage)
    })
}

module.exports.createPostPage = async(req , res) => {
    const user = await User.findOne({ id : req.params.id })
    res.render("./private/createPost.ejs" , {
        pageTitle : "ساخت پست جدید",
        path : "/dashboard/create-post",
        layout : "./layouts/dashLayout.ejs",
        username : user.username
    })
}

module.exports.handleCreatePost = async(req , res) => {
    const user = await User.findOne({ id : req.user._id })
    const errors = []
    let thumbnail = req.files ? req.files.thumbnail : {}
    let fileName = `${await nanoid()}_${thumbnail.name}`
    fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`
    console.log(thumbnail);
    try {
        req.body = { ...req.body , thumbnail }
        if(typeof thumbnail.name == `undefined`){
            errors.push({ message : "قرار دادن تصویر برای پست الزامی است" })
            return res.render("./private/createPost.ejs" , {
                pageTitle : "ساخت پست جدید",
                path : "/dashboard/create-post",
                layout : "./layouts/dashLayout.ejs",
                errors : errors 
            })
        }
        if(thumbnail.mimetype == "image/jpeg" || thumbnail.mimetype == "image/png"){
            if(thumbnail.size > 8000000){
                errors.push({ message : "حداکثر حجم تصویر : 8 مگابایت" })
                return res.render("./private/createPost.ejs" , {
                    pageTitle : "ساخت پست جدید",
                    path : "/dashboard/create-post",
                    layout : "./layouts/dashLayout.ejs",
                    errors : errors
                })
            }
            await sharp(thumbnail.data).toFile(uploadPath , err => console.log(err))

            //Puts id of user into the post in order to access the post from the user  
            await Post.create({ ...req.body , user : req.user._id  ,thumbnail : fileName })

            return res.redirect("/dashboard")
        }
        else{
            errors.push({ message : "فقط تصویر با فرمت JPEG یا PNG وارد شود" })
            return res.render("./private/createPost.ejs" , {
                pageTitle : "ساخت پست جدید",
                path : "/dashboard/create-post",
                layout : "./layouts/dashLayout.ejs",
                errors : errors
            })
        }
        
    } catch (err) {
        if(typeof err.errors["title"] != `undefined`) errors.push({ message : err.errors["title"].message })
        if(typeof err.errors["body"] != `undefined`) errors.push({ message : err.errors["body"].message })
        return res.render("./private/createPost.ejs" , {
            pageTitle : "ساخت پست",
            path : "/dashboard/create-post",
            layout : "./layouts/dashLayout.ejs",
            errors : errors,
            username : user.username            
        })
    }
}

module.exports.editPostPage = async(req , res) => { 
    const user = await User.findOne({ _id : req.user._id })
    try {

        //finds post by id 
        const post = await Post.findOne({ _id : req.params.id })
        if(!post) return res.redirect("/404")
        if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
        else{
            return res.render("./private/editPost.ejs" , {
                pageTitle : "ویرایش پست",
                path : "/dashboard/edit-post",
                layout : "./layouts/dashLayout.ejs",
                post : post,
                username : user.username
            })
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports.handleEditPost = async(req , res) => {
    const user = await User.findOne({ id : req.user._id })
    const errors = []
    let thumbnail = req.files ? req.files.thumbnail : {}
    let fileName = `${await nanoid()}_${thumbnail.name}`
    fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`
    
    //finds the first thing related - finds post by id 
    const post = await Post.findOne({ _id : req.params.id })

    try {
        if(!post) return res.redirect("/404")

        //post.user and req.user are populated by passportjs
        if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
        else{
            if(thumbnail.name){
                //Deletes previous thumbnail
                //Adds new one
                fs.unlink(`${appRoot}/public/uploads/thumbnails/${post.thumbnail}` , async err => {
                    if(err) console.log(err);
                    await sharp(thumbnail.data).toFile(uploadPath , err => console.log(err))
                })
            }
        }
        if(typeof thumbnail.name == `undefined` && typeof post.thumbnail == `undefined`){
            errors.push({ message : "قرار دادن تصویر برای پست الزامی است" })
            return res.render("./private/editPost.ejs" , {
                pageTitle : "ویرایش پست",
                path : "/dashboard/edit-post",
                layout : "./layouts/dashLayout.ejs",
                post : post,
                errors : errors,
                username : user.username
            })
        }

        //if thumbnail.name exists (user wants to change thumbnail) fileName will be replaced
        post.thumbnail = thumbnail.name ? fileName : post.thumbnail

        const { title , body , status } = req.body

        post.title = title
        post.body = body
        post.status = status

        await post.save()
        return res.redirect("/dashboard")
    } catch (err) {
        console.log(err);
        if(typeof err.errors["title"] != `undefined`) errors.push({ message : err.errors["title"].message })
        if(typeof err.errors["body"] != `undefined`) errors.push({ message : err.errors["body"].message })
        return res.render("./private/editPost.ejs" , {
            pageTitle : "ویرایش پست",
            path : "/dashboard/edit-post",
            layout : "./layouts/dashLayout.ejs",
            post : post,
            errors : errors,
            username : user.username
        })
    }
}

module.exports.deletePost = async(req , res) => {
    

    //finds the first thing related - finds post its by id
    const post = await Post.findOne({ _id : req.params.id })

    try {
        if(!post) return res.redirect("/404")

        if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
        else{
            fs.unlink(`${appRoot}/public/uploads/thumbnails/${post.thumbnail}` , async err => {
                if(err) console.log(err);
                await Post.findByIdAndRemove(req.params.id)
                return res.redirect("/dashboard")                                  
            })           
        }
    } catch (err) {
        console.log(err);
        return res.redirect('/500')
    }    
}

module.exports.messagesPage = async(req , res) => {
    const user = await User.findOne({ _id : req.user._id })
    
    if(!user) return res.redirect("/404")

    //finds messages by id in the message
    //id in the message should be as same as logged-in user's id
    const messages = await Message.find({ user : req.user._id })

    res.render("./private/messages.ejs" , {
        pageTitle : " پیام ها",
        path : "/dashboard/messages/:username",
        layout : "./layouts/dashLayout.ejs",
        username : user.username,
        messages : messages,
        convertToShamsi,
        truncate
    })
}

module.exports.deleteMessage = async(req , res) => {
    try {

        //finds user by id 
        const user = await User.findOne({ _id : req.user._id })

        //finds message by id
        const message = await Message.findOne({ _id : req.params.id })

        if(!user) return res.redirect("/404")
        if(!message) return res.redirect("/404")
        if(req.user._id != message.user.toString()) return res.redirect(`/dashboard/messages/${user.username}`)        
        
        await Message.findByIdAndRemove(req.params.id)       

        return res.redirect(`/dashboard/messages/${user.username}`)
    } catch (err) {
        console.log(err);
        return res.redirect("/500")
    } 
}

module.exports.editProfilePage = (req , res) => {
    res.render("./private/editProfile.ejs" , {
        pageTitle : "ویرایش مشخصات"
    })
}

// module.exports.handleEditPost = async(req , res) => {
//     const errors = []
//     let thumbnail = req.files ? req.files.thumbnail : {}
//     let fileName = `${await nanoid()}_${thumbnail.name}`
//     fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
//     const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`
    
//     //finds post by id 
//     const post = await Post.findOne({ _id : req.params.id })
//     try {       
//   
//         if(!post) return res.redirect("/404")

//         //post.user and req.user are populated by passport
//         if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
//         else{
//             if(thumbnail.name){
                
//                 //Delete previous thumbnail 
//                 //Add new thumbnail
//                 fs.unlink(`${appRoot}/public/uploads/thumbnails/${post.thumbnail}` , async err => {
//                     if(err) console.log(err);
//                     else await sharp(thumbnail.data).toFile(uploadPath , err => console.log(err)) 
//                 })

//             }
//             const { title , body , status } = req.body
//             post.title = title
//             post.body = body
//             post.status = status 

//             //If there's a new thumbnail(user wants to change thumbnail) name of the new thumbnail will be replaced
//             //else name of the previous thumbnail will be saved 
//             post.thumbnail = thumbnail.name ? fileName : post.thumbnail

//             await post.save()
//             return res.redirect("/dashboard")
//         }

//     } catch (err) {
//         if(typeof err.errors["title"] != `undefined`) errors.push({ message : err.errors["title"].message })
//         if(typeof err.errors["body"] != `undefined`) errors.push({ message : err.errors["body"].message })
//         console.log("ERROR -> " , err);
//         return res.render("./private/editPost.ejs" , {
//             pageTitle : "ویرایش پست",
//             path : "/dashboard/edit-post",
//             layout : "./layouts/dashLayout.ejs",
//        
//             post : post,
//             errors : errors  
//         })
//     }
// }



