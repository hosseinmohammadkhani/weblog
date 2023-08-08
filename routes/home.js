const { Router } = require('express');
const router = new Router();
const mainPageController = require('../controllers/mainPageController.js');
const { isAuthenticated } = require('../utils/helpers.js');

// @desc get posts page
// @route GET /
router.get("/" , mainPageController.getPosts)

// @desc search page
// @route POST /search
router.post("/search" , mainPageController.search)

// @desc show post 
// @route GET /post/:id
router.get("/post/:id" , mainPageController.showPost)

// @desc /captcha.png
// @route GET /captcha.png
router.get("/captcha.png" , mainPageController.getCaptcha)

// @desc contact us page
// @route GET contact-us 
router.get("/contact-us" , mainPageController.contactUsPage)

// @desc handle contact-us
// @route POST contact-us 
router.post("/contact-us" , mainPageController.handleContactUs)

// @desc submit comment 
// @route POST /submit-comment/:postId
router.post("/submit-comment/:postId" , mainPageController.submitComment)

// @desc delete comment 
// @route GET /delete-comment/:commentId
router.get("/delete-comment/:commentId" , isAuthenticated ,  mainPageController.deleteComment)

module.exports = router