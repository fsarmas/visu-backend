const request = require('supertest');
const assert = require('chai').assert;
const mongoose = require('mongoose');

const app = require('../../src/app.js');
const scoreController = require('../../src/controllers/scoreController.js');
const cardController = require('../../src/controllers/cardController.js');
const {EXAMPLES: EXAMPLE_CARDS} = require('../unit/testCardController.js');
const {createRegularUser, REGULAR, authHeader} = require('./authUtils.js');

/* Helper functions (HTTP requests) */

function getScore(token, id) {
  return request(app)
      .get(`/scores/${id}`)
      .set(authHeader(token));
}

function postResults(token, result) {
  return request(app)
      .post(`/scores/results`)
      .set(authHeader(token))
      .send(result);
}

/* Helper functions (other) */

function isEqualScore(score, cardId, userId, points, date) {
  const scoreCard = (Object.prototype.hasOwnProperty.call(score.card, '_id') ?
    score.card._id : score.card).toString();

  const scoreUser = (Object.prototype.hasOwnProperty.call(score.user, '_id') ?
    score.user._id : score.user).toString();

  return scoreCard === cardId.toString()
    && scoreUser === userId.toString()
    && score.points === points
    && parseInt(Date.parse(score.lastTest) / 1000) ===
        parseInt(Date.parse(date) / 1000);
}

/*
  Tests
 */

describe('Scores API tests', function() {
  let tokenRegular;

  before('Before all tests', async function() {
    tokenRegular = await createRegularUser();
  });

  beforeEach('Before each test', async function() {
    await cardController.deleteAll();
    await scoreController.deleteAll();
  });

  it('GET a score (no auth)', function() {
    return getScore(undefined, 1).expect(401);
  });

  it('GET a score (card nonexisting)', function() {
    return getScore(tokenRegular, new mongoose.Types.ObjectId()).expect(404);
  });

  it('GET a score (no score for the card)', async function() {
    const card = await cardController.create(EXAMPLE_CARDS[0]);
    return getScore(tokenRegular, card._id).expect(404);
  });

  it('POST a result', async function() {
    const card0 = await cardController.create(EXAMPLE_CARDS[0]);
    const card1 = await cardController.create(EXAMPLE_CARDS[1]);
    let date = new Date();

    const userId = REGULAR._id.toString();
    const result0 = {cardId: card0._id.toString(), hit: true, date};
    const result1 = {cardId: card1._id.toString(), hit: true, date};

    await postResults(tokenRegular, [result0, result1])
        .expect(200)
        .expect(res => {
          assert.lengthOf(res.body, 2);
          assert.isOk(res.body.some(score =>
            isEqualScore(score, card0._id, userId, 1, date)));
          assert.isOk(res.body.some(score =>
            isEqualScore(score, card1._id, userId, 1, date)));
        });

    for (let i = 0; i < 4; i++) {
      date = new Date(); // eslint-disable-line require-atomic-updates
      await postResults(tokenRegular, [
        {cardId: card0._id, hit: true, date},
        {cardId: card1._id, hit: true, date},
      ]);
    }

    await getScore(tokenRegular, card0._id).expect(200).expect(res => {
      assert.isOk(isEqualScore(res.body, card0._id, userId, 5, date));
    });

    await getScore(tokenRegular, card1._id).expect(200).expect(res => {
      assert.isOk(isEqualScore(res.body, card1._id, userId, 5, date));
    });

    date = new Date(); // eslint-disable-line require-atomic-updates
    await postResults(tokenRegular, [
      {cardId: card0._id, hit: false, date},
      {cardId: card1._id, hit: false, date},
    ]).expect(200).expect(res => {
      assert.lengthOf(res.body, 2);
      assert.isOk(res.body.some(score =>
        isEqualScore(score, card0._id, userId, 4, date)));
      assert.isOk(res.body.some(score =>
        isEqualScore(score, card1._id, userId, 4, date)));
    });

    for (let i = 0; i < 10; i++) {
      date = new Date(); // eslint-disable-line require-atomic-updates
      await postResults(tokenRegular, [
        {cardId: card0._id, hit: true, date},
        {cardId: card1._id, hit: false, date},
      ]);
    }

    await getScore(tokenRegular, card0._id).expect(200).expect(res => {
      assert.isOk(isEqualScore(res.body, card0._id, userId, 10, date));
    });

    await getScore(tokenRegular, card1._id).expect(200).expect(res => {
      assert.isOk(isEqualScore(res.body, card1._id, userId, 1, date));
    });
  });
});
