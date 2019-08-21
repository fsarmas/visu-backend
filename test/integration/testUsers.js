const request = require('supertest');
const assert = require('chai').assert;

const app = require('../../src/app.js');
const hasDuplicates = require('../../src/utils.js').hasDuplicates;
const userController = require('../../src/controllers/userController');
const User = require('../../src/models/user');
const auth = require('../../src/auth.js');

const EXAMPLE_USERS = [
  {name: 'Daenerys Targaryen', email: 'danny@targaryen.com', password: '12345'},
  {name: 'Arya Stark', email: 'arya@stark.com', password: '67890'},
  {name: 'Onion Knight', email: 'davos@tor.org', password: 'abcde'},
  {name: 'Brienne of Tarth', email: 'brienne@tarth.net', password: 'fghij'},
];

const ADMIN = {name: 'A', email: 'a@a.com', password: 'aaa'};
const REGULAR = {name: 'B', email: 'b@b.com', password: 'bbb'};

/* Helper functions (validation) */

function assertValidUser(user) {
  assert.isObject(user);
  assert.notProperty(user, 'password');
  const userDoc = new User(Object.assign({password: 'dummy'}, user));
  const error = userDoc.validateSync();
  if (error) {
    throw error;
  }
}

function assertEqualUser(user1, user2) {
  User.schema.eachPath(path => {
    if (['_id', '__v', 'createdAt', 'updatedAt', 'password'].includes(path)) {
      return;
    }
    assert.strictEqual(user1[path], user2[path]);
  });
}

/* Helper functions (HTTP requests) */

function authHeader(token) {
  if (!token) {
    return {};
  }

  return {Authorization: `Bearer ${token}`};
}

function getUsers(token) {
  return request(app)
      .get('/users')
      .set(authHeader(token));
}

function postUsers(token, user) {
  return request(app)
      .post('/users')
      .set(authHeader(token))
      .send(user);
}

function getUser(token, id) {
  return request(app)
      .get(`/users/${id}`)
      .set(authHeader(token));
}

function putUser(token, id, user) {
  return request(app)
      .put(`/users/${id}`)
      .set(authHeader(token))
      .send(user);
}

function deleteUser(token, id) {
  return request(app)
      .delete(`/users/${id}`)
      .set(authHeader(token));
}

/*
  Tests
 */

