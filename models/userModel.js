const crypto = require('crypto'); // built-in cypto node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, // not a validator, transform the email to lower case
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        // el - passwordConfirm, only going to work on CREATE and SAVE!!!
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAT: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// document Mongoose middle
// related to encypt password
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hashing/Encyption with cost of 12
  this.password = await bcrypt.hash(this.password, 12); // password, salt - pass cost parameter (how intensive the cpu operation is going to be)

  // delete passwordconfirm
  this.passwordConfirm = undefined; // why this work - it is a required input, not required to be persisted in database
  next();
});

// related to encypt password
userSchema.pre('save', function (next) {
  // if user update the password
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAT = Date.now() - 10000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// instance method - methods will be available on all documents of a certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userpassword,
) {
  return await bcrypt.compare(candidatePassword, userpassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // console.log('->', JWTTimestamp, this.passwordChangedAT); // 2024-03-16T00:00:00.000Z 1710596947
  if (this.passwordChangedAT) {
    const changedTimestamp = parseInt(
      this.passwordChangedAT.getTime() / 1000,
      10,
    ); //parseInt(time in millisecond/1000, base)

    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  // false means password not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // (no. of characters).(convert to hexadecimal string)

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken); // logging as an object so it will tell variable name along with it's value, this will not log as an object way, { resetToken: 'b90c9457454ffed1366bb2ccd62517cce9cdf3afceec46b243ca16f55635b7d1' } 70fbb1bc90e41735d10a26ce97ad31f6362f173c5829e789460f9957b0077a0b
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // min * second * millisecond

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
