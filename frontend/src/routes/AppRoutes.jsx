import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import RoleBasedRoute from './RoleBasedRoute';
const LandingPage      = lazy(() => import('../pages/LandingPage/LandingPage'));
const ServicesPage     = lazy(() => import('../pages/LandingPage/ServicesPage'));
const FleetGalleryPage = lazy(() => import('../pages/LandingPage/FleetGalleryPage'));
const NewsPage          = lazy(() => import('../pages/LandingPage/NewsPage'));
const AboutPage        = lazy(() => import('../pages/LandingPage/AboutPage'));


const GlobalChatPage   = lazy(() => import('../pages/LandingPage/GlobalChatPage'));
const PharmacyHealthPage = lazy(() => import('../pages/LandingPage/PharmacyHealthPage'));
const FarmingServicePage = lazy(() => import('../pages/LandingPage/FarmingServicePage'));
const PrintingServicePage = lazy(() => import('../pages/LandingPage/PrintingServicePage'));
const RetailStorePage = lazy(() => import('../pages/LandingPage/RetailStorePage'));
const GalleryPage        = lazy(() => import('../pages/LandingPage/GalleryPage'));
const TrackOrderPage     = lazy(() => import('../pages/LandingPage/TrackOrderPage'));
const LoginPage          = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('../pages/auth/ResetPasswordPage'));
const TwoFactorPage      = lazy(() => import('../pages/auth/TwoFactorPage'));
const AdminDashboard    = lazy(() => import('../pages/admin/AdminDashboard'));
const CEODashboard      = lazy(() => import('../pages/ceo/CEODashboard'));
const FinanceDashboard  = lazy(() => import('../pages/finance/FinanceDashboard'));
const PurchaseDashboard = lazy(() => import('../pages/purchase/PurchaseDashboard'));
const PharmacyStoreDashboard = lazy(() => import('../pages/pharmacy-store/StoreDashboard'));
const GeneralStoreDashboard = lazy(() => import('../pages/general-store/StoreDashboard'));
const StoreManagementDashboard = lazy(() => import('../pages/pharmacy-store/StoreManagementDashboard')); // Keeping this for legacy if needed, or remove later
const PrintingManagerDashboard = lazy(() => import('../pages/printing/PrintingDashboard'));
const CustomerDashboard = lazy(() => import('../pages/customer/CustomerPortal.jsx'));
const PharmacyDashboard = lazy(() => import('../pages/pharmacy/PharmacyDashboard'));
const PharmacyWorkerDashboard = lazy(() => import('../pages/pharmacy/PharmacyWorkerDashboard'));
const CarRentingDashboard = lazy(() => import('../pages/car-renting/CarRentingDashboard'));
const PlaceholderPage = lazy(() => import('../pages/LandingPage/PlaceholderPage'));
const HRDashboard      = lazy(() => import('../pages/hr/HRDashboard'));
const BoardDashboard   = lazy(() => import('../pages/board/BoardDashboard'));
const NotificationsPage = lazy(() => import('../pages/employee/NotificationsPage'));
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeePortalDashboard'));
const PrescriptionViewer = lazy(() => import('../pages/shared/PrescriptionViewer'));
const PublicTendersPage = lazy(() => import('../pages/LandingPage/PublicTendersPage'));
const PublicSmartTendersPage = lazy(() => import('../pages/LandingPage/PublicSmartTendersPage'));
const PublicBuyTendersPage = lazy(() => import('../pages/LandingPage/PublicBuyTendersPage'));
const TenderDetailPage = lazy(() => import('../pages/LandingPage/TenderDetailPage'));
const TenderManagePage = lazy(() => import('../pages/admin/TenderManagePage'));
const SearchResultsPage = lazy(() => import('../pages/LandingPage/SearchResultsPage'));
const RegularMarketPage = lazy(() => import('../pages/LandingPage/RegularMarketPage'));
const SalesDashboard = lazy(() => import('../pages/sales/SalesDashboard'));
const UnauthorizedPage  = lazy(() => import('../pages/auth/Unauthorized'));
const NotFoundPage = lazy(() => import('../pages/shared/NotFoundPage'));

