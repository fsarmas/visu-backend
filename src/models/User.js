const mongoose = require('mongoose');
const config = require('config');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  email: {type: String, required: true, unique: true, trim: true},
  password: {type: String, required: true, trim: true},
  name: String,

}, {timestamps: true});

/*
 * Pre-save hook to encrypt password before saving.
 */
userSchema.pre('save', function save(next) {
  const user = this; // eslint-disable-line no-invalid-this

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.hash(user.password, config.get('saltingRounds'), (err, hash) => {
    if (err) {
      next(err);
    } else {
      user.password = hash;
      next();
    }
  });
});

module.exports = mongoose.model('User', userSchema);
