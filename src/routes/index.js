const router = require('express').Router(); // eslint-disable-line new-cap

router.use('/users', require('./users.js'));
router.use('/me', require('./me.js'));
router.use('/auth', require('./auth.js'));
router.use('/cards', require('./cards.js'));

module.exports = router;
