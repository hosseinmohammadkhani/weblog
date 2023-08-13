const Post = require('../models/Post.js');
const User = require('../models/User.js');
const Message = require('../models/Message.js');
const fs = require('fs');
const sharp = require('sharp');
const appRoot = require('app-root-path');
const { nanoid } = require('nanoid');
const { convertToShamsi } = require('../utils/helpers.js');
const { truncate } = require('../utils/helpers.js');
const jwt = require('jsonwebtoken');


module.exports.getDashboard = async(req , res) => {

    //Prevent from back after logging out
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    const page = +req.query.page || 1
    const postPerPage = 3

    const numberOfPosts = await Post.find({ user : req.user._id }).countDocuments()
    
    //All of the posts of logged-in user - finds post by user
    const posts = await Post.find({ user : req.user._id })
    .sort({ createdAt : "desc" })
    .skip((page - 1) * postPerPage)
    .limit(postPerPage)
    
    const user = await User.findOne({ _id : req.user._id })
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
        username : user.username,
    })
}

function renderCreatePost(res , user , errors){
    res.render("./private/createPost.ejs" , {
        pageTitle : "ساخت پست جدید",
        path : "/dashboard/create-post",
        layout : "./layouts/dashLayout.ejs",
        username : user.username,
        errors : errors
    })
}

