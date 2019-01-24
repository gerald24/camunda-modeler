'use strict';

const { app } = require('electron');

const DefaultMenuBuilder = require('./menu-builder');

const renderer = require('../util/renderer');
const requirePlatform = require('../util/require-platform');


class Menu {

  /**
   * Constructor.
   *
   * @param {String} platform - Platform.
   * @param {Object} plugins - Plugins instance.
   */
  constructor(platform, plugins) {
    this.plugins = plugins;

    this.state = {};
    this.providers = {};

    this.MenuBuilder = requirePlatform(platform, __dirname, DefaultMenuBuilder);

    this.rebuildMenu = this.rebuildMenu.bind(this);

    this.updateState = this.updateState.bind(this);
  }

  init() {
    renderer.on('menu:register', this.registerMenuProvider.bind(this));

    app.on('menu:action', this.handleMenuAction.bind(this));

    app.on('menu:update', this.updateState);

    renderer.on('menu:update', this.updateState);

    app.on('window-all-closed', this.rebuildMenu);

    renderer.on('context-menu:open', this.openContextMenu.bind(this));

    this.rebuildMenu();
  }

  /**
   *
   * @param {string} type
   * @param {Object} options
   * @param {Object[]} options.newFileMenu
   * @param {Object[]} options.helpMenu
   */
  registerMenuProvider(type, options) {
    if (!type) {
      return;
    }

    if (this.providers[type]) {
      return;
    }

    const {
      helpMenu,
      newFileMenu
    } = options;

    const providerOptions = {};

    providerOptions.helpMenu = helpMenu || [];
    providerOptions.newFileMenu = newFileMenu || [];

    this.providers[type] = providerOptions;

    this.rebuildMenu();
  }

  handleMenuAction(action, options) {
    if (!app.mainWindow) {
      return this.scheduleMenuAction(action, options);
    }

    renderer.send('menu:action', action, options);
  }

  scheduleMenuAction(action, options) {
    app.once('app:client-ready', function() {
      renderer.send('menu:action', action, options);
    });

    app.createEditorWindow();
  }

  updateState(newState = this.state) {
    debugger

    if (!this.state.hasOwnProperty('devtools') && app.mainWindow) {
      const isDevToolsOpened = app.mainWindow.isDevToolsOpened();

      newState = Object.assign({}, newState, { devtools: isDevToolsOpened });
    }

    this.state = newState;

    this.rebuildMenu();
  }

  rebuildMenu() {
    const plugins = this.plugins,
          providers = this.providers,
          state = this.state;

    const menu = new this.MenuBuilder({
      providers,
      state
    }, plugins).build();

    menu.setMenu();
  }

  openContextMenu(type, attrs) {
    const contextMenu = this.buildContextMenu(type, attrs);

    if (!contextMenu) {
      return;
    }

    contextMenu.openPopup();
  }

  buildContextMenu(type, attrs) {
    const state = this.state,
          providers = this.providers;

    const menu = new this.MenuBuilder({
      state,
      providers,
      type,
      attrs
    }).buildContextMenu();

    return menu;
  }
}

module.exports = Menu;
