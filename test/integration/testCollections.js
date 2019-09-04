const request = require('supertest');
const assert = require('chai').assert;

const app = require('../../src/app.js');
const hasDuplicates = require('../../src/utils.js').hasDuplicates;
const collectionController = require('../../src/controllers/collectionController.js'); // eslint-disable-line max-len
const {createAdminUser, createRegularUser, authHeader} = require('./authUtils.js'); // eslint-disable-line max-len
const {EXAMPLES: EXAMPLE_CARDS} = require('../unit/testCardController.js');

const EXAMPLES = [
  {name: 'Iberian animals'},
  {name: 'Iberian plants'},
  {name: 'Iberian funghi'},
  {name: 'Fossiles'},
  {name: 'Iberian minerals'},
  {name: 'Greenland animals'},
];

/**
 * Assert that the given objects have the same 'kind' and 'name' fields,
 * throwing an exception otherwise.
 *
 * @param   {!object} obj1 the first collection to compare
 * @param   {!object} obj2 the second collection to compare
 */
function assertEqCollections(obj1, obj2) {
  assert.strictEqual(obj1.name, obj2.name);
}

/* Helper functions (HTTP requests) */

function getCollections(token, skip, limit) {
  return request(app)
      .get('/collections')
      .query({skip, limit})
      .set(authHeader(token));
}

function postCollections(token, collection) {
  return request(app)
      .post('/collections')
      .set(authHeader(token))
      .send(collection);
}

function getCollection(token, id) {
  return request(app)
      .get(`/collections/${id}`)
      .set(authHeader(token));
}

function putCollection(token, id, collection) {
  return request(app)
      .put(`/collections/${id}`)
      .set(authHeader(token))
      .send(collection);
}

function deleteCollection(token, id) {
  return request(app)
      .delete(`/collections/${id}`)
      .set(authHeader(token));
}

function getCardsInCollection(token, collectionId) {
  return request(app)
      .get(`/collections/${collectionId}/cards`)
      .set(authHeader(token));
}

function addCardToCollection(token, cardId, collectionId) {
  return request(app)
      .post(`/collections/${collectionId}/cards/${cardId}`)
      .set(authHeader(token));
}

function postCards(token, card) {
  return request(app)
      .post('/cards')
      .set(authHeader(token))
      .send(card);
}

/*
  Tests
 */

