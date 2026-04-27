import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:skycommands/skycommands.dart';

final skyCommands = SkyCommands(
  host: 'https://your-backend.example.com',
  appKey: 'your-app-key',
);

/// User-defined command handler. Add cases for the commands your app supports.
Future<String> executeCommand(String command, String? payload) async {
  switch (command) {
    case 'echo':
      return payload ?? '';
    case 'whoami':
      return 'example-device';
    default:
      throw 'Unsupported command: $command';
  }
}

/// Must be a top-level function annotated with `@pragma('vm:entry-point')`
/// because Firebase invokes it from a separate isolate.
@pragma('vm:entry-point')
Future<void> backgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await skyCommands.runner(message, executeCommand);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  skyCommands.initialize(backgroundHandler);

  runApp(const ExampleApp());
}

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SkyCommands Example',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _status = 'Idle';

  Future<void> _run(String label, Future<void> Function() action) async {
    setState(() => _status = '$label…');
    try {
      await action();
      setState(() => _status = '$label: ok');
    } catch (e) {
      setState(() => _status = '$label: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SkyCommands Example')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton(
              onPressed: () => _run('Register', skyCommands.register),
              child: const Text('Register device'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () => _run('Heartbeat', skyCommands.heartbeat),
              child: const Text('Send heartbeat'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () => _run(
                'Metadata',
                () => skyCommands.setMetadata({
                  'environment': 'example',
                  'appVersion': '1.0.0',
                }),
              ),
              child: const Text('Set metadata'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () => _run('Unregister', skyCommands.unregister),
              child: const Text('Unregister device'),
            ),
            const Spacer(),
            Text(_status, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
