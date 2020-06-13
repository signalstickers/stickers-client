module.exports = {
  extends: '@darkobits/ts-unified/dist/config/babel',
  presets: [
    ['@babel/preset-env', {
      targets: {node: '10', ie: '11'}
    }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime'
  ]
};
