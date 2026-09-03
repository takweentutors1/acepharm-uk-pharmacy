import 'ace_citation.dart';

enum AceMessageRole { user, assistant }

/// A single turn in the local Ask Ace transcript. The server itself is
/// stateless per-call — this list only exists client-side to render the
/// conversation within one sheet session; continuity across calls is via
/// [threadId] on the repository, not this list.
class AceChatMessage {
  const AceChatMessage({
    required this.role,
    required this.content,
    this.citations = const [],
    this.isRefusal = false,
  });

  final AceMessageRole role;
  final String content;
  final List<AceCitation> citations;

  /// True for a deterministic out-of-coverage refusal — styled distinctly
  /// so it never reads like a normal confident answer.
  final bool isRefusal;
}
