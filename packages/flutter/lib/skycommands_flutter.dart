import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_udid/flutter_udid.dart';

const _api = 'http://10.0.2.2:3000';
typedef CommandCallback = Future<String> Function(String command, String? payload);

class SkyCommands {
  static final _client = HttpClient();
  static final _fcm = FirebaseMessaging.instance;

  static void initialize(BackgroundMessageHandler callBack) {
    FirebaseMessaging.onBackgroundMessage(callBack);
    FirebaseMessaging.onMessage.listen(callBack);
  }

  static Future<void> registerDevice() async {
    final token = await _fcm.getToken();
    final udid = await FlutterUdid.udid;

    await _httpPost('/register_device', {
      'fcmToken': token,
      'udid': udid,
    });
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
    await _httpPost('/result', {
      'commandId': commandId,
      'result': result,
    });
  }

  static Future<void> _httpPost(String path, Map<String, dynamic> body) async {
    final url = Uri.parse(_api).replace(path: path);

    final request = await _client.postUrl(url);
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    request.add(utf8.encode(jsonEncode(body)));

    final response = await request.close();
    if (response.statusCode == 200) {
      final responseBody = await response.transform(utf8.decoder).join();
      print('Response: $responseBody');
    } else {
      print('Failed to post data: ${response.statusCode}');
    }
  }
}
