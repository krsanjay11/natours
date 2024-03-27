/* eslint-disable import/no-extraneous-dependencies */
const multer = require('multer'); // for uploading elements/photo
const sharp = require('sharp'); // image processing library for js
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// multer storage
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // destination here is a call back function
//     cb(null, 'public/img/users'); // error- we can set to null, destincation
//   },
//   filename: (req, file, cb) => {
//     // user - userid - current timestamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage(); // image will store as a buffer

// multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}); // use upload to create a middleware function that we can put it in updateMe route

exports.uploadUserPhoto = upload.single('photo'); // middleware function, name in form

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); // sharp will create an object on which we can chain multiple methods
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts password data
  // console.log(req.file);
  // {
  //   fieldname: 'photo',
  //   originalname: 'leo.jpg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   destination: 'public/img/users',
  //   filename: '1a4b61b8e9b4bd1ca58319b37fc3392a',
  //   path: 'public\\img\\users\\1a4b61b8e9b4bd1ca58319b37fc3392a',
  //   size: 207078
  // }
  // console.log(req.body);
  // [Object: null prototype] { name: 'leo j. gillespie' }
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }); // new - return updated object, explicitly mentioned runValidator to check validation for all fields
  // user.name = 'sanjay';
  // await user.save(); // require password and confirm password

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Soft delete
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not defined! please use /signup instead',
  });
};

// Do Not update passwords with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'err',
//     message: 'This route is not yet defined!',
//   });
// };
