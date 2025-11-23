# Build Configuration Notes

## Current Setup

### Platforms
- **macOS**: DMG and ZIP (universal binary)
- **Windows x64**: 64-bit NSIS installer
- **Windows ia32**: 32-bit NSIS installer

### Code Signing
**All builds are UNSIGNED** - This is intentional for free distribution without paid developer certificates.

## Known Issues & Solutions

### macOS: "App is damaged" Error
This occurs because the app is not notarized by Apple.

**Users must bypass Gatekeeper** using one of these methods:
1. Right-click the app → Open → Open (easiest)
2. Run: `xattr -cr /path/to/ParzPOS.app`
3. System Settings → Privacy & Security → "Open Anyway"

See [INSTALL.md](INSTALL.md) for detailed instructions.

### Windows: "Not a valid Win32 application" Error
This can occur due to:
1. **Corrupted download** - Re-download from GitHub releases
2. **Antivirus interference** - Temporarily disable and re-download
3. **Build failure** - Check GitHub Actions logs

### CI Build Configuration
The workflow uses `CSC_IDENTITY_AUTO_DISCOVERY: false` to prevent electron-builder from attempting to sign builds in CI without certificates.

## Local Development

### Building Locally
```bash
# macOS/Linux
npm run build

# Windows x64
npm run build:win

# Windows ia32
npm run build:win32
```

### Why Local Builds Work but CI Builds Don't
- Local builds may use system keychain/certificates automatically
- CI builds run in a clean environment without any signing certificates
- The `CSC_IDENTITY_AUTO_DISCOVERY: false` flag ensures CI builds skip signing

## Future: Proper Code Signing

To eliminate these issues, you would need:

### macOS
1. Apple Developer Account ($99/year)
2. Developer ID Application certificate
3. App notarization through Apple's notary service
4. Set environment variables in GitHub Actions:
   - `CSC_LINK` (base64 encoded certificate)
   - `CSC_KEY_PASSWORD`
   - `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`

### Windows
1. Code signing certificate from a trusted CA ($100-400/year)
2. Set environment variables in GitHub Actions:
   - `WIN_CSC_LINK` (base64 encoded certificate)
   - `WIN_CSC_KEY_PASSWORD`

## Troubleshooting

### If builds fail in CI
1. Check GitHub Actions logs
2. Ensure `dist/` folder contains `.exe` (Windows) or `.dmg`/`.zip` (macOS)
3. Verify file sizes are reasonable (100-200MB typically)
4. Check for error messages during the electron-builder step

### If downloads are corrupted
1. Compare file hash/size with what CI reports
2. Try different browser or download manager
3. Check Windows Defender/antivirus quarantine
4. Download the artifact directly from GitHub Actions (90-day retention)
