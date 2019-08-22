const mongoose = require('mongoose');
const config = require('config');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  email: {type: String, required: true, unique: true, trim: true},
  password: {type: String, required: true, trim: true},
  name: String,
  level: String,

}, {timestamps: true});

/*
 * Pre-save hook to encrypt password before saving.
 */
userSchema.pre('save', function(next) {
  const user = this; // eslint-disable-line no-invalid-this

  user.level = undefined; // level cannot be stored on creation

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

/**
 * Verifies that the given hash was generated from the given password.
 *
 * @param {string} password unencrypted password to verify
 * @param {string} hash encrypted hash to match
 * @returns {Promise} resolves to true if the hash matches the password;
 * resolves to false otherwise
 */
userSchema.statics.verifyPassword = function(password, hash) {
  return bcrypt.compare(password, hash);
};

module.exports = mongoose.model('User', userSchema);
