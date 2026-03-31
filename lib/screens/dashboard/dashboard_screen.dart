import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/student.dart';
import '../../services/student_service.dart';
import '../../services/fee_service.dart';
import '../registration/student_registration_screen.dart';
import '../attendance/attendance_screen.dart';
import '../fees/fees_screen.dart';
import '../communication/noticeboard_screen.dart';
import '../students/student_list_screen.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final StudentService studentService = StudentService();
    final FeeService feeService = FeeService();

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            // Trigger a rebuild of the dashboard to refresh streams
            (context as Element).markNeedsBuild();
            await Future.delayed(const Duration(milliseconds: 800));
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              // Dynamic Header
              _buildHeader(context),
              
              const SizedBox(height: 32),
              
              // Statistics Section
              const Text(
                "School Overview",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    StreamBuilder<List<Student>>(
                      stream: studentService.getStudentsStream(),
                      builder: (context, snapshot) {
                        final count = snapshot.hasData ? snapshot.data!.length : 0;
                        return _buildStatCard(context, label: "Students", value: count.toString(), icon: LucideIcons.users, color: Colors.blue);
                      }
                    ),
                    _buildStatCard(context, label: "Attendance", value: "94%", icon: LucideIcons.calendarCheck, color: Colors.green),
                    StreamBuilder<Map<String, double>>(
                      stream: feeService.getFeeStatsStream(),
                      builder: (context, snapshot) {
                        final pending = snapshot.hasData ? (snapshot.data!['pending'] ?? 0).toInt() : 0;
                        return _buildStatCard(context, label: "Fees Due", value: pending.toString(), icon: LucideIcons.wallet, color: Colors.orange);
                      }
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              
              // Main Management Grid
              const Text(
                "Management",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  _buildMenuCard(
                    context,
                    title: 'Student Mgmt',
                    icon: LucideIcons.users,
                    color: const Color(0xFF1E88E5),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentListScreen())),
                  ),
                  _buildMenuCard(
                    context,
                    title: 'Attendance',
                    icon: LucideIcons.calendarCheck,
                    color: const Color(0xFF43A047),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceScreen())),
                  ),
                  _buildMenuCard(
                    context,
                    title: 'Fees Status',
                    icon: LucideIcons.shieldCheck,
                    color: const Color(0xFFFB8C00),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FeesScreen())),
                  ),
                  _buildMenuCard(
                    context,
                    title: 'Noticeboard',
                    icon: LucideIcons.megaphone,
                    color: const Color(0xFFE53935),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeboardScreen())),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),

              // Recent Activity Section
              const Text(
                "Recent Registrations",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              const SizedBox(height: 16),
              _buildRecentActivityList(studentService),
              
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    String greeting = "Good Morning";
    final hour = DateTime.now().hour;
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    if (hour >= 17) greeting = "Good Evening";

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${DateFormat('EEEE, MMM d').format(DateTime.now())}',
              style: const TextStyle(fontSize: 14, color: Colors.blueGrey, fontWeight: FontWeight.w500),
            ),
            Text(
              '$greeting, Admin',
              style: TextStyle(
                fontSize: 26, 
                fontWeight: FontWeight.bold, 
                color: Theme.of(context).primaryColor,
              ),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Theme.of(context).primaryColor.withOpacity(0.1), width: 2),
            color: Colors.white,
          ),
          child: const CircleAvatar(
            radius: 26,
            backgroundImage: NetworkImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, {required String label, required String value, required IconData icon, required Color color}) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 16),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1F36))),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.blueGrey)),
        ],
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, {required String title, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, size: 32, color: color),
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivityList(StudentService service) {
    return StreamBuilder<List<Student>>(
      stream: service.getStudentsStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final students = snapshot.data ?? [];
        if (students.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: Text('No students registered yet', style: TextStyle(color: Colors.grey))),
          );
        }

        // Show last 5
        final recentStudents = students.length > 5 ? students.sublist(0, 5) : students;

        return Column(
          children: recentStudents.map((student) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 5, offset: const Offset(0, 2))],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                    child: Text(student.name[0], style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(student.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Class: ${student.studentClass}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  ),
                  const Text('New', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }).toList(),
        );
      }
    );
  }
}
