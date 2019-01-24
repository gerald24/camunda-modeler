const path = require('path'),
      glob = require('glob');

class Plugins {
  constructor(options = {}) {
    this.options = options;

    const { directories } = options;

    this.pluginDescriptors = this._createPluginDescriptors(directories);
  }

  _createPluginDescriptors(directories = []) {
    const pluginPaths = getPluginPathsFromDirectories(directories);

    return createPluginDescriptorsFromPaths(pluginPaths);
  }

  getAllPluginDescriptors() {
    return this.pluginDescriptors;
  }
}

module.exports = Plugins;

// helpers //////////

/**
 * Get all plugin paths.
 *
 * @param {Array} paths - Paths.
 *
 * @returns {Array}
 */
function getPluginPathsFromDirectories(directories = []) {
  return directories.reduce((pluginPaths, directory) => {
    const options = {
      cwd: directory,
      ignore: 'plugins/**/node_modules/**/index.js',
      nodir: true,
      realpath: true
    };

    return [
      ...pluginPaths,
      ...glob.sync('plugins/**/index.js', options)
    ];
  }, []);
}

/**
 * Get plugin descriptors from plugin paths.
 *
 * @param {Array} pluginPaths - Plugin paths.
 *
 * @returns {Array}
 */
function createPluginDescriptorsFromPaths(pluginPaths) {
  return pluginPaths.map(pluginPath => {
    pluginPath = path.dirname(pluginPath);

    const descriptor = require(pluginPath);

    const plugin = {};

    // set plugin name
    plugin.name = descriptor.name || '<unknown plugin>';

    // style plugins
    if (descriptor.style) {
      let stylePath = path.join(pluginPath, descriptor.style),
          styleFiles = glob.sync(stylePath);

      if (!styleFiles.length) {
        plugin.error = true;
      } else {
        plugin.style = stylePath;
      }
    }

    // script plugins
    if (descriptor.script) {
      let scriptPath = path.join(pluginPath, descriptor.script),
          scriptFiles = glob.sync(scriptPath);

      if (!scriptFiles.length) {
        plugin.error = true;
      } else {
        plugin.script = scriptPath;
      }
    }

    // menu plugins
    if (descriptor.menu) {
      let menuPath = path.join(pluginPath, descriptor.menu);

      try {
        plugin.menu = require(menuPath);
      } catch (e) {
        console.error(e);

        plugin.error = true;
      }
    }

    return plugin;
  });
}