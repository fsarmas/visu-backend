const assert = require('chai').assert;

const userController = require('../../src/controllers/userController');

describe('userController tests', function() {
  beforeEach('Delete all users', function() {
    return userController.deleteAll().exec();
  });

  it('Save ignores level / promote sets it', async function() {
    const user = {name: 'Daenerys Targaryen', email: 'danny@targaryen.com',
      password: '12345', level: 'admin'};

    let saved = await userController.create(user);
    assert.isNotOk(saved.level);

    saved = await userController.makeAdmin(saved.id);
    assert.strictEqual(saved.level, 'admin');

    saved = await userController.findById(saved.id);
    assert.strictEqual(saved.level, 'admin');
  });
});
