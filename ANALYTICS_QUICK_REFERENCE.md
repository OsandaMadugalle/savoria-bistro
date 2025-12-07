# Quick Reference Guide - Analytics Dashboard

## 🎯 What's New in the Analytics Dashboard

### Accessing Analytics
1. Login to admin account
2. Click "Admin Dashboard"
3. You're on the Analytics tab by default
4. All visualizations load automatically

---

## 📊 8 Interactive Charts

### 1. Summary Statistics (Top of page)
```
Total Customers | Total Orders | Total Revenue | Avg Order Value
```
**Purpose**: High-level business overview  
**Updates**: Real-time as orders come in

### 2. Customer Demographics
**Shows**: Tier distribution (Bronze/Silver/Gold)
```
Bronze: 🟠 ████░░░░░░ 40% (100 customers)
Silver: 🟡 ████░░░░░░ 30% (75 customers)
Gold:   🟡 ██░░░░░░░░ 30% (75 customers)
```
**Plus**: Total loyalty points, avg points/customer

### 3. Revenue Trend (Last 30 Days)
**Chart**: Area chart showing daily revenue
**Use**: Spot revenue patterns and growth trends

### 4. Top 10 Popular Items
**Chart**: Bar chart with units sold vs revenue
```
1. Signature Pizza - 150 units ($2,250)
2. House Salad - 120 units ($840)
3. Pasta Primavera - 110 units ($1,540)
...
```
**Use**: Identify bestsellers, plan promotions

### 5. Revenue by Category
**Chart**: Pie chart showing category breakdown
```
Appetizers: 15%
Main Courses: 45%
Desserts: 20%
Drinks: 20%
```
**Use**: Understand which categories drive revenue

### 6. Reservation Patterns - By Day
**Chart**: Bar chart showing busiest days
```
Mon: ████░░░░░░ 30 bookings
Tue: ███░░░░░░░ 25 bookings
Wed: ███░░░░░░░ 25 bookings
Thu: ██░░░░░░░░ 15 bookings
Fri: ███████░░░ 65 bookings (busiest!)
Sat: ████████░░ 80 bookings (busiest!)
Sun: ████░░░░░░ 35 bookings
```
**Use**: Plan staffing and seating

### 7. Reservation Patterns - By Hour
**Chart**: Line chart showing peak times
```
Peak Hours: 18:00 (6 PM) and 19:00 (7 PM)
Slowest: 11:00 (11 AM) and 14:00 (2 PM)
```
**Use**: Optimize reservation scheduling

### 8. Order Status Distribution
**Chart**: Pie chart + stats table
```
Completed: 75% (300 orders)
Processing: 15% (60 orders)
Pending: 8% (32 orders)
Cancelled: 2% (8 orders)
```
**Use**: Track order fulfillment

---

## 📥 5 Export Buttons (At Top of Page)

### 1. 📊 Revenue Report
**Contains**: Order ID, Date, Customer, Items Count, Subtotal, Discount, Tax, Total, Payment Status, Order Status
**File**: `revenue-report-2025-01-10.csv`
**Use**: Accounting, revenue tracking

### 2. 👥 Customer Report
**Contains**: Customer ID, Name, Email, Phone, Member Since, Total Orders, Loyalty Points, Tier, Total Spent
**File**: `customer-report-2025-01-10.csv`
**Use**: Customer relationship management

### 3. 🍽️ Popular Items
**Contains**: Rank, Item Name, Units Sold, Revenue, Avg Price
**File**: `popular-items-report-2025-01-10.csv`
**Use**: Menu optimization, marketing

### 4. 📅 Reservations
**Contains**: Reservation ID, Customer, Email, Phone, Date, Time, Guests, Special Requests, Status, Created
**File**: `reservations-report-2025-01-10.csv`
**Use**: Operations planning

### 5. ⭐ Tier Analysis
**Contains**: Tier, Count, Percentage, Avg Points, Avg Spent
**File**: `tier-report-2025-01-10.csv`
**Use**: Loyalty program analysis

---

## 💡 How to Use Each Report

### Daily Check
**Best for**: Quick business health check
1. View Revenue Trend chart
2. Check Today's order count
3. See Popular Items this week
4. Takes: 2 minutes

### Weekly Analysis
**Best for**: Mid-level insights
1. Click 📊 Revenue Report
2. Click 👥 Customer Report
3. Review Reservation Patterns
4. Check Popular Items
5. Takes: 10 minutes

