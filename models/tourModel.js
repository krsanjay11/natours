const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // also specified array, validators
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal to 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],// use external library for validation
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // setter run each time a new value is set, 4.6666666 -> 46.6666666 -> 47 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // caveats/limits: this keyword only points to current doc on NEW document creation, not updates
        validator: function (val) {
          return val < this.price; // return bool
        },
        message: `Discount price ({VALUE}) should be below the regular price`, // not js syntax but mongoose
      },
    },
    summary: {
      type: String,
      trim: true, // remove extra space from start and end will be removed
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
      trim: true,
    },
    images: [String], // an array of string
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON, embedded object
      type: {
        // each of these sub-fields is then get its own schema type options
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // coordinates of points, lng, lat
      address: String,
      description: String,
    },
    locations: [
      // array of objects
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, // for embedded documents
    guides: [
      // for referencing documents
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
); // pass schema as an object, Schema(schema defination, options)

// tourSchema.index({ price: 1 }); // single field index
tourSchema.index({ slug: 1 }); // single field index
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound field index
tourSchema.index({ startLocation: '2dsphere' }); // 2d - plane or 2dsphere - earth like sphere index

tourSchema.virtual('durationWeeks').get(function () {
  // used regular function as arrow function will not get its this keyword
  // it will be created each time when we get data out of the database, get -> getter
  return this.duration / 7; // this is pointing to the current document
});

// virtual populate -populate tours with reviews, connect to model
tourSchema.virtual('reviews', {
  ref: 'Review', // name of the model
  foreignField: 'tour', // reference to current model is stored
  localField: '_id',
});

// DOCUMENT MIDDLEWARE
// we define middleware on the schema
tourSchema.pre('save', function (next) {
  // Runs before .save and .create command, not on .insert command
  // (hook, callback function)
  // it will run before an actual event
  this.slug = slugify(this.name, { lower: true }); // point to currently processed document
  next(); // not required if only 1 mongoose middleware used
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAT',
  });
  next();
});

// // to get embedded documents in mongodb
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', (next) => {
//   // middleware for the same hook
//   console.log('will save document...');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next(); // option, best practice to call
// });

// QUERY MIDDLEWARE - This keyword now points to current query, not document
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  // run for every hook that contain find keyword using regular expression
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now(); // clog to measure how much time it took
  // this.find({ secretTour: true });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  // console.log(`Query took ${Date.now() - this.start} milliseconds!`); // Query took 468 milliseconds! // useful
  next();
});

// AGGREGATION MIDDLEWARE
// this is going to point to current aggregation object
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // console.log(this.pipeline());
//   console.log(this);

//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // modelName, schema ; convention to always use upper case for model names

module.exports = Tour;

// testing creating documents
// creating a new document out of Tour model or function constructor, using the model, it has a couple of methods that help us to interact with model
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save() // we can the methdod in the new document
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 🔴:', err);
//   });
