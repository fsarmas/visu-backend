const router = require('express').Router(); // eslint-disable-line new-cap
const auth = require('../../src/auth.js');

const userController = require('../controllers/userController.js');

function authError(res) {
  res.status(401).send('Unauthorized');
}

router.post('/login', (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return authError(res);
  }

  let user;

  userController.findByEmail(req.body.email).then(found => {
    if (!found) {
      throw new Error('__auth_error__');
    }
    user = found;
    return userController.verifyPassword(req.body.password, found.password);
  }).then(valid => {
    if (!valid) {
      throw new Error('__auth_error__');
    }
    const token = auth.generateAccessToken(user.id);
    res.status(200).send({auth: true, uid: user.id, token});
  }).catch(error => {
    console.log('caught ->', error);
    if (error.message === '__auth_error__') {
      authError(res);
    } else {
      next(error);
    }
  });
});

module.exports = router;
