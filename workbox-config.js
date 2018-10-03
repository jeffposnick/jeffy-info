const path = require('path');

const BUILD_DIR = 'build';

module.exports = {
  globDirectory: 'build',
  globPatterns: [
    '**/*.{json,njk}',
    'index.html',
  ],
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  swSrc: path.join('src', 'service-worker.js'),
};
