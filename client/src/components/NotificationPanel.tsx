import React, { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { Notification, notificationService } from '../services/notificationService';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (notification: Notification) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onNotification }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      setUnreadCount(prev => prev + 1);
      onNotification?.(notification);
    });

    // Load initial notifications
    setNotifications(notificationService.getNotifications(20));
    setUnreadCount(notificationService.getNotifications(20).filter(n => !n.read).length);

    return unsubscribe;
  }, [onNotification]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={() => (isOpen ? onClose : null)}
          className="relative p-2 text-stone-600 hover:text-orange-600 transition-colors"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {Math.min(unreadCount, 9)}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-20 right-4 w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 max-h-[600px] flex flex-col animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <h3 className="font-bold text-lg text-stone-900">Notifications</h3>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                <Bell size={32} className="mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-stone-100 cursor-pointer transition-colors ${
                    notification.read ? 'hover:bg-stone-50' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className={`font-bold text-sm ${notification.read ? 'text-stone-900' : 'text-blue-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-stone-400">
                        {notification.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {notification.actionLabel && (
                        <button className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700">
                          → {notification.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-stone-100 text-center">
              <button
                onClick={handleClearAll}
                className="text-xs text-stone-600 hover:text-stone-900 font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NotificationPanel;
