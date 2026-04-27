import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_udid/flutter_udid.dart';

/// Callback invoked when a remote command is received.
///
/// Receives the [command] name and optional [payload], and must return the
/// result as a [String] which will be sent back to the server.
typedef CommandCallback = Future<String> Function(String command, String? payload);

/// Client SDK for the SkyCommands platform.
///
/// Handles device registration, heartbeats, metadata sync, and dispatches
/// remote commands received via Firebase Cloud Messaging.
class SkyCommands {
  final _RequestHttp _http;

  /// Creates a new SkyCommands client.
  ///
  /// [host] is the base URL of the SkyCommands backend.
  /// [appKey] is the bearer token used to authenticate against the API.
  SkyCommands({required String host, String? appKey}) : _http = _RequestHttp(host, appKey: appKey);

  final _fcm = FirebaseMessaging.instance;

  bool _initialized = false;

  /// Registers the FCM message handlers used to dispatch incoming commands.
  ///
  /// Safe to call multiple times: subsequent calls are no-ops.
  void initialize(BackgroundMessageHandler callBack) {
    if (_initialized) return;
    _initialized = true;

    FirebaseMessaging.onBackgroundMessage(callBack);
    FirebaseMessaging.onMessage.listen(callBack);
  }

  /// Registers this device with the backend using its FCM token and UDID.
  Future<void> register() async {
    final token = await _fcm.getToken();
    final udid = await FlutterUdid.udid;

    await _http.post('/devices', {
      'fcmToken': token,
      'udid': udid,
    });
  }

  /// Removes this device from the backend.
  Future<void> unregister() async {
    final udid = await FlutterUdid.udid;
    await _http.delete('/devices/$udid');
  }

  /// Notifies the backend that this device is still active.
  Future<void> heartbeat() async {
    final udid = await FlutterUdid.udid;
    await _http.post('/devices/heartbeat', {
      'udid': udid,
    });
  }

  /// Updates the device metadata stored on the backend.
  Future<void> setMetadata(Map<String, String?> metadata) async {
    final udid = await FlutterUdid.udid;
    await _http.put('/devices/$udid/metadata', metadata);
  }

  /// Processes an incoming FCM [message] containing a command.
  ///
  /// Invokes [executeCommand] with the command and payload, then sends the
  /// returned result back to the server. The built-in `ping` command is
  /// handled internally and replies with `pong`.
  ///
  /// If [executeCommand] throws, [onError] is invoked with the error message.
  Future<void> runner(
    RemoteMessage message,
    CommandCallback executeCommand, {
    Function(String error)? onError,
  }) async {
    final data = message.data;

    if (data.containsKey('commandId') && data.containsKey('command')) {
      final commandId = data['commandId'];
      final command = data['command'];

      Future<void> sendResult(String result) async {
        await _http.post('/commands/result', {'commandId': commandId, 'result': result});
      }

      try {
        if (command == 'ping') {
          await sendResult('pong');
          return;
        }

        final result = await executeCommand(command, data['payload']);
        await sendResult(result);
      } catch (error) {
        onError?.call(error.toString());
      }
    }
  }
}

/// Internal HTTP client used by [SkyCommands].
///
/// Network connectivity errors ([SocketException], [HandshakeException]) are
/// silently swallowed so the SDK does not surface noise when the device is
/// offline. HTTP errors (non-200 responses) still propagate as [HttpException].
class _RequestHttp {
  final String host;
  final String? _appKey;
  final _client = HttpClient();

  _RequestHttp(this.host, {String? appKey}) : _appKey = appKey;

  Future<void> get(String path) async {
    await _request('GET', path);
  }

  Future<void> post(String path, Map<String, String?> body) async {
    await _request('POST', path, body: body);
  }

  Future<void> put(String path, Map<String, String?> body) async {
    await _request('PUT', path, body: body);
  }

  Future<void> delete(String path) async {
    await _request('DELETE', path);
  }

  Future<void> _request(
    String method,
    String path, {
    Map<String, String?>? body,
  }) async {
    final uri = Uri.parse(host).replace(path: path);

    try {
      final request = switch (method) {
        'GET' => await _client.getUrl(uri),
        'POST' => await _client.postUrl(uri),
        'DELETE' => await _client.deleteUrl(uri),
        'PUT' => await _client.putUrl(uri),
        _ => throw ArgumentError('Unsupported HTTP method: $method'),
      };

      if (_appKey != null) {
        request.headers.set('authorization', 'Bearer $_appKey');
      }

      if (body != null) {
        request.headers.set('content-type', 'application/json');
        request.add(utf8.encode(jsonEncode(body)));
      }

      final response = await request.close();
      if (response.statusCode != 200) {
        throw HttpException(
          response.reasonPhrase ?? 'Unknown error',
          statusCode: response.statusCode,
        );
      }
    } on SocketException {
      // Device is offline or host is unreachable; fail silently.
    } on HandshakeException {
      // TLS handshake failed; treat as a connectivity issue and fail silently.
    }
  }
}

/// Thrown when the backend returns a non-200 HTTP response.
class HttpException implements Exception {
  final String message;
  final int? statusCode;
  const HttpException(this.message, {this.statusCode});

  @override
  String toString() => 'HttpException: $message (Status code: $statusCode)';
}
