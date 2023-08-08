const User = require('../models/User.js');
const Message = require('../models/Message.js');
const passport = require('passport'); 
const { convertToShamsi } = require('../utils/helpers.js');
const JWT = require('jsonwebtoken');
const captchapng = require('captchapng');
const fetch = require('node-fetch');
let CAPTCHA_NUM


module.exports.registerPage = (req , res) => {
    res.render("./register.ejs" , {
        pageTitle : "تایید ایمیل",
        path : "/users/register",
        message : req.flash("success_msg"),
        error : req.flash("error")
    })
}

module.exports.handleRegister = async(req , res) => {
    try {
        let token = JWT.sign({ email : req.body.email } , process.env.JWT_SECRET , { expiresIn : "1h" })
        
        //لینک زیر باید به ایمیل کاربر ارسال شود
        let registerLink = `http://localhost:5000/users/register/${token}`
        console.log(`لینک ثبت نام
        اگر در حال حاضر در وبلاگ حساب کاربری دارید ، این پیام را نادیده بگیرید
        لینک ثبت نام : ${registerLink}`);
        
        req.flash("success_msg" , "لینک ثبت نام به ایمیل شما ارسال شد")
        return res.render("./register.ejs" , {
            pageTitle : "تایید ایمیل",
            path : "/users/register",
            message : req.flash("success_msg"),
            error : req.flash("error")
        }) 
    } catch (err) {
        console.log(err);
        return res.redirect("/500")
    }
}

module.exports.getVerifiedRegisterPage = async(req , res) => {
    const token = req.params.token
    let decodedToken;
    try {
        decodedToken = JWT.verify(token , process.env.JWT_SECRET)
        if(!decodedToken) return res.redirect("/404")
    } catch (error) {
        console.log(error);
        return res.redirect("/500")
    }
    return res.render("./verifiedRegister.ejs" , {
        pageTitle : "ثبت نام کاربر جدید",
        path : `/users/register/${token}`,
        email : decodedToken.email,
        token,
        message : req.flash("success_msg"),
        error : req.flash("error")
    })
}

module.exports.createUser = async(req , res) => {
    const errors = []
    
    const token = req.params.token
    let decodedToken;
    try {
        decodedToken = JWT.verify(token , process.env.JWT_SECRET)
        if(!decodedToken)  return res.redirect("/404")
    } catch (err) {
        console.log(err);
        return res.redirect("/500")
    }

    try {
    
        //object destructuring : picks up username , email , password , confirmPassword from req.body object
        const { email , password , confirmPassword } = req.body
        let { username } = req.body
        username = username.replace(/\s+/g, '-').toLowerCase() //replace space with dash

        //finds the first thing related - finds user by email or username
        const duplicatedEmail = await User.findOne({ email : email })
        const duplicatedUsername = await User.findOne({ username : username })
        
        if(duplicatedUsername){
            errors.push({ message : "نام کاربری قبلا ثبت شده است" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token,
                email : decodedToken.email,
                errors : errors            
            })
        }

        if(duplicatedEmail){
            errors.push({ message : "ایمیل قبلا ثبت شده است" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token,
                email : decodedToken.email,
                errors : errors            
            })
        }

        if(username.length < 5 || username.length > 255){
            errors.push({ message : "طول نام کاربری باید حداقل 5 کاراکتر و حداکثر 255 کاراکتر باشد" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token,
                email : decodedToken.email,
                errors : errors            
            })
        }

        if(password.length < 6 || password.length > 255){
            errors.push({ message : "طول پسوورد باید حداقل 6 کاراکتر و حداکثر 255 کاراکتر باشد" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token,
                email : decodedToken.email,
                errors : errors            
            })
        }

        if(password !== confirmPassword){
            errors.push({ message : "پسوورد و تکرار پسوورد باید برابر باشند" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token,
                email : decodedToken.email,
                errors : errors            
            })
        }

        if(email !== decodedToken.email){
            errors.push({ message : "ایمیل نامعتبر" })
            return res.render("./verifiedRegister.ejs" , {
                pageTitle : "ثبت نام کاربر جدید",
                path : `/users/register/${token}`,
                token , 
                email : decodedToken.email,
                errors : errors
            })
        }

        await User.create({ username : username , email : email , password : password })
        
        req.flash("success_msg" , "ثبت نام با موفقیت انجام شد")

        return res.redirect("/users/login")
    } catch (err) {
        console.log("Error : "  , err);
        if(typeof err.errors["username"] !== `undefined`) errors.push({ message : err.errors["username"].message })
        if(typeof err.errors["password"] !== `undefined`) errors.push({ message : err.errors["password"].message })
        return res.render("./verifiedRegister.ejs" , {
            pageTitle : "ثبت نام کاربر جدید",
            path : "/users/register",
            token,
            email : decodedToken.email,
            errors : errors
        })        
        
    }

}