describe('User API tests', function() {
  let tokenRegular;
  let tokenAdmin;

  beforeEach('Before each test', function() {
    return userController.deleteAll()
        .then(() => userController.create(ADMIN))
        .then(created => userController.makeAdmin(created.id))
        .then(updated => tokenAdmin =
            auth.generateAccessToken(updated.id, '1d'))
        .then(() => userController.create(REGULAR))
        .then(created => tokenRegular =
            auth.generateAccessToken(created.id, '1d'));
  });

  it('GET users (no auth)', function() {
    return getUsers(undefined).expect(401);
  });

  it('GET users (regular auth)', function() {
    return getUsers(tokenRegular).expect(401);
  });

  it('GET users (non empty)', function() {
    return Promise.all(EXAMPLE_USERS.map(u => postUsers(tokenAdmin, u)))
        .then(() => {
          return getUsers(tokenAdmin)
              .expect(200)
              .expect(res => {
                assert.isArray(res.body);
                assert.lengthOf(res.body, EXAMPLE_USERS.length + 2);
                res.body.forEach(e => assertValidUser(e));
                assert.isNotOk(hasDuplicates(res.body.map(e => e._id)));
              });
        });
  });

  it('POST users (no auth)', function() {
    return postUsers(null, EXAMPLE_USERS[0]).expect(401);
  });

  it('POST users (regular auth)', function() {
    return postUsers(tokenRegular, EXAMPLE_USERS[0]).expect(401);
  });

  it('POST users (invalid name)', function() {
    const user = Object.assign({}, EXAMPLE_USERS[0]);
    user.name = [1, 2, 3];

    return postUsers(tokenAdmin, user).expect(400);
  });

  it('POST users (invalid - missing email)', function() {
    const user = Object.assign({}, EXAMPLE_USERS[0]);
    delete user.email;

    return postUsers(tokenAdmin, user).expect(400);
  });

  it('POST users (duplicated email)', function() {
    const user1 = Object.assign({}, EXAMPLE_USERS[0]);

    return postUsers(tokenAdmin, user1).expect(201).then(() => {
      return postUsers(tokenAdmin, user1).expect(409);
    });
  });

  it('POST users (valid)', function() {
    return postUsers(tokenAdmin, EXAMPLE_USERS[0])
        .expect(201)
        .expect(function(res) {
          assertValidUser(res.body);
          assertEqualUser(res.body, EXAMPLE_USERS[0]);
        });
  });

  it('GET a user (no auth)', function() {
    return getUser(null, 1).expect(401);
  });

  it('GET a user (regular auth)', function() {
    return getUser(tokenRegular, 1).expect(401);
  });

  it('GET a user (nonexisting)', function() {
    return getUser(tokenAdmin, 1).expect(404);
  });

  it('GET a user (existing)', function() {
    let created;

    return postUsers(tokenAdmin, EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => {
          return getUser(tokenAdmin, created._id)
              .expect(200)
              .expect(res => {
                assertValidUser(res.body);
                assertEqualUser(res.body, EXAMPLE_USERS[0]);
                assert.strictEqual(res.body._id, created._id);
              });
        });
  });

  it('PUT a user (no auth)', function() {
    return putUser(null, 1, EXAMPLE_USERS[0]).expect(401);
  });

  it('PUT a user (regular auth)', function() {
    return putUser(tokenRegular, 1, EXAMPLE_USERS[0]).expect(401);
  });

  it('PUT a user (nonexisting)', function() {
    return putUser(tokenAdmin, 1, EXAMPLE_USERS[0]).expect(404);
  });

  it('PUT a user (invalid name)', function() {
    let created;

    return postUsers(tokenAdmin, EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => {
          created.name = [1, 2, 3];
          return putUser(tokenAdmin, created._id, created).expect(400);
        });
  });

  it('PUT a user (email & password do not change)', function() {
    let id;

    const user1 = Object.assign({}, EXAMPLE_USERS[0]);
    const user2 = Object.assign({}, EXAMPLE_USERS[1]);

    return postUsers(tokenAdmin, user1).expect(201).expect(res => {
      id = res.body._id;
    }).then(() => {
      return putUser(tokenAdmin, id, user2).expect(200).expect(res => {
        assertValidUser(res.body);
        assert.strictEqual(res.body._id, id);
        assert.strictEqual(res.body.name, user2.name);
        assert.strictEqual(res.body.email, user1.email);
      });
    });
  });

  it('PUT a user (valid)', function() {
    const original = Object.assign({}, EXAMPLE_USERS[0]);

    return postUsers(tokenAdmin, original)
        .expect(201)
        .expect(res => original._id = res.body._id)
        .then(() => {
          // Modified object without ID
          const mod1 = Object.assign({}, EXAMPLE_USERS[1]);

          // Modified object with same ID
          const mod2 = Object.assign({}, EXAMPLE_USERS[2]);
          mod2.id = original._id;

          // Modified object with different ID
          const mod3 = Object.assign({}, EXAMPLE_USERS[3]);
          mod3.id = 1234;

          return Promise.all([mod1, mod2, mod3].map(modified => {
            return putUser(tokenAdmin, original._id, modified)
                .expect(200)
                .expect(res => {
                  assertValidUser(res.body);
                  assert.strictEqual(res.body._id, original._id);
                  assert.strictEqual(res.body.email, original.email);
                  assert.strictEqual(res.body.name, modified.name);
                });
          }));
        });
  });

  it('DELETE a user (no auth)', function() {
    return deleteUser(null, 1).expect(401);
  });

  it('DELETE a user (regular auth)', function() {
    return deleteUser(tokenRegular, 1).expect(401);
  });

  it('DELETE a user (nonexisting)', function() {
    return deleteUser(tokenAdmin, 1).expect(404);
  });

  it('DELETE a user (existing)', function() {
    let created;

    return postUsers(tokenAdmin, EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => deleteUser(tokenAdmin, created._id).expect(200)
            .expect(res => {
              assertEqualUser(created, res.body);
            }))
        .then(() => getUser(tokenAdmin, created._id).expect(404));
  });
});
