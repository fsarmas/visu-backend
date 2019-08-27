const router = require('express').Router(); // eslint-disable-line new-cap

const auth = require('../auth.js');
const cardController = require('../controllers/cardController.js');

// Retieve card if necessary, or fail with 404 if not existing
router.param('id', (req, res, next, id) => {
  cardController.findById(id).then(card => {
    if (card) {
      req.card = card;
      next();
    } else {
      const error = new Error('Card not found');
      error.status = 404;
      return next(error);
    }
  }).catch(next);
});

// require admin authentication for all routes under this
router.use(auth.authAdmin());

router.route('/')
    .get((req, res, next) => {
      cardController.list(req.query.skip, req.query.limit)
          .then(list => res.send(list))
          .catch(next);
    })
    .post((req, res, next) => {
      cardController.create(req.body).then(created => {
        res.status(201).send(created);
      }).catch(next);
    });

router.route('/:id')
    .get((req, res, next) => {
      res.send(req.card);
    })
    .put((req, res, next) => {
      cardController.update(req.card._id, req.body).then(updated => {
        res.send(updated);
      }).catch(next);
    })
    .delete((req, res, next) => {
      cardController.delete(req.card._id).then((deleted) => {
        res.send(deleted);
      }).catch(next);
    });

module.exports = router;
