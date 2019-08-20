const request = require('supertest');
const assert = require('chai').assert;
const app = require('../../src/app.js');
const hasDuplicates = require('../../src/utils.js').hasDuplicates;

const userController = require('../../src/controllers/userController');
const User = require('../../src/models/user');

const EXAMPLE_USERS = [
  {name: 'Daenerys Targaryen', email: 'danny@targaryen.com', password: '12345'},
  {name: 'Arya Stark', email: 'arya@stark.com', password: '67890'},
  {name: 'Onion Knight', email: 'davos@tor.org', password: 'abcde'},
  {name: 'Brienne of Tarth', email: 'brienne@tarth.net', password: 'fghij'},
];

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
  beforeEach('Delete all users', function() {
    return userController.deleteAll().exec();
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
                assert.isNotOk(hasDuplicates(res.body.map(e => e._id)));
              });
        });
  });

  it('POST users (invalid name)', function() {
    const user = Object.assign({}, EXAMPLE_USERS[0]);
    user.name = [1, 2, 3];

    return postUsers(user).expect(400);
  });

  it('POST users (invalid - missing email)', function() {
    const user = Object.assign({}, EXAMPLE_USERS[0]);
    delete user.email;

    return postUsers(user).expect(400);
  });

  it('POST users (duplicated email)', function() {
    const user1 = Object.assign({}, EXAMPLE_USERS[0]);

    return postUsers(user1).expect(201).then(() => {
      return postUsers(user1).expect(409);
    });
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
          return getUser(created._id)
              .expect(200)
              .expect(res => {
                assertValidUser(res.body);
                assertEqualUser(res.body, EXAMPLE_USERS[0]);
                assert.strictEqual(res.body._id, created._id);
              });
        });
  });

  it('PUT a user (nonexisting)', function() {
    return putUser(1, EXAMPLE_USERS[0]).expect(404);
  });

  it('PUT a user (invalid name)', function() {
    let created;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => {
          created.name = [1, 2, 3];
          return putUser(created._id, created).expect(400);
        });
  });

  it('PUT a user (email & password do not change)', function() {
    let id;

    const user1 = Object.assign({}, EXAMPLE_USERS[0]);
    const user2 = Object.assign({}, EXAMPLE_USERS[1]);

    return postUsers(user1).expect(201).expect(res => {
      id = res.body._id;
    }).then(() => {
      return putUser(id, user2).expect(200).expect(res => {
        assertValidUser(res.body);
        assert.strictEqual(res.body._id, id);
        assert.strictEqual(res.body.name, user2.name);
        assert.strictEqual(res.body.email, user1.email);
      });
    });
  });

  it('PUT a user (valid)', function() {
    const original = Object.assign({}, EXAMPLE_USERS[0]);

    return postUsers(original)
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
            return putUser(original._id, modified)
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

  it('DELETE a user (nonexisting)', function() {
    return deleteUser(1).expect(404);
  });

  it('DELETE a user (existing)', function() {
    let created;

    return postUsers(EXAMPLE_USERS[0])
        .expect(res => created = res.body)
        .then(() => deleteUser(created._id).expect(200).expect(res => {
          assertEqualUser(created, res.body);
        }))
        .then(() => getUser(created._id).expect(404));
  });
});
