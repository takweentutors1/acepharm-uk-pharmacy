/// API endpoint configuration. Override at build time with:
/// `flutter run --dart-define=API_BASE_URL=https://acepharm-api.takweencentreuk.workers.dev/api/v1`
abstract final class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.acepharmexams.co.uk/api/v1',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
