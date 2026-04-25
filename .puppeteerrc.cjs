const { join } = require('path');

/**
 * Puppeteer cache inside the project source directory so Render's build
 * snapshot includes it (files outside /opt/render/project/src are discarded).
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
