module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'mocha': true,
  },
  'plugins': [
        'jsdoc'
  ],
  'extends': [
    'eslint:recommended',
    'google',
    'plugin:jsdoc/recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'rules': {
    'arrow-parens': 0,
    'max-len': 1,
    'spaced-comment': 1,
    'padded-blocks': 1,
    'no-unused-vars': 1,
    'valid-jsdoc': 0, // deprecated, use eslint-plugin-jsdoc
    'require-jsdoc': 0, // deprecated, use eslint-plugin-jsdoc
    'jsdoc/require-jsdoc': ['warn', {
      'publicOnly': true,
      'require': { FunctionExpression: true, ClassDeclaration: true, }
    }],
  },
};
