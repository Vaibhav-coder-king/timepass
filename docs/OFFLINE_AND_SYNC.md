# COGNIVA Offline-First & Sync Engine Architecture

---

## 1. Problem Statement: The "False-Sync" Hazard

In vulnerable healthcare environments with patchy cellular connections (such as rural Assam or Arunachal Pradesh), applications often fall into two critical sync failure traps:
1. **Workbox Stale Caching of `/api/sync`**: An overbroad Service Worker cache intercepts `POST /api/sync` and returns HTTP 200 from cache while offline, causing the client app to falsely report "🟢 Synced".
2. **Optimistic UI Status Without Server Ack**: Showing "Synced" whenever network connectivity is detected, even though local sessions are still stuck in browser storage.

COGNIVA completely eliminates both failure modes.

---

## 2. Five Truthful Sync States

The UI uses an explicit state machine:

```
                  +---------------+
                  |    offline    |
                  +-------+-------+
                          | (window.online)
                          v
+---------------+  (syncing)   +---------------+  (error)   +---------------+
|    pending    +------------->|    syncing    +----------->|     error     |
+---------------+              +-------+-------+            +-------+-------+
       ^                               | (server ack)               |
       |                               v                            |
       +-----------------------+---------------+                    |
       (new local session)     |    synced     |<-------------------+
                               +---------------+      (retry success)
```

1. **`synced`**: Zero unsynced sessions remain in local storage AND the last sync batch was positively acknowledged by the server.
2. **`pending`**: Unsynced sessions exist locally and are waiting to be dispatched.
3. **`syncing`**: An active HTTP POST request is in flight.
4. **`offline`**: The device has no network connection (`!navigator.onLine`).
5. **`error`**: The server returned an HTTP 4xx/5xx status or the request timed out.

---

## 3. Workbox Cache Isolation

In `vite.config.ts`, all API routes are explicitly excluded from navigation fallbacks and service worker runtime interception:

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,json}'],
  navigateFallbackDenylist: [/^\/api/], // CRITICAL: Never cache API endpoints
  runtimeCaching: [
    // Fonts and static assets ONLY
  ]
}
```

---

## 4. Sync Protocol & Exponential Backoff

When syncing, `syncService.ts` executes:
1. Gathers all sessions with `synced === 0`.
2. Sends the batch to `POST /api/sync`.
3. If successful, reads `acknowledged_ids` from server response.
4. Marks only the acknowledged sessions as `synced = 1`.
5. If the request fails, applies exponential backoff with jitter:
   $$t_{\text{backoff}} = \min(60000, 2^{\text{attempt}} \times 1000) + \text{random}(0, 1000)\,\text{ms}$$
