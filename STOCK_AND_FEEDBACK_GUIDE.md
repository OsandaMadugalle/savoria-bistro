# Stock Tracking, Low Stock Alerts, and Order Feedback System

## Overview

This comprehensive update adds three major operational features to Savoria Bistro:

1. **Stock Tracking System** - Complete inventory management with real-time updates
2. **Low Stock Alerts** - Automatic notifications for inventory thresholds
3. **Auto-Disable Out of Stock** - Menu items automatically disable when stock reaches zero
4. **Order Feedback & Ratings** - Customer feedback collection with item-level ratings and analytics

---

## 1. Stock Tracking System

### Features

#### Real-Time Stock Management
- Track current stock levels for each menu item
- Set customizable low stock thresholds
- Automatic stock deduction on order placement
- Stock history and audit trail

#### Stock Status Display
- **Available**: Items with stock > 0
- **Low Stock**: Items at or below threshold
- **Out of Stock**: Items with 0 stock (automatically disabled)

### Backend Implementation

#### MenuItem Model Updates
```javascript
// Added fields to MenuItem schema:
stock: { type: Number, default: 0, min: 0 },
lowStockThreshold: { type: Number, default: 5, min: 0 },
isAvailable: { type: Boolean, default: true },
averageRating: { type: Number, default: 0 },
totalRatings: { type: Number, default: 0 }
```

#### Stock Management API Endpoints

**Get Stock Alerts**
```
GET /api/stock/alerts
GET /api/stock/alerts/active
```
Returns list of active stock alerts with alert type and status.

**Update Item Stock**
```
PATCH /api/stock/{itemId}/stock
Body: { quantity, reason, requesterEmail }
```
Updates stock and triggers alerts if needed.

**Get Low Stock Items**
```
GET /api/stock/low-stock
```
Returns all items below their threshold.

**Get Out of Stock Items**
```
GET /api/stock/out-of-stock
```
Returns all items with zero stock.

**Set Low Stock Threshold**
```
PATCH /api/stock/{itemId}/threshold
Body: { threshold, requesterEmail }
```
Updates the threshold for an item.

**Get Stock Statistics**
```
GET /api/stock/stats
```
Returns:
- Total items in menu
- Available items count
- Out of stock count
- Low stock count
- Total stock units
- Average stock per item

### Stock Alerts

#### StockAlert Model
```javascript
{
  itemId: String,
  itemName: String,
  currentStock: Number,
  lowStockThreshold: Number,
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_IN_STOCK',
  isActive: Boolean,
  acknowledged: Boolean,
  acknowledgedBy: String,
  acknowledgedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Alert Types
1. **LOW_STOCK** - Item stock ≤ threshold
2. **OUT_OF_STOCK** - Item stock = 0
3. **BACK_IN_STOCK** - Item restocked after being out

#### Alert Workflow
1. Admin adds item to stock
2. System checks against thresholds
3. Creates appropriate alert if needed
4. Admin can acknowledge alert
5. Alert deactivates when threshold is recovered

### Order Flow Integration

When an order is placed:
1. System checks stock availability for all items
2. Returns error if insufficient stock
3. Deducts stock from each item
4. Triggers stock alerts if needed
5. Marks menu item unavailable if stock = 0

---

## 2. Low Stock Alerts System

### Alert Management

#### Viewing Alerts
```typescript
// API
import { getActiveStockAlerts, getLowStockItems, getOutOfStockItems } from '../services/api';

