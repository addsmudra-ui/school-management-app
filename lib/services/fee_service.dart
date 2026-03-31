import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/fee.dart';

class FeeService {
  final CollectionReference _feesCollection = 
      FirebaseFirestore.instance.collection('fees');

  // Stream of all fee records
  Stream<List<Fee>> getFeesStream() {
    try {
      return _feesCollection.orderBy('dueDate', descending: true).snapshots().map((snapshot) {
        return snapshot.docs.map((doc) {
          return Fee.fromMap(doc.data() as Map<String, dynamic>, doc.id);
        }).toList();
      });
    } catch (e) {
      return Stream.error('Fee record stream failed: $e');
    }
  }

  // Record a payment
  Future<void> updateFeeStatus(String feeId, String newStatus) async {
    try {
      await _feesCollection.doc(feeId).update({'status': newStatus});
    } catch (e) {
      throw Exception('Failed to update fee: $e');
    }
  }

  // Create a new fee entry
  Future<void> addFee(Map<String, dynamic> feeData) async {
    try {
      await _feesCollection.add(feeData);
    } catch (e) {
      throw Exception('Failed to add fee record: $e');
    }
  }

  // Dashboard Aggregates (Paid vs Pending)
  Stream<Map<String, double>> getFeeStatsStream() {
    try {
      return _feesCollection.snapshots().map((snapshot) {
        double paid = 0;
        double pending = 0;
        for (var doc in snapshot.docs) {
          final data = doc.data() as Map<String, dynamic>;
          final amount = (data['amount'] as num).toDouble();
          if (data['status'] == 'Paid') {
            paid += amount;
          } else {
            pending += amount;
          }
        }
        return {'paid': paid, 'pending': pending, 'total': paid + pending};
      });
    } catch (e) {
      return Stream.error('Fee analytics failed: $e');
    }
  }
}
