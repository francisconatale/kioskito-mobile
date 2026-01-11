// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql'); // Optional

const { resolver } = config;

// Fix for expo-sqlite on web (WASM bundling)
// WASM should be treated as an asset so Metro resolves it as a file URI, not source code
if (!resolver.assetExts.includes('wasm')) {
    resolver.assetExts.push('wasm');
}
if (resolver.sourceExts.includes('wasm')) {
    resolver.sourceExts = resolver.sourceExts.filter(ext => ext !== 'wasm');
}

module.exports = config;
