const CACHE = 'tron-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// Los archivos de audio se cachean por separado para no bloquear el install
const AUDIO_ASSETS = [
    '/assets/audio/musica1.mp3',
    '/assets/audio/musica2.mp3',
    '/assets/audio/musica3.mp3',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(async c => {
            // Primero cachear los assets principales (obligatorio)
            await c.addAll(ASSETS);
            // Luego cachear audio sin bloquear (si falla no rompe el SW)
            for (const url of AUDIO_ASSETS) {
                try {
                    await c.add(url);
                } catch (err) {
                    console.warn('No se pudo cachear audio:', url, err);
                }
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Para audio: intentar red primero, luego cache (evita problemas de Range requests)
    if (e.request.url.includes('/assets/audio/')) {
        e.respondWith(
            fetch(e.request).catch(() =>
                caches.match(e.request)
            )
        );
        return;
    }
    // Para el resto: cache primero
    e.respondWith(
        caches.match(e.request).then(cached =>
            cached || fetch(e.request).catch(() => caches.match('/index.html'))
        )
    );
});