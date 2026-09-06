import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
// Shrift ilova ichiga joylanadi: APK internetsiz ochilganda ham Inter
// yuklanadi. Ilgari u Google Fonts'dan kelardi va telefonda tizim
// shriftiga (Roboto) tushib qolardi — dizayn boshqacha ko'rinardi.
import '@fontsource-variable/inter/wght.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
