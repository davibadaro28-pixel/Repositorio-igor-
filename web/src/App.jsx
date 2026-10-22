import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from './components/ui.jsx';
import Menu from './public/Menu.jsx';
import Track from './public/Track.jsx';

// O painel só é baixado por quem entra nele, deixando o cardápio leve no celular do cliente
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const Courier = lazy(() => import('./courier/Courier.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-dvh" />}>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/pedido/:code" element={<Track />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/entregador" element={<Courier />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
