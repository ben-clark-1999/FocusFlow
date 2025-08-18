import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(<App />);

// ---- FocusFlow custom cursor + parallax -----------------------------------
const c = document.createElement('div');
c.className = 'ff-cursor';
document.body.appendChild(c);

function onMove(e: MouseEvent) {
  const rot = Math.atan2(e.movementY, e.movementX) * 57.2958; // rad->deg
  document.documentElement.style.setProperty('--cx', `${e.clientX}px`);
  document.documentElement.style.setProperty('--cy', `${e.clientY}px`);
  document.documentElement.style.setProperty('--rot', `${rot || 0}deg`);
  document.documentElement.style.setProperty('--parx', `${(e.clientX / innerWidth - .5) * 2}%`);
}
window.addEventListener('mousemove', onMove, { passive: true });

window.addEventListener('mousedown', () => {
  c.classList.add('is-click');
  setTimeout(() => c.classList.remove('is-click'), 220);
});
