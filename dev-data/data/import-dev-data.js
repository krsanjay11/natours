const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config({ path: './config.env' }); // load config variables

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB, {}).then(() => console.log('DB connection successful!'));

// READ JSON FILE
// const tours = JSON.parse(
//   // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
//   fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'),
// ); // ./ - home folder where node application is started, __dirname
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// IMPORT DATA TO DB
// password is already encrypted, so comment out few lines in userModel.js - related to encypt password
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); // password for all users "test1234"
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // stop program
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv); // show CLI command details
//[
//   'C:\\Program Files\\nodejs\\node.exe',
//   'E:\\Programs\\Backend Development\\jonas\\complete node bootcamp\\4-natours\\starter\\dev-data\\data\\import-dev-data.js'
// '--import'
// ]

// CLI cmd
// node .\dev-data\data\import-dev-data.js
// node .\dev-data\data\import-dev-data.js –delete
// node .\dev-data\data\import-dev-data.js --import
