const mongoose = require('mongoose');
const assert = require('chai').assert;

const cardController = require('../../src/controllers/cardController.js');
const collectionController = require('../../src/controllers/collectionController.js'); // eslint-disable-line max-len

const EXAMPLES = [
  {kind: 'animal', name: 'Apodemus sylvaticus'},
  {kind: 'animal', name: 'Canis lupus'},
  {kind: 'animal', name: 'Bos primigenius taurus'},
  {kind: 'plant', name: 'Quercus ilex'},
  {kind: 'plant', name: 'Olea europaea'},
  {kind: 'rock', name: 'Andalucita'},
];

/**
 * Assert that the given objects have the same 'kind' and 'name' fields,
 * throwing an exception otherwise.
 *
 * @param   {!object} card1 the first card to compare
 * @param   {!object} card2 the second card to compare
 */
function assertEqCards(card1, card2) {
  assert.strictEqual(card1.kind, card2.kind);
  assert.strictEqual(card1.name, card2.name);
}

describe('cardController tests', function() {
  beforeEach('Delete all cards', function() {
    return cardController.deleteAll();
  });

  it('List empty', async function() {
    const result = await cardController.list();
    assert.deepEqual(result, []);
  });

  it('Create card', async function() {
    const created0 = await cardController.create(EXAMPLES[0]);
    assertEqCards(EXAMPLES[0], created0);

    const created1 = await cardController.create(EXAMPLES[1]);
    assertEqCards(EXAMPLES[1], created1);
  });

  it('List with skip and limit', async function() {
    for (const card of EXAMPLES) {
      await cardController.create(card);
    }

    const result0 = await cardController.list(0, 3);
    assert.lengthOf(result0, 3);
    for (let i = 0; i < 3; i++) {
      assertEqCards(EXAMPLES[i], result0[i]);
    }

    const result1 = await cardController.list(2, 2);
    assert.lengthOf(result1, 2);
    for (let i = 0; i < 2; i++) {
      assertEqCards(EXAMPLES[i+2], result1[i]);
    }

    const result2 = await cardController.list(4, 4);
    assert.lengthOf(result2, 2);
    for (let i = 0; i < 2; i++) {
      assertEqCards(EXAMPLES[i+4], result2[i]);
    }
  });

  it('Find by id', async function() {
    const created = await cardController.create(EXAMPLES[0]);
    const found = await cardController.findById(created._id);
    assertEqCards(created, found);

    const notFound = await cardController.findById(
        new mongoose.Types.ObjectId());
    assert.notExists(notFound);
  });

  it('Update', async function() {
    const created = await cardController.create(EXAMPLES[0]);
    const updated = await cardController.update(created._id, EXAMPLES[1]);
    assertEqCards(updated, EXAMPLES[1]);
    assert.exists(updated.id);
    assert.isOk(created._id.equals(updated._id));
  });

  it('Delete and Delete All', async function() {
    let id;
    for (let i = 0; i < EXAMPLES.length; i++) {
      const created = await cardController.create(EXAMPLES[i]);
      if (i == 0) {
        id = created._id;
      }
    }

    const result0 = await cardController.list();
    assert.lengthOf(result0, EXAMPLES.length);

    const deleted = await cardController.delete(id);
    assertEqCards(deleted, EXAMPLES[0]);
    assert.isOk(id.equals(deleted._id));

    const result1 = await cardController.list();
    assert.lengthOf(result1, EXAMPLES.length - 1);

    await cardController.deleteAll();
    const result3 = await cardController.list();
    assert.deepEqual(result3, []);
  });

  it('adds cards to collections, get cards in collection', async function() {
    const col1 = await collectionController.create({name: 'MyCollection 1'});
    const col2 = await collectionController.create({name: 'MyCollection 2'});

    const card1 = await cardController.create(EXAMPLES[0]);
    const card2 = await cardController.create(EXAMPLES[1]);

    await cardController.addToCollection(card1._id, col1._id);
    await cardController.addToCollection(card1._id, col2._id);
    await cardController.addToCollection(card2._id, col1._id);

    let found = await cardController.findById(card1._id);
    assert.lengthOf(found.collections, 2);
    assert.deepInclude(found.collections, col1._id);
    assert.deepInclude(found.collections, col2._id);

    found = await cardController.findById(card2._id);
    assert.lengthOf(found.collections, 1);
    assert.deepInclude(found.collections, col1._id);

    found = await collectionController.getCardsInCollection(col1._id);
    assert.lengthOf(found, 2);
    assert.deepInclude(found.map(e => e._id), card1._id);
    assert.deepInclude(found.map(e => e._id), card2._id);

    found = await collectionController.getCardsInCollection(col2._id);
    assert.lengthOf(found, 1);
    assert.deepInclude(found.map(e => e._id), card1._id);
  });
});

it('removes cards from collection', async function() {
  const col = await collectionController.create({name: 'MyCollection 1'});

  const card0 = await cardController.create(EXAMPLES[0]);
  const card1 = await cardController.create(EXAMPLES[1]);
  const card2 = await cardController.create(EXAMPLES[2]);

  await cardController.addToCollection(card0._id, col._id);
  await cardController.addToCollection(card1._id, col._id);
  await cardController.addToCollection(card2._id, col._id);

  let cards = await collectionController.getCardsInCollection(col._id);
  assert.lengthOf(cards, 3);

  let result = await cardController.removeFromCollection(card1._id, col._id);
  assert.isOk(result);
  cards = await collectionController.getCardsInCollection(col._id);
  assert.lengthOf(cards, 2);

  result = await cardController.removeFromCollection(card1._id, col._id);
  assert.isNotOk(result);
  cards = await collectionController.getCardsInCollection(col._id);
  assert.lengthOf(cards, 2);

  result = await cardController.removeFromCollection(card0._id, col._id);
  assert.isOk(result);
  cards = await collectionController.getCardsInCollection(col._id);
  assert.lengthOf(cards, 1);
  assertEqCards(cards[0], EXAMPLES[2]);
});

module.exports.EXAMPLES = EXAMPLES;
module.exports.assertEqCards = assertEqCards;
