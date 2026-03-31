import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/student.dart';
import '../../services/student_service.dart';
import 'package:intl/intl.dart';

class StudentRegistrationScreen extends StatefulWidget {
  const StudentRegistrationScreen({super.key});

  @override
  State<StudentRegistrationScreen> createState() => _StudentRegistrationScreenState();
}

class _StudentRegistrationScreenState extends State<StudentRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _rollNoController = TextEditingController();
  final _contactController = TextEditingController();
  final _dobController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _addressController = TextEditingController();
  
  String? _selectedClass;
  String? _selectedGender;
  String? _selectedBloodGroup;
  bool _isLoading = false;

  final List<String> _classList = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  final List<String> _genderList = ['Male', 'Female', 'Other'];
  final List<String> _bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  @override
  void dispose() {
    _nameController.dispose();
    _rollNoController.dispose();
    _contactController.dispose();
    _dobController.dispose();
    _parentNameController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dobController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  void _submitForm() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        final newStudent = Student(
          name: _nameController.text.trim(),
          studentClass: _selectedClass!,
          rollNo: _rollNoController.text.trim(),
          guardianContact: _contactController.text.trim(),
          dob: _dobController.text.trim(),
          gender: _selectedGender,
          parentName: _parentNameController.text.trim(),
          address: _addressController.text.trim(),
          bloodGroup: _selectedBloodGroup,
          createdAt: DateTime.now(),
        );

        await StudentService().addStudent(newStudent);
        
        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              title: const Row(
                children: [
                  Icon(LucideIcons.checkCircle, color: Colors.green),
                  SizedBox(width: 12),
                  Text('Enrollment Success'),
                ],
              ),
              content: Text('${newStudent.name} has been successfully registered to ${newStudent.studentClass}.'),
              actions: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Close dialog
                    Navigator.pop(context); // Return to student list
                  },
                  child: const Text('View Student Directory'),
                ),
              ],
            ),
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        title: const Text('New Admission', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile Photo Placeholder
              Center(
                child: Stack(
                  children: [
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)],
                        border: Border.all(color: Colors.blue.withOpacity(0.1), width: 4),
                      ),
                      child: Icon(LucideIcons.user, size: 60, color: Theme.of(context).primaryColor.withOpacity(0.3)),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: CircleAvatar(
                        backgroundColor: Theme.of(context).primaryColor,
                        radius: 18,
                        child: const Icon(LucideIcons.camera, size: 18, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              _buildFormSection(
                title: "Personal Details",
                children: [
                  _buildTextField(
                    controller: _nameController,
                    label: 'Full Name',
                    icon: LucideIcons.user,
                    validator: (val) => val == null || val.isEmpty ? 'Enter full name' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedGender,
                          decoration: const InputDecoration(labelText: 'Gender', prefixIcon: Icon(LucideIcons.userCircle)),
                          items: _genderList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (val) => setState(() => _selectedGender = val),
                          validator: (val) => val == null ? 'Select gender' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _dobController,
                          readOnly: true,
                          onTap: () => _selectDate(context),
                          decoration: const InputDecoration(labelText: 'Birth Date', prefixIcon: Icon(LucideIcons.calendar)),
                          validator: (val) => val == null || val.isEmpty ? 'Select DOB' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedBloodGroup,
                          decoration: const InputDecoration(labelText: 'Blood Group', prefixIcon: Icon(LucideIcons.droplets)),
                          items: _bloodGroups.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (val) => setState(() => _selectedBloodGroup = val),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              _buildFormSection(
                title: "Academic Details",
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedClass,
                          decoration: const InputDecoration(labelText: 'Class', prefixIcon: Icon(LucideIcons.graduationCap)),
                          items: _classList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (val) => setState(() => _selectedClass = val),
                          validator: (val) => val == null ? 'Select class' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _rollNoController,
                          label: 'Roll No',
                          icon: LucideIcons.hash,
                          validator: (val) => val == null || val.isEmpty ? 'Enter roll no' : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              _buildFormSection(
                title: "Parent & Contact Info",
                children: [
                  _buildTextField(
                    controller: _parentNameController,
                    label: 'Parent/Guardian Name',
                    icon: LucideIcons.users,
                    validator: (val) => val == null || val.isEmpty ? 'Enter parent name' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _contactController,
                    label: 'Contact Number',
                    icon: LucideIcons.phone,
                    keyboardType: TextInputType.phone,
                    validator: (val) => val == null || val.isEmpty ? 'Enter contact' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _addressController,
                    label: 'Home Address',
                    icon: LucideIcons.mapPin,
                    maxLines: 3,
                    validator: (val) => val == null || val.isEmpty ? 'Enter address' : null,
                  ),
                ],
              ),

              const SizedBox(height: 40),

              _isLoading 
                ? const CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: _submitForm,
                    child: const Text('Register Student'),
                  ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
      ),
      validator: validator,
    );
  }
}
