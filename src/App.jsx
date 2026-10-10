import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import CustomerLayout from './layouts/CustomerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import FullPageSpinner from './components/FullPageSpinner.jsx';

import Home from './pages/customer/Home.jsx';
import Menu from './pages/customer/Menu.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import Orders from './pages/customer/Orders.jsx';
import OrderTracking from './pages/customer/OrderTracking.jsx';
import OrderSuccess from './pages/customer/OrderSuccess.jsx';
import Profile from './pages/customer/Profile.jsx';
import Login from './pages/customer/Login.jsx';

import Dashboard from './pages/admin/Dashboard.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminMenu from './pages/admin/AdminMenu.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';
import PhoneOrders from './pages/admin/PhoneOrders.jsx';

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Customer site */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderTracking /></RequireAuth>} />
        <Route path="/order-confirmed/:id" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
      </Route>

      {/* Admin panel */}
      <Route
        path="/admin"
        element={<RequireAdmin><AdminLayout /></RequireAdmin>}
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="phone-orders" element={<PhoneOrders />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="banners" element={<AdminBanners />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
