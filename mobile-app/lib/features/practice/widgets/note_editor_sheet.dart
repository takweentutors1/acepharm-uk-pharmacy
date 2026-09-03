import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../question_note.dart';
import '../question_repository.dart';

Future<void> showNoteEditorSheet({
  required BuildContext context,
  required QuestionRepository questionRepository,
  required String questionId,
}) {
  return AceModalSheet.show(
    context: context,
    title: 'Personal clinical notes',
    builder: (context) => _NoteEditorBody(
      questionRepository: questionRepository,
      questionId: questionId,
    ),
  );
}

class _NoteEditorBody extends StatefulWidget {
  const _NoteEditorBody({
    required this.questionRepository,
    required this.questionId,
  });

  final QuestionRepository questionRepository;
  final String questionId;

  @override
  State<_NoteEditorBody> createState() => _NoteEditorBodyState();
}

class _NoteEditorBodyState extends State<_NoteEditorBody> {
  late Future<List<QuestionNote>> _notesFuture = widget.questionRepository
      .fetchNotes(widget.questionId);
  final _contentController = TextEditingController();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) return;
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await widget.questionRepository.saveNote(
        widget.questionId,
        content: content,
      );
      _contentController.clear();
      if (!mounted) return;
      setState(() {
        _notesFuture = widget.questionRepository.fetchNotes(widget.questionId);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "Couldn't save your note. Try again.");
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AceInput(
          label: 'Add a note',
          controller: _contentController,
          hintText: 'e.g. Remember first-line NICE guidance for this class',
        ),
        if (_error != null) ...[
          const SizedBox(height: AceSpacing.xs),
          Text(
            _error!,
            style: const TextStyle(color: AceColors.dangerRose, fontSize: 13),
          ),
        ],
        const SizedBox(height: AceSpacing.sm),
        AceButton(label: 'Save note', isLoading: _isSaving, onPressed: _save),
        const SizedBox(height: AceSpacing.lg),
        FutureBuilder<List<QuestionNote>>(
          future: _notesFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: AceSpacing.lg),
                child: Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              );
            }
            final notes = snapshot.data ?? const [];
            if (notes.isEmpty) {
              return const Text(
                'No notes yet on this question.',
                style: TextStyle(color: AceColors.slateLight),
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final note in notes)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AceSpacing.sm),
                    child: AceCard(child: Text(note.content)),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}
