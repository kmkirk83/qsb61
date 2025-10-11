// Quantum Spark Bot™ - Main Website Service Worker
// Enables offline functionality and Android APK capabilities

const CACHE_NAME = 'quantum-spark-v1.2.0';
const STATIC_CACHE = 'quantum-spark-static-v1.2.0';
const DYNAMIC_CACHE = 'quantum-spark-dynamic-v1.2.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/js/app.js',
  '/js/auth.js',
  '/js/subscription-manager.js',
  '/js/conversion-optimizer.js',
  '/js/payment-processor.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Dynamic content patterns that should be cached
const DYNAMIC_PATTERNS = [
  /\/api\//,
  /\/tables\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('[SW] Installing Quantum Spark Bot Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching external resources');
        return Promise.allSettled(
          STATIC_FILES.filter(url => url.startsWith('http')).map(url =>
            cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Quantum Spark Bot Service Worker');
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // For API calls, try network first, then cache
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/tables/')) {
      return await networkFirstStrategy(request);
    }
    
    // For static files, try cache first, then network
    if (isStaticFile(url.pathname) || isCDNResource(url.href)) {
      return await cacheFirstStrategy(request);
    }
    
    // For dynamic content, try stale while revalidate
    if (isDynamicContent(url.pathname)) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // For everything else, try network first
    return await networkFirstStrategy(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await handleOfflineFallback(request);
  }
}

// Network first strategy - good for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch and cache:', request.url, error);
    throw error;
  }
}

// Stale while revalidate strategy - good for frequently updated content
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(err => {
    console.log('[SW] Network update failed for:', request.url, err);
    return null;
  });
  
  return cachedResponse || await networkResponsePromise;
}

// Offline fallback handling
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Try to return cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/index.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return generic offline response
  return new Response(
    JSON.stringify({
      error: 'Network unavailable',
      message: 'This content is not available offline',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// Helper functions
function isStaticFile(pathname) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname) ||
         pathname === '/' ||
         pathname.endsWith('.html');
}

function isCDNResource(url) {
  return url.includes('cdn.') || 
         url.includes('fonts.googleapis.com') ||
         url.includes('cdn.jsdelivr.net') ||
         url.includes('cdnjs.cloudflare.com');
}

function isDynamicContent(pathname) {
  return DYNAMIC_PATTERNS.some(pattern => pattern.test(pathname));
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-trading') {
    event.waitUntil(syncTradingData());
  }
  
  if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

async function syncTradingData() {
  try {
    // Get offline trading actions from IndexedDB
    const offlineActions = await getOfflineActions('trading');
    
    for (const action of offlineActions) {
      try {
        await fetch('/api/sync/trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        await removeOfflineAction('trading', action.id);
        console.log('[SW] Synced trading action:', action.id);
      } catch (error) {
        console.error('[SW] Failed to sync trading action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

async function syncAnalyticsData() {
  try {
    const offlineEvents = await getOfflineActions('analytics');
    
    for (const event of offlineEvents) {
      try {
        await fetch('/api/sync/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
        
        await removeOfflineAction('analytics', event.id);
        console.log('[SW] Synced analytics event:', event.id);
      } catch (error) {
        console.error('[SW] Failed to sync analytics event:', event.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync error:', error);
  }
}

// IndexedDB helpers for offline storage
async function getOfflineActions(type) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuantumSparkOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([type], 'readonly');
      const store = transaction.objectStore(type);
      const getAll = store.getAll();
      
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(type)) {
        db.createObjectStore(type, { keyPath: 'id' });
      }
    };
  });
}

async function removeOfflineAction(type, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuantumSparkOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([type], 'readwrite');
      const store = transaction.objectStore(type);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Your trading bot has important updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload };
    } catch (error) {
      console.error('[SW] Push payload parsing error:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Quantum Spark Bot™', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data?.url || '/');
        }
      })
    );
  }
});

console.log('[SW] Quantum Spark Bot™ Service Worker loaded successfully');