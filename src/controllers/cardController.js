const mongoose = require('mongoose');

const Card = require('../../src/models/Card.js');
const controllerCRUD = require('./crud.js');

/**
 * Adds the card with given cardId to the collection with given collectionId.
 *
 * @param {string} cardId Unique ID of the card to add to the collection
 * @param {string} collectionId Unique ID of the collection where the card is
 * added.
 *
 * @returns {Promise<boolean>} Fulfills with true if the card was added to the
 * collection or false if the card was already part of the collection
 */
async function addToCollection(cardId, collectionId) {
  const collectionOID = collectionId instanceof mongoose.Types.ObjectId ?
      collectionId :
      new mongoose.Types.ObjectId(collectionId);

  const card = await Card.findById(cardId);
  if (!card) {
    const error = new Error('Card not found');
    error.status = 404;
    throw error;
  }

  if (card.collections.includes(collectionOID)) {
    return false;
  }

  card.collections.push(collectionOID);
  await card.save();
  return true;
}

/**
 * Removes the card with given cardId from the collection with given
 * collectionId.
 *
 * @param {string} cardId Unique ID of the card to remove from the collection
 * @param {string} collectionId Unique ID of the collection the card is
 * removed from.
 *
 * @returns {Promise<boolean>} Fulfills with true if the card was removed from
 * the collection or false if the card was not part of the collection
 */
async function removeFromCollection(cardId, collectionId) {
  const collectionOID = collectionId instanceof mongoose.Types.ObjectId ?
      collectionId :
      new mongoose.Types.ObjectId(collectionId);

  const card = await Card.findById(cardId);
  const index = card.collections.indexOf(collectionOID);

  if (-1 == index) {
    return false;
  }

  card.collections.splice(index, 1);
  await card.save();
  return true;
}

module.exports = {
  ...controllerCRUD(Card),
  addToCollection,
  removeFromCollection,
};

