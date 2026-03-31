import 'package:cloud_firestore/cloud_firestore.dart';

class SchoolNotice {
  final String? id;
  final String title;
  final String content;
  final DateTime date;
  final String priority; // 'High', 'Normal', 'Info'

  SchoolNotice({
    this.id,
    required this.title,
    required this.content,
    required this.date,
    required this.priority,
  });

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'content': content,
      'date': Timestamp.fromDate(date),
      'priority': priority,
    };
  }

  factory SchoolNotice.fromMap(Map<String, dynamic> map, String id) {
    return SchoolNotice(
      id: id,
      title: map['title'] ?? '',
      content: map['content'] ?? '',
      date: (map['date'] as Timestamp).toDate(),
      priority: map['priority'] ?? 'Normal',
    );
  }
}
