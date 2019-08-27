const request = require('supertest');
const assert = require('chai').assert;

const app = require('../../src/app.js');
const userController = require('../../src/controllers/userController.js');

function login(email, password) {
  return request(app).post('/auth/login').send({email, password});
}

/* Exported constants */

const ADMIN = {name: 'A', email: 'a@a.com', password: 'aaa'};
const REGULAR = {name: 'B', email: 'b@b.com', password: 'bbb'};

/* Exported functions */

/**
 * Creates the user defined in constant ADMIN (if not existing) and use its
 * credentials not log in, returning an access token.
 *
 * @returns {Promise<string>} fulfills with an access token for ADMIN user
 */
async function createAdminUser() {
  let user = await userController.findById(ADMIN.email);
  if (!user) {
    user = await userController.create(ADMIN);
    ADMIN._id = user._id; // eslint-disable-line require-atomic-updates
    user = await userController.makeAdmin(user.id);
  }
  assert.strictEqual(user.level, 'admin');

  const response = await login(ADMIN.email, ADMIN.password);
  assert.isOk(response.body.auth);
  assert.strictEqual(user._id.toString(), response.body.uid);
  return response.body.token;
}

/**
 * Creates the user defined in constant REGULAR (if not existing) and use its
 * credentials not log in, returning an access token.
 *
 * @returns {Promise<string>} fulfills with an access token for REGULAR user
 */
async function createRegularUser() {
  let user = await userController.findById(REGULAR.email);
  if (!user) {
    user = await userController.create(REGULAR);
    REGULAR._id = user._id; // eslint-disable-line require-atomic-updates
  }

  const response = await login(REGULAR.email, REGULAR.password);
  assert.isOk(response.body.auth);
  assert.strictEqual(user._id.toString(), response.body.uid);
  return response.body.token;
}

/**
 * Returns an object with one key-value pair representing the authorization
 * header for the given bearer token; or empty object if no token is given
 *
 * @param   {string} token to be included in header's value
 *
 * @returns {!object} containing authorization header name-value pair
 */
function authHeader(token) {
  return token ? {Authorization: `Bearer ${token}`} : {};
}

module.exports = {ADMIN, REGULAR, createAdminUser, createRegularUser,
  authHeader};
