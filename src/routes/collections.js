const router = require('express').Router(); // eslint-disable-line new-cap

const auth = require('../auth.js');
const collectionController = require('../controllers/collectionController.js');
const cardController = require('../controllers/cardController.js');

// Retieve collection if necessary, or fail with 404 if not existing
router.param('id', (req, res, next, id) => {
  collectionController.findById(id).then(collection => {
    if (collection) {
      req.collection = collection;
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
      const skip = parseInt(req.query.skip);
      const limit = parseInt(req.query.limit);
      collectionController.list(skip, limit)
          .then(list => res.send(list))
          .catch(next);
    })
    .post((req, res, next) => {
      collectionController.create(req.body).then(created => {
        res.status(201).send(created);
      }).catch(next);
    });

router.route('/:id')
    .get((req, res, next) => {
      res.send(req.collection);
    })
    .put((req, res, next) => {
      collectionController.update(req.collection._id, req.body)
          .then(updated => {
            res.send(updated);
          }).catch(next);
    })
    .delete((req, res, next) => {
      collectionController.delete(req.collection._id).then((deleted) => {
        res.send(deleted);
      }).catch(next);
    });

router.get('/:id/cards', (req, res, next) => {
  collectionController.getCardsInCollection(req.collection._id).then(cards => {
    res.send(cards);
  }).catch(next);
});

router.route('/:id/cards/:cardId')
    .post((req, res, next) => {
      cardController.addToCollection(req.params.cardId, req.collection._id)
          .then(added => {
            res.send(added);
          }).catch(next);
    })
    .delete((req, res, next) => {
      cardController.removeFromCollection(req.params.cardId, req.collection._id)
          .then(removed => {
            res.send(removed);
          }).catch(next);
    });

module.exports = router;
