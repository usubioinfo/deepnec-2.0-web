// Author: Naveen Duhan
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);
const isViteDevServer = isLocalhost && window.location.port === '3000';
const baseUrl = (import.meta.env.BASE_URL || '/deepnec-2.0/').replace(/\/$/, '');
const defaultBackend = isViteDevServer
    ? 'http://localhost:3365'
    : `${window.location.origin}${baseUrl}`;

export const env = {
    BASE_URL: baseUrl,
    BACKEND: (import.meta.env.VITE_BACKEND_URL || defaultBackend).replace(/\/$/, '')
};

export default env;
