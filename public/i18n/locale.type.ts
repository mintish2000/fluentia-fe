

export type AppLanguages = "ar" | "en"
type DataValue = any;

export interface Locale {
    lang: AppLanguages;
    data: { [key: string]: DataValue }
}