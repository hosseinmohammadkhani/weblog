const { Router } = require('express');
const router = new Router()
const adminController = require('../controllers/adminController.js');
const { isAuthenticated } = require('../utils/helpers.js');

// @desc dashboard page
// @route GET /dashboard
router.get("/" , isAuthenticated , adminController.getDashboard)

// @desc dashboard search
// @route POST /dashboard/search
router.post("/search" , isAuthenticated , adminController.search)

// @desc create post page 
// @route GET /dahboard/create-post
router.get("/create-post" , isAuthenticated , adminController.createPostPage)

// @desc create post handler 
// @route POST /dashboard/create-post
router.post("/create-post" , isAuthenticated , adminController.handleCreatePost)

// @desc edit post page 
// @route GET /dashboard/edit-post/:id
router.get("/edit-post/:id" , isAuthenticated , adminController.editPostPage)

// @desc handle edit post
// @route POST /dashboard/edit-post/:id
router.post("/edit-post/:id" , isAuthenticated , adminController.handleEditPost)

// @desc delete post
// @route POST /dashboard/delete-post/:id
router.get("/delete-post/:id" , isAuthenticated , adminController.deletePost)

// @desc messages page ( unique for every user )
// @route GET /dashboard/messages/:username
router.get("/messages/:username" , isAuthenticated , adminController.messagesPage)

// @desc deletes message by its id
// @route GET /dashboard/delete-message/:id
router.get("/delete-message/:id" , isAuthenticated , adminController.deleteMessage)

// @desc edit profile page
// @route GET /dashboard/edit-profile
router.get("/edit-profile" , isAuthenticated , adminController.editProfilePage)

module.exports = router