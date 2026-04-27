# SkyCommands

Flutter SDK for the [SkyCommands](https://github.com/carum98/skycommands) platform — receive remote commands on production devices via Firebase Cloud Messaging and send results back to the backend.

Useful for diagnostics, customer support, and operations on already-installed apps: read or write preferences, query the device's local database, force syncs, trigger one-off actions, etc.

## Features

- Remote command dispatch via FCM data messages.
- Foreground and background command handling.
- Built-in `ping` for liveness checks.
- Device registration, heartbeat, and metadata sync.
- Silent handling of connectivity errors — no log noise when the device is offline.
- Configurable connection and request timeouts.

## Requirements

- Flutter `>= 3.19.0`, Dart `>= 3.0.0`.
- **Android only** for now — iOS support is planned for a future release.
- A configured Firebase project with **Cloud Messaging** enabled.
  Follow [`firebase_messaging` setup](https://firebase.flutter.dev/docs/messaging/overview) before using this SDK.
- A running [SkyCommands backend](https://github.com/carum98/skycommands/tree/main/packages/backend) and an `APP_KEY` for authentication.

## Installation

Add the package to your `pubspec.yaml`:

```yaml
dependencies:
  skycommands: ^0.0.1
```

Then run:

```bash
flutter pub get
```

## Quick start

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:skycommands/skycommands.dart';

final skyCommands = SkyCommands(
  host: 'https://your-backend.example.com',
  appKey: 'your-app-key',
);

// Background handler must be a top-level or static function.
@pragma('vm:entry-point')
Future<void> backgroundHandler(RemoteMessage message) async {
  await skyCommands.runner(message, executeCommand);
}

Future<String> executeCommand(String command, String? payload) async {
  switch (command) {
    case 'echo':
      return payload ?? '';
    case 'whoami':
      return 'device-42';
    default:
      throw 'Unknown command: $command';
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  skyCommands.initialize(backgroundHandler);
  await skyCommands.register();

  runApp(const MyApp());
}
```

## Usage

### Register the device

Call once when the user opts in (or at first launch):

```dart
await skyCommands.register();
```

This sends the FCM token and the device UDID to the backend so it can route commands to this device.

### Heartbeat

The backend deletes devices that have not been seen in 30 days. Call `heartbeat()` periodically (e.g. on app start) to keep the registration alive:

```dart
await skyCommands.heartbeat();
```

### Attach metadata

Attach searchable metadata to the device record so operators can identify it from the dashboard:

```dart
await skyCommands.setMetadata({
  'userId': '12345',
  'environment': 'production',
  'appVersion': '2.4.1',
});
```

### Handle commands

Pass an `executeCommand` callback to `runner` — it receives the command name and an optional payload, and must return a `String` result:

```dart
Future<String> executeCommand(String command, String? payload) async {
  switch (command) {
    case 'get_logs':
      return await readLogs();
    case 'clear_cache':
      await clearCache();
      return 'ok';
    default:
      throw 'Unsupported command: $command';
  }
}
```

If the callback throws, the optional `onError` callback is invoked:

```dart
await skyCommands.runner(
  message,
  executeCommand,
  onError: (error) => debugPrint('Command failed: $error'),
);
```

### Unregister

When the user logs out or opts out:

```dart
await skyCommands.unregister();
```

## Background messages

Firebase invokes the background handler from a separate isolate, so the function **must** be top-level or `static`. Closures and instance methods will not work for background messages.

```dart
@pragma('vm:entry-point')
Future<void> backgroundHandler(RemoteMessage message) async {
  await skyCommands.runner(message, executeCommand);
}
```

The `@pragma('vm:entry-point')` annotation prevents the function from being tree-shaken in release builds.

## Error handling

The SDK distinguishes between two kinds of failures:

| Failure | Behavior |
|---|---|
| Connectivity (`SocketException`, `HandshakeException`, `TimeoutException`) | Silently swallowed. The SDK never throws when the device is offline. |
| Backend HTTP error (non-2xx response) | Throws [`HttpException`](#httpexception). |
| `executeCommand` throws | The optional `onError` callback is invoked. The result is not sent back to the server. |

### `HttpException`

```dart
try {
  await skyCommands.register();
} on HttpException catch (e) {
  debugPrint('Backend rejected the request: ${e.statusCode} ${e.message}');
}
```

## API reference

### `SkyCommands`

| Member | Description |
|---|---|
| `SkyCommands({required String host, String? appKey})` | Creates a client. `host` is the backend base URL; `appKey` is the bearer token. |
| `initialize(BackgroundMessageHandler callback)` | Registers FCM message handlers. Idempotent. |
| `register()` | Registers the device on the backend. |
| `unregister()` | Removes the device from the backend. |
| `heartbeat()` | Notifies the backend that the device is still active. |
| `setMetadata(Map<String, dynamic> metadata)` | Updates the device's metadata. |
| `runner(RemoteMessage, CommandCallback, {onError})` | Dispatches an incoming FCM command to the user-supplied callback. |

### `CommandCallback`

```dart
typedef CommandCallback = Future<String> Function(String command, String? payload);
```

## License

MIT — see [LICENSE](LICENSE) for details.
