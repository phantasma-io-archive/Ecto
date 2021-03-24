const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

// Generate pages object
const pagesObj = {};

const chromeName = ["popup", "options", "content_script", "background", "inpage"];

chromeName.forEach(name => {
  pagesObj[name] = {
    entry: `src/${name}/index.ts`,
    template: "public/index.html",
    filename: `${name}.html`
  };
});

const plugins =
  process.env.NODE_ENV === "production"
    ? [
        {
          from: path.resolve("src/manifest.production.json"),
          to: `${path.resolve("dist")}/manifest.json`
        }
      ]
    : [
        {
          from: path.resolve("src/manifest.development.json"),
          to: `${path.resolve("dist")}/manifest.json`
        }
      ];

module.exports = {
  pages: pagesObj,
  configureWebpack: config => {
    config.plugins.push(new CopyWebpackPlugin(plugins));
    config.output.filename = 'js/[name].js';
    config.output.chunkFilename = 'js/[name].js';
  },
  chainWebpack: config => {
    config.plugin('copy')
          .tap(args => {
            args[0].push({
              from: path.resolve(__dirname, 'src/_locales'),
              to: path.resolve(__dirname, 'dist/_locales'),
              toType: 'dir',
              ignore: ['.DS_Store']
            })
            return args
          })
  }
};
