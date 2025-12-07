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
