const mongoose = require('mongoose');
const Card = require('../../src/models/Card.js');

module.exports = {

  /**
   * Gets a subset of all the cards stored in database.
   *
   * @param {number} skip if provided, skip this amount of cards before the
   * first one returned
   * @param {number} limit if provided, return at most this number of cards
   *
   * @returns {!Promise<!Array<Card>>} resolves to a (possibly empty) array
   * containing a subset of cards in database
   */
  list(skip, limit) {
    return Card.find(null, null, {skip, limit}).lean().exec();
  },

  /**
   * Gets the card matching the given ID from database.
   *
   * @param {string} id card ID to match
   *
   * @returns {!Promise<?Card>} resolves to the card matching the given ID, or
   * 'undefined' such a card is not found
   */
  findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Promise.resolve(undefined);
    }

    return Card.findById(id).lean().exec();
  },

  /**
   * Creates a card in database with the given fields.
   *
   * @param {!object} card contains the fields to create a Card that to be
   * stored in database
   *
   * @returns {!Promise<!Card>} resolves with the saved card
   */
  async create(card) {
    const cardDocument = new Card(card);
    const created = await cardDocument.save();
    return created.toObject();
  },

  /**
   * Updates the card in dabase with the given ID using the given replacement
   * data. TODO: Document 'undefined' values.
   *
   * @param {string} id Unique ID of the card to update
   * @param {!object} update contains key-value pairs representing the updates
   *
   * @returns {!Promise<!Card>} resolves to the updated card
   */
  async update(id, update) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`invalid arg id: ${id}`);
    }
    if (!(typeof update == 'object')) {
      throw new Error(`invalid arg update: ${update}`);
    }

    const card = await Card.findById(id);
    if (!card) {
      const error = new Error(`id ${id} not found`);
      error.status = 404;
      throw error;
    }

    for (const key in update) {
      if (Card.schema.path(key)) { // TODO: Avoid updating ID
        card[key] = update[key];
      }
    }

    return card.save();
  },

  /**
   * Deletes the card matching the given ID from database.
   *
   * @param {string} id Unique ID of the card to delete
   *
   * @returns {!Promise<?Card>} resolves to the deleted card, or undefined if
   * not found
   *
   * @throws {Error} If the given ID does not represent a valid ObjectId
   */
  delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('invalid id: ' + id);
    }
    return Card.findByIdAndRemove(id).lean().exec();
  },

  /**
   * Deletes all cards from database.
   *
   * @returns {!Promise<undefined>} resolves without a value when all cards are
   * deleted
   */
  deleteAll() {
    return Card.deleteMany({}).lean().exec();
  },

};
