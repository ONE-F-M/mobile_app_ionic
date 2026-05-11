---
description: Build the mobile app for Android or iOS using Capacitor
---

# Build Mobile App

## Prerequisites
- Ensure `yarn` dependencies are installed
- Android Studio installed (for Android builds)
- Xcode installed (for iOS builds, macOS only)

## Steps

1. Build the web assets:
// turbo
```
yarn build
```

2. Sync with Capacitor (copies web assets + updates native config):
// turbo
```
npx cap sync
```

3. Open in native IDE:

**For Android:**
```
npx cap open android
```

**For iOS:**
```
npx cap open ios
```

4. Build and run from the native IDE (Android Studio or Xcode)

## Notes
- The `yarn build` command runs `node swEnvBuild.js && vite build`
- Web assets are output to `dist/` directory
- `npx cap sync` copies `dist/` to the native project and updates plugins
- You can also use `yarn sync` which combines build + cap sync
