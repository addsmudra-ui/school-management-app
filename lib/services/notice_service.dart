import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/notice.dart';

class NoticeService {
  final CollectionReference _noticesCollection = 
      FirebaseFirestore.instance.collection('notices');

  // Stream of all notices
  Stream<List<SchoolNotice>> getNoticesStream() {
    try {
      return _noticesCollection.orderBy('date', descending: true).snapshots().map((snapshot) {
        return snapshot.docs.map((doc) {
          return SchoolNotice.fromMap(doc.data() as Map<String, dynamic>, doc.id);
        }).toList();
      });
    } catch (e) {
      return Stream.error('Announcement stream failed: $e');
    }
  }

  // Post a new announcement
  Future<void> addNotice(SchoolNotice notice) async {
    try {
      await _noticesCollection.add(notice.toMap());
    } catch (e) {
      throw Exception('Failed to post announcement: $e');
    }
  }

  // Dashboard Stream (Most Recent 5)
  Stream<List<SchoolNotice>> getRecentNoticesStream() {
    return _noticesCollection.orderBy('date', descending: true).limit(5).snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return SchoolNotice.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }
}
