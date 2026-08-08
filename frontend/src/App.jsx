import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import ContactPopup from './components/ContactPopup';
import { SmartFooter } from './pages/LandingPage/ModernSections';
import GlobalLoader from './components/ui/GlobalLoader';
import './App.css';


function App() {
  const location = useLocation();
  const showFooter = ['/','/services','/gallery','/fleet-gallery','/news','/track-order','/about','/contact','/tenders','/search','/prescription-viewer','/services/printing','/printing-contact','/hr-contact'].some(p =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  );
  return (
    <div className="app-container">
      <GlobalLoader />
      <AppRoutes />
      {showFooter && <SmartFooter />}

      <ContactPopup />
      <ScrollToTop />
    </div>
  );
}

export default App;
