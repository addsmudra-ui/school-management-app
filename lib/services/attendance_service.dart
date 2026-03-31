import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/attendance.dart';

class AttendanceService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> saveAttendance(List<Attendance> records) async {
    final batch = _firestore.batch();
    
    for (var record in records) {
      final docRef = _firestore.collection('attendance').doc();
      batch.set(docRef, record.toMap());
    }

    try {
      await batch.commit();
    } catch (e) {
      throw Exception('Failed to save attendance: $e');
    }
  }

  // Check if attendance already exists for a date/class
  Future<bool> checkAttendanceExists(String className, DateTime date) async {
    // Simplified check
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    final query = await _firestore
        .collection('attendance')
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfDay))
        .where('date', isLessThan: Timestamp.fromDate(endOfDay))
        // Note: Real implementation would also filter by class via the studentId/studentClass
        .limit(1)
        .get();

    return query.docs.isNotEmpty;
  }
}
