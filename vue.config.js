// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require("webpack");
const dayjs = require("dayjs");

module.exports = {
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          BUILD_DATE: `"${dayjs().format("MMM D, YYYY, HH:mm")} - ${dayjs().unix()}"`,
        },
      }),
    ],
  },
};
