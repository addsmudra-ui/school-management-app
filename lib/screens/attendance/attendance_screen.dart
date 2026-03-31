import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/attendance.dart';
import '../../models/student.dart';
import '../../services/attendance_service.dart';
import 'package:intl/intl.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  DateTime _selectedDate = DateTime.now();
  String? _selectedClass;
  bool _isLoading = false;
  final StudentService _studentService = StudentService();
  
  List<Student>? _students;
  final Map<String, bool> _attendanceMap = {};

  final List<String> _classList = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  @override
  void initState() {
    super.initState();
  }

  void _fetchStudents(String className) async {
    setState(() => _isLoading = true);
    try {
      final students = await _studentService.getStudentsByClass(className);
      setState(() {
        _students = students;
        _attendanceMap.clear();
        for (var student in students) {
          _attendanceMap[student.id!] = true;
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error fetching students: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2023),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  void _saveAttendance() async {
    if (_selectedClass == null || _students == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a class and ensure students are loaded!')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final List<Attendance> records = _students!.map((student) {
        return Attendance(
          studentId: student.id!,
          studentName: student.name,
          date: _selectedDate,
          isPresent: _attendanceMap[student.id!] ?? false,
        );
      }).toList();

      await AttendanceService().saveAttendance(records);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Attendance Saved Successfully!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        title: const Text('Attendance', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: Column(
        children: [
          // Filter Header
          Container(
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Select Class', style: TextStyle(fontSize: 12, color: Colors.blueGrey)),
                      DropdownButton<String>(
                        isExpanded: true,
                        underline: const SizedBox(),
                        value: _selectedClass,
                        hint: const Text('Choose...'),
                        items: _classList.map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (newValue) {
                          if (newValue != null) {
                            setState(() => _selectedClass = newValue);
                            _fetchStudents(newValue);
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const VerticalDivider(width: 40),
                Expanded(
                  child: InkWell(
                    onTap: () => _selectDate(context),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Date', style: TextStyle(fontSize: 12, color: Colors.blueGrey)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(LucideIcons.calendar, size: 16, color: Colors.blue),
                            const SizedBox(width: 8),
                            Text(DateFormat('MMM dd, yyyy').format(_selectedDate)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 10),
          
          // Bulk Marking Actions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _students == null ? null : () {
                      setState(() {
                        for (var student in _students!) {
                          _attendanceMap[student.id!] = true;
                        }
                      });
                    },
                    icon: const Icon(LucideIcons.checkCircle, size: 16),
                    label: const Text('All Present'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.green,
                      side: BorderSide(color: Colors.green.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _students == null ? null : () {
                      setState(() {
                        for (var student in _students!) {
                          _attendanceMap[student.id!] = false;
                        }
                      });
                    },
                    icon: const Icon(LucideIcons.xCircle, size: 16),
                    label: const Text('All Absent'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: BorderSide(color: Colors.red.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 10),
          
          // Student List
          Expanded(
            child: _students == null 
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.users, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      const Text('Select a class to mark attendance', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : _students!.isEmpty
                ? const Center(child: Text('No students found in this class'))
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _students!.length,
                    itemBuilder: (context, index) {
                      final student = _students![index];
                final isPresent = _attendanceMap[student.id!] ?? false;
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isPresent ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                      width: 2,
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: (isPresent ? Colors.green : Colors.red).withOpacity(0.1),
                        child: Text(student.rollNo, style: TextStyle(color: isPresent ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(student.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text(student.studentClass, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                      ),
                      
                      // Big Toggle Buttons
                      Row(
                        children: [
                          _buildToggleButton(
                            icon: LucideIcons.checkCircle,
                            isActive: isPresent,
                            activeColor: Colors.green,
                            onTap: () => setState(() => _attendanceMap[student.id!] = true),
                          ),
                          const SizedBox(width: 12),
                          _buildToggleButton(
                            icon: LucideIcons.xCircle,
                            isActive: !isPresent,
                            activeColor: Colors.red,
                            onTap: () => setState(() => _attendanceMap[student.id!] = false),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          
          // Bottom Bar with Save Button
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)],
            ),
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : ElevatedButton(
                  onPressed: _saveAttendance,
                  child: const Text('Save Attendance'),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleButton({
    required IconData icon,
    required bool isActive,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 50,
        width: 50,
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.grey.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: isActive ? Colors.white : Colors.grey.withOpacity(0.3)),
      ),
    );
  }
}
