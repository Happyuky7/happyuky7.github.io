import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import MonitorProbe from '@pages/MonitorProbe';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MonitorProbe />
  </StrictMode>,
);
