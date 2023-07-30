const { Router } = require('express');
const router = new Router()
const passport = require('passport');
const userController = require('../controllers/userController.js');
const { isAuthenticated } = require('../utils/helpers.js');

// @desc register page
// @route GET /users/register
router.get("/register" , userController.registerPage)

// @desc register handler
// @route POST /users/register
router.post("/register" , userController.createUser)

// @desc login page
// @route GET /users/login
router.get("/login" , userController.loginPage)

// @desc login handler
// @route POST /users/login
router.post("/login" , userController.handleLogin , userController.rememberMe)

// @desc logout
// @route GET /users/logout
router.get("/logout" , isAuthenticated , userController.logout)

// @desc forgetPassword page
// @route GET /users/forget-password
router.get("/forget-password" , userController.forgetPasswordPage)

// @desc handle forget-password
// @route POST /users/forget-password
router.post("/forget-password" , userController.handleForgetPassword)

// @desc reset-password page
// @route GET /users/reset-password/:token
router.get("/reset-password/:token" , userController.resetPasswordPage)

// @desc handle reset-password 
// @route POST /users/reset-password/:token
router.post("/reset-password/:token" , userController.handleResetPassword)

// @desc profile page
// @route GET /users/profile/:username
router.get("/profile/:username" , userController.showProfilePage)

// @desc /messageCaptcha.png
// @route GET /messageCaptcha.png
router.get("/messageCaptcha.png" , userController.getMessageCaptcha)

// @desc send message page
// @route GET /users/message/:username
router.get("/message/:username" , userController.sendMessagePage)

// @desc handle send message
// @route POST /users/message/:username
router.post("/message/:username" , userController.handleSendMessage)

module.exports = router