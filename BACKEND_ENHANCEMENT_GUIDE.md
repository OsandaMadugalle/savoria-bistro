# Backend Enhancement Guide - Staff Tracking & Inventory Management

## Overview

This guide covers optional backend enhancements to fully support the new reporting features, particularly for staff performance tracking and inventory management.

---

## 1. Staff Performance Tracking

### Current Status
- Basic staff performance data is available through `handledBy` and `staffId` fields in orders
- Staff data is fetched from the User model filtered by `role: 'staff'`

### Recommended Enhancements

#### 1.1 Order Model Enhancement

**File**: `server/models/Order.js`

Add tracking fields for staff attribution:

```javascript
const orderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Staff tracking (NEW)
  handledBy: {
    type: String,          // Staff email
    default: null
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Order fulfillment tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // ... rest of schema ...
}, { timestamps: true });
```

#### 1.2 Update Order Creation Route

**File**: `server/routes/orders.js`

Capture staff information when order is created:

```javascript
// In POST /orders endpoint
router.post('/', async (req, res) => {
  try {
    const { items, total, customerName, userEmail, handledBy } = req.body;
    
    const order = new Order({
      items,
      total,
      customerName,
      email: userEmail,
      handledBy: handledBy || userEmail,  // NEW: Attribute to staff member
      status: 'Pending',
      createdAt: new Date()
    });
    
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### 1.3 Staff Performance Endpoint (NEW)

Add a new endpoint to calculate staff metrics:

```javascript
// In server/routes/orders.js

/**
 * Get staff performance metrics
 */
