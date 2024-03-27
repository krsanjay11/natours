const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router(); // this new moduler router is a real middleware, it's like a small sub app for each of the resource

// Nested routes
// POST /tour/tourId/reviews
// GET /tour/tourId/reviews
// Get /tour/tourId/reviews/reviewId
// const reviewController = require('./../controllers/reviewController');
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   ); // need to use nested routes with express

// mounting a review router
// reviewRouter is not having access to tourId params, turn on mergeParam in reviewRoutes
router.use('/:tourId/reviews', reviewRouter); // a router itself is really a middleware, redirect to reviewRouter

// param middleware, since this middle ware is only specified on this router, it is only part of this middleware stack/ sub-application if we are actually inside of this sub-application
// router.param('id', tourController.checkId); // tourController old code

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // prefill some of the fields

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-24,45&unit=miles - we can also use query strings
// /tours-within/233/center/-24,45/unit/miles - standard of specify url

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  // .get(authController.protect, tourController.getAllTours)
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
// .post(tourController.checkBody, tourController.createTour); // middleaware, route-handler(function)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImage,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
