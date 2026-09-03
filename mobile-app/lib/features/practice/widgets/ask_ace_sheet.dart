import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../ace_message.dart';
import '../ace_repository.dart';

/// The "Ask Ace about this question" bottom sheet, opened from beneath
/// the explanation card on [QuestionScreen]. Grounded strictly in
/// reviewed clinical context for this question via the RAG-backed
/// `/api/v1/ace/message` endpoint.
Future<void> showAskAceSheet({
  required BuildContext context,
  required AceRepository aceRepository,
  required String questionId,
  String? userId,
}) {
  return AceModalSheet.show(
    context: context,
    title: 'Ask Ace about this question',
    builder: (context) => _AskAceBody(
      aceRepository: aceRepository,
      questionId: questionId,
      userId: userId,
    ),
  );
}

class _AskAceBody extends StatefulWidget {
  const _AskAceBody({
    required this.aceRepository,
    required this.questionId,
    required this.userId,
  });

  final AceRepository aceRepository;
  final String questionId;
  final String? userId;

  @override
  State<_AskAceBody> createState() => _AskAceBodyState();
}

class _AskAceBodyState extends State<_AskAceBody> {
  final _controller = TextEditingController();
  final List<AceChatMessage> _messages = [];
  String? _threadId;
  bool _isSending = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final prompt = _controller.text.trim();
    if (prompt.isEmpty || _isSending) return;

    setState(() {
      _messages.add(AceChatMessage(role: AceMessageRole.user, content: prompt));
      _controller.clear();
      _isSending = true;
      _error = null;
    });

    try {
      final result = await widget.aceRepository.sendMessage(
        contextId: widget.questionId,
        prompt: prompt,
        threadId: _threadId,
        userId: widget.userId,
      );
      if (!mounted) return;
      setState(() {
        _threadId = result.threadId;
        _messages.add(
          AceChatMessage(
            role: AceMessageRole.assistant,
            content: result.content,
            citations: result.citations,
            isRefusal: result.refused,
          ),
        );
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "Ace couldn't respond. Try again.");
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.45,
          ),
          child: _messages.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: AceSpacing.lg),
                  child: Text(
                    'Ask Ace to clarify anything about this question — '
                    'grounded strictly in reviewed BNF and NICE guidance.',
                    style: TextStyle(color: AceColors.slate),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: _messages.length,
                  itemBuilder: (context, index) =>
                      _MessageBubble(message: _messages[index]),
                ),
        ),
        if (_isSending) ...[
          const SizedBox(height: AceSpacing.sm),
          const Row(
            children: [
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: AceSpacing.sm),
              Text(
                'Ace is thinking…',
                style: TextStyle(color: AceColors.slate, fontSize: 13),
              ),
            ],
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: AceSpacing.sm),
          Text(
            _error!,
            style: const TextStyle(color: AceColors.dangerRose, fontSize: 13),
          ),
        ],
        const SizedBox(height: AceSpacing.sm),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: AceInput(label: 'Your question', controller: _controller),
            ),
            const SizedBox(width: AceSpacing.sm),
            IconButton.filled(
              onPressed: _isSending ? null : _send,
              icon: const Icon(Icons.send),
            ),
          ],
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final AceChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == AceMessageRole.user;
    // A refusal is never styled like a confident indigo answer — neutral
    // background plus an explicit icon + label, so it can't be mistaken
    // for normal grounded guidance at a glance.
    final bubbleColor = isUser
        ? AceColors.aceIndigo
        : (message.isRefusal ? AceColors.canvas : AceColors.indigoWash);
    final textColor = isUser
        ? AceColors.surface
        : (message.isRefusal ? AceColors.slate : AceColors.ink);

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: AceSpacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: AceSpacing.md,
          vertical: AceSpacing.sm,
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.circular(14),
          border: message.isRefusal
              ? Border.all(color: AceColors.border)
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.isRefusal) ...[
              const Row(
                children: [
                  Icon(Icons.info_outline, size: 14, color: AceColors.slate),
                  SizedBox(width: 4),
                  Text(
                    'Outside reviewed curriculum',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AceColors.slate,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
            ],
            Text(message.content, style: TextStyle(color: textColor)),
            if (message.citations.isNotEmpty) ...[
              const SizedBox(height: AceSpacing.xs),
              for (final citation in message.citations)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    '— ${citation.displayLabel}',
                    style: TextStyle(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: isUser ? AceColors.indigoWash : AceColors.slate,
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
