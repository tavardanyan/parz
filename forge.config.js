import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

export default {
  packagerConfig: {
    asar: true,
    osxSign: false,       // ⛔ disable macOS code signing
    osxNotarize: false,    // ⛔ disable macOS notarization
    out: './out'
  },
  rebuildConfig: {
    skip: true   // ⛔ skip native rebuilds
  },
  makers: [
    {
      name: '@electron-forge/maker-zip', // ✅ zip for macOS
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-squirrel', // Windows builds
      platforms: ['win32']
    },
    {
      name: '@electron-forge/maker-deb', // Linux .deb
      platforms: ['linux']
    },
    {
      name: '@electron-forge/maker-rpm', // Linux .rpm
      platforms: ['linux']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
