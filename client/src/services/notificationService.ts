/**
 * Real-time Notification Service
 * Handles desktop notifications, email alerts, and in-app messaging
 */

export type NotificationType = 'order' | 'reservation' | 'loyalty' | 'event' | 'promotion' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notification: Notification) => void)[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private userEmail: string | null = null;

  /**
   * Initialize notification service
   */
  init(email: string) {
    this.userEmail = email;
    // Request permission for desktop notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Start polling for new notifications
    this.startPolling();
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Send in-app notification
   */
  notify(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.push(fullNotification);
    this.emit(fullNotification);
    this.showDesktopNotification(fullNotification);

    return fullNotification;
  }

  /**
   * Send order notification
   */
  notifyOrderPlaced(orderId: string, total: number, pointsEarned: number, tier: string) {
    return this.notify({
      type: 'order',
      title: '🎉 Order Placed Successfully',
      message: `Order #${orderId} for $${total.toFixed(2)}. You earned ${pointsEarned} loyalty points! (${tier} Member)`,
      priority: 'high',
      actionUrl: `/tracker?orderId=${orderId}`,
      actionLabel: 'Track Order',
      icon: '📦'
    });
  }

  /**
   * Send order status notification
   */
  notifyOrderStatus(orderId: string, newStatus: string) {
    const statusEmoji: Record<string, string> = {
      'Confirmed': '✅',
      'Preparing': '👨‍🍳',
      'Quality Check': '👀',
      'Ready': '✨',
      'Delivering': '🚚',
      'Delivered': '🎁'
    };

    const messages: Record<string, string> = {
      'Confirmed': 'Your order has been confirmed',
      'Preparing': 'Your food is being prepared',
      'Quality Check': 'Quality checking your order',
      'Ready': 'Your order is ready for pickup/delivery',
      'Delivering': 'Your order is on the way',
      'Delivered': 'Your order has been delivered'
    };

    return this.notify({
      type: 'order',
      title: `${statusEmoji[newStatus] || '📦'} Order ${newStatus}`,
      message: messages[newStatus] || `Order #${orderId} is now ${newStatus}`,
      priority: newStatus === 'Ready' || newStatus === 'Delivered' ? 'high' : 'medium',
      actionUrl: `/tracker?orderId=${orderId}`,
      actionLabel: 'View Details'
    });
  }

  /**
   * Send reservation notification
   */
  notifyReservationConfirmed(_reservationId: string, date: string, time: string, guests: number) {
    return this.notify({
      type: 'reservation',
      title: '✅ Reservation Confirmed',
      message: `Table reserved for ${guests} on ${date} at ${time}`,
      priority: 'high',
      actionUrl: '/profile?tab=reservations',
      actionLabel: 'View Reservation',
      icon: '🍽️'
    });
  }

  /**
   * Send loyalty tier upgrade notification
   */
  notifyTierUpgrade(newTier: string, points: number) {
    const tierEmoji: Record<string, string> = {
      'Bronze': '🔥',
      'Silver': '✨',
      'Gold': '⭐'
    };

    const tierBenefits: Record<string, string> = {
      'Bronze': 'Earn points on every order',
      'Silver': '10% discount on all orders',
      'Gold': '20% discount + VIP benefits'
    };

    return this.notify({
      type: 'loyalty',
      title: `${tierEmoji[newTier] || '🏅'} ${newTier} Tier Unlocked!`,
      message: `Congratulations! You've reached ${newTier} tier with ${points} points. ${tierBenefits[newTier]}`,
      priority: 'high',
      actionUrl: '/profile?tab=loyalty',
      actionLabel: 'View Benefits',
      icon: tierEmoji[newTier]
    });
  }

  /**
   * Send promotion notification
   */
  notifyPromotion(promoCode: string, discount: number, expiresIn: string) {
    return this.notify({
      type: 'promotion',
      title: '🎟️ Exclusive Offer Just for You!',
      message: `Use code ${promoCode} for ${discount}% off. Expires in ${expiresIn}`,
      priority: 'medium',
      actionUrl: '/menu',
      actionLabel: 'Shop Now',
      icon: '🎉'
    });
  }

  /**
   * Send private event inquiry notification
   */
  notifyEventReply(eventType: string, staffName: string) {
    return this.notify({
      type: 'event',
      title: '💬 Event Inquiry Reply',
      message: `${staffName} replied to your ${eventType} event inquiry`,
      priority: 'high',
      actionUrl: '/profile?tab=events',
      actionLabel: 'View Reply',
      icon: '🎉'
    });
  }

  /**
   * Get notification history
   */
  getNotifications(limit: number = 10): Notification[] {
    return this.notifications.slice(-limit).reverse();
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
  }

  /**
   * Start polling for server-side notifications
   */
  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(() => {
      this.fetchNotifications();
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Fetch notifications from server
   */
  private async fetchNotifications() {
    if (!this.userEmail) return;

    try {
      const response = await fetch(`/api/notifications?email=${this.userEmail}`);
      if (response.ok) {
        const newNotifications = await response.json();
        newNotifications.forEach((n: any) => {
          if (!this.notifications.find(notif => notif.id === n.id)) {
            this.notify(n);
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  /**
   * Show desktop notification
   */
  private showDesktopNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.icon ? this.getNotificationIcon(notification.icon) : '/favicon.ico',
          tag: notification.type,
          requireInteraction: notification.priority === 'urgent'
        });
      } catch (err) {
        console.error('Desktop notification failed:', err);
      }
    }
  }

  /**
   * Get icon URL for notification
   */
  private getNotificationIcon(_emoji: string): string {
    // In production, you'd convert emoji to proper icon URLs
    return '/favicon.ico';
  }

  /**
   * Emit notification to listeners
   */
  private emit(notification: Notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  /**
   * Stop polling
   */
  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.notifications = [];
    this.listeners = [];
  }
}

export const notificationService = new NotificationService();
