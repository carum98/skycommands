import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';

const _api = 'http://10.0.2.2:3000';
typedef CommandCallback = Future<String> Function(String command, String? payload);

class SkyCommands {
  static final _client = HttpClient();
  static final _fcm = FirebaseMessaging.instance;

  static void initialize(BackgroundMessageHandler callBack) {
    FirebaseMessaging.onBackgroundMessage(callBack);
    FirebaseMessaging.onMessage.listen(callBack);

    _fcm.getToken().then((token) => print('Firebase Messaging Token: $token'));
  }

  static Future<void> runner(RemoteMessage message, CommandCallback executeCommand) async {
    final data = message.data;

    if (data.containsKey('commandId') && data.containsKey('command')) {
      final commandId = data['commandId'];
      final command = data['command'];

      // Execute the command and get the result
      final result = await executeCommand(command, data['payload']);

      // Send the result back to the server
      await _result(commandId, result);
    }
  }

  static Future<void> _result(String commandId, String result) async {
    final url = Uri.parse(_api).replace(path: '/result');

    final request = await _client.postUrl(url);
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    request.add(
      utf8.encode(
        jsonEncode({
          'commandId': commandId,
          'result': result,
        }),
      ),
    );

    final response = await request.close();
    if (response.statusCode == 200) {
      print('Result sent successfully');
    } else {
      print('Failed to send result: ${response.statusCode}');
    }
  }
}
