const mongoose = require('mongoose');
const assert = require('chai').assert;

const cardController = require('../../src/controllers/cardController.js');

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
});

module.exports.EXAMPLES = EXAMPLES;
module.exports.assertEqCards = assertEqCards;
