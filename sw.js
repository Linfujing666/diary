// 富婆的财富日记 · Service Worker
// 版本号变更时会自动清理旧缓存
const VERSION = 'v1.4.3';
const CACHE_NAME = `ledger-${VERSION}`;

// 关键资源 - 应用 shell
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './mascot.js',
  './pages.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './apple-touch-icon-ipad.png',
  './favicon-32.png',
  './favicon-16.png',
  './offline.html',
];

// ============ 安装：预缓存应用 shell ============
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ============ 激活：清理旧版本缓存 ============
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key.startsWith('ledger-'))
          .map(key => {
            console.log('[SW] Deleting old cache', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ============ 请求拦截：HTML + JS + CSS 网络优先 / 其他资源缓存优先 ============
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  // 不处理 chrome-extension 等非 http(s) 请求
  if (!req.url.startsWith('http')) return;

  // HTML 文档 & JS & CSS：Network First（确保拿到最新版本）
  if (req.mode === 'navigate' ||
      (req.headers.get('accept') || '').includes('text/html') ||
      req.destination === 'script' ||
      req.destination === 'style') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // 其他静态资源：Cache First + 后台更新
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        fetch(req).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => {
        if (req.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#eef3e9"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});

// ============ 接收消息：手动触发更新 ============
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
