import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { ToastProvider, Spinner } from './components/ui.jsx';
import Menu from './public/Menu.jsx';
import Track from './public/Track.jsx';

// O painel só é baixado por quem entra nele, deixando o cardápio leve no celular do cliente
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const Courier = lazy(() => import('./courier/Courier.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner className="min-h-dvh" />}>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/pedido/:code" element={<Track />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/entregador" element={<Courier />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
);
