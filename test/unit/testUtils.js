const utils = require('../../src/utils.js');
const assert = require('chai').assert;

describe('Test utils', function() {
  it('utils.hasDuplicates', function(done) {
    assert.isOk(utils.hasDuplicates([1, 2, 3, 4, 5, 3]));
    assert.isNotOk(utils.hasDuplicates([1, 2, 3, 4, 5]));
    assert.isNotOk(utils.hasDuplicates([]));
    assert.throws(() => utils.hasDuplicates('Not an array'));
    done();
  });
});
