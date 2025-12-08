/**
 * Reporting Service
 * Provides comprehensive reporting and export functionality for admin analytics
 */

/**
 * Export data to CSV format
 */
export const exportToCSV = (filename: string, data: any[], headers: string[]): void => {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] ?? '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

/**
 * Generate revenue report
 */
export const generateRevenueReport = (orders: any[]): any[] => {
  return orders.map(order => ({
    'Order ID': order._id || order.id,
    'Date': new Date(order.createdAt).toLocaleDateString(),
    'Customer': order.customerName || order.email || 'Guest',
    'Items Count': order.items?.length || 0,
    'Subtotal': (order.subtotal || 0).toFixed(2),
    'Discount': (order.discount || 0).toFixed(2),
    'Tax': (order.tax || 0).toFixed(2),
    'Total': (order.total || 0).toFixed(2),
    'Payment Status': order.paymentStatus || 'Pending',
    'Order Status': order.status || 'Processing',
  }));
};

/**
 * Generate customer/loyalty report
 */
export const generateCustomerReport = (users: any[]): any[] => {
  return users
    .filter(u => u.role === 'customer')
    .map(user => ({
      'Customer ID': user._id || user.id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '-',
      'Member Since': new Date(user.memberSince).toLocaleDateString(),
      'Total Orders': user.totalOrders || 0,
      'Loyalty Points': user.loyaltyPoints || 0,
      'Tier': user.tier || 'Bronze',
      'Total Spent': (user.totalSpent || 0).toFixed(2),
    }));
};

/**
 * Generate popular items report
 */
export const generatePopularItemsReport = (orders: any[]): any[] => {
  const itemMap: Record<string, { name: string; count: number; revenue: number }> = {};

  orders.forEach(order => {
    order.items?.forEach((item: any) => {
      if (!itemMap[item.itemId]) {
        itemMap[item.itemId] = { name: item.name, count: 0, revenue: 0 };
      }
      itemMap[item.itemId].count += item.quantity;
      itemMap[item.itemId].revenue += item.price * item.quantity;
    });
  });

  return Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)
    .map((item, idx) => ({
      'Rank': idx + 1,
      'Item Name': item.name,
      'Units Sold': item.count,
      'Revenue': item.revenue.toFixed(2),
      'Avg Price': (item.revenue / item.count).toFixed(2),
    }));
};

/**
 * Generate reservation report
 */
export const generateReservationReport = (reservations: any[]): any[] => {
  return reservations.map(res => ({
    'Reservation ID': res._id || res.id,
    'Customer Name': res.customerName,
    'Email': res.email,
    'Phone': res.phone,
    'Date': new Date(res.date).toLocaleDateString(),
    'Time': res.time,
    'Guests': res.guestCount,
    'Special Requests': res.specialRequests || '-',
    'Status': res.status || 'Confirmed',
    'Created': new Date(res.createdAt).toLocaleDateString(),
  }));
};

/**
 * Generate tier distribution report
 */
export const generateTierReport = (users: any[]): any[] => {
  const customerUsers = users.filter(u => u.role === 'customer');
  
  return [
    {
      'Tier': 'Bronze',
      'Count': customerUsers.filter(u => u.tier === 'Bronze').length,
      'Percentage': (
        (customerUsers.filter(u => u.tier === 'Bronze').length / customerUsers.length) * 100
      ).toFixed(1),
      'Avg Points': (
        customerUsers
          .filter(u => u.tier === 'Bronze')
          .reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Bronze').length || 1)
      ).toFixed(0),
      'Avg Spent': (
        customerUsers
          .filter(u => u.tier === 'Bronze')
          .reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Bronze').length || 1)
      ).toFixed(2),
    },
    {
      'Tier': 'Silver',
      'Count': customerUsers.filter(u => u.tier === 'Silver').length,
      'Percentage': (
        (customerUsers.filter(u => u.tier === 'Silver').length / customerUsers.length) * 100
      ).toFixed(1),
      'Avg Points': (
        customerUsers
          .filter(u => u.tier === 'Silver')
          .reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Silver').length || 1)
      ).toFixed(0),
      'Avg Spent': (
        customerUsers
          .filter(u => u.tier === 'Silver')
          .reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Silver').length || 1)
      ).toFixed(2),
    },
    {
      'Tier': 'Gold',
      'Count': customerUsers.filter(u => u.tier === 'Gold').length,
      'Percentage': (
        (customerUsers.filter(u => u.tier === 'Gold').length / customerUsers.length) * 100
      ).toFixed(1),
      'Avg Points': (
        customerUsers
          .filter(u => u.tier === 'Gold')
          .reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Gold').length || 1)
      ).toFixed(0),
      'Avg Spent': (
        customerUsers
          .filter(u => u.tier === 'Gold')
          .reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 
        (customerUsers.filter(u => u.tier === 'Gold').length || 1)
      ).toFixed(2),
    },
  ];
};

