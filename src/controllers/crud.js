const mongoose = require('mongoose');

module.exports = (MyModel) => {
  if (!(MyModel.prototype instanceof mongoose.Model)) {
    throw new Error('MyModel must be a mongoose.Model');
  }

  return {

    /**
     * Fill this array with the properties that can't be updated by using the
     * update method.
     *
     * @type {Array}
     */
    nonUpdatable: [],

    /**
     * Gets a subset of all the elements stored in database.
     *
     * @param {number} skip if provided, skip this amount of elements before the
     * first one returned
     * @param {number} limit if provided, return at most this number of elements
     *
     * @returns {!Promise<!Array<object>>} fulfills with a (possibly empty)
     * array containing a subset of elements in database
     */
    list(skip, limit) {
      return MyModel.find(null, null, {skip, limit}).lean().exec();
    },

    /**
     * Gets the element matching the given ID from database.
     *
     * @param {string} id element ID to match
     *
     * @returns {!Promise<?object>} fulfills with the element matching the
     * given ID, or 'undefined' if such a element is not found
     */
    findById(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return Promise.resolve(undefined);
      }

      return MyModel.findById(id).lean().exec();
    },

    /**
     * Creates an element in database with the given fields.
     *
     * @param {!object} element contains the fields to create a mongoose
     * document of type  MyModel to be stored in database
     *
     * @returns {!Promise<!object>} fulfills with the saved element
     */
    async create(element) {
      const doc = new MyModel(element);
      const created = await doc.save();
      return created.toObject();
    },

    /**
     * Updates the element in dabase with the given ID using the given
     * replacement data. TODO: Document 'undefined' values.
     *
     * @param {string} id Unique ID of the element to update
     * @param {!object} update contains key-value pairs representing the fields
     * to update
     *
     * @returns {!Promise<!object>} fulfills with the updated element
     * @throws {Error} If id does not represent a valid ObjectId
     * @throws {Error} If update is not an object
     * @throws {Error} If an element with the given id is not found
     */
    async update(id, update) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`invalid arg id: ${id}`);
      }
      if (!(typeof update == 'object')) {
        throw new Error(`invalid arg update: ${update}`);
      }

      const found = await MyModel.findById(id);
      if (!found) {
        const error = new Error(`id ${id} not found`);
        error.status = 404;
        throw error;
      }

      const ommit = ['_id', '__v', 'createdAt', 'updatedAt',
        ...this.nonUpdatable];

      for (const key in update) {
        if (!ommit.includes(key) && MyModel.schema.path(key)) {
          found[key] = update[key];
        }
      }

      return found.save();
    },

    /**
     * Deletes the element matching the given ID from database.
     *
     * @param {string} id Unique ID of the element to delete
     *
     * @returns {!Promise<?object>} fulfills with the deleted element, or
     * undefined if not found
     *
     * @throws {Error} If the given ID does not represent a valid ObjectId
     */
    delete(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid id: ' + id);
      }
      return MyModel.findByIdAndRemove(id).lean().exec();
    },

    /**
     * Deletes all elements from database.
     *
     * @returns {!Promise<undefined>} fulfills without a value when all elements
     * are deleted
     */
    deleteAll() {
      return MyModel.deleteMany({}).lean().exec();
    },

  };
};


