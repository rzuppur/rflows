// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require("webpack");

module.exports = {
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          BUILD_DATE: `"${Date.now() + (new Date().getTimezoneOffset()) * 60000}"`,
        },
      }),
    ],
  },
};
