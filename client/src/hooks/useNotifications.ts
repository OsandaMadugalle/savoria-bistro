import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

/**
 * Hook to initialize notification service for a user
 */
export const useNotifications = (userEmail?: string) => {
  useEffect(() => {
    if (userEmail) {
      notificationService.init(userEmail);
    }

    return () => {
      // Cleanup on unmount
      notificationService.destroy();
    };
  }, [userEmail]);

  return notificationService;
};

export default useNotifications;
