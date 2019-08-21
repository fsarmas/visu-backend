const User = require('../../src/models/user');
const mongoose = require('mongoose');

module.exports = {

  /**
   * Gets all the users in database.
   *
   * @returns {!mongoose.Query<!Array<User>>} exec or then to get a promise
   * which resolves to a (possibly empty) array containing all users stored in
   * database
   */
  list() {
    return User.find();
  },

  /**
   * Gets the user matching the given ID from database.
   *
   * @param {string} id user ID to match
   * @returns {!mongoose.Query<?User>} exec or then to get a promise which
   * resolves to the user matching the given ID, or 'undefined' if no user is
   * found
   */
  findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Promise.resolve(undefined);
    }

    return User.findById(id);
  },

  /**
   * Creates a user in database with the given fields.
   *
   * @param {!object} user contains the fields to create a User that is stored
   * in database
   * @returns {!Promise<!User>} resolves with the user saved.
   */
  create(user) {
    const userDocument = new User(user);
    return userDocument.save();
  },

  /**
   * Updates the user in dabase with the given ID using the given replacement
   * data. Email, password, level and internal database fields cannot be changed
   * and are ignored if present in update object. Update keys whose value is
   * undefined are removed from the object.
   *
   * @param {string} id Unique ID of the user to update
   * @param {!object} update contains key-value pairs representing the user
   * updates
   * @returns {!mongoose.Query<!User>} exec or then to get a promise which
   * resolves to the updated user.
   */
  update(id, update) {
    const cleanUpdates = {};

    for (const key in update) {
      if (key.includes('$')) {
        continue;
      }
      if (['_id', '__v', 'createdAt', 'updatedAt', 'email', 'password', 'level']
          .includes(key)) {
        continue;
      }
      cleanUpdates[key] = update[key];
    }

    return User.findOneAndUpdate(
        {_id: id},
        cleanUpdates,
        {new: true, runValidators: true, omitUndefined: true},
    );
  },

  /**
   * Deleted the user matching the given ID from database.
   *
   * @param   {string} id Unique ID of the user to delete
   * @returns {!mongoose.Query<?User>} exec or then to get a promise which
   * resolves to the deleted user, or undefined if not found.
   * @throws {Error} If the given ID does not represent a valid ObjectId
   */
  delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('invalid id: ' + id);
    }
    return User.findByIdAndRemove(id);
  },

  /**
   * Deletes all users from database.
   *
   * @returns {!mongoose.Query<undefined>} exec or then to get a promise which
   * resolves when all users are deleted.
   */
  deleteAll() {
    return User.deleteMany({});
  },

  /**
   * Sets the 'level' of the given object in database to value 'admin'.
   *
   * @param   {string} id Unique ID of the user to update
   * @returns {!mongoose.Query<!User>} exec or then to get a promise which
   * resolves to the updated user.
   */
  makeAdmin(id) {
    return User.findOneAndUpdate(
        {_id: id},
        {level: 'admin'},
        {new: true, runValidators: true},
    );
  },

};
