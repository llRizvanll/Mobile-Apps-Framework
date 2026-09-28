// Expo's Metro config resolves the tsconfig `paths` aliases (@framework/*, @features/*, ...).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
