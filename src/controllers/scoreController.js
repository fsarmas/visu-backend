const Score = require('../../src/models/Score.js');
const controllerCRUD = require('./crud.js');

const MAX_SCORE = 10;

/**
 * Gets the score with matching card ID and user ID from database.
 *
 * @param   {string} cardId card ID to match
 * @param   {string} userId  user ID to match
 * @param   {boolean} populate if true, card and user are returned as full
 * objects; otherwise, only their IDs are returned
 *
 * @returns {!Promise<Score>} fulfills with the score stored for the given card
 * and user, if any
 */
function get(cardId, userId, populate) {
  let query = Score.findOne({card: cardId, user: userId});
  if (populate) {
    query = query.populate('card').populate('user');
  }
  return query.lean().exec();
}

/**
 * Register a hit for the given user at the given card.
 *
 * @param {string} cardId card ID for the hit
 * @param {string} userId user ID for the hit
 * @param {Date} date when the hit happened
 *
 * @returns {!Promise<Score>} fulfills with the score for the given card and
 * user after applying the hit
 */
function addHit(cardId, userId, date) {
  return addScore(cardId, userId, date, true);
}

/**
 * Register a miss for the given user at the given card.
 *
 * @param {string} cardId card ID for the miss
 * @param {string} userId user ID for the miss
 * @param {Date} date when the miss happened
 *
 * @returns {!Promise<Score>} fulfills with the score for the given card and
 * user after applying the miss
 */
function addMiss(cardId, userId, date) {
  return addScore(cardId, userId, date, false);
}

async function addScore(cardId, userId, date, result) {
  let score = await Score.findOne({card: cardId, user: userId}).exec();
  if (!score) {
    score = new Score({card: cardId, user: userId});
  }

  processScore(score, result);
  score.lastTest = date;
  await score.save();

  return score;
}

function processScore(score, result) {
  if (result) {
    score.points = score.points + 1 || 1;
  } else {
    score.points = score.points - 1 || 0;
  }

  if (score.points < 1) {
    score.points = 1;
  }

  if (score.points > MAX_SCORE) {
    score.points = MAX_SCORE;
  }
}

const crud = controllerCRUD(Score);

module.exports = {
  deleteAll: crud.deleteAll,
  get,
  addHit,
  addMiss,
};

