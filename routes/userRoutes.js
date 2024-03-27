const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
// const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// const upload = multer({ dest: 'public/img/users' }); // use upload to create a middleware function that we can put it in updateMe route

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// middleware for router – Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
// router.patch('/updateMe', upload.single('photo'), userController.updateMe); // photo is the name of the field that holds image
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
); // photo is the name of the field that holds image
router.delete('/deleteMe', userController.deleteMe);

// Restrict all routes after this middleware to admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
