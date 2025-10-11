// Quantum Spark Bot™ - Admin Panel Service Worker
// Enables offline functionality and Android APK capabilities for admin dashboard

const ADMIN_CACHE_NAME = 'quantum-spark-admin-v1.2.0';
const ADMIN_STATIC_CACHE = 'quantum-spark-admin-static-v1.2.0';
const ADMIN_DYNAMIC_CACHE = 'quantum-spark-admin-dynamic-v1.2.0';

// Admin panel files to cache for offline functionality
const ADMIN_STATIC_FILES = [
  '/admin-panel.html',
  '/admin-manifest.json',
  '/js/admin-panel.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Admin-specific dynamic content patterns
const ADMIN_DYNAMIC_PATTERNS = [
  /\/api\/admin\//,
  /\/tables\//,
  /\/admin-api\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/
];

// Sensitive admin routes that require authentication
const PROTECTED_ROUTES = [
  '/admin-panel.html',
  '/api/admin/',
  '/tables/'
];

// Install event - cache admin static files
self.addEventListener('install', event => {
  console.log('[Admin SW] Installing Quantum Spark Bot Admin Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(ADMIN_STATIC_CACHE).then(cache => {
        console.log('[Admin SW] Caching admin static files');
        return cache.addAll(ADMIN_STATIC_FILES.filter(url => !url.startsWith('http')));
      }),
      caches.open(ADMIN_DYNAMIC_CACHE).then(cache => {
        console.log('[Admin SW] Caching admin external resources');
        return Promise.allSettled(
          ADMIN_STATIC_FILES.filter(url => url.startsWith('http')).map(url =>
            cache.add(url).catch(err => console.warn(`[Admin SW] Failed to cache ${url}:`, err))
          )
        );
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old admin caches
self.addEventListener('activate', event => {
  console.log('[Admin SW] Activating Quantum Spark Bot Admin Service Worker');
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== ADMIN_STATIC_CACHE && key !== ADMIN_DYNAMIC_CACHE && key.includes('admin')) {
            console.log('[Admin SW] Deleting old admin cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve cached admin content or fetch from network
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
  
  // Admin panel specific routing
  if (url.pathname === '/admin-panel.html' || url.pathname.startsWith('/admin')) {
    event.respondWith(handleAdminFetch(request));
  } else {
    event.respondWith(handleStandardFetch(request));
  }
});

async function handleAdminFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Check authentication for protected admin routes
    if (isProtectedAdminRoute(url.pathname)) {
      const isAuthenticated = await checkAdminAuthentication(request);
      if (!isAuthenticated) {
        return await handleAuthenticationRequired();
      }
    }
    
    // For admin API calls, always try network first with admin-specific caching
    if (url.pathname.startsWith('/api/admin/') || url.pathname.startsWith('/admin-api/')) {
      return await adminNetworkFirstStrategy(request);
    }
    
    // For admin static files, try cache first
    if (url.pathname === '/admin-panel.html' || isAdminStaticFile(url.pathname)) {
      return await adminCacheFirstStrategy(request);
    }
    
    // For admin dynamic content, use stale while revalidate
    return await adminStaleWhileRevalidateStrategy(request);
    
  } catch (error) {
    console.error('[Admin SW] Admin fetch error:', error);
    return await handleAdminOfflineFallback(request);
  }
}

async function handleStandardFetch(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[Admin SW] Standard fetch error:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network Error', { status: 503 });
  }
}

// Admin-specific network first strategy with enhanced error handling
async function adminNetworkFirstStrategy(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for admin calls
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      const cache = await caches.open(ADMIN_DYNAMIC_CACHE);
      // Cache admin responses with shorter TTL
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-cache-ttl', '300000'); // 5 minutes TTL for admin data
      
      cache.put(request, new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      }));
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Admin SW] Admin network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached admin data is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const ttl = cachedResponse.headers.get('sw-cache-ttl') || '300000';
      
      if (cachedAt && Date.now() - parseInt(cachedAt) > parseInt(ttl)) {
        console.log('[Admin SW] Cached admin data expired, returning with warning');
        const response = cachedResponse.clone();
        response.headers.set('sw-cache-expired', 'true');
        return response;
      }
      
      return cachedResponse;
    }
    
    throw error;
  }
}

// Admin cache first strategy with authentication awareness
async function adminCacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Validate admin cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        const cache = caches.open(ADMIN_STATIC_CACHE);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
    }).catch(err => {
      console.log('[Admin SW] Background admin cache update failed:', err);
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(ADMIN_STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Admin SW] Failed to fetch admin resource:', request.url, error);
    throw error;
  }
}

// Admin stale while revalidate with security considerations
async function adminStaleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(ADMIN_DYNAMIC_CACHE);
      cache.then(c => {
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        c.put(request, new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        }));
      });
    }
    return networkResponse;
  }).catch(err => {
    console.log('[Admin SW] Admin network update failed for:', request.url, err);
    return null;
  });
  
  return cachedResponse || await networkResponsePromise;
}

