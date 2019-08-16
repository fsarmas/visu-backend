const User = require('../../src/models/user');

let nextId = 0;
let users = [];

module.exports = {
  // TODO: Replace all this functions with database queries

  list() {
    return users;
  },

  findById(id) {
    return users.find(e => e.id == id);
  },

  create(user) {
    const error = new User(user).validateSync();
    if (error) {
      throw error;
    }

    const created = {id: ++nextId, name: user.name};
    users.push(created);
    return created;
  },

  update(user) {
    const error = new User(user).validateSync();
    if (error) {
      throw error;
    }

    const index = users.findIndex(e => e.id == user.id);
    if (-1 == index) {
      throw new Error(`Update index ${user.id} invalid`);
    }
    users[index] = user;
    return users[index];
  },

  delete(id) {
    const index = users.findIndex(e => e.id = id);
    if (-1 == index) {
      throw new Error(`Delete index ${id} invalid`);
    }
    users.splice(index, 1);
  },

  deleteAll() {
    users = [];
  },

};
