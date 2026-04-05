// TODO: To activate IAP when ready:
// 1. Set ENABLE_IAP = true
// 2. Call initIAP() in App.tsx on mount
// 3. Replace the no-op in purchaseTip() with the RNIap purchase flow
// 4. Replace com.PLACEHOLDER in IAP_TIP_PRODUCT_ID with real bundle ID
// 5. Configure products in App Store Connect and Google Play Console

export const ENABLE_IAP = false;

export const IAP_TIP_PRODUCT_ID = 'com.PLACEHOLDER.fourhundredscorekeeper.tip_001';

export async function purchaseTip(): Promise<void> {
  if (!ENABLE_IAP) return;
  // Future: await RNIap.requestPurchase({ sku: IAP_TIP_PRODUCT_ID });
}

export async function initIAP(): Promise<void> {
  if (!ENABLE_IAP) return;
  // Future: await RNIap.initConnection();
}