/**
 * Generate summary statistics report
 */
export const generateSummaryReport = (
  orders: any[],
  users: any[],
  reservations: any[],
  menuItems: any[]
): any[] => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalTierPoints = users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0);
  const totalReservations = reservations.length;

  return [
    { 'Metric': 'Total Revenue', 'Value': totalRevenue.toFixed(2) },
    { 'Metric': 'Total Orders', 'Value': totalOrders },
    { 'Metric': 'Average Order Value', 'Value': (totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2) },
    { 'Metric': 'Total Customers', 'Value': totalCustomers },
    { 'Metric': 'Total Reservations', 'Value': totalReservations },
    { 'Metric': 'Total Menu Items', 'Value': menuItems.length },
    { 'Metric': 'Total Loyalty Points', 'Value': totalTierPoints },
    { 'Metric': 'Average Points per Customer', 'Value': (totalCustomers > 0 ? (totalTierPoints / totalCustomers) : 0).toFixed(0) },
    { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() },
  ];
};

/**
 * Generate comprehensive admin report with all analytics
 */
export const generateComprehensiveReport = async (
  orders: any[],
  users: any[],
  reservations: any[],
  menuItems: any[]
): Promise<string> => {
  const timestamp = new Date().toLocaleString();
  const sections: string[] = [];

  sections.push(`COMPREHENSIVE BUSINESS REPORT`);
  sections.push(`Generated: ${timestamp}`);
  sections.push(`${'='.repeat(80)}\n`);

  // Summary Stats
  sections.push(`EXECUTIVE SUMMARY`);
  sections.push(`-`.repeat(80));
  const summaryData = generateSummaryReport(orders, users, reservations, menuItems);
  summaryData.forEach(row => {
    sections.push(`${row.Metric}: ${row.Value}`);
  });
  sections.push('');

  // Key Metrics
  sections.push(`KEY PERFORMANCE INDICATORS (KPIs)`);
  sections.push(`-`.repeat(80));
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const last30Days = orders.filter(o => {
    const date = new Date(o.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });
  const revenue30d = last30Days.reduce((sum, o) => sum + (o.total || 0), 0);
  
  sections.push(`Last 30 Days Revenue: $${revenue30d.toFixed(2)}`);
  sections.push(`Last 30 Days Orders: ${last30Days.length}`);
  sections.push(`Monthly Growth Rate: ${totalRevenue > 0 ? ((revenue30d / totalRevenue) * 100).toFixed(1) : 0}%`);
  sections.push(`Customer Retention: ${users.filter(u => u.role === 'customer' && (u.totalOrders || 0) > 1).length} repeat customers`);
  sections.push('');

  // Tier Distribution
  sections.push(`CUSTOMER TIER DISTRIBUTION`);
  sections.push(`-`.repeat(80));
  const tierReport = generateTierReport(users);
  tierReport.forEach(row => {
    sections.push(`${row.Tier} Tier: ${row.Count} customers (${row.Percentage}%) - Avg Spent: $${row['Avg Spent']}`);
  });
  sections.push('');

  // Popular Items
  sections.push(`TOP 10 POPULAR ITEMS`);
  sections.push(`-`.repeat(80));
  const popularItems = generatePopularItemsReport(orders);
  popularItems.slice(0, 10).forEach(item => {
    sections.push(`${item.Rank}. ${item['Item Name']}: ${item['Units Sold']} sold ($${item.Revenue})`);
  });
  sections.push('');

  // Reservation Stats
  sections.push(`RESERVATION STATISTICS`);
  sections.push(`-`.repeat(80));
  const reservationsByDay = reservations.reduce((acc: any, res: any) => {
    const day = new Date(res.date).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const busiest = Object.entries(reservationsByDay).sort((a: any, b: any) => b[1] - a[1])[0];
  sections.push(`Total Reservations: ${reservations.length}`);
  sections.push(`Busiest Day: ${busiest ? `${busiest[0]} (${busiest[1]} reservations)` : 'N/A'}`);
  sections.push('');

  return sections.join('\n');
};

/**
 * Generate sales report by date range
 */
export const generateSalesReport = (orders: any[], startDate?: Date, endDate?: Date): any[] => {
  const start = startDate || new Date(new Date().getFullYear(), 0, 1);
  const end = endDate || new Date();

  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= start && orderDate <= end;
  });

  const reportByDate: Record<string, any> = {};
  
  filteredOrders.forEach(order => {
    const dateKey = new Date(order.createdAt).toLocaleDateString();
    if (!reportByDate[dateKey]) {
      reportByDate[dateKey] = {
        'Date': dateKey,
        'Orders': 0,
        'Revenue': 0,
        'Avg Order': 0,
        'Items': 0,
      };
    }
    reportByDate[dateKey].Orders += 1;
    reportByDate[dateKey].Revenue += order.total || 0;
    reportByDate[dateKey].Items += order.items?.length || 0;
  });

  // Calculate averages and format
  return Object.values(reportByDate)
    .map((day: any) => ({
      'Date': day.Date,
      'Orders': day.Orders,
      'Total Revenue': day.Revenue.toFixed(2),
      'Avg Order Value': (day.Revenue / day.Orders).toFixed(2),
      'Total Items': day.Items,
    }))
    .sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
};

/**
 * Generate staff performance report
 */
export const generateStaffPerformanceReport = (users: any[], orders: any[]): any[] => {
  const staffUsers = users.filter(u => u.role === 'staff');

  return staffUsers.map(staff => {
    // Count orders handled by this staff member (using email or name reference)
    const staffOrders = orders.filter(o => 
      o.handledBy === staff.email || o.staffId === staff._id
    );

    const totalRevenue = staffOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = staffOrders.length;

    return {
      'Staff Name': staff.name,
      'Email': staff.email,
      'Phone': staff.phone || '-',
      'Total Orders': totalOrders,
      'Total Revenue': totalRevenue.toFixed(2),
      'Avg Revenue per Order': totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0',
      'Shift Hours': staff.shiftHours || 'TBD',
      'Status': staff.status || 'Active',
    };
  });
};

/**
 * Generate inventory management report
 */
export const generateInventoryReport = (menuItems: any[]): any[] => {
  return menuItems.map(item => ({
    'Item ID': item._id || item.id,
    'Item Name': item.name,
    'Category': item.category,
    'Price': item.price?.toFixed(2),
    'Availability': item.available !== false ? 'In Stock' : 'Out of Stock',
    'Dietary': (item.dietary || []).join(', ') || 'None',
    'Prep Time (min)': item.prepTime || '-',
    'Calories': item.calories || '-',
    'Featured': item.featured ? 'Yes' : 'No',
  }));
};

/**
 * Generate simple PDF document (text-based, no library needed)
 */
export const generatePDFReport = (reportTitle: string, content: string): Blob => {
  // Create a simple PDF-like structure using text
  // For production, use jsPDF library
  const lines = content.split('\n');
  let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length ${lines.join(' ').length} >>
stream
BT
/F1 12 Tf
50 750 Td
(${reportTitle}) Tj
0 -20 Td
`;

  lines.forEach((line) => {
    pdfContent += `(${line}) Tj\n0 -15 Td\n`;
  });

  pdfContent += `ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000304 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${pdfContent.length}
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
};

/**
 * Export data to PDF (uses text-based PDF or requires jsPDF)
 */
export const exportToPDF = (filename: string, reportTitle: string, content: string): void => {
  try {
    // Try to use jsPDF if available
    if ((window as any).jsPDF) {
      const { jsPDF } = (window as any);
      const doc = new jsPDF();
      const lines = content.split('\n');
      let yPosition = 20;

      doc.setFontSize(16);
      doc.text(reportTitle, 15, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      lines.forEach(line => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 15, yPosition);
        yPosition += 5;
      });

      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      // Fallback: Download as text file
      const blob = new Blob([content], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      console.warn('jsPDF not available. Exported as text file instead.');
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    // Fallback to text export
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  }
};
