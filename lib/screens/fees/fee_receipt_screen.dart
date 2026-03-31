import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/fee.dart';
import 'package:intl/intl.dart';

class FeeReceiptScreen extends StatelessWidget {
  final Fee fee;

  const FeeReceiptScreen({super.key, required this.fee});

  @override
  Widget build(BuildContext context) {
    final statusColor = fee.status == 'Paid' ? Colors.green : (fee.status == 'Overdue' ? Colors.red : Colors.orange);
    
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Fee Receipt', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.download, size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Receipt PDF generation started...')));
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Official Receipt Card
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 30)],
              ),
              child: Column(
                children: [
                   _buildReceiptHeader(context, statusColor),
                   const Divider(height: 1),
                   _buildStudentInfo(context),
                   const Divider(height: 1),
                   _buildPaymentBreakdown(context),
                   _buildReceiptFooter(context, statusColor),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Support Info
            Text(
              'Questions about this receipt? Contact the Accounts Office at +91 1234 567890',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptHeader(BuildContext context, Color statusColor) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('EDU-MANAGE Pro', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 1, color: Color(0xFF1E88E5))),
                  Text('Official Fee Receipt', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  border: Border.all(color: statusColor.withOpacity(0.3), width: 1.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  fee.status.toUpperCase(),
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1),
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          Text(
            '\$${fee.amount.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Color(0xFF1A1F36)),
          ),
          Text(
            'Receipt No: #RCT-${fee.id?.toUpperCase() ?? '00921'}',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentInfo(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('STUDENT INFORMATION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: Colors.blueGrey)),
          const SizedBox(height: 16),
          _buildInfoRow('Name', fee.studentName),
          _buildInfoRow('Student ID', '#STU-${fee.studentId}'),
          _buildInfoRow('Due Date', DateFormat('MMM dd, yyyy').format(fee.dueDate)),
          _buildInfoRow('Payment Method', fee.status == 'Paid' ? 'Online/Card' : 'N/A'),
        ],
      ),
    );
  }

  Widget _buildPaymentBreakdown(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('FEES BREAKDOWN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: Colors.blueGrey)),
          const SizedBox(height: 16),
          _buildFeeItem('Tuition Fees', fee.amount * 0.8),
          _buildFeeItem('Library & Lab', fee.amount * 0.15),
          _buildFeeItem('Sports & Physical Edu', fee.amount * 0.05),
          const SizedBox(height: 8),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F36))),
              Text('\$${fee.amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E88E5))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptFooter(BuildContext context, Color statusColor) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(24), bottomRight: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.checkCircle2, color: statusColor.withOpacity(0.2), size: 40),
          const SizedBox(height: 8),
          Text(
            fee.status == 'Paid' ? 'Signed digitally by Registrar' : 'Awaiting payment confirmation',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF1A1F36))),
        ],
      ),
    );
  }

  Widget _buildFeeItem(String label, double amount) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
          Text('\$${amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, color: Colors.blueGrey)),
        ],
      ),
    );
  }
}