// Enhanced admin offline fallback
async function handleAdminOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Try to return cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return admin offline page for navigation requests
  if (request.mode === 'navigate') {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Panel Offline - Quantum Spark Bot™</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
          <div class="text-red-500 text-6xl mb-4">
            <i class="fas fa-wifi-slash"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Admin Panel Offline</h1>
          <p class="text-gray-600 mb-6">The admin panel requires an internet connection. Please check your network and try again.</p>
          <button onclick="location.reload()" class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">
            Retry Connection
          </button>
        </div>
      </body>
      </html>
    `, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Return admin-specific offline API response
  return new Response(
    JSON.stringify({
      error: 'Admin network unavailable',
      message: 'Admin panel requires network connection for security',
      offline: true,
      requiresAuth: true
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

// Admin authentication check (simplified - in real implementation would be more robust)
async function checkAdminAuthentication(request) {
  try {
    // Check for admin session in client
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      // In a real implementation, you'd check stored admin tokens
      // For now, assume authenticated if admin panel is open
      if (client.url.includes('admin-panel.html')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[Admin SW] Auth check error:', error);
    return false;
  }
}

// Handle authentication required response
async function handleAuthenticationRequired() {
  return new Response(
    JSON.stringify({
      error: 'Authentication required',
      message: 'Admin access requires authentication',
      requiresAuth: true,
      redirectTo: '/admin-login.html'
    }),
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer'
      }
    }
  );
}

// Helper functions
function isProtectedAdminRoute(pathname) {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAdminStaticFile(pathname) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname) ||
         pathname === '/admin-panel.html' ||
         pathname.endsWith('.html');
}

// Background sync for admin operations
self.addEventListener('sync', event => {
  console.log('[Admin SW] Background sync:', event.tag);
  
  if (event.tag === 'admin-sync-users') {
    event.waitUntil(syncAdminUsers());
  }
  
  if (event.tag === 'admin-sync-settings') {
    event.waitUntil(syncAdminSettings());
  }
  
  if (event.tag === 'admin-sync-analytics') {
    event.waitUntil(syncAdminAnalytics());
  }
});

async function syncAdminUsers() {
  try {
    const offlineUserActions = await getOfflineAdminActions('users');
    
    for (const action of offlineUserActions) {
      try {
        await fetch('/api/admin/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        await removeOfflineAdminAction('users', action.id);
        console.log('[Admin SW] Synced user action:', action.id);
      } catch (error) {
        console.error('[Admin SW] Failed to sync user action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[Admin SW] User sync error:', error);
  }
}

async function syncAdminSettings() {
  try {
    const offlineSettings = await getOfflineAdminActions('settings');
    
    for (const setting of offlineSettings) {
      try {
        await fetch('/api/admin/settings/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        });
        
        await removeOfflineAdminAction('settings', setting.id);
        console.log('[Admin SW] Synced setting:', setting.id);
      } catch (error) {
        console.error('[Admin SW] Failed to sync setting:', setting.id, error);
      }
    }
  } catch (error) {
    console.error('[Admin SW] Settings sync error:', error);
  }
}

async function syncAdminAnalytics() {
  try {
    const offlineAnalytics = await getOfflineAdminActions('analytics');
    
    for (const analytic of offlineAnalytics) {
      try {
        await fetch('/api/admin/analytics/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analytic)
        });
        
        await removeOfflineAdminAction('analytics', analytic.id);
        console.log('[Admin SW] Synced analytic:', analytic.id);
      } catch (error) {
        console.error('[Admin SW] Failed to sync analytic:', analytic.id, error);
      }
    }
  } catch (error) {
    console.error('[Admin SW] Analytics sync error:', error);
  }
}

// IndexedDB helpers for admin offline storage
async function getOfflineAdminActions(type) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuantumSparkAdminOffline', 1);
    
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

async function removeOfflineAdminAction(type, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuantumSparkAdminOffline', 1);
    
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

// Admin-specific push notifications
self.addEventListener('push', event => {
  console.log('[Admin SW] Admin push notification received');
  
  const options = {
    body: 'Admin alert: System requires attention',
    icon: '/icons/admin-icon-192x192.png',
    badge: '/icons/admin-badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true, // Admin notifications should be persistent
    data: {
      url: '/admin-panel.html',
      timestamp: Date.now(),
      priority: 'high'
    },
    actions: [
      {
        action: 'view-admin',
        title: 'Open Admin Panel',
        icon: '/icons/admin-action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: 'admin-notification'
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload };
      
      // Set priority-based notification behavior
      if (payload.priority === 'critical') {
        options.requireInteraction = true;
        options.vibrate = [300, 200, 300, 200, 300];
      }
    } catch (error) {
      console.error('[Admin SW] Push payload parsing error:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Quantum Spark Admin™', options)
  );
});

// Admin notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[Admin SW] Admin notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view-admin' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Look for existing admin panel window
        for (const client of clientList) {
          if (client.url.includes('admin-panel.html') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new admin panel window
        if (clients.openWindow) {
          return clients.openWindow('/admin-panel.html');
        }
      })
    );
  }
});

console.log('[Admin SW] Quantum Spark Bot™ Admin Service Worker loaded successfully');