router.get('/staff/performance', async (req, res) => {
  try {
    const staffPerformance = await Order.aggregate([
      {
        $match: { handledBy: { $ne: null } }
      },
      {
        $group: {
          _id: '$handledBy',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgRevenue: { $avg: '$total' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);
    
    res.json(staffPerformance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### 1.4 Staff Model Enhancement (Optional)

**File**: `server/models/User.js`

Add staff-specific fields:

```javascript
// Add to schema for staff members
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Staff-specific fields (only for role='staff')
  shiftHours: String,                    // "9AM-5PM"
  startDate: { type: Date, default: Date.now },
  status: {                              // Active, On Leave, Terminated
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  performanceRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 3
  },
  orderCount: {                          // Cached count
    type: Number,
    default: 0
  }
});
```

---

## 2. Inventory Management

### Current Status
- Menu items are stored with basic information
- Availability tracking can be implemented

### Recommended Enhancements

#### 2.1 MenuItem Model Enhancement

**File**: `server/models/MenuItem.js`

Add inventory management fields:

```javascript
const menuItemSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Inventory Management (NEW)
  available: {
    type: Boolean,
    default: true
  },
  
  stock: {
    quantity: {
      type: Number,
      default: 0
    },
    unit: {                              // 'pieces', 'kg', 'liters', etc.
      type: String,
      default: 'pieces'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  reorderLevel: {
    type: Number,
    default: 10
  },
  
  supplier: String,
  cost: Number,                          // Cost to prepare
  margin: Number,                        // Profit margin percentage
  
  // Availability status
  outOfStockSince: Date,
  availabilityNotes: String
});
```

#### 2.2 Inventory Tracking Endpoint (NEW)

Add endpoint to update and retrieve inventory:

```javascript
// In server/routes/menu.js

/**
 * Get inventory status
 */
router.get('/inventory', async (req, res) => {
  try {
    const inventory = await MenuItem.find({}, {
      name: 1,
      category: 1,
      price: 1,
      available: 1,
      stock: 1,
      reorderLevel: 1,
      cost: 1,
      supplier: 1
    });
    
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update inventory level
 */
router.patch('/inventory/:id', async (req, res) => {
  try {
    const { quantity, unit, available } = req.body;
    
    const update = {
      'stock.quantity': quantity,
      'stock.unit': unit,
      'stock.lastUpdated': new Date(),
      available: available
    };
    
    const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get low-stock items (below reorder level)
 */
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const lowStock = await MenuItem.find({
      'stock.quantity': { $lt: '$reorderLevel' }
    });
    
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### 2.3 Inventory Alert System (Optional)

```javascript
// In server/utils/inventoryService.js

/**
 * Check for low stock and generate alerts
 */
exports.checkLowStock = async () => {
  try {
    const lowStockItems = await MenuItem.find({
      $expr: { $lt: ['$stock.quantity', '$reorderLevel'] }
    });
    
    return {
      itemsNeedingReorder: lowStockItems.length,
      items: lowStockItems.map(item => ({
        name: item.name,
        currentStock: item.stock.quantity,
        reorderLevel: item.reorderLevel,
        supplier: item.supplier
      }))
    };
  } catch (err) {
    console.error('Error checking low stock:', err);
    return { error: err.message };
  }
};
```

---

## 3. Sales Report Enhancement

### Backend Aggregation (Optional)

For high-volume operations, consider doing aggregation on backend:

**File**: `server/routes/orders.js`

```javascript
/**
 * Get daily sales report
 */
router.get('/sales-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
          itemCount: { $sum: { $size: '$items' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json(salesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 4. Activity Logging Enhancement

### Track Report Generation

**File**: `server/utils/emailService.js` or create new `reportingService.js`

```javascript
/**
 * Log report generation for audit trail
 */
const logReportGeneration = async (reportType, adminEmail, filters = {}) => {
  try {
    const activity = new ActivityLog({
      type: 'Report Generated',
      description: `${reportType} report generated`,
      email: adminEmail,
      timestamp: new Date(),
      metadata: {
        reportType,
        filters
      }
    });
    
    await activity.save();
  } catch (err) {
    console.error('Error logging report generation:', err);
  }
};

module.exports = { logReportGeneration };
```

---

## 5. API Endpoints Summary

### Recommended New Endpoints

```
GET  /api/orders/staff/performance          - Staff metrics
GET  /api/orders/sales-report               - Daily sales data
GET  /api/menu/inventory                    - Inventory status
PATCH /api/menu/inventory/:id               - Update stock levels
GET  /api/menu/inventory/low-stock          - Low stock alerts
POST /api/reports/generate                  - Generate report
POST /api/reports/email                     - Email report
```

---

## 6. Frontend Integration Points

### Using Backend Data

The frontend can now use these endpoints for real-time data:

```typescript
// In reportingService.ts

export const fetchSalesReportFromAPI = async (startDate?: Date, endDate?: Date) => {
  try {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate.toISOString());
    if (endDate) query.append('endDate', endDate.toISOString());
    
    const response = await fetch(`/api/orders/sales-report?${query}`);
    return await response.json();
  } catch (err) {
    console.error('Error fetching sales report:', err);
    throw err;
  }
};

export const fetchInventoryStatus = async () => {
  try {
    const response = await fetch('/api/menu/inventory');
    return await response.json();
  } catch (err) {
    console.error('Error fetching inventory:', err);
    throw err;
  }
};
```

---

## 7. Database Indexes

### Performance Optimization

Add these indexes to improve query performance:

```javascript
// In Order model
orderSchema.index({ handledBy: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ email: 1, createdAt: -1 });

// In MenuItem model
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ 'stock.quantity': 1 });
```

---

## 8. Implementation Roadmap

### Phase 1: Core Implementation (Week 1)
- ✅ Frontend reporting service (completed)
- ✅ CSV exports (completed)
- [ ] Add `handledBy` field to Order model
- [ ] Add basic inventory fields to MenuItem

### Phase 2: API Endpoints (Week 2)
- [ ] Staff performance endpoint
- [ ] Inventory management endpoints
- [ ] Sales report aggregation
- [ ] Low stock alerts

### Phase 3: Advanced Features (Week 3)
- [ ] Email report delivery
- [ ] Scheduled report generation
- [ ] Real-time inventory dashboard
- [ ] Staff performance tracking dashboard

### Phase 4: Analytics (Week 4)
- [ ] Predictive inventory management
- [ ] Staff performance trends
- [ ] Revenue forecasting
- [ ] Seasonal analysis

---

## 9. Testing Checklist

### Staff Performance
- [ ] Orders properly attributed to staff
- [ ] Revenue calculations accurate
- [ ] Inactive staff excluded from reports
- [ ] Performance ranking correct

### Inventory
- [ ] Stock levels update correctly
- [ ] Low stock alerts trigger
- [ ] Availability status reflects stock
- [ ] Supplier information tracked

### Sales Reports
- [ ] Date filtering works
- [ ] Revenue calculations match
- [ ] Item counts accurate
- [ ] Trends identified correctly

---

## 10. Security Considerations

### Access Control
Ensure reports can only be accessed by authorized users:

```javascript
// In route middleware
const authorizeAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (!['admin', 'masterAdmin'].includes(userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

router.get('/sales-report', authorizeAdmin, salesReportHandler);
```

### Data Privacy
- Don't expose sensitive pricing data to non-admins
- Audit log all report access
- Encrypt exported files if containing sensitive data

---

## Summary

These backend enhancements enable:
- ✅ Complete staff performance tracking
- ✅ Inventory management system
- ✅ Advanced sales reporting
- ✅ Real-time metrics and alerts
- ✅ Audit trails for compliance

**Current Status**: Frontend reporting complete  
**Next Steps**: Implement backend endpoints (optional but recommended)

---

## Questions & Support

For implementation questions, refer to:
- Main reporting guide: `ADVANCED_REPORTING_FEATURES.md`
- Analytics guide: `ANALYTICS_IMPLEMENTATION.md`
- API documentation: Check server/routes for endpoint details
