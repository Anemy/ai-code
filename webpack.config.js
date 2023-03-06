// eslint-disable-next-line @typescript-eslint/no-var-requires
const electronConfig = require('./webpack.electron.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const reactConfig = require('./webpack.react.js');

module.exports = [electronConfig, reactConfig];