// Frontend component
<StockManagement userEmail={user.email} />
```

#### Alert Dashboard Features
- Color-coded alert display (red for out-of-stock, yellow for low)
- Quick restock interface
- Bulk update capability
- Acknowledgement tracking

#### Admin Notifications
- Real-time alert display on admin dashboard
- Count badges for pending items
- Priority sorting (out-of-stock before low-stock)

### Restock Workflow

1. **Identify Issue**
   - Admin views Stock Management tab
   - Sees low stock and out-of-stock items

2. **Update Stock**
   - Click "Update" or "Restock Now" button
   - Enter quantity to add
   - Specify reason (e.g., "Vendor shipment", "New prep")
   - System records change with timestamp

3. **Alert Resolution**
   - Out-of-stock alerts deactivate when stock > 0
   - Low-stock alerts deactivate when stock > threshold
   - Back-in-stock alerts created for user info

4. **Activity Logging**
   - All stock changes logged to activity audit trail
   - Includes admin name, timestamp, quantity change, reason

---

## 3. Order Feedback & Ratings System

### Features

#### Multi-Level Feedback Collection
1. **Overall Rating** - 1-5 star overall experience
2. **Item Ratings** - Individual ratings for each item ordered
3. **Service Rating** - Staff/service quality (1-5)
4. **Delivery Rating** - Delivery experience (1-5)
5. **Comments** - Open feedback text
6. **Recommendation** - Would recommend checkbox
7. **Suggestions** - Improvement suggestions text

### Backend Implementation

#### OrderFeedback Model
```javascript
{
  orderId: String (unique),
  userId: ObjectId (ref: User),
  overallRating: Number (1-5, required),
  items: [{
    itemId: String,
    itemName: String,
    quantity: Number,
    itemRating: Number (1-5),
    comment: String
  }],
  serviceRating: Number (1-5),
  deliveryRating: Number (1-5),
  comment: String,
  wouldRecommend: Boolean,
  improvementSuggestions: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Order Model Update
```javascript
// Added fields:
hasFeedback: Boolean,
feedbackSubmittedAt: Date
```

### Feedback API Endpoints

**Submit Order Feedback**
```
POST /api/feedback
Body: {
  orderId, userId, overallRating, items[], 
  serviceRating, deliveryRating, comment, 
  wouldRecommend, improvementSuggestions
}
```

**Get Order Feedback**
```
GET /api/feedback/order/{orderId}
```

**Get User Feedback History**
```
GET /api/feedback/user/{userId}
```

**Get Feedback Statistics** (Admin only)
```
GET /api/feedback/stats/summary?requesterEmail={email}
```

**Get Item-Level Feedback**
```
GET /api/feedback/item/{itemId}/feedback
```

**Get All Feedback** (Admin only)
```
GET /api/feedback?requesterEmail={email}&limit=50&skip=0
```

### Customer Feedback Experience

#### Feedback Submission Flow

1. **Order Delivered**
   - Customer completes order
   - Receives notification on Tracker Page
   - "Leave Feedback & Rate Your Order" button appears

2. **Open Feedback Form**
   - Modal opens with order summary
   - Shows items in the order

3. **Fill Feedback**
   - Select overall rating (required)
   - Rate individual items (optional)
   - Add comments per item (optional)
   - Rate service (optional)
   - Rate delivery (optional)
   - Add general comment (optional)
   - Check "Would Recommend"
   - Add improvement suggestions (optional)

4. **Submit**
   - System validates required fields
   - Saves feedback to database
   - Updates menu item ratings
   - Marks order as having feedback
   - Shows success message
   - Form closes

### Admin Analytics Dashboard

#### Feedback Tab Features

**Key Metrics**
- Average overall rating (0-5)
- Total feedback responses
- Recommendation rate percentage
- 5-star rating count

**Rating Distribution**
- Breakdown by 1-5 stars
- Percentage per rating level
- Visual bar chart

**Top Rated Items**
- Items with highest average ratings
- Shows rating and count

**Items Needing Attention**
- Items with below-average ratings
- Requires minimum 3 ratings to appear
- Sorted by lowest rating first

#### Feedback Analysis

**Statistical Breakdown**
```javascript
{
  totalFeedback: Number,
  averageRating: Number,
  ratingDistribution: {
    '5': Number,
    '4': Number,
    '3': Number,
    '2': Number,
    '1': Number
  },
  wouldRecommendCount: Number,
  recommendationRate: Number,
  topRatedItems: Array,
  needsAttention: Array
}
```

**Menu Item Ratings**
- Aggregate ratings from individual item feedback
- Running average calculation
- Total ratings count
- Used for menu optimization

---

## Frontend Components

### StockManagement Component

Location: `client/src/components/StockManagement.tsx`

**Props**
```typescript
interface StockManagementProps {
  userEmail: string;
}
```

**Features**
- Real-time stock statistics
- Active alerts display with acknowledge buttons
- Low stock items table with inline editing
- Out of stock items table with restock buttons
- Refresh data button
- Color-coded status indicators

**Sections**
1. Stats Overview (4 cards)
   - Total items
   - Available items
   - Low stock count
   - Out of stock count

2. Active Alerts (if any)
   - Alert color by type
   - Item name and current stock
   - Acknowledge button

3. Low Stock Items
   - Table with name, stock, threshold, category
   - Quick update button
   - Inline edit interface

4. Out of Stock Items
   - Table with name, category, price
   - Restock Now button
   - Inline edit interface

### FeedbackForm Component

Location: `client/src/components/FeedbackForm.tsx`

**Props**
```typescript
interface FeedbackFormProps {
  order: Order;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features**
- Modal form for feedback submission
- Order summary display
- Star rating selectors
- Item-level rating and comments
- Service/delivery ratings
- Text areas for comments
- Recommendation checkbox
- Loading state handling
- Error validation

### FeedbackAnalytics Component

Location: `client/src/components/FeedbackAnalytics.tsx`

**Props**
```typescript
interface FeedbackAnalyticsProps {
  userEmail: string;
}
```

**Features**
- Four metric cards (average rating, total feedback, recommendation %, 5-star count)
- Rating distribution chart
- Top rated items display
- Items needing attention section
- Refresh data button

---

## API Service Functions

### Stock Management Functions
```typescript
// Get all stock alerts
export const getStockAlerts = async () => Promise<StockAlert[]>

// Get active alerts only
export const getActiveStockAlerts = async () => Promise<StockAlert[]>

// Get low stock items
export const getLowStockItems = async () => Promise<MenuItem[]>

// Get out of stock items
export const getOutOfStockItems = async () => Promise<MenuItem[]>

// Update item stock
export const updateItemStock = async (
  itemId: string,
  quantity: number,
  reason: string,
  requesterEmail: string
) => Promise<any>

// Set low stock threshold
export const setLowStockThreshold = async (
  itemId: string,
  threshold: number,
  requesterEmail: string
) => Promise<any>

// Acknowledge stock alert
export const acknowledgeStockAlert = async (
  alertId: string,
  requesterEmail: string
) => Promise<StockAlert>

// Get stock statistics
export const getStockStats = async () => Promise<{
  totalItems: number,
  availableItems: number,
  outOfStockItems: number,
  lowStockItems: number,
  totalStock: number,
  averageStockPerItem: number
}>
```

### Feedback Functions
```typescript
// Submit feedback
export const submitOrderFeedback = async (feedback: OrderFeedback) => Promise<any>

// Get feedback for order
export const getOrderFeedback = async (orderId: string) => Promise<OrderFeedback | null>

// Get user's feedback history
export const getUserFeedbackHistory = async (userId: string) => Promise<OrderFeedback[]>

// Get feedback statistics
export const getFeedbackStats = async (requesterEmail: string) => Promise<any>

// Get feedback for specific item
export const getItemFeedback = async (itemId: string) => Promise<any>
```

---

## Database Models

### MenuItem (Updated)
```javascript
{
  _id: ObjectId,
  id: String (unique),
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  cloudinaryId: String,
  tags: [String],
  ingredients: [String],
  dietary: [String],
  calories: Number,
  prepTime: Number,
  featured: Boolean,
  // NEW FIELDS:
  stock: Number,
  lowStockThreshold: Number,
  isAvailable: Boolean,
  averageRating: Number,
  totalRatings: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Order (Updated)
```javascript
{
  _id: ObjectId,
  orderId: String,
  userId: ObjectId,
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: String,
  // NEW FIELDS:
  hasFeedback: Boolean,
  feedbackSubmittedAt: Date,
  createdAt: Date
}
```

### StockAlert (New)
```javascript
{
  _id: ObjectId,
  itemId: String,
  itemName: String,
  currentStock: Number,
  lowStockThreshold: Number,
  alertType: String,
  isActive: Boolean,
  acknowledged: Boolean,
  acknowledgedBy: String,
  acknowledgedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### OrderFeedback (New)
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  userId: ObjectId,
  overallRating: Number,
  items: [{
    itemId: String,
    itemName: String,
    quantity: Number,
    itemRating: Number,
    comment: String
  }],
  serviceRating: Number,
  deliveryRating: Number,
  comment: String,
  wouldRecommend: Boolean,
  improvementSuggestions: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Integration Points

### With Existing Systems

#### Orders System
- Stock checked before order creation
- Stock deducted on successful order
- Prevents overselling

#### Menu System
- Menu items automatically disable when out of stock
- Stock visible in admin menu management
- Item ratings visible in admin analytics

#### Admin Dashboard
- Stock Management tab for inventory control
- Feedback & Ratings tab for customer insights
- Integrated into operations section

#### Tracker Page
- Customer can leave feedback when order delivered
- Feedback button appears only for delivered orders
- Previous feedback hidden if already submitted

#### Activity Logging
- All stock changes logged
- Admin name, timestamp, quantity, reason recorded
- Feedback submissions logged

---

## Usage Examples

### Staff Managing Stock

1. Log in to admin panel
2. Navigate to Operations → Stock Management
3. View current stock levels in statistics
4. See active alerts with color coding
5. For low stock items:
   - Click "Update" button
   - Enter restock quantity
   - Enter reason (e.g., "Vendor delivery")
   - Click Save
6. For out of stock items:
   - Click "Restock Now" button
   - Enter new quantity
   - Click Save
7. Alerts automatically acknowledge when resolved

### Customer Leaving Feedback

1. Order is delivered
2. Customer tracks order on Tracker Page
3. When status shows "Delivered"
4. "Leave Feedback & Rate Your Order" button appears
5. Customer clicks button
6. Feedback form modal opens
7. Fill in ratings and comments
8. Click "Submit Feedback"
9. System shows success message
10. Button changes to "✅ Thank you for your feedback"

### Admin Reviewing Feedback

1. Log in to admin panel
2. Navigate to Operations → Feedback & Ratings
3. View key metrics:
   - Average rating
   - Total responses
   - Recommendation rate
4. See rating distribution chart
5. Review top-rated items
6. Identify items needing attention
7. Use data for menu optimization

---

## Configuration

### Default Stock Values
- Initial stock: 0 units
- Default low stock threshold: 5 units
- Customizable per item

### Alert Settings
- All alerts active by default
- Admin can acknowledge alerts
- Automatic deactivation when stock recovers

### Feedback Settings
- One feedback per order
- Can be updated if submitted again
- Item ratings aggregate to menu item average
- Requires minimum 1-5 rating (integers only)

---

## Best Practices

### Stock Management
1. Set realistic low-stock thresholds based on demand
2. Establish regular restock schedule
3. Monitor alerts daily
4. Document restock reasons for audit trail
5. Update thresholds seasonally

### Feedback Handling
1. Review customer feedback regularly (weekly)
2. Act on items with low ratings
3. Celebrate top-rated items
4. Share insights with kitchen staff
5. Implement improvement suggestions

### Customer Experience
1. Ensure feedback form is easily accessible
2. Make submission quick (2-3 minutes)
3. Acknowledge feedback in future communications
4. Show customers their feedback matters
5. Implement visible changes based on feedback

---

## Troubleshooting

### Stock Issues

**Q: Item not disabling when stock reaches 0**
- A: Check if `isAvailable` field updating correctly
- Manually set `isAvailable: false` via API if needed

**Q: Alerts not appearing**
- A: Verify alerts are created in database
- Check `isActive` field is true

**Q: Stock deduction failed on order**
- A: Check for concurrent updates
- Verify itemId matches in both order and menu

### Feedback Issues

**Q: Feedback form not appearing after delivery**
- A: Ensure user is logged in
- Check if `hasFeedback` already set on order
- Verify status is exactly "Delivered"

**Q: Item ratings not updating**
- A: Check feedback contains valid itemId
- Verify itemRating is 1-5 integer
- Check MenuItem model has averageRating field

---

## Future Enhancements

### Phase 2
- [ ] Scheduled automated alerts (email, SMS)
- [ ] Predictive stock levels based on demand
- [ ] Bulk stock import from CSV
- [ ] Supplier integration
- [ ] Advanced feedback filtering

### Phase 3
- [ ] Customer notification on item back-in-stock
- [ ] Recipe recommendations based on feedback
- [ ] Menu item A/B testing
- [ ] Seasonal stock adjustments
- [ ] Feedback sentiment analysis

---

## Support & References

### Related Files
- Backend: `server/models/MenuItem.js`, `Order.js`
- Routes: `server/routes/stock.js`, `feedback.js`
- Components: `client/src/components/StockManagement.tsx`, `FeedbackForm.tsx`, `FeedbackAnalytics.tsx`
- Pages: `client/src/pages/AdminDashboard.tsx`, `TrackerPage.tsx`
- Services: `client/src/services/api.ts`

### API Documentation
- Stock endpoints: `/api/stock/*`
- Feedback endpoints: `/api/feedback/*`

### Type Definitions
- `client/src/types.ts` - StockAlert, OrderFeedback interfaces
