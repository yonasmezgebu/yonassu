import React, { useState } from 'react';
import { FilePlus, CheckCircle, Upload } from 'lucide-react';
import axios from 'axios';

const PharmacyWorkerNewPrescription = () => {
  const [source, setSource] = useState('Physical Prescription');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [strength, setStrength] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dosage, setDosage] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_age: parseInt(patientAge),
        medicine_name: medicineName,
        strength,
        quantity: parseInt(quantity),
        dosage_instructions: dosage,
        prescriber_name: doctorName,
        prescriber_hospital: hospital,
        prescription_date: prescriptionDate,
        source
      };
      const res = await axios.post('/api/pharmacy-sales/prescriptions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rx = res.data.data;
      setSubmitted({
        prescriptionNumber: rx.prescription_code,
        status: rx.status,
        patientName: rx.patient_name,
        medicineName: rx.medicine_name,
        isAvailable: rx.status !== 'ON_HOLD'
      });
    } catch (err) { alert(`Failed to submit: ${err.response?.data?.message || err.message}`);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #ec4899', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#ec4899" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#831843', margin: '0 0 8px' }}>Prescription Logged</h2>
          <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: 8, margin: '24px 0', border: '1px solid #fbcfe8' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#be185d' }}>{submitted.prescriptionNumber}</div>
            <div style={{ margin: '8px 0', fontSize: 14 }}>Patient: <strong>{submitted.patientName}</strong></div>
            <div style={{ fontSize: 14 }}>Medicine: <strong>{submitted.medicineName}</strong></div>
            
            <div style={{ marginTop: 16, display: 'inline-block', padding: '6px 12px', borderRadius: 4, background: submitted.isAvailable ? '#dcfce7' : '#fee2e2', color: submitted.isAvailable ? '#166534' : '#991b1b', fontWeight: 600, fontSize: 13 }}>
              Status: {submitted.status}
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            {submitted.isAvailable 
              ? 'Medicine is in stock. Record marked as ready to prepare for dispense.' 
              : 'Medicine is out of stock. Patient notification triggered.'}
          </p>

          <button onClick={() => { setSubmitted(null); setPatientName(''); setMedicineName(''); setQuantity(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            + Log Another Prescription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#831843' }}>
          <FilePlus color="#ec4899" size={28} /> NEW PRESCRIPTION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Prescription Form</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Source</h3>
          <select value={source} onChange={e => setSource(e.target.value)} style={{ width: 300, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
            <option>Physical Prescription (In-person)</option>
            <option>Online Prescription (Submitted)</option>
          </select>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Patient Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Full Name *</label>
              <input required value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Patient Name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone *</label>
              <input required value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="Phone Number" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Age *</label>
              <input required type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Age" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Prescription Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Medicine Name *</label>
              <input required value={medicineName} onChange={e => setMedicineName(e.target.value)} placeholder="Try 'Amoxicillin' or 'Ibuprofen'" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Strength *</label>
              <input required value={strength} onChange={e => setStrength(e.target.value)} placeholder="e.g. 500mg" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Quantity *</label>
              <input required type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Dosage Instructions *</label>
              <input required value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 1 tab twice daily" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Doctor Name *</label>
              <input required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Hospital/Institution *</label>
              <input required value={hospital} onChange={e => setHospital(e.target.value)} placeholder="Hospital" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {source === 'Online Prescription (Submitted)' && (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Prescription Image</h3>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: 32, textAlign: 'center', background: '#f8fafc' }}>
              <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: '0 0 8px', color: '#475569', fontWeight: 500 }}>Upload Prescription Image (Required for Online)</p>
              <input required type="file" accept="image/*" style={{ fontSize: 13 }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={{ padding: '12px 32px', background: '#ec4899', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            Submit Prescription
          </button>
        </div>
      </form>
    </div>
  );
};

export default PharmacyWorkerNewPrescription;
