const router = require('express').Router(); // eslint-disable-line new-cap

router.use('/users', require('./users.js'));
router.use('/me', require('./me.js'));
router.use('/auth', require('./auth.js'));

module.exports = router;