### Monthly Deep Dive
**Best for**: Strategic planning
1. Export all 5 reports
2. Analyze Customer Report for spending patterns
3. Check Tier Analysis for loyalty health
4. Review Popular Items for next month's menu
5. Analyze Reservations for staffing
6. Takes: 30-45 minutes

---

## 🎨 Color Coding

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Customer metrics |
| 🟢 Green | Order metrics, good status |
| 🟣 Purple | Revenue, monetary values |
| 🟠 Orange | Warnings, trends, peak times |
| 🟡 Yellow | Tier-based metrics |
| 🔴 Red | Issues, cancelled orders |

---

## 📱 Mobile View

All analytics work on mobile:
- Charts stack vertically
- Export buttons wrap to next line
- Touch-friendly interactions
- Zoom to see details
- Same data, optimized layout

---

## ⚡ Key Metrics at a Glance

### What Each Metric Tells You

**Total Customers**: Growing? Good sign for business  
**Total Orders**: Monthly growth indicates market interest  
**Total Revenue**: Primary success metric  
**Avg Order Value**: Higher = better customer value  

**Revenue by Day**: Spotting busy/slow days  
**Popular Items**: What customers love (menu optimization)  
**Reservation by Day**: When tables are busiest  
**Reservation by Hour**: When to staff up  

**Tier Distribution**: Loyalty program health  
**Avg Loyalty Points**: Customer engagement level  
**Order Status**: Fulfillment efficiency  

---

## 🔍 Data Interpretation Tips

### Revenue Trend
- **Upward arrow**: Growing business
- **Downward arrow**: Need promotions
- **Flat line**: Stable, consistent

### Popular Items
- **High rank**: Feature in marketing
- **Low rank**: Consider removing or revamping
- **Top 3**: Focus on keeping in stock

### Reservation Patterns
- **Friday/Saturday peak**: Prepare for crowds
- **Weekday slow**: Consider specials
- **Evening peak**: Staff accordingly

### Tier Distribution
- **High Gold %**: Strong loyalty program
- **Low Gold %**: Need to incentivize upgrades
- **Balanced**: Healthy customer base

---

## 🚨 Troubleshooting

### Charts not showing data?
- Ensure you have orders/reservations in system
- Refresh page (Ctrl+R)
- Check browser console (F12)

### Export button not working?
- Ensure browser allows downloads
- Check if browser popup blocked
- Try different browser

### Numbers seem wrong?
- Verify data in database
- Check date calculations (last 30 days)
- Confirm no data entry errors

---

## 📊 Sample Interpretation

### Typical Week Analysis

**Monday-Thursday**
- Lower revenue
- Few reservations
- Good time for promotions

**Friday-Saturday**
- 2-3x higher revenue
- Peak reservation times: 6-8 PM
- Need 1.5x staff

**Sunday**
- Recovery day, moderate traffic
- Lunch popular, dinner slower

---

## 📈 Dashboard Update Frequency

| Data | Update Frequency |
|------|------------------|
| Revenue | Real-time |
| Orders | Real-time |
| Customers | When new signup |
| Reservations | When booked |
| Popular Items | Real-time |
| Charts | Auto-refresh |

---

## 🎯 Typical Use Cases

### For Operations Manager
- Check "Reservation by Day" every Monday
- Export Reservations Report for scheduling
- Use Popular Items to stock menu items

### For Marketing Manager
- Export Popular Items for promotions
- Use Revenue Trend for campaign timing
- Check Customer Demographics for targeting

### For Finance Manager
- Export Revenue Report daily
- Track Avg Order Value
- Analyze category revenue

### For Owner
- Check Dashboard daily (2 min check)
- Weekly deep dive with all reports
- Monthly strategy review

---

## 💾 Exporting to Excel

**Step 1**: Click export button  
**Step 2**: CSV file downloads  
**Step 3**: Open in Excel  
**Step 4**: Sort/filter/analyze as needed  

**Pro Tips**:
- Sort by revenue (high to low)
- Filter by date ranges
- Create pivot tables
- Make charts in Excel

---

## 📞 Need Help?

**Chart won't load?** → Refresh page  
**Export not working?** → Check browser settings  
**Data seems wrong?** → Verify database entries  
**Question about metrics?** → Check ANALYTICS_IMPLEMENTATION.md  

---

**Last Updated**: January 10, 2025  
**Version**: 1.0  
**Status**: Ready for Use ✅
