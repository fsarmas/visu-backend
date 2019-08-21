const router = require('express').Router(); // eslint-disable-line new-cap

const auth = require('../auth.js');
const userController = require('../controllers/userController.js');
const {cleanUser} = require('../utils.js');

// Retieve user if necessary, or fail with 404 if not existing
router.param('id', (req, res, next, id) => {
  userController.findById(id).then(user => {
    if (user) {
      req.user = user;
      next();
    } else {
      const error = new Error('User not found');
      error.status = 404;
      return next(error);
    }
  }).catch(next);
});

// require admin authentication for all routes under this
router.use(auth.authAdmin());

router.route('/')
    .get((req, res, next) => {
      userController.list().then(list => res.send(
          list.map(user => cleanUser(user)))
      ).catch(next);
    })
    .post((req, res, next) => {
      userController.create(req.body).then(created => {
        res.status(201).send(cleanUser(created));
      }).catch(next);
    });

router.route('/:id')
    .get((req, res, next) => {
      res.send(cleanUser(req.user));
    })
    .put((req, res, next) => {
      userController.update(req.user._id, req.body).then(updated => {
        res.status(200).send(cleanUser(updated));
      }).catch(next);
    })
    .delete((req, res, next) => {
      userController.delete(req.user._id).then((deleted) => {
        res.status(200).send(cleanUser(deleted));
      }).catch(next);
    });

module.exports = router;
