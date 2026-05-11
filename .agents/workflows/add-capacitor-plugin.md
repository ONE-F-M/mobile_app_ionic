---
description: Add a new Capacitor plugin to the mobile app (Android and iOS)
---

# Add Capacitor Plugin

## Steps

1. Install the plugin package:
```
yarn add @capacitor/<plugin-name>
```

2. If the plugin requires configuration, update `capacitor.config.ts`:
```typescript
plugins: {
  // ... existing plugins
  PluginName: {
    // plugin-specific options
  },
}
```

3. Add native permissions if needed:

**Android** — Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.REQUIRED_PERMISSION" />
```

**iOS** — Edit `ios/App/App/Info.plist`:
```xml
<key>NSPermissionUsageDescription</key>
<string>Reason for requesting this permission</string>
```

4. Sync the native projects:
// turbo
```
npx cap sync
```

5. Create a composable wrapper in `src/composable/use<PluginName>.ts`:
```typescript
import { PluginName } from '@capacitor/<plugin-name>';

export const usePluginName = () => {
  const doSomething = async () => {
    const result = await PluginName.method();
    return result;
  };

  return { doSomething };
};
```

## Currently Installed Plugins

| Plugin | Package | Used For |
|--------|---------|----------|
| Camera | `@capacitor/camera` | Photo capture for face enrollment |
| Geolocation | `@capacitor/geolocation` | Location for check-in verification |
| Push Notifications | `@capacitor/push-notifications` | Firebase push notifications |
| Keyboard | `@capacitor/keyboard` | Keyboard resize behavior |
| Status Bar | `@capacitor/status-bar` | Status bar styling |
| Haptics | `@capacitor/haptics` | Haptic feedback |
| Device | `@capacitor/device` | Device info |
| Filesystem | `@capacitor/filesystem` | File operations |
| Google Maps | `@capacitor/google-maps` | Map display |
| App | `@capacitor/app` | App state management |

## Notes
- Always check the [Capacitor plugin docs](https://capacitorjs.com/docs/plugins) for plugin-specific setup
- After `npx cap sync`, rebuild in Android Studio or Xcode
- Test on a real device — some plugins don't work in the browser emulator