module.exports.handleCreatePost = async(req , res) => {
    const errors = []
    const user = await User.findOne({ _id : req.user._id })    
    let thumbnail = req.files ? req.files.thumbnail : {}
    let fileName = `${await nanoid()}_${thumbnail.name}`
    fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`
    try {
        req.body = { ...req.body , thumbnail }
        if(typeof thumbnail.name == `undefined`){
            errors.push({ message :  "قرار دادن تصویر برای پست الزامی است"}) 
            return renderCreatePost(res , user , errors)
        }
        if(thumbnail.size > 8000000){
            errors.push({ message : "حداکثر حجم : 8 مگابایت" })
            return renderCreatePost(res , user , errors)
        }
        if(thumbnail.mimetype != "image/jpeg" && thumbnail.mimetype != "image/png"){   
            errors.push({ message : "فرمت فقط JPG یا PNG" })
            return renderCreatePost(res , user , errors)
        }

        await sharp(thumbnail.data).toFile(uploadPath , err => console.log(err))

        //Puts id of user into the post in order to access the post from the user  
        await Post.create({ ...req.body , user : req.user._id  ,thumbnail : fileName })

        return res.redirect("/dashboard")
        
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

function renderEditPostPage(res , post , user , errors){
    res.render("./private/editPost.ejs" , {
        pageTitle : "ویرایش پست",
        path : `/dashboard/edit-post/${post._id}`,
        layout : "./layouts/dashLayout.ejs",
        post : post,
        username : user.username,
        errors : errors
    })
}

module.exports.editPostPage = async(req , res) => { 
    const user = await User.findOne({ _id : req.user._id })
    const errors = []
    try {

        //finds post by id 
        const post = await Post.findOne({ _id : req.params.id })
        if(!post) return res.redirect("/404")
        if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
        else return renderEditPostPage(res , post , user , errors)
        
    } catch (err) {
        console.log(err);
    }
}

module.exports.handleEditPost = async(req , res) => {
    const user = await User.findOne({ _id : req.user._id })
    const errors = []
    let thumbnail = req.files ? req.files.thumbnail : {}
    let fileName = `${await nanoid()}_${thumbnail.name}`
    fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`
    
    //finds post by id 
    const post = await Post.findOne({ _id : req.params.id })
    console.log(post);
    
    try {
        if(!post) return res.redirect("/404")

        //post.user(id of user in the post) === id of logged-in user
        if(post.user.toString() != req.user._id) return res.redirect("/dashboard")
        else{
            if(thumbnail.name){
                if(thumbnail.mimetype != "image/jpeg" && thumbnail.mimetype != "image/png"){
                    errors.push({ message : "فرمت فقط PNG  یا JPG" })
                    return renderEditPostPage(res , post , user , errors)
                }
                
                //Deletes previous thumbnail
                //Adds new one
                fs.unlink(`${appRoot}/public/uploads/thumbnails/${post.thumbnail}` , async err => {
                    if(err) console.log(err);
                    await sharp(thumbnail.data).toFile(uploadPath , err => console.log(err))
                })
            }
        }

        if(typeof thumbnail.name == `undefined` && typeof post.thumbnail == `undefined`){
            errors.push({ message : "قرار دادن تصویر برای پست الزامی است"})
            return renderEditPostPage(res , post , user , errors)
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
        path : `/dashboard/messages/${user.username}`,
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

function renderEditProfilePage(req , res , user){
    res.render("./private/editProfile.ejs" , {
        pageTitle : "ویرایش مشخصات",
        path : `/dashboard/edit-profile/${user.username}`,
        layout : "./layouts/dashLayout.ejs",
        username : user.username,
        error : req.flash("error"),
        message : req.flash("success_msg"),
        email : user.email,
        password : user.password,
        profilePhoto : user.profilePhoto
    })
}

module.exports.editProfilePage = async(req , res) => {
    try {
        //finds logged-in user by id
        const user = await User.findOne({ _id : req.user._id })

        if(req.params.username !== user.username) return res.redirect("/404")

        if(!user) return res.redirect("/404")
        
        res.render("./private/editProfile.ejs" , {
            pageTitle : "ویرایش مشخصات",
            path : `/dashboard/edit-profile/${user.username}`,
            layout : "./layouts/dashLayout.ejs",
            username : user.username,
            error : req.flash("error"),
            message : req.flash("success_msg"),
            email : user.email,
            password : user.password,
            profilePhoto : user.profilePhoto
        })   

    }catch (error) {
        console.log(error);
        return res.redirect("/500")
    }
}

module.exports.handleEditProfile = async(req , res) => {
    const { username , email } = req.body
    let profilePhoto = req.files ? req.files.profilePhoto : {}
    let fileName = `${await nanoid()}_${profilePhoto.name}`
    fileName = fileName.replace(/\s+/g, '-').toLowerCase() //replacing space with dash
    const uploadPath = `${appRoot}/public/uploads/profilePhotos/${fileName}`
    try {
        
        //finds user by id
        const user = await User.findOne({ _id : req.user._id })
        
        if(profilePhoto.name){
            if(profilePhoto.mimetype == "image/jpeg" || profilePhoto.mimetype == "image/png"){
                if(profilePhoto.size > 8000000){
                    errors.push({ message : "حداکثر حجم تصویر : 8 مگابایت" })
                    return renderEditProfilePage(req , res , user)
                }
                if(user.profilePhoto == "") await sharp(profilePhoto.data).toFile(uploadPath , err => console.log(err))
                else{

                    //removes previous profile photo and replaces new one
                    fs.unlink(`${appRoot}/public/uploads/profilePhotos/${user.profilePhoto}` , async err => {
                        if(err) console.log(err);
                        await sharp(profilePhoto.data).toFile(uploadPath , err => console.log(err))
                    })
                }          
                user.profilePhoto = fileName
                await user.save()
            }
            else{
                req.flash("error" , "فقط فرمت JPG یا PNG پذیرفته می‌شود")
                return renderEditProfilePage(req , res , user)
            }
        }

        

        if(user.email === email){
            if(user.username === username) return renderEditProfilePage(req , res , user)
            else if(user.username !== username){
                const duplicatedUsername  = await User.findOne({ username })
                if(duplicatedUsername){
                    req.flash("error" , "کاربر با این نام کاربری موجود است")
                    return renderEditProfilePage(req , res , user)
                }
                if(username === "" || username.length < 6 || username.length > 255){
                    req.flash("error" , "نام کاربری غیرمجاز")
                    return renderEditProfilePage(req , res , user)
                }
                req.flash("success_msg" , "پروفایل با موفقیت تغییر یافت")
                user.username = username
                // req.params.username = username
                await user.save()
                return renderEditProfilePage(req , res , user)
            }
        }else if(user.email !== email){
            const duplicatedEmail = await User.findOne({ email })
            if(duplicatedEmail){
                req.flash("error" , "کاربر با این ایمیل موجود است")
                return renderEditProfilePage(req , res , user)
            }

            const token = jwt.sign({ email : email , username : username } , process.env.JWT_SECRET , {expiresIn : "1h"})
            const link = `http://localhost:5000/dashboard/change-email/${token}`
            
            req.flash("success_msg" , "لینک تایید به ایمیل شما ارسال شد")
            
            //Send email
            console.log(link);
            
            return renderEditProfilePage(req, res , user)
        }
    } catch (error) {
        console.log(error);
    }
}
module.exports.changeEmail = async(req , res) => {
    const token = req.params.token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token , process.env.JWT_SECRET)
        if(!decodedToken) return res.redirect("/404")
    } catch (err) { console.log(err); }

    try {

        //finds user by id
        const user = await User.findOne({ _id : req.user._id })
        if(decodedToken.username === user.username){
            user.username = decodedToken.username
            user.email = decodedToken.email
            await user.save()
            req.flash("success_msg" , "ایمیل با موفقیت تغییر کرد")
            return res.redirect(`/dashboard/edit-profile/${user.username}`)
        }else if(decodedToken.username !== user.username){
            if(decodedToken.username === "" || decodedToken.username.length < 6 
            || decodedToken.username.length > 255){
                req.flash("error" , "نام کاربری غیرمجاز")
                return renderEditProfilePage(req , res , user)
            }
            const duplicatedUsername = await User.findOne({ username : decodedToken.username })
            if(duplicatedUsername){
                req.flash("error" , "نام کاربری قبلا ثبت شده است")
                return res.redirect(`/dashboard/edit-profile/${user.username}`)
            }
            user.username = decodedToken.username
            user.email = decodedToken.email
            // req.params.username = decodedToken.username
            await user.save()
            req.flash("success_msg" , "ایمیل با موفقیت تغییر کرد")
            return res.redirect(`/dashboard/edit-profile/${user.username}`)            
        }

    } catch (err) {
        console.log(err);
    }

}

