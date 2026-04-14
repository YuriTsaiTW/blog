'use strict';

// Allow project-level layout overrides (e.g. layout/widget/*.jsx)
// so custom widgets can be added without modifying node_modules.

const view = require('hexo-component-inferno/lib/core/view');
const path = require('path');

const origRequire = view.require;

view.require = function (filename) {
  const localPath = path.join(hexo.base_dir, 'layout', filename);
  try {
    return require(require.resolve(localPath));
  } catch {
    return origRequire(filename);
  }
};
view.require.resolve = origRequire.resolve;
