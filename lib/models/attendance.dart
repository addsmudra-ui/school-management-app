import 'package:cloud_firestore/cloud_firestore.dart';

class Attendance {
  final String? id;
  final String studentId;
  final String studentName;
  final DateTime date;
  final bool isPresent;

  Attendance({
    this.id,
    required this.studentId,
    required this.studentName,
    required this.date,
    required this.isPresent,
  });

  Map<String, dynamic> toMap() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'date': Timestamp.fromDate(date),
      'isPresent': isPresent,
    };
  }

  factory Attendance.fromMap(Map<String, dynamic> map, String id) {
    return Attendance(
      id: id,
      studentId: map['studentId'] ?? '',
      studentName: map['studentName'] ?? '',
      date: (map['date'] as Timestamp).toDate(),
      isPresent: map['isPresent'] ?? false,
    );
  }
}
