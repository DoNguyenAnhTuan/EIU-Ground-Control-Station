// Trả về key Azure Maps an toàn
export async function getAzureKey() {
  // 1) từ bridge (Qt)
  if (window.qt && window.QWebChannel) {
    try {
      const key = await new Promise((resolve) => {
        new QWebChannel(qt.webChannelTransport, (channel) => {
          const b = channel.objects?.bridge;
          if (b && typeof b.getMapKey === "function") {
            b.getMapKey((k) => resolve(k || null));
          } else resolve(null);
        });
      });
      if (key) return key;
    } catch {}
  }
  // 2) từ window.__CONFIG__
  if (window.__CONFIG__?.AZURE_MAPS_KEY) return window.__CONFIG__.AZURE_MAPS_KEY;

  console.warn("Using placeholder Azure key. Set bridge.getMapKey or __CONFIG__.");
  return "YOUR_AZURE_MAPS_KEY";
}

export const ORIGIN = {
  lat: 11.052939,
  lon: 106.666123,
};
