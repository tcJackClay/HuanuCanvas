import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      "appTitle": "企鹅工坊",
      "dashboard": "仪表盘",
      "creativeLibrary": "创意库",
      "settings": "设置"
      // 更多翻译...
    }
  },
  en: {
    translation: {
      "appTitle": "Penguin Magic",
      "dashboard": "Dashboard",
      "creativeLibrary": "Creative Library",
      "settings": "Settings"
      // 更多翻译...
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;