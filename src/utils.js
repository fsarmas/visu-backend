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

  /**
   * Sanitizes the given user so that it is ready to be sent away. Password
   * field is deleted. If the given user has a "toJSON" method, it is invoked
   * first.
   *
   * @param {!object} user the user to sanitize
   * @returns {!object} a copy of the given user without sentitive information
   */
  cleanUser: function(user) {
    const result = user.toJSON ? user.toJSON() : {...user};
    delete result.password;
    return result;
  },

};

