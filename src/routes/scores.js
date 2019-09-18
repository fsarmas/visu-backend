const mongoose = require('mongoose');
const router = require('express').Router(); // eslint-disable-line new-cap

const auth = require('../auth.js');
const scoreController = require('../controllers/scoreController.js');

// require regular authentication for all routes under this
router.use(auth.authRegular());

router.get('/:cardId', (req, res, next) => {
  scoreController.get(req.params.cardId, req.auth._id, true).then(found => {
    if (!found) {
      res.sendStatus(404);
    } else {
      res.send(found);
    }
  }).catch(next);
});

/*
 * Body: array of {
 *   cardId: string,
 *   hit: boolean,
 *   date: timestamp
 * }
 */
router.post('/results', async (req, res, next) => {
  if (!(req.body instanceof Array)) {
    return next(new TypeError('Expected an array'));
  }

  for (const result of req.body) {
    if (!mongoose.Types.ObjectId.isValid(result.cardId)) {
      return next(new TypeError(`Invalid ObjectId: ${result.cardId}`));
    }
    if (typeof result.hit != 'boolean') {
      return next(new TypeError(`cardId is not a boolean: ${result.hit}`));
    }
    if (isNaN(Date.parse(result.date))) {
      return next(new TypeError(`wrong date format: ${result.date}`));
    }
  }

  try {
    const cardIds = new Set();
    for (const result of req.body) {
      cardIds.add(result.cardId.toString());
      if (result.hit) {
        await scoreController.addHit(result.cardId, req.auth._id, result.date);
      } else {
        await scoreController.addMiss(result.cardId, req.auth._id, result.date);
      }
    }

    const responseBody = [];
    for (const cardId of cardIds) {
      const score = await scoreController.get(cardId, req.auth._id, false);
      responseBody.push(score);
    }

    res.send(responseBody);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
