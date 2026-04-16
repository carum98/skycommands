import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_udid/flutter_udid.dart';
import '../utils/request_http.dart';

export '../utils/request_http.dart' show HttpException;

typedef CommandCallback = Future<String> Function(String command, String? payload);

class SkyCommands {
  final RequestHttp _http;
  SkyCommands({required String host}) : _http = RequestHttp(host);

  final _fcm = FirebaseMessaging.instance;

  void initialize(BackgroundMessageHandler callBack) {
    FirebaseMessaging.onBackgroundMessage(callBack);
    FirebaseMessaging.onMessage.listen(callBack);
  }

  Future<String> register() async {
    final token = await _fcm.getToken();
    final udid = await FlutterUdid.udid;

    final response = await _http.post('/devices', {
      'fcmToken': token,
      'udid': udid,
    });

    return response['code'];
  }

  Future<void> unregister() async {
    final udid = await FlutterUdid.udid;
    await _http.delete('/devices/$udid');
  }

  Future<void> heartbeat() async {
    final udid = await FlutterUdid.udid;
    await _http.post('/devices/heartbeat', {
      'udid': udid,
    });
  }

  Future<void> runner(RemoteMessage message, CommandCallback executeCommand) async {
    final data = message.data;

    if (data.containsKey('commandId') && data.containsKey('command')) {
      final commandId = data['commandId'];
      final command = data['command'];

      Future<void> sendResult(String result) async {
        await _http.post('/commands/result', {'commandId': commandId, 'result': result});
      }

      if (command == 'ping') {
        await sendResult('pong');
        return;
      }

      // Execute the command and get the result
      final result = await executeCommand(command, data['payload']);

      // Send the result back to the server
      await sendResult(result);
    }
  }
}
