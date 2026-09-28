// Expo's Metro config auto-detects npm workspaces (watchFolders + nodeModulesPaths).
// Framework packages point "main"/"react-native" at TypeScript source, which Metro transpiles.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
