import 'dart:convert';
import 'dart:io';

class RequestHttp {
  final String host;
  final _client = HttpClient();

  RequestHttp(this.host);

  Future<Map<String, dynamic>> get(String path) async {
    return await _request('GET', path);
  }

  Future<Map<String, dynamic>> post(String path, Map<String, String?> body) async {
    return await _request('POST', path, body: body);
  }

  Future<void> delete(String path) async {
    await _request('DELETE', path);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, String?>? body,
  }) async {
    final uri = Uri.parse(host).replace(path: path);

    final request = switch (method) {
      'GET' => await _client.getUrl(uri),
      'POST' => await _client.postUrl(uri),
      'DELETE' => await _client.deleteUrl(uri),
      _ => throw ArgumentError('Unsupported HTTP method: $method'),
    };

    if (method == 'POST' && body != null) {
      request.headers.set('content-type', 'application/json');
      request.add(utf8.encode(jsonEncode(body)));
    }

    final response = await request.close();
    if (response.statusCode == 200) {
      final responseBody = await response.transform(utf8.decoder).join();
      return jsonDecode(responseBody);
    } else {
      throw HttpException(
        response.reasonPhrase ?? 'Unknown error',
        statusCode: response.statusCode,
      );
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
