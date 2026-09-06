import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android paketlash sozlamalari.
 *
 * Hozircha ilova to'liq offline ishlaydi: `webDir` — Vite build natijasi,
 * ya'ni APK ichida. Backend ulanganda bu yerga `server.url` qo'shiladi.
 */
const config: CapacitorConfig = {
  appId: 'uz.hizmat24.client',
  appName: 'Hizmat24',
  webDir: 'dist',
  android: {
    // Web qatlami tizim temasiga qarab fon tanlaydi; oq miltillash bo'lmasin.
    backgroundColor: '#0E2B2C',
  },
  plugins: {
    SplashScreen: {
      /*
       * Splash IKKI yo'l bilan yopiladi:
       *  1. Odatda — ilova yuklangach `hideSplash()` (~0.3s);
       *  2. Zaxira — Android o'zi 3 soniyadan keyin.
       *
       * Ikkinchisi majburiy: `launchAutoHide: false` bo'lganda JS umuman
       * yuklanmasa (bundle xatosi, WebView nosozligi) ilova splash ekranida
       * ABADIY qotib qolardi va foydalanuvchi hech narsa qila olmasdi.
       */
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: '#0E2B2C',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0E2B2C',
    },
  },
};

export default config;
