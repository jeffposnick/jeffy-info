const path = require('path');

const BUILD_DIR = 'build';
const SRC_DIR = 'src';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    'assets/**/*.{css,json}',
    '_sw/**/*.json',
  ],
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  swSrc: path.join(SRC_DIR, 'service-worker.js'),
};
