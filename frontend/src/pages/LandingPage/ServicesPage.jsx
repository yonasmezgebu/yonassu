import { useNavigate } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, ArrowRight } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
export { PublicNav };
import './LandingRedesign.css';
import './ServicesPage.css';

const services = [
  { icon: Printer, label: 'Commercial Printing',   path: '/services/printing', desc: 'Offset, digital, large-format printing with end-to-end production tracking.' },
  { icon: Pill,    label: 'Pharmacy & Health',     path: '/services/pharmacy', desc: 'Prescription management, medication inventory, and health consultations.' },
  { icon: Car,     label: 'Car Rental',            path: '/fleet-gallery',     desc: 'Reliable vehicles for short and long-term rental with flexible terms.' },
  { icon: Wheat,   label: 'AgriRent',              path: '/services/farming',  desc: 'Rent farming machineries, tractors, and expert advice for modern farming.' },
  { icon: Store,   label: 'Retail Store',          path: '/services/retail',   desc: 'Stationery, electronics, office supplies, and everyday essentials.' },
];

const ServicesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="services-page-wrap">
      <PublicNav />
      
      <main className="services-container">
        <div className="services-content">
          
          <header className="services-header">
            <h1 className="services-title">
              Our <span className="services-accent">Services</span>
            </h1>
            <p className="services-subtitle">
              We provide a comprehensive suite of tools and services designed to empower your business operations.
            </p>
          </header>

          <div className="services-list">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <a 
                  key={index} 
                  href={service.path} 
                  onClick={(e) => { e.preventDefault(); navigate(service.path); }}
                  className="service-card"
                >
                  <div className="service-icon-box">
                    <Icon size={24} />
                  </div>
                  <div className="service-info">
                    <h2 className="service-name">{service.label}</h2>
                    <p className="service-desc">{service.desc}</p>
                  </div>
                  <div className="service-arrow">
                    <ArrowRight size={18} />
                  </div>
                </a>
              );
            })}
          </div>

          <div className="services-actions">
            <button
              type="button"
              className="services-btn-secondary"
              onClick={() => navigate('/about')}
            >
              About Us
            </button>
            <button
              type="button"
              className="services-btn-primary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
