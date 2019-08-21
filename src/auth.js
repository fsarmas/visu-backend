const config = require('config');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const userController = require('./controllers/userController.js');

const JWT_REGULAR = 'jwt-regular';
const JWT_ADMIN = 'jwt-admin';

/**
 * Initializes passport with JWT strategies for regular and admin users, and
 * returns the passport middleware that should be passed to app.use().
 * Recommended use:
 *
 * const app = express();
 * const auth = require('./path/to/auth.js');
 * app.use(auth.initializePassport());
 *
 * @returns {Function} the passport middleware ready to be passed to app.use()
 */
function initializePassport() {
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get('jwtSigningKey'),
  };

  function createJwtStrategy(isAdmin) {
    return new JwtStrategy(jwtOptions, function(jwtPayload, done) {
      userController.findById(jwtPayload.uid).then(user => {
        if (!user) {
          return done(null, false);
        }
        if (isAdmin && user.level != 'admin') {
          return done(null, false);
        }
        done(null, user);
      }).catch(err => done(err, false));
    });
  }

  passport.use(JWT_REGULAR, createJwtStrategy(false));
  passport.use(JWT_ADMIN, createJwtStrategy(true));

  return passport.initialize({userProperty: 'auth'});
}

/**
 * Gets an authentication middleware that requires a JWT bearer token for any
 * user to be present in "Authorization" request header.
 *
 * @returns {Function} authentication middleware for regular users via JWT
 */
function authRegular() {
  return passport.authenticate(JWT_REGULAR, {session: false});
}

/**
 * Gets an authentication middleware that requires a JWT bearer token for an
 * admin user to be present in "Authorization" request header.
 *
 * @returns {Function} authentication middleware for admin users via JWT
 */
function authAdmin() {
  return passport.authenticate(JWT_ADMIN, {session: false});
}

/**
 * Generates a new JWT whose payload contains the "uid" field with the given
 * userId, signed with the signing key set in configuration for the current
 * environment.
 *
 * @param {string} userId set as value for "uid" field in the payload
 * @param {string|number} expiresIn describes a time span (as per zeit/ms) after
 * which the tokes expires. A numeric value is interpreted as a seconds count.
 * A string should provide the time units (e.g. "2 days", "10h", "7d"),
 * otherwise it defaults to milliseconds
 *
 * @returns {string} a JWT containing the given userId (as "uid" field)
 */
function generateAccessToken(userId, expiresIn) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return jwt.sign(
      {uid: userId},
      config.get('jwtSigningKey'),
      {expiresIn: expiresIn || '1 day'}
  );
}

module.exports = {
  initializePassport,
  authRegular,
  authAdmin,
  generateAccessToken,
};
