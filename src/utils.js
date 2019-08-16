module.exports = {

  /**
   * Check an array for duplicate elements. Equality is defined as in the Set
   * class.
   *
   * @param  {Array} a the array to check
   *
   * @returns {boolean} true if the given array contains duplicates; false
   * otherwise
   */
  hasDuplicates: function(a) {
    if (!Array.isArray(a)) {
      throw new Error('hasDuplicates must be given an array');
    }

    const set = new Set(a);
    return a.length != set.size;
  },

};

