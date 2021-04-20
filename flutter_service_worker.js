'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "2efbb41d7877d10aac9d091f58ccd7b9",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "a8d1d130b9909728d724354dc06becc1",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"favicon.png": "50d7e353ed30006948e9be86d8062b24",
"icons/android-icon-144x144.png": "0f347c81ce590e3ff4e6424629205889",
"icons/android-icon-192x192.png": "68a29f5bd5bd879b7a1529ae63504001",
"icons/android-icon-36x36.png": "c719bdb53244a7a3c2a87f63dcf18e42",
"icons/android-icon-48x48.png": "64e4f2fb0d39c80acb0d35a397bec055",
"icons/android-icon-72x72.png": "78ec25e5cf57c0cce7db951239219f11",
"icons/android-icon-96x96.png": "64d188ffac2bcb1cd0fc55f6453a30fb",
"icons/apple-icon-114x114.png": "ea1cbcb97a8a949ba670de5fff441714",
"icons/apple-icon-120x120.png": "ef3a988dc3f9c625aa511854201364da",
"icons/apple-icon-144x144.png": "0f347c81ce590e3ff4e6424629205889",
"icons/apple-icon-152x152.png": "fd6bf60db4dcb6f5d4e444a03fe600cd",
"icons/apple-icon-180x180.png": "1092dfa243e84786972677fa4b3e1306",
"icons/apple-icon-57x57.png": "ac7eef3e6718facc7b84bdad518d446b",
"icons/apple-icon-60x60.png": "d29614999ff4d87ab34c0741100253cb",
"icons/apple-icon-72x72.png": "78ec25e5cf57c0cce7db951239219f11",
"icons/apple-icon-76x76.png": "0ef978c479e6c070b87cb35957967f6b",
"icons/apple-icon-precomposed.png": "6493e95a3487cb1069fa404b13de2e65",
"icons/apple-icon.png": "6493e95a3487cb1069fa404b13de2e65",
"icons/favicon-16x16.png": "b63f5a9154008d9e7069754601fd8254",
"icons/favicon-32x32.png": "ce748741fcc470e2822c8990ae6130e5",
"icons/favicon-96x96.png": "64d188ffac2bcb1cd0fc55f6453a30fb",
"icons/ms-icon-144x144.png": "0f347c81ce590e3ff4e6424629205889",
"icons/ms-icon-150x150.png": "4a4a39be0a35f41386f8769bac371fcc",
"icons/ms-icon-310x310.png": "972b7ec660c379203ddb1d33e6f24e2f",
"icons/ms-icon-70x70.png": "f1413e67a3c1eabc07a3d9a0dbb89cbd",
"index.html": "9555d24561456f52fac11b5e4762a16d",
"/": "9555d24561456f52fac11b5e4762a16d",
"main.dart.js": "d210574c123a7d4acd024d308b21ffd3",
"manifest.json": "d0fd3703ab405cf15a5bcc0a93bf6761",
"version.json": "ddc43fce4d1aaeeb3cee9f0cbdc24a8e"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
