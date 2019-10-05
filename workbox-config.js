const path = require('path');

const BUILD_DIR = 'build';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    '**/*.{json,njk}',
    'index.html',
  ],
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  swSrc: path.join(BUILD_DIR, 'service-worker.js'),
};
