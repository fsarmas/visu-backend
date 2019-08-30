const User = require('../../src/models/user');
const controllerCRUD = require('./crud.js');

const nonUpdatable = ['email', 'password', 'level'];

/**
 * Gets the user matching the given email from database.
 *
 * @param {string} email user email to match
 *
 * @returns {!Promise<?User>} fulfills with the user matching the given email,
 * or 'undefined' if such a user was not found
 */
function findByEmail(email) {
  if (!email) {
    throw new Error('email is required');
  }

  return User.findOne({email}).lean().exec();
}

/**
 * Verifies that the given hash was generated from the given password.
 *
 * @param {string} password unencrypted password to verify
 * @param {string} hash encrypted hash to match
 *
 * @returns {Promise} resolves to true if the hash matches the password;
 * resolves to false otherwise
 */
function verifyPassword(password, hash) {
  return User.verifyPassword(password, hash);
}

/**
 * Sets the 'level' of the given object in database to value 'admin'.
 *
 * @param {string} id Unique ID of the user to update
 *
 * @returns {!Promise<?User>} fulfills with the updated user, or 'undefined' if
 * such a user was not found
 */
async function makeAdmin(id) {
  const result = await User.findOneAndUpdate(
      {_id: id},
      {level: 'admin'},
      {new: true, runValidators: true},
  );
  return result ? result.toObject() : undefined;
}

module.exports = {
  ...controllerCRUD(User),
  nonUpdatable,
  findByEmail,
  verifyPassword,
  makeAdmin,
};
