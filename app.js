/* eslint-disable import/no-extraneous-dependencies */
// configure our application
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const GlobalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); // express adds bunch of method to our app variable

// tell express what template engine we will use, express supports most common engines, we don't need to install or require pug, it will happen begind the scenes internally in express, our pug templates called views in express
app.set('view engine', 'pug');
// app.set('views', './views'); //'./views' - the path we provide here is always relative to the directive from where we launch our node application
app.set('views', path.join(__dirname, 'views')); // we can use path module, so path is a build in node module which is used to manipulate the path name, path.join will add /

// 1) Global Middlewares
// Serving static files
// app.use(express.static(`${__dirname}/public`)); // give direct access to static resource/folder which can we access by browser
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(`${__dirname}/controllers`));

// Set SECURITY HTTP Headers
app.use(helmet()); // calling a function, return a function, then it will be sitting here until it called
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", 'https:', 'http:', 'unsafe-inline'],
    },
  }),
);

// development logging
console.log(process.env.NODE_ENV, 'env');
if (process.env.NODE_ENV === 'development') {
  // console.log('you are in', process.env.NODE_ENV, 'env');
  app.use(morgan('dev')); // 3rd party middleware help in login, logger -> GET /api/v1/tours/22 404 4.694 ms - 40
}

// limit request from same IP
// limiter we created is now a middleware function - allow 100 request from same IP in 1 hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too Many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // affect all the routes

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // middleware - a function that can modify the incoming request data, stands in middele or between of a request and response, a step that request go through while it is been processed, here data from the body is added to request object, can accept upto 10 kb
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // add form name into body of req
app.use(cookieParser()); // parses the data from cookie

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // look at the request body, request query string and req.params, filterout all of the $ and .(dots)

// DATA sanitization against XSS
app.use(xss()); // clean any user input from malacious html, js code

// prevent http parameter pollution
// app.use(hpp()); // clear up the query string, after hpp, using last parameter
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // allow few duplicates in query string
  }),
); // wide list parameters

// Test Middleware
// create our own middleware function, define a middleware, apply to below functions only, not above functions, order matters in express
// app.use((req, res, next) => {
//   console.log('Hello from the middle ware 😯');
//   next();
// });

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(x); // error in middleware
  // console.log(req.cookies); // {    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjOGExZTFhMmY4ZmI4MTRiNTZmYTE4MiIsImlhdCI6MTcxMTI3MzMxNiwiZXhwIjoxNzE5MDQ5MzE2fQ.ukZ6s7e5Km22XSjlELLm8elVVGT4a0LxPl5O8rlJcbM'}
  next();
});

// uncaught exceptions
// console.log(x);

// TO pug files
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Sanjay', // variable here will called locals in pub files
//   }); // it will render the template with the name we pass in
// });

// 3) mounting the router - connect tourRouter, userRouter with our application
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // middleware
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error handling middleware - express recognize it with 4 args
app.use(GlobalErrorHandler);

// 4) Start server
module.exports = app;
