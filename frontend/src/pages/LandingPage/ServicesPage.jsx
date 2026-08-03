import { useNavigate } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, ArrowRight } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
export { PublicNav };
import './PublicLayout.css';

const DARK_GREEN = '#1B5E20';
const FOREST_GREEN = '#228B22';
const EMERALD_GREEN = '#2E8B57';
const OLIVE_GREEN = '#6B8E23';
const EARTH_BROWN = '#8D6E63';
const LIGHT_GRAY = '#F5F5F5';
const DARK_GRAY = '#424242';
const SAGE_GREEN = '#A5D6A7';

const STYLES = `
  .services-page-wrap {
    min-height: 100vh;
    background: ${LIGHT_GRAY};
    display: flex;
    flex-direction: column;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  
  .services-content {
    flex: 1;
    padding: 80px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .services-header {
    text-align: center;
    margin-bottom: 48px;
  }
  
  .services-header h1 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900;
    color: ${DARK_GREEN};
    margin: 0 0 16px;
  }
  
  .services-header p {
    font-size: 1.05rem;
    color: ${DARK_GRAY};
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .services-list {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .service-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    border-radius: 12px;
    background: #FFFFFF;
    border: 1px solid ${EARTH_BROWN};
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .service-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .service-icon-box {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    background: ${SAGE_GREEN};
    color: ${DARK_GREEN};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .service-card:hover .service-icon-box {
    background: ${FOREST_GREEN};
    color: #FFFFFF;
  }

  .service-info {
    flex: 1;
  }

  .service-title {
    font-weight: 800;
    font-size: 1.1rem;
    color: ${DARK_GREEN};
    margin-bottom: 4px;
  }

  .service-desc {
    font-size: 0.9rem;
    color: ${DARK_GRAY};
    line-height: 1.5;
  }

  .service-arrow {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${LIGHT_GRAY};
    color: ${DARK_GRAY};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .service-card:hover .service-arrow {
    background: ${SAGE_GREEN};
    color: ${DARK_GREEN};
    transform: translateX(4px);
  }

  .services-actions {
    margin-top: 48px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .services-btn-primary {
    background: ${EMERALD_GREEN};
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .services-btn-primary:hover {
    background: ${DARK_GREEN};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,94,32,0.3);
  }

  .services-btn-secondary {
    background: ${OLIVE_GREEN};
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .services-btn-secondary:hover {
    background: #55711C;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 142, 35, 0.3);
  }

  @media (max-width: 768px) {
    .services-content { padding: 48px 16px; }
    .service-card { padding: 20px; gap: 16px; }
    .service-icon-box { width: 48px; height: 48px; }
  }
`;

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
      <style>{STYLES}</style>
      <PublicNav />
      
      <div className="services-content">
        <div className="services-header">
          <h1>Our <span style={{ color: FOREST_GREEN }}>Services</span></h1>
          <p>We provide a comprehensive suite of tools and services designed to empower your business operations.</p>
        </div>

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
                  <div className="service-title">{service.label}</div>
                  <div className="service-desc">{service.desc}</div>
                </div>
                <div className="service-arrow">
                  <ArrowRight size={18} />
                </div>
              </a>
            );
          })}
        </div>

        <div className="services-actions">
          <button className="services-btn-secondary" onClick={() => navigate('/about')}>
            About Us
          </button>
          <button className="services-btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
