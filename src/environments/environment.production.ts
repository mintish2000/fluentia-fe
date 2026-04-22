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
  paypalClientId: 'AT5Ll8qjh1JksFVRCDoObsw0_X8-xNJ7Vc50sDxxGiOVT6PRBrqic1QAfRx8CeztG8-nfudHUfUl1TWs',
  secretClientId: 'EKIIFlUWx5Q0-M4_UDtjsPUF2_rH9SCgVKPh9xeh8Z9Ua3gh24olYQZKoaPu8b-brei8AtLEdSJePsSA',
  paypalCurrency: 'USD',
  paypalHostedCheckoutUrlByPlan: {} as Record<string, string>,
};
