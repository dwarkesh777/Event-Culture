const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to prevent ESM import.meta errors in Web/Hermes
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
