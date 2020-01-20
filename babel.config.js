module.exports = require('@darkobits/ts-unified/dist/config/babel')({
  presets: [
    [require.resolve('@babel/preset-env'), {
      targets: {
        node: '10',
        ie: '11'
      }
    }]
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-runtime')
  ]
});
