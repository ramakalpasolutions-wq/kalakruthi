'use client'
import React, { useState } from 'react'
// ⬇️ SAFE START BELOW LETTERHEAD
const SAFE_TOP_Y = 95; // adjust between 65–85 if needed

const cameraConfigurations = {
  'Photo Camera': { Sony: ['7R III', '7 IV', '7R V'], Canon: ['EOS R5'] },
  'Video Camera': { Sony: ['FX3', 'FX30', '7 IV'], Canon: ['EOS R5'] },
  'Candid Photo': { Sony: ['7R V'], Canon: ['EOS R5'] },
  'Candid Video': { Sony: ['FX3', 'A7S III', '7 IV'], Canon: ['EOS R5'] }
}

export default function PricingList({ quotationPricing, setQuotationPricing }) {
  const [activePricingLayout, setActivePricingLayout] = useState('Quotation')
const [showSubmittedMessage, setShowSubmittedMessage] = useState(false)
const [submittedPrices, setSubmittedPrices] = useState({})

  const [b2bForm, setB2bForm] = useState({
    studioName: '',
    personName: '',
    phoneNumber: '',
    cameraType: '',
    cameraBrand: 'Sony',
    cameraModel: '',
    location: '',
    timeSlot: 'Half Day',
    totalPrice: 0,
    advance: 0,
    balance: 0
  })

  const [cameraTimeSlots, setCameraTimeSlots] = useState({
    'Photo Camera': 'Half Day',
    'Video Camera': 'Half Day',
    'Candid Photo': 'Half Day',
    'Candid Video': 'Half Day'
  })

  const [cameraBrands, setCameraBrands] = useState({
    'Photo Camera': 'Sony',
    'Video Camera': 'Sony',
    'Candid Photo': 'Sony',
    'Candid Video': 'Sony'
  })

  const [cameraModels, setCameraModels] = useState({
    'Photo Camera': '',
    'Video Camera': '',
    'Candid Photo': '',
    'Candid Video': ''
  })

  const [pricingData, setPricingData] = useState({
    cameras: {
      'Photo Camera': { actualPrice: 25000, customerPrice: 25000 },
      'Video Camera': { actualPrice: 30000, customerPrice: 30000 },
      'Candid Photo': { actualPrice: 20000, customerPrice: 20000 },
      'Candid Video': { actualPrice: 25000, customerPrice: 25000 }
    }
  })

  const cameraOptions = ['Photo Camera', 'Video Camera', 'Candid Photo', 'Candid Video']
  const timeSlots = ['Half Day', 'Full Day']

  const calculateQuotationTotal = () => {
    let total = 0
    Object.values(pricingData.cameras).forEach(c => total += c.customerPrice || 0)
    return total
  }

  /* 🔥 PRICE AUTO SYNC */
  const handlePriceUpdate = (cameraType, priceType, value) => {
    const price = parseInt(value) || 0

    setPricingData(prev => ({
      ...prev,
      cameras: {
        ...prev.cameras,
        [cameraType]: {
          ...prev.cameras[cameraType],
          [priceType]: price
        }
      }
    }))

    if (priceType === 'customerPrice') {
      setQuotationPricing(prev => ({
        ...prev,
        [cameraType]: {
          ...(prev?.[cameraType] || {}),
          price
        }
      }))
    }
  }

  /* 🔥 TIME AUTO SYNC */
  const handleCameraTimeSlotChange = (camera, timeSlot) => {
    setCameraTimeSlots(prev => ({ ...prev, [camera]: timeSlot }))

    setQuotationPricing(prev => ({
      ...prev,
      [camera]: {
        ...(prev?.[camera] || {}),
        time: timeSlot
      }
    }))
  }

  const handleCameraModelChange = (cameraType, brand, model) => {
    setCameraBrands(prev => ({ ...prev, [cameraType]: brand }))
    setCameraModels(prev => ({ ...prev, [cameraType]: model }))
  }

  const handleB2bInputChange = (field, value) => {
    setB2bForm(prev => {
      let newForm = { ...prev }
      
      if (field === 'totalPrice') {
        newForm.totalPrice = Math.max(0, parseInt(value) || 0)
      } else if (field === 'advance') {
        newForm.advance = Math.max(0, parseInt(value) || 0)
      } else {
        newForm[field] = value
      }
      
      newForm.balance = Math.max(0, newForm.totalPrice - newForm.advance)
      
      return newForm
    })
  }

  const handleB2bCameraTypeChange = (cameraType) => {
    setB2bForm(prev => ({
      ...prev,
      cameraType,
      cameraModel: ''
    }))
  }

  // NEW: Function to submit prices to quotation section
  const submitQuotationPrices = () => {
    // Store the current customer prices
    const newSubmittedPrices = {}
    cameraOptions.forEach(camera => {
      newSubmittedPrices[camera] = pricingData.cameras[camera]?.customerPrice || 0
    })
    setSubmittedPrices(newSubmittedPrices)
    
    // Show success message
    setShowSubmittedMessage(true)
    
    // Hide message after 3 seconds
    setTimeout(() => {
      setShowSubmittedMessage(false)
    }, 3000)
    
    // Show alert
    alert('✅ Prices submitted to Quotation section! You can now go to the Quotation tab to use these prices.')
  }

  // NEW: Function to get price for a camera type (for quotation section)
  const getCameraPrice = (cameraType) => {
    return submittedPrices[cameraType] || pricingData.cameras[cameraType]?.customerPrice || 0
  }

   const downloadB2BPdf = async () => {
    try {
      if (!b2bForm.studioName || !b2bForm.phoneNumber || b2bForm.totalPrice <= 0) {
        alert('❌ Please fill Studio Name, Phone, and Total Amount')
        return
      }

      /* ================= 1️⃣ SAVE TO MONGODB ================= */

      const payload = {
        id: Date.now().toString(),
        studio: b2bForm.studioName,
        person: b2bForm.personName,
        phone: b2bForm.phoneNumber,
        date: new Date().toISOString().split('T')[0],
        camera: `${b2bForm.cameraType} - ${b2bForm.cameraBrand} ${b2bForm.cameraModel}`,
        location: b2bForm.location,
        total: b2bForm.totalPrice,
        advance: b2bForm.advance,
        balance: b2bForm.totalPrice - b2bForm.advance,
        status:
          b2bForm.totalPrice - b2bForm.advance === 0 ? 'Paid' : 'Pending'
      }

      const saveRes = await fetch('/api/b2b-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!saveRes.ok) {
        throw new Error('MongoDB save failed')
      }

      /* ================= 2️⃣ PDF (UNCHANGED) ================= */

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  compress: true,
})
doc.addImage("/letterhead.jpeg", "JPEG", 0, 0, 210, 297)
let y = 85


      doc.setProperties({
        title: 'B2B Order Form',
        subject: 'Camera Rental Order',
        author: 'Kalakruthi Photography',
        creator: 'Kalakruthi Admin Dashboard'
      })

      

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      const date = new Date().toLocaleDateString('en-IN')
      let yPosition = SAFE_TOP_Y

// Date (top right)
doc.setFontSize(10)
doc.setFont("helvetica", "normal")
doc.text(`Date: ${date}`, 190, yPosition, { align: "right" })

yPosition += 10

// Order Details heading
doc.setFontSize(14)
doc.setFont("helvetica", "bold")
doc.text("Order Details", 14, yPosition)

yPosition += 12


      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
     // let yPosition = 65

      doc.setFont('helvetica', 'bold')
      doc.text('Studio Information:', 14, yPosition)
      yPosition += 7

      doc.setFont('helvetica', 'normal')
      doc.text(`Studio Name: ${b2bForm.studioName}`, 20, yPosition)
      yPosition += 7

      doc.text(`Contact Person: ${b2bForm.personName || 'Not Provided'}`, 20, yPosition)
      yPosition += 7

      doc.text(`Phone: ${b2bForm.phoneNumber}`, 20, yPosition)
      yPosition += 7

      yPosition += 3
      doc.setFont('helvetica', 'bold')
      doc.text('Camera Details:', 14, yPosition)
      yPosition += 7

      doc.setFont('helvetica', 'normal')
      doc.text(`Camera Type: ${b2bForm.cameraType || 'Not Selected'}`, 20, yPosition)
      yPosition += 7

      doc.text(`Camera Brand: ${b2bForm.cameraBrand}`, 20, yPosition)
      yPosition += 7

      doc.text(`Camera Model: ${b2bForm.cameraModel || 'Not Selected'}`, 20, yPosition)
      yPosition += 7

      yPosition += 3
      doc.setFont('helvetica', 'bold')
      doc.text('Event Details:', 14, yPosition)
      yPosition += 7

      doc.setFont('helvetica', 'normal')
      doc.text(`Location: ${b2bForm.location || 'Not Provided'}`, 20, yPosition)
      yPosition += 7

      doc.text(`Time Slot: ${b2bForm.timeSlot}`, 20, yPosition)
      yPosition += 7

      yPosition += 3
      doc.setFont('helvetica', 'bold')
      doc.text('Payment Details:', 14, yPosition)
      yPosition += 7

      const paymentData = [
        ['Total Amount', `${b2bForm.totalPrice.toLocaleString('en-IN')}`],
        ['Advance Paid', `${b2bForm.advance.toLocaleString('en-IN')}`],
        ['Balance Due', `${b2bForm.balance.toLocaleString('en-IN')}`]
      ]

      doc.setFont('helvetica', 'normal')
      paymentData.forEach(row => {
        doc.text(row[0], 20, yPosition)
        doc.text(row[1], 150, yPosition)
        yPosition += 7
      })

      yPosition += 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(
        'This is a computer-generated document. No signature required.',
        105,
        yPosition,
        { align: 'center' }
      )

      doc.save(`B2B-Order-${b2bForm.studioName}-${Date.now()}.pdf`)

      alert('✅ PDF downloaded & B2B customer updated')

    } catch (error) {
      console.error('❌ PDF Download ERROR:', error)
      alert('❌ Failed to generate PDF. Please try again.')
    }
  }


  const formInputStyle = {
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#fafbfc',
    fontWeight: '500',
    minHeight: '48px'
  }

  const selectInputStyle = {
    padding: '12px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    background: '#fafbfc',
    fontWeight: '500',
    minHeight: '44px',
    flex: 1
  }

  const priceInputStyleActual = {
    padding: '12px 12px',
    border: '2px solid #f59e0b',
    borderRadius: '10px',
    background: '#fef3c7',
    textAlign: 'right',
    fontWeight: '600',
    fontSize: '14px',
    minHeight: '44px'
  }

  const priceInputStyleCustomer = {
    padding: '12px 12px',
    border: '2px solid #10b981',
    borderRadius: '10px',
    background: '#d1fae5',
    textAlign: 'right',
    fontWeight: '600',
    fontSize: '14px',
    minHeight: '44px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '16px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      <style>{`
        .pricing-tabs {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          max-width: 700px;
          margin: 0 auto 20px;
        }
        
        .pricing-tab {
          padding: 14px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f8fafc;
          color: #64748b;
        }
        
        .pricing-tab.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.12);
          border: 1px solid #f1f5f9;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .b2b-form-container {
          padding: 0 24px 24px;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .pricing-card-header {
            padding: 16px !important;
          }
          
          .grid-header, .grid-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 12px !important;
          }
          
          .camera-info-mobile {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .price-inputs-mobile {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          
          .mobile-label {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #64748b !important;
            margin-bottom: 4px !important;
          }
          
          .mobile-value {
            font-weight: 600 !important;
            font-size: 14px !important;
            color: #1f2937 !important;
          }
        }

        @media (min-width: 768px) {
          .pricing-tabs { flex-direction: row; }
          .pricing-tab { flex: 1; font-size: 16px; }
        }

        @media (max-width: 480px) {
          .pricing-card { border-radius: 12px; }
          .pricing-tabs { padding: 16px; }
          .pricing-tab { padding: 12px 16px; font-size: 13px; }
          .b2b-form-container { padding: 0 16px 20px; }
          
          .submit-message {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            z-index: 1000 !important;
          }
        }
      `}</style>

      <div className="pricing-tabs">
        <button className={`pricing-tab ${activePricingLayout === 'Quotation' ? 'active' : ''}`}
          onClick={() => setActivePricingLayout('Quotation')}>
          👤 Quotation Pricing
        </button>
        <button className={`pricing-tab ${activePricingLayout === 'B2B' ? 'active' : ''}`}
          onClick={() => setActivePricingLayout('B2B')}>
          💼 B2B Orders
        </button>
      </div>

      {showSubmittedMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          ✅ Prices submitted to Quotation section!
        </div>
      )}

      {activePricingLayout === 'Quotation' ? (
        <div className="pricing-card">
          <div className="pricing-card-header" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', borderRadius: '16px 16px 0 0'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>👤 Quotation Pricing</h2>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              ₹{calculateQuotationTotal().toLocaleString()}
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="grid-header" style={{
            display: 'grid', 
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', 
            gap: '8px',
            padding: '16px 24px', 
            background: '#f8fafc', 
            fontWeight: '600', 
            color: '#1e293b', 
            fontSize: '13px'
          }}>
            <div>Camera</div>
            <div style={{ textAlign: 'center' }}>Brand/Model</div>
            <div style={{ textAlign: 'center' }}>Time</div>
            <div style={{ textAlign: 'center' }}>Actual ₹</div>
            <div style={{ textAlign: 'center' }}>Customer ₹</div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {cameraOptions.map((camera) => (
              <div key={camera} className="grid-row" style={{
                display: 'grid', 
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', 
                gap: '12px', 
                alignItems: 'center',
                padding: '16px 0', 
                borderBottom: '1px solid #f1f5f9'
              }}>
                {/* Desktop View */}
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                  📷 {camera}
                </div>
                
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <select style={selectInputStyle}
                    value={cameraBrands[camera] || 'Sony'}
                    onChange={(e) => handleCameraModelChange(camera, e.target.value, cameraModels[camera])}
                  >
                    <option>Sony</option>
                    <option>Canon</option>
                  </select>
                  <select style={selectInputStyle}
                    value={cameraModels[camera] || ''}
                    onChange={(e) => handleCameraModelChange(camera, cameraBrands[camera], e.target.value)}
                  >
                    <option value="">Model</option>
                    {cameraConfigurations[camera][cameraBrands[camera] || 'Sony'].map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                
                <select style={selectInputStyle}
                  value={cameraTimeSlots[camera] || 'Half Day'}
                  onChange={(e) => handleCameraTimeSlotChange(camera, e.target.value)}
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  value={pricingData.cameras[camera]?.actualPrice || 0}
                  onChange={(e) => handlePriceUpdate(camera, 'actualPrice', e.target.value)}
                  style={priceInputStyleActual}
                  placeholder="0"
                  min="0"
                />
                
                <input
                  type="number"
                  value={pricingData.cameras[camera]?.customerPrice || 0}
                  onChange={(e) => handlePriceUpdate(camera, 'customerPrice', e.target.value)}
                  style={priceInputStyleCustomer}
                  placeholder="0"
                  min="0"
                />
                
                {/* Mobile View */}
                <div className="mobile-view" style={{
                  display: 'none',
                  gridColumn: '1 / -1',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginTop: '8px'
                }}>
                  <div className="camera-info-mobile">
                    <div>
                      <div className="mobile-label">Brand/Model</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <select style={{...selectInputStyle, flex: 1}}
                          value={cameraBrands[camera] || 'Sony'}
                          onChange={(e) => handleCameraModelChange(camera, e.target.value, cameraModels[camera])}
                        >
                          <option>Sony</option>
                          <option>Canon</option>
                        </select>
                        <select style={{...selectInputStyle, flex: 1}}
                          value={cameraModels[camera] || ''}
                          onChange={(e) => handleCameraModelChange(camera, cameraBrands[camera], e.target.value)}
                        >
                          <option value="">Model</option>
                          {cameraConfigurations[camera][cameraBrands[camera] || 'Sony'].map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mobile-label">Time Slot</div>
                      <select style={{...selectInputStyle, width: '100%'}}
                        value={cameraTimeSlots[camera] || 'Half Day'}
                        onChange={(e) => handleCameraTimeSlotChange(camera, e.target.value)}
                      >
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="price-inputs-mobile">
                      <div>
                        <div className="mobile-label">Actual Price</div>
                        <input
                          type="number"
                          value={pricingData.cameras[camera]?.actualPrice || 0}
                          onChange={(e) => handlePriceUpdate(camera, 'actualPrice', e.target.value)}
                          style={{...priceInputStyleActual, width: '100%'}}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <div className="mobile-label">Customer Price</div>
                        <input
                          type="number"
                          value={pricingData.cameras[camera]?.customerPrice || 0}
                          onChange={(e) => handlePriceUpdate(camera, 'customerPrice', e.target.value)}
                          style={{...priceInputStyleCustomer, width: '100%'}}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button Section */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderTop: '2px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '12px', 
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                TOTAL: ₹{calculateQuotationTotal().toLocaleString()}
              </div>
              
              <button onClick={submitQuotationPrices}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                📤 Submit 
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pricing-card">
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
            padding: '20px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white', borderRadius: '16px 16px 0 0', textAlign: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>💼 B2B Order Form</h2>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              ₹{b2bForm.totalPrice.toLocaleString()}
            </div>
          </div>

          <div className="b2b-form-container">
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input placeholder="🏢 Studio Name *" 
                  value={b2bForm.studioName}
                  onChange={(e) => handleB2bInputChange('studioName', e.target.value)}
                  style={formInputStyle} />
                <input placeholder="👤 Person Name *" 
                  value={b2bForm.personName}
                  onChange={(e) => handleB2bInputChange('personName', e.target.value)}
                  style={formInputStyle} />
              </div>

              <input placeholder="📱 Phone Number *" 
                value={b2bForm.phoneNumber}
                onChange={(e) => handleB2bInputChange('phoneNumber', e.target.value)}
                style={formInputStyle} />

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ 
                  padding: '16px', background: '#f8fafc', borderRadius: '10px', 
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px', color: '#1f2937' }}>
                    📷 Camera Selection
                  </div>
                  <select value={b2bForm.cameraType}
                    onChange={(e) => handleB2bCameraTypeChange(e.target.value)}
                    style={formInputStyle}
                  >
                    <option value="">Select Camera Type</option>
                    {cameraOptions.map(camera => (
                      <option key={camera} value={camera}>{camera}</option>
                    ))}
                  </select>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px', 
                    marginTop: '10px'
                  }}>
                    <select value={b2bForm.cameraBrand}
                      onChange={(e) => handleB2bInputChange('cameraBrand', e.target.value)}
                      style={formInputStyle}
                      disabled={!b2bForm.cameraType}
                    >
                      <option value="">Brand</option>
                      <option>Sony</option>
                      <option>Canon</option>
                    </select>
                    
                    {b2bForm.cameraType && (
                      <select value={b2bForm.cameraModel}
                        onChange={(e) => handleB2bInputChange('cameraModel', e.target.value)}
                        style={formInputStyle}
                      >
                        <option value="">Model</option>
                        {cameraConfigurations[b2bForm.cameraType]?.[b2bForm.cameraBrand || 'Sony']?.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <input placeholder="📍 Event Location *" 
                value={b2bForm.location}
                onChange={(e) => handleB2bInputChange('location', e.target.value)}
                style={formInputStyle} />

              <select value={b2bForm.timeSlot}
                onChange={(e) => handleB2bInputChange('timeSlot', e.target.value)}
                style={formInputStyle}
              >
                <option value="">Select Duration</option>
                <option>Half Day</option>
                <option>Full Day</option>
              </select>

              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                padding: '24px', borderRadius: '12px', border: '2px solid #0ea5e9'
              }}>
                <h5 style={{ 
                  margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', 
                  color: '#0369a1', textAlign: 'center'
                }}>
                  💰 Payment Details
                </h5>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
                      💎 Total Amount *
                    </label>
                    <input type="number" 
                      value={b2bForm.totalPrice}
                      onChange={(e) => handleB2bInputChange('totalPrice', e.target.value)}
                      placeholder="Enter total amount"
                      min="0"
                      style={{ 
                        ...formInputStyle, 
                        background: '#dbeafe', 
                        fontWeight: '700', 
                        fontSize: '15px',
                        borderColor: '#3b82f6'
                      }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
                      💳 Advance Payment
                    </label>
                    <input type="number" 
                      value={b2bForm.advance}
                      onChange={(e) => handleB2bInputChange('advance', e.target.value)}
                      placeholder="Enter advance"
                      min="0"
                      style={{ ...formInputStyle, background: '#fef3c7', fontWeight: '600', fontSize: '15px' }} />
                  </div>
                  <div style={{ 
                    padding: '14px', background: '#ecfdf5', borderRadius: '10px', 
                    borderLeft: '4px solid #10b981', textAlign: 'center'
                  }}>
                    <label style={{ fontSize: '15px', fontWeight: '700', color: '#065f46' }}>
                      💰 Balance: ₹{b2bForm.balance.toLocaleString()}
                    </label>
                  </div>
                </div>
              </div>

              <button onClick={downloadB2BPdf}
                style={{
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white', border: 'none', borderRadius: '12px', 
                  fontWeight: '700', fontSize: '16px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  marginTop: '8px'
                }}
              >
                📥 Download B2B Order PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for mobile responsiveness */}
      <style jsx>{`
        @media (max-width: 768px) {
          .grid-header {
            display: none !important;
          }
          
          .grid-row {
            grid-template-columns: 1fr !important;
            padding: 16px 0 !important;
            border-bottom: 2px solid #f1f5f9 !important;
          }
          
          .grid-row > div:first-child {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
          
          .mobile-view {
            display: block !important;
          }
          
          .grid-row > div:not(:first-child):not(.mobile-view) {
            display: none !important;
          }
          
          .submit-message {
            animation: fadeIn 0.3s ease-in;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}