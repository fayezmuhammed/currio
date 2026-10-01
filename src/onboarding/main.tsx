import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/app.css';
import { Onboarding } from './Onboarding';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Onboarding />
    </StrictMode>,
  );
}
