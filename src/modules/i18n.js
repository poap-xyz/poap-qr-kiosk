import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

i18n
	// load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
	// learn more: https://github.com/i18next/i18next-http-backend
	.use(Backend)

	.use(LanguageDetector)

	.use(initReactI18next)

    .init({
        backend: {
            // translation file path
            loadPath: '/locales/{{ns}}/{{lng}}.json',
        },
        supportedLngs: [ 'en', 'nl' ],
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
            formatSeparator: ',',
        },
        debug: process.env.NODE_ENV === 'development',
        ns: [ 'general' ], 
    })

export default i18n