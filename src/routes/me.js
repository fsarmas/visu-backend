const router = require('express').Router(); // eslint-disable-line new-cap

const auth = require('../auth.js');
const {cleanUser} = require('../utils.js');

// require regular authentication for all routes under this
router.use(auth.authRegular());

router.route('/')
    .get((req, res, next) => {
      res.send(cleanUser(req.auth));
    });

module.exports = router;
