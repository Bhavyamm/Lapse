/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// Stores save through AsyncStorage in tests; app-storage.native.test.ts covers the encrypted database.
jest.mock('@/features/storage/app-storage', () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  return {
    appStorage: {
      getItem: (name) => AsyncStorage.getItem(name),
      setItem: (name, value) => AsyncStorage.setItem(name, value),
      removeItem: (name) => AsyncStorage.removeItem(name),
    },
  };
});
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));
// Screens are rendered without a navigator in tests; these two hooks need one.
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn(), useScrollToTop: jest.fn() }));
// RevenueCat has no native module in tests; purchase.test.ts drives this mock.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
    PRODUCT_ALREADY_PURCHASED_ERROR: '6',
    PAYMENT_PENDING_ERROR: '20',
  },
  default: {
    configure: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));
