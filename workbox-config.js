const path = require('path');

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    '**/*.{json,njk}',
    'index.html',
  ],
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  swSrc: path.join('src', 'service-worker.js'),
};
