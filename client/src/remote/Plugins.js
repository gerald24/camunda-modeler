export default class Plugins {
  constructor(app) {
    this.app = app;
  }

  /**
   * Load all plugins by creating either HTML <link> or <script> tag.
   */
  async loadAll() {
    const pluginDescriptors = this.app.plugins.getAllPluginDescriptors();

    const stylePlugins = pluginDescriptors.filter(pluginDescriptor => pluginDescriptor.style),
          scriptPlugins = pluginDescriptors.filter(pluginDescriptor => pluginDescriptor.script);

    // load style plugins
    stylePlugins.forEach(loadStylePlugin);

    // load script plugins
    return Promise.all(scriptPlugins.map(loadScriptPlugin));
  }

  /**
   * Get all previously registered plugins. Plugins can register themselves using:
   * https://github.com/camunda/camunda-modeler-plugin-helpers
   *
   * @returns {Array}
   */
  getAll() {
    const plugins = window.plugins || [];

    return copy(plugins);
  }

  /**
   * Get plugins of type.
   *
   * @param {String} type - Plugin type.
   *
   * @returns {Array}
   */
  get(type) {
    return this.getAll()
      .filter(plugin => plugin.type === type)
      .map(({ plugin }) => plugin);
  }
}

// helpers //////////

/**
 * Copy an array.
 *
 * @param {Array} array - Array.
 *
 * @returns {Array}
 */
function copy(array) {
  return array.slice(0);
}

/**
 * Load style plugin by creating HTML <link> tag.
 *
 * @param {Object} stylePlugin - Style plugin.
 * @param {String} stylePlugin.style - Path to stylesheet.
 */
function loadStylePlugin(stylePlugin) {
  const { style } = stylePlugin;

  const styleTag = document.createElement('link');

  styleTag.href = style;
  styleTag.rel = 'stylesheet';

  document.head.appendChild(styleTag);
}

/**
 * Load script plugin by creating HTML <script> tag.
 *
 * @param {Object} scriptPlugin - Script plugin.
 * @param {String} scriptPlugin.script - Path to script.
 */
function loadScriptPlugin(scriptPlugin) {
  const { script } = scriptPlugin;

  return new Promise(resolve => {
    const scriptTag = document.createElement('script');

    scriptTag.src = script;
    scriptTag.type = 'text/javascript';
    scriptTag.async = false;
    scriptTag.onload = resolve;

    document.head.appendChild(scriptTag);
  });
}