export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  languages: ['en', 'ar'],
  defaultLanguage: 'en',
  maxFileSize: {
    images: 5 * 1024 * 1024, // 5MB
    excel: 500 * 1024 * 1024, // 500MB
    csv: 50 * 1024 * 1024, // 50MB
    pdf: 20 * 1024 * 1024, // 20MB
  },
  /** PayPal REST app Client ID (Dashboard → Apps & credentials). Use sandbox ID for testing. */
  paypalClientId: 'AT5Ll8qjh1JksFVRCDoObsw0_X8-xNJ7Vc50sDxxGiOVT6PRBrqic1QAfRx8CeztG8-nfudHUfUl1TWs',
  paypalCurrency: 'USD',
  /** Optional hosted checkout URLs keyed by plan id (`group-1m`, etc.) if you prefer PayPal buttons over the SDK. */
  paypalHostedCheckoutUrlByPlan: {} as Record<string, string>,
};
