import 'package:cloud_firestore/cloud_firestore.dart';

class Student {
  final String? id;
  final String name;
  final String studentClass;
  final String rollNo;
  final String guardianContact;
  final String dob;
  
  // New Enhanced Fields
  final String? gender;
  final String? parentName;
  final String? address;
  final String? bloodGroup;
  final String? profileImageUrl;
  
  final DateTime createdAt;

  Student({
    this.id,
    required this.name,
    required this.studentClass,
    required this.rollNo,
    required this.guardianContact,
    required this.dob,
    this.gender,
    this.parentName,
    this.address,
    this.bloodGroup,
    this.profileImageUrl,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'studentClass': studentClass,
      'rollNo': rollNo,
      'guardianContact': guardianContact,
      'dob': dob,
      'gender': gender,
      'parentName': parentName,
      'address': address,
      'bloodGroup': bloodGroup,
      'profileImageUrl': profileImageUrl,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  factory Student.fromMap(Map<String, dynamic> map, String id) {
    return Student(
      id: id,
      name: map['name'] ?? '',
      studentClass: map['studentClass'] ?? '',
      rollNo: map['rollNo'] ?? '',
      guardianContact: map['guardianContact'] ?? '',
      dob: map['dob'] ?? '',
      gender: map['gender'],
      parentName: map['parentName'],
      address: map['address'],
      bloodGroup: map['bloodGroup'],
      profileImageUrl: map['profileImageUrl'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }
}
