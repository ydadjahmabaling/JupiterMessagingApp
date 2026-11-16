const GRADS = [
  'from-violet-500 to-fuchsia-500', 'from-amber-400 to-orange-600', 'from-sky-500 to-indigo-600',
  'from-emerald-400 to-teal-600', 'from-rose-500 to-orange-500', 'from-indigo-500 to-violet-700',
];
export const colorFor = (id) => GRADS[Math.abs(Number(id) || 0) % GRADS.length];

export const noteActive = (u) => !!u?.noteText && (!u.noteExpiresAt || new Date(u.noteExpiresAt) > new Date());

export function fmtTime(iso) {
  const d = new Date(iso), now = new Date();
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return 'Today at ' + t;
  return d.toLocaleDateString() + ' ' + t;
}

/** Reads an image file and returns a cover-cropped JPEG data URL of exactly w x h (keeps DB rows small). */
export function resizeImage(file, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const s = Math.max(w / img.width, h / img.height);
      const dw = img.width * s, dh = img.height * s;
      c.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = url;
  });
}

export const CITIES = [
  ['Tokyo', 'Japan', 35.6762, 139.6503], ['London', 'United Kingdom', 51.5072, -0.1276],
  ['New York', 'United States', 40.7128, -74.006], ['San Francisco', 'United States', 37.7749, -122.4194],
  ['Sao Paulo', 'Brazil', -23.5505, -46.6333], ['Paris', 'France', 48.8566, 2.3522],
  ['Berlin', 'Germany', 52.52, 13.405], ['Lagos', 'Nigeria', 6.5244, 3.3792],
  ['Cairo', 'Egypt', 30.0444, 31.2357], ['Mumbai', 'India', 19.076, 72.8777],
  ['Singapore', 'Singapore', 1.3521, 103.8198], ['Manila', 'Philippines', 14.5995, 120.9842],
  ['Tuguegarao', 'Philippines', 17.6132, 121.7270], ['Seoul', 'South Korea', 37.5665, 126.978],
  ['Sydney', 'Australia', -33.8688, 151.2093], ['Mexico City', 'Mexico', 19.4326, -99.1332],
  ['Toronto', 'Canada', 43.6532, -79.3832], ['Nairobi', 'Kenya', -1.2921, 36.8219],
  ['Istanbul', 'Turkey', 41.0082, 28.9784], ['Buenos Aires', 'Argentina', -34.6037, -58.3816],
].map(([city, country, lat, lng]) => ({ city, country, lat, lng }));
