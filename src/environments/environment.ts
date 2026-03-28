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
};
