const { Router } = require('express');
const router = new Router();
const mainPageController = require('../controllers/mainPageController.js');

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

module.exports = router