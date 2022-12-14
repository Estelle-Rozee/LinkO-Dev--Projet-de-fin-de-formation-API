/** **** */
/*  USER */
/** **** */
const { Router } = require("express");
const userController = require('../controllers/userController');

// Middleware auth for JWT authorization
const auth = require("./../middleware/authMiddleware");

/* Middleware to validate the body of requests */ 
const {validateBody} = require('../middleware/validation/validation.js');
// Schemas definition
const schemas = require("../middleware/validation/schemas");

const router = new Router();

// All routes that begin with '/me' need a token
router.use(auth);

 /**
  * GET /me
  * @summary Get details of the user connected
  * @tags User
  * @security BearerAuth
  * @return {userResponse} 200 - success response, details of the user - application/json 
  * @example response - 200 - User details
  * {
  *     "firstname" : "Prénom",
  *     "lastname" : "Nom",
  *     "email" : "example1@domain.com"
  * }
  */
router.get('/', userController.getUser);

/**
  * PUT /me
  * @summary Update details of the user connected
  * @tags User
  * @security BearerAuth
  * @param {updateUserForm} request.body - Body request
  * @return {string} 200 - success response - application/json 
  * @example request - All
  * {
  *   "email" : "example1@domain.com",
  *   "password" : "Example1234",
  *   "update": {
  *     "firstname" : "Prénom",
  *     "lastname" : "Nom",
  *     "email" : "example2@domain.com",
  *     "password": "Example12345",
  *     "confirmPassword": "Example12345"
  *   }
  * }
  * @example request - New email
  * {
  *   "email" : "example1@domain.com",
  *   "password" : "Example1234",
  *   "update": {"email": "example2@domain.com"}
  * }
  * @example request - New password
  * {
  *   "email" : "example1@domain.com",
  *   "password" : "Example1234",
  *   "update": {
  *     "password": "Example12345",
  *     "confirmPassword": "Example12345"
  *   }
  * }
  * @example request - New name
  * {
  *   "email" : "example1@domain.com",
  *   "password" : "Example1234",
  *   "update": {
  *     "firstname" : "Prénom",
  *     "lastname" : "Nom"
  *   }
  * }
  * 
  */
router.put('/', validateBody(schemas.updateUserForm),userController.updateUser);


 /**
  * DELETE /me
  * @summary Delete the user connected
  * @tags User
  * @security BearerAuth
  * @return {successResponse} 200 - success response, user deleted - application/json 
  */
router.delete('/', userController.deleteUser);

/**
  * GET /me/posts
  * @summary Get all posts of the user connected
  * @tags User
  * @security BearerAuth
  * @return {array<Post>} 200 - success response - application/json 
  */
router.get('/posts', userController.getAlluserPosts);

 /**
  * POST /me/posts
  * @summary Add post to the favorites of the user connected
  * @tags User
  * @security BearerAuth
  * @param {BodyNewPost|BodyOldPost} request.body - Body of the post request to add a post to an user
  * @return {successResponse} 200 - success response - application/json 
  * @example request - Old post
  * {
  *   "postId" : 1
  * }
  * @example request - New post
  * {
  * "introductionId" : 1,
  * "bodyId" : 1,
  * "conclusionId" : 1
  * }
  */
router.post('/posts',validateBody(schemas.bodyAddPost), userController.addPost);

 /**
  * DELETE /me/posts/{postId}
  * @summary Delete one post of favorites
  * @tags User
  * @param {number} postId.path - Id of the post
  * @security BearerAuth
  * @return {successResponse} 200 - success response, user deleted - application/json 
  */
router.delete('/posts/:postId', userController.deletePost);

module.exports = router;
