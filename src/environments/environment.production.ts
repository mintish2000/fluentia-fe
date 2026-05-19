export const environment = {
  production: true,
  apiUrl: 'https://web-production-a2b41.up.railway.app/api/v1',
  languages: ['en', 'ar'],
  defaultLanguage: 'en',
  maxFileSize: {
    images: 5 * 1024 * 1024, // 5MB
    excel: 500 * 1024 * 1024, // 500MB
    csv: 50 * 1024 * 1024, // 50MB
    pdf: 20 * 1024 * 1024, // 20MB
  },
  paypalClientId: 'AWSOcZlVBBb6Fzo1lbmm3dj1Hx5rlJxfBd0_TJ7PXQeBCoNzmHoe42BBw5PNo8a9HMRyw_COCnF6rG5s',
  paypalCurrency: 'USD',
  paypalHostedCheckoutUrlByPlan: {} as Record<string, string>,
};
