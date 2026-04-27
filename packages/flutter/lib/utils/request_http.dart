import 'dart:convert';
import 'dart:io';

class RequestHttp {
  final String host;
  final String? _appKey;
  final _client = HttpClient();

  RequestHttp(this.host, {String? appKey}) : _appKey = appKey;

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
      // Ignore connectivity errors silently
    } on HandshakeException {
      // Ignore connectivity errors silently
    }
  }
}

class HttpException implements Exception {
  final String message;
  final int? statusCode;
  const HttpException(this.message, {this.statusCode});

  @override
  String toString() => 'HttpException: $message (Status code: $statusCode)';
}
