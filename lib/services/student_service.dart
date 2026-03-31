import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/student.dart';

class StudentService {
  final CollectionReference _studentsCollection = 
      FirebaseFirestore.instance.collection('students');

  // Stream of all students
  Stream<List<Student>> getStudentsStream() {
    try {
      return _studentsCollection.snapshots().map((snapshot) {
        return snapshot.docs.map((doc) {
          return Student.fromMap(doc.data() as Map<String, dynamic>, doc.id);
        }).toList();
      });
    } catch (e) {
      // Return an empty stream or a stream that emits an error for UI to catch
      return Stream.error('Cloud connection failed. Please check your Firebase setup.');
    }
  }

  // Register a new student
  Future<void> addStudent(Map<String, dynamic> studentData) async {
    try {
      await _studentsCollection.add(studentData);
    } catch (e) {
      throw Exception('Failed to register student: $e');
    }
  }

  // Update student details
  Future<void> updateStudent(String id, Map<String, dynamic> data) async {
    try {
      await _studentsCollection.doc(id).update(data);
    } catch (e) {
      throw Exception('Failed to update student: $e');
    }
  }

  // Search students (Server-side partially, client-side for flexibility)
  Stream<List<Student>> searchStudents(String query) {
    try {
      if (query.isEmpty) return getStudentsStream();
      
      // Note: Firestore doesn't support partial string matching well without a 3rd party indexer.
      // We will fetch and filter on client for small-medium school datasets.
      return _studentsCollection.snapshots().map((snapshot) {
        final all = snapshot.docs.map((doc) {
          return Student.fromMap(doc.data() as Map<String, dynamic>, doc.id);
        }).toList();
        
        return all.where((s) => s.name.toLowerCase().contains(query.toLowerCase())).toList();
      });
    } catch (e) {
      return Stream.error('Search failed: Please check your cloud connection.');
    }
  }
}
