// handler function
/* eslint-disable import/no-extraneous-dependencies */
const multer = require('multer'); // for uploading elements/photo
const sharp = require('sharp'); // image processing library for js
// const AppError = require('../utils/appError');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// multer storage
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

exports.uploadTourImages = upload.fields([
  // req.files
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]); // middleware function, images, imageCover in form

// if we have only single field to accept multiple photos or single photo
// upload.array('images', 5); // req.files
// upload.single('image'); // req.file

exports.resizeTourImage = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); // sharp will create an object on which we can chain multiple methods

  // 2) images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  // console.log(req.body.images);
  next();
});

// Middleware
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// const APIFeatures = require('./../utils/apiFeatures');
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();

//   // const tours = await features.query.populate('guides');
//   const tours = await features.query;
//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews'); // .populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAT',
//   // }); // Tour.findOne({ _id: req.params.id }) // used this in tourModel middleware
//   if (!tour) {
//     return next(new AppError('No Tour found with provided ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

/* // without catchAsync functions
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id); // Tour.findOne({ _id: req.params.id })
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
*/

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//   // passing next in order to pass the error in globalHandler fn
//   const newTour = await Tour.create(req.body); // call the method directly at the tour

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, // new updated document will be returned
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No Tour found with provided ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour); // this works because of javascript closers - inner function which it calling will get access to it's variable of the outer function even after outer function already returned, calling this function here return another function which will then sit here and wait until it is finally called asap we hit the corresponding routes
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No Tour found with provided ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: {
//       tour: null,
//     },
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // stages as objects
    {
      // like a filter object
      $match: { ratingsAverage: { $gte: 4.5 } }, // stage name
    },
    {
      $group: {
        // it allow to group object together using accumulator
        _id: { $toUpper: '$difficulty' }, // first thing we always need to specify is the id, this is where we will specify what to group by
        // _id: '$ratingsAverage',
        numTour: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 - asc. -1 - desc
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // deconstruct an array field from the input document and then output 2 document for each element of the array
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        // show or hide fields 0-off, 1-on
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/233/center/34.111745,-118.113491/unit/mi - standard of specify url
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // radius that we want to have as radius but converted into a special unit called radians, for radians, we need to divide our distance by the radius of the earth
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lnd.',
        400,
      ),
    );
  }
  // console.log(distance, lng, lng, unit); // 233 34.111745 -118.113491 mi
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, // [[cneter of sphere], radius in radian]
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lnd.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    // it is fail as AGGREGATION MIDDLEWARE in tourModel is the first one, not this geoNear
    {
      $geoNear: {
        // it required atleast 1 geolocation index, it will automatically take that field
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', // result in m, need to convert it into km
        distanceMultiplier: multiplier, //0.001, // divide by 1000
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
