const request = require('supertest');
const assert = require('chai').assert;
const app = require('../../src/app.js');
const hasDuplicates = require('../../src/utils.js').hasDuplicates;

const userController = require('../../src/controllers/userController');
const User = require('../../src/models/user');

const EXAMPLE_USERS = [
  {name: 'Daenerys Targaryen'},
  {name: 'Arya Stark'},
  {name: 'Onion Knight'},
  {name: 'Brienne of Tarth'},
];

/* Helper functions (validation) */

function assertValidUser(user) {
  assert.isObject(user);
  const userDoc = new User(user);
  const error = userDoc.validateSync();
  if (error) {
    throw error;
  }
}

function assertEqualUser(user1, user2) {
  assert.strictEqual(user1.name, user2.name);
}

/* Helper functions (HTTP requests) */

function getUsers() {
  return request(app)
      .get('/users')
      .expect(200)
      .expect(res => assert.isArray(res.body));
}

function postUsers(user) {
  return request(app)
      .post('/users')
      .send(user);
}

function getUser(id) {
  return request(app).get(`/users/${id}`);
}

function putUser(id, user) {
  return request(app)
      .put(`/users/${id}`)
      .send(user);
}

function deleteUser(id) {
  return request(app).delete(`/users/${id}`);
}

/*
  Tests
 */

describe('User API tests', function() {
  beforeEach('Delete all users', function(done) {
    userController.deleteAll();
    done();
  });

  it('GET users (empty)', function() {
    return getUsers().expect([]);
  });

  it('GET users (non empty)', function() {
    return Promise.all(EXAMPLE_USERS.map(u => postUsers(u)))
        .then(() => {
          return getUsers(EXAMPLE_USERS)
              .expect(res => {
                assert.isArray(res.body);
                assert.lengthOf(res.body, EXAMPLE_USERS.length);
                res.body.forEach(e => assertValidUser(e));
                assert.isNotOk(hasDuplicates(res.body.map(e => e.id)));
              });
        });
  });

  it('POST users (invalid)', function() {
    const user = Object.assign({}, EXAMPLE_USERS[0]);
    user.name = [1, 2, 3];

    return postUsers(user).expect(400);
  });

  it('POST users (valid)', function() {
    return postUsers(EXAMPLE_USERS[0])
        .expect(201)
        .expect(function(res) {
          assertValidUser(res.body);
          assertEqualUser(res.body, EXAMPLE_USERS[0]);
        });
  });

  it('GET a user (nonexisting)', function() {
    return getUser(1).expect(404);
  });

  it('GET a user (existing)', function() {
    let created;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => {
          return getUser(created.id)
              .expect(200)
              .expect(res => {
                assertValidUser(res.body);
                assertEqualUser(res.body, EXAMPLE_USERS[0]);
                assert.strictEqual(res.body.id, created.id);
              });
        });
  });

  it('PUT a user (nonexisting)', function() {
    return putUser(1, EXAMPLE_USERS[0]).expect(404);
  });

  it('PUT a user (invalid)', function() {
    let created;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => {
          created.name = [1, 2, 3];
          return putUser(created.id, created).
              expect(400);
        });
  });

  it('PUT a user (valid)', function() {
    let createdId;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => createdId = res.body.id)
        .then(() => {
          // Modified object without ID
          const mod1 = Object.assign({}, EXAMPLE_USERS[1]);

          // Modified object with same ID
          const mod2 = Object.assign({}, EXAMPLE_USERS[2]);
          mod2.id = createdId;

          // Modified object with different ID
          const mod3 = Object.assign({}, EXAMPLE_USERS[3]);
          mod3.id = 1234;

          return Promise.all([mod1, mod2, mod3].map(modified => {
            return putUser(createdId, modified)
                .expect(200)
                .expect(res => {
                  assertEqualUser(res.body, modified);
                  assert.strictEqual(res.body.id, createdId);
                });
          }));
        });
  });

  it('DELETE a user (nonexisting)', function() {
    return deleteUser(1).expect(404);
  });

  it('DELETE a user (existing)', function() {
    let created;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => deleteUser(created.id).expect(204))
        .then(() => getUser(created.id).expect(404));
  });
});