// Flow 2 New Roles
// const MarketDashboard = lazy(() => import('../pages/market/MarketDashboard'));
// const SupplierDashboard = lazy(() => import('../pages/supplier/SupplierDashboard'));
const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#f8fafc',
    fontFamily: 'Inter, sans-serif', color: '#2563eb',
    fontSize: 15, gap: 10,
  }}>
    <span style={{ fontSize: 22 }}>⏳</span> Loading SUTANA…
  </div>
);
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public / Landing Pages — redirect to dashboard if logged in */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/printing" element={<PrintingServicePage />} />
        <Route path="/services/pharmacy" element={<PharmacyHealthPage />} />
        <Route path="/services/farming" element={<FarmingServicePage />} />
        <Route path="/services/retail" element={<RetailStorePage />} />
        <Route path="/fleet-gallery" element={<FleetGalleryPage />} />
        <Route path="/about"    element={<AboutPage />} />

        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/search" element={<PlaceholderPage />} />
        <Route path="/gallery/workers" element={<PlaceholderPage />} />
        <Route path="/gallery/cars" element={<PlaceholderPage />} />
        <Route path="/gallery/other" element={<PlaceholderPage />} />
        <Route path="/news/notice" element={<PlaceholderPage />} />
        <Route path="/news/video" element={<PlaceholderPage />} />
        <Route path="/news/gallery" element={<PlaceholderPage />} />

        <Route path="/marketplace/regular" element={<RegularMarketPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:type" element={<NewsPage />} />
        <Route path="/tenders" element={<PublicTendersPage />} />
        <Route path="/tenders/smart-bids" element={<PublicSmartTendersPage />} />
        <Route path="/tenders/buy" element={<PublicBuyTendersPage />} />
        <Route path="/tenders/:id" element={<TenderDetailPage />} />
        <Route path="/prescription-viewer" element={<PrescriptionViewer />} />

        <Route path="/chat"     element={<GlobalChatPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/auth/two-factor" element={<PublicRoute><TwoFactorPage /></PublicRoute>} />
        {}
        <Route path="/admin/*" element={
          <RoleBasedRoute role="Admin">
            <AdminDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/ceo/*" element={
          <RoleBasedRoute role="CEO">
            <CEODashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/finance/*" element={
          <RoleBasedRoute role={['Finance', 'Finance Manager', 'Admin']}>
            <FinanceDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/purchase/*" element={
          <RoleBasedRoute role={['Purchase', 'Market Team', 'Admin']}>
            <PurchaseDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/pharmacy-store/*" element={
          <RoleBasedRoute role={['Pharmacy Store Keeper', 'CEO']}>
            <PharmacyStoreDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/general-store/*" element={
          <RoleBasedRoute role={['General Store Keeper', 'CEO']}>
            <GeneralStoreDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/store-management/*" element={
          <RoleBasedRoute role={['Pharmacy Store Keeper', 'General Store Keeper', 'CEO']}>
            <StoreManagementDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/printing-manager/*" element={
          <RoleBasedRoute role={['Printing Supervisor', 'Printing Manager', 'Admin', 'CEO']}>
            <PrintingManagerDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/customer/*" element={
          <PrivateRoute>
            <CustomerDashboard />
          </PrivateRoute>
        } />
        {}
        <Route path="/pharmacy/*" element={
          <RoleBasedRoute role={['Pharmacy Manager', 'Admin', 'CEO']}>
            <PharmacyDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/pharmacy-worker/*" element={
          <RoleBasedRoute role={['Pharmacy Worker', 'Sales/Cashier', 'Admin', 'CEO']}>
            <PharmacyWorkerDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/car-renting/*" element={
          <RoleBasedRoute role="Car Renting Manager">
            <CarRentingDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/hr/*" element={
          <RoleBasedRoute role={['HR Manager', 'Admin', 'CEO']}>
            <HRDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/board/*" element={
          <RoleBasedRoute role={['Board Member', 'Admin', 'CEO']}>
            <BoardDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/employee/*" element={
          <PrivateRoute>
            <EmployeeDashboard />
          </PrivateRoute>
        } />
        {}
        <Route path="/notifications" element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        } />
        <Route path="/sales/*" element={
          <RoleBasedRoute role={['Admin', 'CEO', 'Sales Manager']}>
            <SalesDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/tenders/manage" element={
          <RoleBasedRoute role={['Admin', 'CEO', 'Sales Manager', 'Purchase']}>
            <TenderManagePage />
          </RoleBasedRoute>
        } />

        {/* Flow 2 New Roles */}
        {/* <Route path="/market/*" element={
          <RoleBasedRoute role={['Market Team', 'Admin', 'CEO']}>
            <MarketDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/supplier/*" element={
          <RoleBasedRoute role={['Supplier', 'Admin']}>
            <SupplierDashboard />
          </RoleBasedRoute>
        } /> */}
        {}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
