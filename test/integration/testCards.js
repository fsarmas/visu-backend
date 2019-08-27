const request = require('supertest');
const assert = require('chai').assert;

const app = require('../../src/app.js');
const hasDuplicates = require('../../src/utils.js').hasDuplicates;
const {EXAMPLES, assertEqCards} = require('../unit/testCardController.js');
const {createAdminUser, createRegularUser, authHeader}
    = require('./authUtils.js');

/* Helper functions (HTTP requests) */

function getCards(token) {
  return request(app)
      .get('/cards')
      .set(authHeader(token));
}

function postCards(token, card) {
  return request(app)
      .post('/cards')
      .set(authHeader(token))
      .send(card);
}

function getCard(token, id) {
  return request(app)
      .get(`/cards/${id}`)
      .set(authHeader(token));
}

function putCard(token, id, card) {
  return request(app)
      .put(`/cards/${id}`)
      .set(authHeader(token))
      .send(card);
}

function deleteCard(token, id) {
  return request(app)
      .delete(`/cards/${id}`)
      .set(authHeader(token));
}

/*
  Tests
 */

describe('Card API tests', function() {
  let tokenRegular;
  let tokenAdmin;

  before('Before all tests', async function() {
    tokenRegular = await createRegularUser();
    tokenAdmin = await createAdminUser();
  });

  it('GET cards (no auth)', function() {
    return getCards(undefined).expect(401);
  });

  it('GET cards (regular auth)', function() {
    return getCards(tokenRegular).expect(401);
  });

  it('GET cards (non empty)', function() {
    return Promise.all(EXAMPLES.map(u => postCards(tokenAdmin, u)))
        .then(() => {
          return getCards(tokenAdmin)
              .expect(200)
              .expect(res => {
                assert.isArray(res.body);
                assert.lengthOf(res.body, EXAMPLES.length);
                assert.isNotOk(hasDuplicates(res.body.map(e => e._id)));
              });
        });
  });

  it('POST cards (no auth)', function() {
    return postCards(null, EXAMPLES[0]).expect(401);
  });

  it('POST cards (regular auth)', function() {
    return postCards(tokenRegular, EXAMPLES[0]).expect(401);
  });

  it('POST cards (invalid name)', function() {
    const card = Object.assign({}, EXAMPLES[0]);
    card.name = [1, 2, 3];

    return postCards(tokenAdmin, card).expect(400);
  });

  it('POST cards (invalid - missing name)', function() {
    const card = Object.assign({}, EXAMPLES[0]);
    delete card.name;

    return postCards(tokenAdmin, card).expect(400);
  });

  it('POST cards (valid)', function() {
    return postCards(tokenAdmin, EXAMPLES[0])
        .expect(201)
        .expect(function(res) {
          assertEqCards(res.body, EXAMPLES[0]);
        });
  });

  it('GET a card (no auth)', function() {
    return getCard(null, 1).expect(401);
  });

  it('GET a card (regular auth)', function() {
    return getCard(tokenRegular, 1).expect(401);
  });

  it('GET a card (nonexisting)', function() {
    return getCard(tokenAdmin, 1).expect(404);
  });

  it('GET a card (existing)', function() {
    let created;

    return postCards(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => {
          return getCard(tokenAdmin, created._id)
              .expect(200)
              .expect(res => {
                assertEqCards(res.body, EXAMPLES[0]);
                assert.strictEqual(res.body._id, created._id);
              });
        });
  });

  it('PUT a card (no auth)', function() {
    return putCard(null, 1, EXAMPLES[0]).expect(401);
  });

  it('PUT a card (regular auth)', function() {
    return putCard(tokenRegular, 1, EXAMPLES[0]).expect(401);
  });

  it('PUT a card (nonexisting)', function() {
    return putCard(tokenAdmin, 1, EXAMPLES[0]).expect(404);
  });

  it('PUT a card (invalid name)', function() {
    let created;

    return postCards(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => {
          created.name = [1, 2, 3];
          return putCard(tokenAdmin, created._id, created).expect(400);
        });
  });

  it('PUT a card (valid)', function() {
    const original = Object.assign({}, EXAMPLES[0]);

    return postCards(tokenAdmin, original)
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
            return putCard(tokenAdmin, original._id, modified)
                .expect(200)
                .expect(res => {
                  assert.strictEqual(res.body._id, original._id);
                  assertEqCards(res.body, modified);
                });
          }));
        });
  });

  it('DELETE a card (no auth)', function() {
    return deleteCard(null, 1).expect(401);
  });

  it('DELETE a card (regular auth)', function() {
    return deleteCard(tokenRegular, 1).expect(401);
  });

  it('DELETE a card (nonexisting)', function() {
    return deleteCard(tokenAdmin, 1).expect(404);
  });

  it('DELETE a card (existing)', function() {
    let created;

    return postCards(tokenAdmin, EXAMPLES[0])
        .expect(res => created = res.body)
        .then(() => deleteCard(tokenAdmin, created._id).expect(200)
            .expect(res => {
              assertEqCards(created, res.body);
            }))
        .then(() => getCard(tokenAdmin, created._id).expect(404));
  });
});
