/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// caught uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
}); // listening to event

dotenv.config({ path: './config.env' }); // load config variables

// console.log(app.get('env')); // development, this is set by express
// console.log(process.env); // this comes from process core module, it is available everywhere

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
// http://127.0.0.1:3000/

// Global unhandled rejection - for promises
process.on('unhandledRejection', (err) => {
  // safety net
  console.log('UNHANDLED REJECTION!! Shutting down...');
  // console.log(err);
  console.log(err.name, err.message); // MongoServerError bad auth : authentication failed
  // process.exit(1); // 0 - success, 1 - uncaught exception, ABRUPTLY ending the program, immediately abort all the request that currently running or pending
  server.close(() => {
    process.exit(1); // optional to crash the server
  }); // to give the server some time to finish all the request that are pending, after that server will be killed -  to shut gracefully
});

// uncaught exceptions
// console.log(x);
