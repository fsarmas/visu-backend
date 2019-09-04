const Collection = require('../models/Collection.js');
const Card = require('../../src/models/Card.js');

const controllerCRUD = require('./crud.js');

/**
 * Gets the list of cards that belong to the given collection
 *
 * @param {string} collectionId Unique ID of the collection to find cards in
 *
 * @returns {Promise<Array<object>>} Fulfills with a (possibly empty) array
 * containing all the cards that belong to the collection with given ID.
 */
async function getCardsInCollection(collectionId) {
  return Card.find({collections: collectionId}).lean().exec();
}

module.exports = {
  ...controllerCRUD(Collection),
  getCardsInCollection,
};
