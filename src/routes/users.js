const router = require('express').Router(); // eslint-disable-line new-cap
const userController = require('../controllers/userController.js');

// Retieve user if necessary, or fail with 404 if not existing
router.param('id', (req, res, next, id) => {
  const user = userController.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    return next(error);
  }

  req.user = user;
  next();
});

router.route('/')
    .get((req, res, next) => {
      res.send(userController.list());
    })
    .post((req, res, next) => {
      try {
        const user = userController.create(req.body);
        res.status(201).send(user);
      } catch (error) {
        if (error.name == 'ValidationError') { // TODO: Move this to error handler
          res.status(400).send(error);
        } else {
          throw error;
        }
      }
    });

router.route('/:id')
    .get((req, res, next) => {
      res.send(req.user);
    })
    .put((req, res, next) => {
      // Ensure we are updating the user whose ID matches path parameter
      const user = req.body;
      user.id = req.user.id;

      try {
        const updated = userController.update(user);
        res.status(200).send(updated);
      } catch (error) {
        if (error.name == 'ValidationError') { // TODO: Move this to error handler
          res.status(400).send(error);
        } else {
          throw error;
        }
      }
    })
    .delete((req, res, next) => {
      userController.delete(req.user.id);
      res.status(204).send();
    });

module.exports = router;
