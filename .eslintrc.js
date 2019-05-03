module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
  },

  extends: [
    "plugin:vue/recommended",
    "@vue/airbnb",
  ],

  rules: {
    quotes: [2, "double"],
    "no-param-reassign": 0,
    "no-underscore-dangle": 0,
    "vue/script-indent": [2, 2, {baseIndent: 1}],
    "vue/require-default-prop": 0,
    "newline-per-chained-call": 0,
    "max-len": 0,
    "camelcase": 0,
    "indent": 0,
    "array-bracket-spacing": 0,
    "linebreak-style": 0,
    "space-in-parens": 0,
    "object-curly-newline": 0,
    "no-unused-expressions": 0,
    "lines-between-class-members": 0,
    "no-plusplus": [1, { "allowForLoopAfterthoughts": true }],
    "no-await-in-loop": 0,
  },

  overrides: [
    {
      files: ["*.vue"],
      rules: {
        indent: "off",
      },
    },
  ],

  parserOptions: {
    parser: "babel-eslint",
    sourceType: "module",
  },
};
