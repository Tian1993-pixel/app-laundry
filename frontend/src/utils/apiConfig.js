export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // Detect Capacitor / Native Android APK environment
    const isCapacitor = (
      (window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.platform === 'android')) ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (typeof navigator !== 'undefined' && (navigator.userAgent?.includes('Capacitor') || navigator.userAgent?.includes('AndroidApp'))) ||
      localStorage.getItem('app_is_apk') === 'true'
    );

    if (isCapacitor) {
      // In Android Emulator / Device, 'localhost' refers to the Android OS itself.
      // Use local Wi-Fi IP or Android loopback 10.0.2.2 to reach host machine Node server
      return 'http://192.168.1.115:5000/api';
    }

    if (host === 'ruangsistem.my.id' || host.endsWith('.my.id')) {
      return '/api';
    }
    if (host === 'app-laundry.test' || host.endsWith('.test') || host.endsWith('.local')) {
      return 'http://localhost:5000/api';
    }
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `http://${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();