module.exports.loginPage = (req , res) => {
    res.render("./login.ejs" , {
        pageTitle : "ورود",
        path : "/users/login",
        message : req.flash("success_msg"),
        error : req.flash("error")
    })
}

module.exports.handleLogin = async(req , res , next) => {

    try {

        if(req.body.email === "" || req.body.password === ""){
            req.flash("error" , "وارد کردن ایمیل و رمز عبور الزامی است")
            return res.render("./login.ejs" , {
                pageTitle : "ورود",
                path : "/users/login",
                message : req.flash("success_msg"),
                error : req.flash("error")
            })
        }

        if(!req.body["g-recaptcha-response"] || req.body["g-recaptcha-response"] === null || req.body["g-recaptcha-response"] === undefined ){
            req.flash("error" , "Captcha error")
            return res.render("./login.ejs" , {
                pageTitle : "ورود",
                path : "/users/login",
                message : req.flash("success_msg"),
                error : req.flash("error")
            })
        }
        const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${req.body["g-recaptcha-response"]}
        &remoteip=${req.connection.remoteAddress}`
    

        const response = await fetch(verifyUrl , {
            method : "post",
            headers : {
                Accept : "application/json",
                "Content-Type" : "application/x-www-form-urlencoded; charset=utf-8"
            }
        })

        const json = await response.json()
        
        if(json.success){
            passport.authenticate("local" , {
                //successRedirect : "/dashboard",
                failureFlash : true,
                failureRedirect : "/users/login"
            })(req , res , next)
        }else{
            req.flash("error" , "captcha error")
            return res.render("./login.ejs" , {
                pageTitle : "ورود",
                path : "/users/login",
                message : req.flash("success_msg"),
                error : req.flash("error")
            })
        }
    } catch (err) {
        console.log(err);
        return res.redirect("/404")
    }

    

    
}

module.exports.rememberMe = (req, res) => {
    if(req.body.rememberMe) req.session.cookie.originalMaxAge = 24 * 60 * 60 * 1000
    else req.session.cookie.expire = null
    return res.redirect("/")
}

module.exports.logout = (req , res , next) => {
    
    //provided by passportjs
    req.logout(function(err){
        if(err) return next(err)
        return res.redirect("/")
    })

}

module.exports.forgetPasswordPage = (req , res) => {
    res.render("./forgetPassword.ejs" , {
        pageTitle : "بررسی ایمیل",
        path : "/users/forget-password",
        message : req.flash("success_msg"),
        error : req.flash("error")
    })
}

module.exports.handleForgetPassword = async(req , res) => {
    try {
        const { email } = req.body

        //finds the first thing related - finds user by user's email
        const user = await User.findOne({ email : email })

        if(!user){
            req.flash("error" , "کاربری با این ایمیل وجود ندارد")
            return res.render("./forgetPassword.ejs" , {
                pageTitle : "بررسی ایمیل",
                path : "/users/forget-password",
                message : req.flash("success_msg"),
                error : req.flash("error")
            })
        }
        let token = JWT.sign({ userId : user._id } , process.env.JWT_SECRET , {expiresIn : "1h"})
        const resetLink = `localhost:5000/users/reset-password/${token}`
        req.flash("success_msg" , "لینک ارسال شد")
        console.log(resetLink);
        return res.render("./forgetPassword.ejs" , {
            pageTitle : "بررسی ایمیل",
            path : "/users/forget-password",
            message : req.flash("success_msg"),
            error : req.flash("error")
        })
    } catch (err) {
        console.log(err);
        return res.redirect("/users/forget-password")
    }
}

module.exports.resetPasswordPage = (req , res) => {
    const token = req.params.token
    let decodedToken;
    try {
        decodedToken = JWT.verify(token , process.env.JWT_SECRET)
        console.log(decodedToken);
    } catch (err) {
        console.log(err);
        if(!decodedToken) return res.redirect("/404")
    }
    res.render("./resetPassword.ejs" , {
        pageTitle : "بازنشانی رمز عبور",
        path: "/users/reset-password",
        message : req.flash("success_msg"),
        error : req.flash("error"),
        userId : decodedToken.userId             
    })
}

module.exports.handleResetPassword = async(req , res) => {
    try {
        console.log("ID : " , req.params.token);
        const { password , confirmPassword } = req.body
        if(password !== confirmPassword){
            req.flash("error" , "رمز عبور و تکرار آن باید برابر باشند")
            return res.render("./resetPassword.ejs" , {
                pageTitle : "بازنشانی رمز عبور",
                path: "/users/reset-password",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                userId : req.params.token
            }) 
        }
        if(password.length  < 6 || password.length > 255){
            req.flash("error" , "رمز عبور باید حداقل 6 کاراکتر و حداکثر 255 کاراکتر باشد")
            return res.render("./resetPassword.ejs" , {
                pageTitle : "بازنشانی رمز عبور",
                path: "/users/reset-password",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                userId : req.params.token
            }) 
        }

        //finds user by id(token)
        const user = await User.findOne({ _id : req.params.token })
        
        if(!user) return res.redirect("/404")
        
        user.password = password
        await user.save()
        
        req.flash("success_msg" , "پسوورد با موفقیت بروزرسانی شد")
        
        return res.redirect("/users/login")
    } catch (err) {
        console.log(err);
    }
}

module.exports.showProfilePage = async(req , res) => {
    console.log(req._parsedOriginalUrl.path);
    const username = req._parsedOriginalUrl.path.substr(15)
    
    //finds the first thing related - finds user by username
    const user = await User.findOne({ username : username })
    res.render("./profile.ejs" , {
        pageTitle : user.username,
        username : user.username,
        email : user.email,
        date : user.createdAt,
        convertToShamsi,
    })
}



module.exports.sendMessagePage = async(req , res) => {

    const username = req._parsedOriginalUrl.path.substr(15)

    //finds user by username
    const user = await User.findOne({ username : username })

    res.render("./sendMessage.ejs" , {
        pageTitle : "ارسال پیام به نویسنده",
        path : "/users/message",
        layout : "./layouts/navbar.ejs",
        req,
        message : req.flash("success_msg"),
        error : req.flash("error"),
        username : username
    })
    
}

module.exports.handleSendMessage = async(req , res) => {
    const username = req._parsedOriginalUrl.path.substr(15)
    try {

        //finds the first thing related - finds user by username
        const user = await User.findOne({ username : username })
        const { fullName , email , message , messageCaptcha } = req.body
        
        if(fullName.length < 6 || fullName.length > 255){
            req.flash("error" , "نام و نام خانوادگی باید حداقل 6 کاراکتر و حداکثر 255 کاراکتر باشد")
            return res.render("./sendMessage.ejs" , {
                pageTitle : "ارتباط با ما",
                path : "/users/message",
                layout : "./layouts/navbar.ejs",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                req,
                username : username
            })
        }
        if(message.length === 0 || message === ""){
            req.flash("error" , "وارد کردن پیام الزامی است")
            return res.render("./sendMessage.ejs" , {
                pageTitle : "ارتباط با ما",
                path : "/users/message",
                layout : "./layouts/navbar.ejs",
                message : req.flash("success_msg"),
                error : req.flash("error"),
                req,
                username : username
            })
        }
        if(CAPTCHA_NUM === parseInt(messageCaptcha)){
            req.flash("success_msg" , "پیام ارسال شد")
            await Message.create({ fullName : fullName , email : email , user : user._id , message : message })
            return res.render("./sendMessage.ejs" , {
                pageTitle : "ارسال پیام به نویسنده",
                path : "/users/message",
                layout : "./layouts/navbar.ejs",
                req,
                message : req.flash("success_msg"),
                error : req.flash("error"),
                username : username
            })
        }
        req.flash("error" , "کد امنیتی صحیح نیست")
        return res.render("./sendMessage.ejs" , {
            pageTitle : "ارسال پیام به نویسنده",
                path : "/users/message",
                layout : "./layouts/navbar.ejs",
                req,
                message : req.flash("success_msg"),
                error : req.flash("error"),
                username : username
        })
        // req.flash("success_msg" , `پیام با موفقیت به ${user.username} ارسال شد`)
        
    } catch (err) {
        console.log(err);
    }
}


module.exports.getMessageCaptcha = (req , res) => {
    CAPTCHA_NUM = parseInt(Math.random()*9000+1000)
    const p = new captchapng(80 , 30 , CAPTCHA_NUM)
    p.color(0, 0, 0, 0);  
    p.color(80, 80, 80, 255)

    let img = p.getBase64()
    let imgbase64 = Buffer.from(img , "base64")

    res.send(imgbase64)
}