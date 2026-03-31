import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/notice.dart';
import 'package:intl/intl.dart';

class NoticeDetailScreen extends StatelessWidget {
  final SchoolNotice notice;

  const NoticeDetailScreen({super.key, required this.notice});

  @override
  Widget build(BuildContext context) {
    Color priorityColor;
    switch (notice.priority) {
      case 'High':
        priorityColor = Colors.red;
        break;
      case 'Info':
        priorityColor = Colors.blue;
        break;
      default:
        priorityColor = Colors.orange;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Announcement', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.share2, size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Priority Tag
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: priorityColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.alertCircle, size: 14, color: priorityColor),
                  const SizedBox(width: 6),
                  Text(
                    '${notice.priority} Priority',
                    style: TextStyle(color: priorityColor, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            
            // Title
            Text(
              notice.title,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                height: 1.3,
                color: Color(0xFF1A1F36),
              ),
            ),
            const SizedBox(height: 12),
            
            // Date and Auth
            Row(
              children: [
                Icon(LucideIcons.calendar, size: 16, color: Colors.grey.shade400),
                const SizedBox(width: 8),
                Text(
                  DateFormat('MMMM dd, yyyy • hh:mm a').format(notice.date),
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Divider(height: 1),
            const SizedBox(height: 32),
            
            // Content
            Text(
              notice.content,
              style: TextStyle(
                fontSize: 16,
                height: 1.6,
                color: Colors.blueGrey.shade800,
              ),
            ),
            
            const SizedBox(height: 48),
            
            // Attachments Section
            const Text(
              'ATTACHMENTS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: Colors.blueGrey),
            ),
            const SizedBox(height: 16),
            _buildAttachmentTile('School_Circular_A24.pdf', '1.2 MB'),
            const SizedBox(height: 12),
            _buildAttachmentTile('Event_Schedule.jpg', '450 KB'),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentTile(String fileName, String size) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.fileText, color: Color(0xFF1E88E5), size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(fileName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(size, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
              ],
            ),
          ),
          const Icon(LucideIcons.download, color: Colors.grey, size: 18),
        ],
      ),
    );
  }
}
