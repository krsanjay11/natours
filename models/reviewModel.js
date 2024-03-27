const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 3,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// mongoose Middleware
reviewSchema.pre(/^find/, function (next) {
  // this.populate('user tour');
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// static methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]); // this points to current model, need to call aggregate on model directly
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 3,
    });
  }
};
// need to call above method
reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour); // this is point to model, constructor is a model who created this document
  // Review.calcAverageRatings(this.tour); // it is not yet defined
  // next(); // post middleware does not get access to next. it is not on post middleware
});

// we don't have document middleware for below hooks but only query middle, and in query we don't have direct access to document in order use this.constructor like we have in save
// findByIdAndUpdate, findByIdAndDelete
// going to implement pre-middleware for these hooks to work, we can use findOneAndUpdate and delete hooks
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // const r = await this.findOne();
  this.r = await this.model.findOne(this.getQuery());
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // const r = await this.findOne();
  // await this.findOne(); doesn't work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
  // next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
