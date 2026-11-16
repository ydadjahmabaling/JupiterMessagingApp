import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

/**
 * Interactive spinning Earth (cobe / WebGL). Drag to rotate.
 * With lat/lng it starts facing that spot and draws a glowing amber pin; without them it is a plain globe.
 */
export default function Globe({ lat, lng, size = 280 }) {
  const ref = useRef(null);

  useEffect(() => {
    const pinned = lat != null && lng != null;
    let phi = pinned ? Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2) : 0.6;
    const theta = pinned ? Math.max(-0.45, Math.min(0.45, (lat * Math.PI) / 180 * 0.7)) : 0.25;
    let dragX = null;
    const canvas = ref.current;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2, width: size * 2, height: size * 2, phi, theta,
      dark: 1, diffuse: 1.3, mapSamples: 18000, mapBrightness: 7,
      baseColor: [0.16, 0.13, 0.33], markerColor: [1, 0.7, 0.2], glowColor: [0.5, 0.33, 0.9],
      markers: pinned ? [{ location: [lat, lng], size: 0.1 }] : [],
      onRender: (s) => { if (dragX === null) phi += 0.0045; s.phi = phi; s.theta = theta; },
    });

    const down = (e) => { dragX = e.clientX; canvas.style.cursor = 'grabbing'; };
    const move = (e) => { if (dragX !== null) { phi += (e.clientX - dragX) / 120; dragX = e.clientX; } };
    const up = () => { dragX = null; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      globe.destroy();
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [lat, lng, size]);

  return <canvas ref={ref} style={{ width: size, height: size, cursor: 'grab', touchAction: 'none' }} aria-label="Spinning Earth" />;
}
