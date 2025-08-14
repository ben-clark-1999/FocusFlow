import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/app';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(<App />);
