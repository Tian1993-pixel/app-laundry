export const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'ruangsistem.my.id' || host.endsWith('.my.id')) {
      return '/api';
    }
    return `http://${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();
