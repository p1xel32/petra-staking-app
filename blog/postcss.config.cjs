// blog/postcss.config.cjs
// Using .cjs extension for CommonJS compatibility if package.json has "type": "module"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