describe('Collection API tests', function() {
  let tokenRegular;
  let tokenAdmin;

  before('Before all tests', async function() {
    tokenRegular = await createRegularUser();
    tokenAdmin = await createAdminUser();
  });

  beforeEach('Before each test', async function() {
    await collectionController.deleteAll();
  });

  it('GET collections (no auth)', function() {
    return getCollections(undefined).expect(401);
  });

  it('GET collections (regular auth)', function() {
    return getCollections(tokenRegular).expect(401);
  });

  it('GET collections (non empty)', function() {
    return Promise.all(EXAMPLES.map(u => postCollections(tokenAdmin, u)))
        .then(() => {
          return getCollections(tokenAdmin)
              .expect(200)
              .expect(res => {
                assert.isArray(res.body);
                assert.lengthOf(res.body, EXAMPLES.length);
                assert.isNotOk(hasDuplicates(res.body.map(e => e._id)));
              });
        });
  });

  it('GET collections (skip & limit)', async function() {
    for (const collection of EXAMPLES) {
      await postCollections(tokenAdmin, collection);
    }

    let all;
    await getCollections(tokenAdmin).expect(res => {
      all = res.body;
    });

    await getCollections(tokenAdmin, 0, 3).expect(200).expect(res => {
      const result = res.body;
      assert.lengthOf(result, 3);
      for (let i = 0; i < 3; i++) {
        assertEqCollections(all[i], result[i]);
      }
    });

    await getCollections(tokenAdmin, 2, 2).expect(200).expect(res => {
      const result = res.body;
      assert.lengthOf(result, 2);
      for (let i = 0; i < 2; i++) {
        assertEqCollections(all[i+2], result[i]);
      }
    });

    await getCollections(tokenAdmin, 4, 4).expect(200).expect(res => {
      const result = res.body;
      assert.lengthOf(result, 2);
      for (let i = 0; i < 2; i++) {
        assertEqCollections(all[i+4], result[i]);
      }
    });
  });

  it('POST collections (no auth)', function() {
    return postCollections(null, EXAMPLES[0]).expect(401);
  });

  it('POST collections (regular auth)', function() {
    return postCollections(tokenRegular, EXAMPLES[0]).expect(401);
  });

  it('POST collections (invalid name)', function() {
    const collection = Object.assign({}, EXAMPLES[0]);
    collection.name = [1, 2, 3];

    return postCollections(tokenAdmin, collection).expect(400);
  });

  it('POST collections (invalid - missing name)', function() {
    const collection = Object.assign({}, EXAMPLES[0]);
    delete collection.name;

    return postCollections(tokenAdmin, collection).expect(400);
  });

  it('POST collections (valid)', function() {
    return postCollections(tokenAdmin, EXAMPLES[0])
        .expect(201)
        .expect(function(res) {
          assertEqCollections(res.body, EXAMPLES[0]);
        });
  });

  it('GET a collection (no auth)', function() {
    return getCollection(null, 1).expect(401);
  });

  it('GET a collection (regular auth)', function() {
    return getCollection(tokenRegular, 1).expect(401);
  });

  it('GET a collection (nonexisting)', function() {
    return getCollection(tokenAdmin, 1).expect(404);
  });

  it('GET a collection (existing)', function() {
    let created;

    return postCollections(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => {
          return getCollection(tokenAdmin, created._id)
              .expect(200)
              .expect(res => {
                assertEqCollections(res.body, EXAMPLES[0]);
                assert.strictEqual(res.body._id, created._id);
              });
        });
  });

  it('PUT a collection (no auth)', function() {
    return putCollection(null, 1, EXAMPLES[0]).expect(401);
  });

  it('PUT a collection (regular auth)', function() {
    return putCollection(tokenRegular, 1, EXAMPLES[0]).expect(401);
  });

  it('PUT a collection (nonexisting)', function() {
    return putCollection(tokenAdmin, 1, EXAMPLES[0]).expect(404);
  });

  it('PUT a collection (invalid name)', function() {
    let created;

    return postCollections(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => {
          created.name = [1, 2, 3];
          return putCollection(tokenAdmin, created._id, created).expect(400);
        });
  });

  it('PUT a collection (valid)', function() {
    const original = Object.assign({}, EXAMPLES[0]);

    return postCollections(tokenAdmin, original)
        .expect(201)
        .expect(res => original._id = res.body._id)
        .then(() => {
          // Modified object without ID
          const mod1 = Object.assign({}, EXAMPLES[1]);

          // Modified object with same ID
          const mod2 = Object.assign({}, EXAMPLES[2]);
          mod2.id = original._id;

          // Modified object with different ID
          const mod3 = Object.assign({}, EXAMPLES[3]);
          mod3.id = 1234;

          return Promise.all([mod1, mod2, mod3].map(modified => {
            return putCollection(tokenAdmin, original._id, modified)
                .expect(200)
                .expect(res => {
                  assert.strictEqual(res.body._id, original._id);
                  assertEqCollections(res.body, modified);
                });
          }));
        });
  });

  it('DELETE a collection (no auth)', function() {
    return deleteCollection(null, 1).expect(401);
  });

  it('DELETE a collection (regular auth)', function() {
    return deleteCollection(tokenRegular, 1).expect(401);
  });

  it('DELETE a collection (nonexisting)', function() {
    return deleteCollection(tokenAdmin, 1).expect(404);
  });

  it('DELETE a collection (existing)', function() {
    let created;

    return postCollections(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => deleteCollection(tokenAdmin, created._id).expect(200)
            .expect(res => {
              assertEqCollections(created, res.body);
            }))
        .then(() => getCollection(tokenAdmin, created._id).expect(404));
  });

  it('Add/Remove cards to a collection', async function() {
    let collection;
    let card0;
    let card1;

    await postCollections(tokenAdmin, EXAMPLES[0]).then(res => {
      collection = res.body;
    });
    await postCards(tokenAdmin, EXAMPLE_CARDS[0]).then(res => {
      card0 = res.body;
    });
    await postCards(tokenAdmin, EXAMPLE_CARDS[1]).then(res => {
      card1 = res.body;
    });

    await addCardToCollection(tokenAdmin, card0._id, collection._id)
        .expect(200);

    await addCardToCollection(tokenAdmin, card1._id, collection._id)
        .expect(200);

    await getCardsInCollection(tokenAdmin, collection._id)
        .expect(200)
        .expect(res => {
          assert.lengthOf(res.body, 2);
        });

    let created;
    await postCollections(tokenAdmin, EXAMPLES[0])
        .then(res => created = res.body);

    return getCollection(tokenAdmin, created._id)
        .expect(200)
        .expect(res => {
          assertEqCollections(res.body, EXAMPLES[0]);
          assert.strictEqual(res.body._id, created._id);
        });
  });
});
