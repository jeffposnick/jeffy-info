const path = require('path');

const BUILD_DIR = 'build';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    '**/*.html',
    'assets/manifest.json',
  ],
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  swSrc: path.join(BUILD_DIR, 'service-worker.js'),
};
