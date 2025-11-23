# Installation Instructions

## macOS

When you first open ParzPOS on macOS, you may see a message saying the app is damaged or cannot be opened.

**To fix this:**

### Option 1: Right-click to Open
1. Right-click (or Control+click) on the ParzPOS app
2. Select "Open" from the menu
3. Click "Open" in the dialog that appears
4. The app will now run and will open normally from now on

### Option 2: Command Line
Open Terminal and run:
```bash
xattr -cr /Applications/ParzPOS.app
```
Or if the app is in your Downloads folder:
```bash
xattr -cr ~/Downloads/ParzPOS.app
```

### Option 3: System Settings
1. Try to open the app normally (it will be blocked)
2. Go to System Settings → Privacy & Security
3. Scroll down to find "ParzPOS was blocked..."
4. Click "Open Anyway"

## Windows

Windows may show a SmartScreen warning. Click "More info" then "Run anyway" to proceed.

The installer is unsigned, which is normal for open-source applications without code signing certificates.

## Notes

This app is not notarized or signed with an Apple Developer certificate. This is common for free, open-source applications.
