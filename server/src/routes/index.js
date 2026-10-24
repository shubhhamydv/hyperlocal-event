const fs = require('fs');
const path = require('path');

/**
 * Auto-mounts every *.routes.js file found in this directory.
 *
 * Each routes file must export:
 *   { basePath: string, router: express.Router }
 *
 * Mounted path: /api + basePath
 *   e.g. basePath '/auth'   → /api/auth
 *        basePath '/events' → /api/events
 *
 * Tolerates files that fail to load or are missing the required exports.
 */
function mountRoutes(app) {
  const routesDir = __dirname;
  let files;

  try {
    files = fs.readdirSync(routesDir);
  } catch (err) {
    console.warn('[routes] Could not read routes directory:', err.message);
    return;
  }

  files
    .filter((file) => file !== 'index.js' && file.endsWith('.routes.js'))
    .forEach((file) => {
      const fullPath = path.join(routesDir, file);
      try {
        const mod = require(fullPath);

        if (!mod.basePath || !mod.router) {
          console.warn(`[routes] ${file} is missing basePath or router — skipped`);
          return;
        }

        app.use(`/api${mod.basePath}`, mod.router);
        console.log(`[routes] Mounted /api${mod.basePath}  ←  ${file}`);
      } catch (err) {
        console.warn(`[routes] Failed to load ${file}:`, err.message);
      }
    });
}

module.exports = mountRoutes;
