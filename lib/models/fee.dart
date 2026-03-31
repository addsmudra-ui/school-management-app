import 'package:cloud_firestore/cloud_firestore.dart';

class Fee {
  final String? id;
  final String studentId;
  final String studentName;
  final double amount;
  final DateTime dueDate;
  final String status; // 'Paid', 'Pending', 'Overdue'

  Fee({
    this.id,
    required this.studentId,
    required this.studentName,
    required this.amount,
    required this.dueDate,
    required this.status,
  });

  Map<String, dynamic> toMap() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'amount': amount,
      'dueDate': Timestamp.fromDate(dueDate),
      'status': status,
    };
  }

  factory Fee.fromMap(Map<String, dynamic> map, String id) {
    return Fee(
      id: id,
      studentId: map['studentId'] ?? '',
      studentName: map['studentName'] ?? '',
      amount: (map['amount'] ?? 0.0).toDouble(),
      dueDate: (map['dueDate'] as Timestamp).toDate(),
      status: map['status'] ?? 'Pending',
    );
  }
}
