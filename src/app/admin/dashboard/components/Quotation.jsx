'use client'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import { generateQuotationPDF } from './QuotationPDF'
import { SERVICES_BY_EVENT, SERVICE_TO_CAMERA_MAP } from './constants'

export default function Quotation({ 
  quotation, 
  setQuotation, 
  quotationPricing, 
  activeRequirementTab, 
  setActiveRequirementTab,
  newEventName,
  setNewEventName,
  loading,
  setLoading,
  showToast 
}) {
  const scrollRef = useRef(null)
  const [showCustomEventInput, setShowCustomEventInput] = useState(false)
  
  // ✅ Load equipment from PricingList API
  const [equipmentList, setEquipmentList] = useState([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)

  useEffect(() => {
    loadEquipmentFromPricingList()
  }, [])

  const loadEquipmentFromPricingList = async () => {
    try {
      const response = await fetch('/api/quotation-pricing')
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        setEquipmentList(data.items)
        console.log('✅ Loaded equipment:', data.items.length)
      }
    } catch (error) {
      console.error('Failed to load equipment:', error)
      showToast('Failed to load equipment list', 'error')
    } finally {
      setLoadingEquipment(false)
    }
  }

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const isCustomEvent = (eventType) => {
    return !Object.keys(SERVICES_BY_EVENT).includes(eventType)
  }

  // ✅ UPDATED: Calculate total with ACTUAL PRICES included
  const calculateQuotationTotal = () => {
    let equipmentActualTotal = 0
    let equipmentCustomerTotal = 0

    // Calculate equipment totals (both actual and customer)
    if (quotation.selectedEquipment) {
      Object.keys(quotation.selectedEquipment).forEach(eventType => {
        const eventEquipment = quotation.selectedEquipment[eventType] || []
        eventEquipment.forEach(eq => {
          if (eq.selected && eq.equipmentId && eq.equipmentId !== 'Not Selected') {
            equipmentActualTotal += eq.actualPrice || 0
            equipmentCustomerTotal += eq.customerPrice || 0
          }
        })
      })
    }

    // ✅ SHEETS CALCULATION: Quantity × Price per sheet (both actual and customer)
    const sheetsQuantity = parseInt(quotation.sheetsCount) || 0
    const sheetsPricePerSheet = quotation.sheetsPricePerSheet || 0
    const sheetsActualPricePerSheet = quotation.sheetsActualPricePerSheet || 0
    const sheetsCustomerTotal = sheetsQuantity * sheetsPricePerSheet
    const sheetsActualTotal = sheetsQuantity * sheetsActualPricePerSheet

    // ✅ Grand totals (actual + customer)
    const actualGrandTotal = equipmentActualTotal + sheetsActualTotal
    const customerGrandTotal = equipmentCustomerTotal + sheetsCustomerTotal

    // ✅ Discount on customer total only
    const discountPercent = parseFloat(quotation.discount) || 0
    const discountAmount = Math.round((customerGrandTotal * discountPercent) / 100)

    // Final customer total
    const finalTotal = customerGrandTotal - discountAmount

    const formatNumber = (num) =>
      Math.round(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    return {
      equipmentActualTotal: formatNumber(equipmentActualTotal),
      equipmentTotal: formatNumber(equipmentCustomerTotal),
      sheetsActualTotal: formatNumber(sheetsActualTotal),
      sheetsTotal: formatNumber(sheetsCustomerTotal),
      actualGrandTotal: formatNumber(actualGrandTotal),
      grandTotal: formatNumber(customerGrandTotal),
      discountAmount: formatNumber(discountAmount),
      discountPercent,
      total: formatNumber(finalTotal)
    }
  }

  const toggleEventSelection = (eventType) => {
    setQuotation((prev) => {
      const isSelected = prev.selectedEvents.includes(eventType)
      
      if (isSelected) {
        const newEventDates = { ...prev.eventDates }
        delete newEventDates[eventType]
        
        const newSelectedEquipment = { ...(prev.selectedEquipment || {}) }
        delete newSelectedEquipment[eventType]
        
        return {
          ...prev,
          selectedEvents: prev.selectedEvents.filter((e) => e !== eventType),
          eventDates: newEventDates,
          selectedEquipment: newSelectedEquipment
        }
      } else {
        const categories = [
          'Traditional Photography',
          'Traditional Videography',
          'Candid Photography',
          'Candid Videography',
          'Drone',
          'Live Streaming',
          'LED Walls'
        ]
        
        const initialEquipment = categories.map((category, idx) => ({
          id: `${eventType}-${idx}`,
          category: category,
          selected: false,
          equipmentId: 'Not Selected',
          timeSlot: 'Not Selected',
          actualPrice: 0,
          customerPrice: 0
        }))
        
        return {
          ...prev,
          selectedEvents: [...prev.selectedEvents, eventType],
          eventDates: {
            ...prev.eventDates,
            [eventType]: { date: "", timeSlot: "" }
          },
          selectedEquipment: {
            ...(prev.selectedEquipment || {}),
            [eventType]: initialEquipment
          }
        }
      }
    })
    
    setTimeout(() => {
      scrollToTop()
      if (!quotation.selectedEvents.includes(eventType)) {
        setActiveRequirementTab(eventType)
      }
    }, 100)
  }

  const cancelEvent = (eventType) => {
    setQuotation((prev) => {
      const newEventDates = { ...prev.eventDates }
      delete newEventDates[eventType]
      
      const newSelectedEquipment = { ...(prev.selectedEquipment || {}) }
      delete newSelectedEquipment[eventType]
      
      return {
        ...prev,
        selectedEvents: prev.selectedEvents.filter((e) => e !== eventType),
        eventDates: newEventDates,
        selectedEquipment: newSelectedEquipment
      }
    })
    
    setTimeout(() => {
      scrollToTop()
      const remainingEvents = quotation.selectedEvents.filter(e => e !== eventType)
      if (remainingEvents.length > 0) {
        setActiveRequirementTab(remainingEvents[0])
      } else {
        setActiveRequirementTab('')
      }
    }, 100)
  }

  const handleAddCustomEvent = () => {
    const trimmed = newEventName.trim()
    if (!trimmed) return

    if (quotation.selectedEvents.includes(trimmed)) {
      scrollToTop()
      setActiveRequirementTab(trimmed)
      setNewEventName("")
      setShowCustomEventInput(false)
      return
    }

    const categories = [
      'Traditional Photography',
      'Traditional Videography',
      'Candid Photography',
      'Candid Videography',
      'Drone',
      'Live Streaming',
      'LED Walls'
    ]
    
    const initialEquipment = categories.map((category, idx) => ({
      id: `${trimmed}-${idx}`,
      category: category,
      selected: false,
      equipmentId: 'Not Selected',
      timeSlot: 'Not Selected',
      actualPrice: 0,
      customerPrice: 0
    }))

    setQuotation((prev) => ({
      ...prev,
      selectedEvents: [...prev.selectedEvents, trimmed],
      eventDates: {
        ...prev.eventDates,
        [trimmed]: { date: "", timeSlot: "" }
      },
      selectedEquipment: {
        ...(prev.selectedEquipment || {}),
        [trimmed]: initialEquipment
      }
    }))

    scrollToTop()
    setActiveRequirementTab(trimmed)
    setNewEventName("")
    setShowCustomEventInput(false)
  }

  const toggleCategorySelection = (eventType, categoryIndex) => {
    setQuotation(prev => {
      const currentSelectedEquipment = prev.selectedEquipment || {}
      const currentEventEquipment = currentSelectedEquipment[eventType] || []
      
      const updatedEquipment = currentEventEquipment.map((eq, idx) => {
        if (idx === categoryIndex) {
          return { 
            ...eq, 
            selected: !eq.selected,
            equipmentId: !eq.selected ? eq.equipmentId : 'Not Selected',
            timeSlot: !eq.selected ? eq.timeSlot : 'Not Selected',
            actualPrice: !eq.selected ? eq.actualPrice : 0,
            customerPrice: !eq.selected ? eq.customerPrice : 0
          }
        }
        return eq
      })

      return {
        ...prev,
        selectedEquipment: {
          ...currentSelectedEquipment,
          [eventType]: updatedEquipment
        }
      }
    })
  }

  const updateTimeSlot = (eventType, categoryIndex, timeSlot) => {
    setQuotation(prev => {
      const currentSelectedEquipment = prev.selectedEquipment || {}
      const currentEventEquipment = currentSelectedEquipment[eventType] || []
      
      const updatedEquipment = currentEventEquipment.map((eq, idx) => {
        if (idx === categoryIndex) {
          const selectedItem = equipmentList.find(item => item.id === parseInt(eq.equipmentId))
          
          let actualPrice = eq.actualPrice
          let customerPrice = eq.customerPrice
          
          if (selectedItem && timeSlot !== 'Not Selected') {
            if (timeSlot === 'Half Day') {
              actualPrice = selectedItem.actualPriceHalfDay || 0
              customerPrice = selectedItem.customerPriceHalfDay || 0
            } else if (timeSlot === 'Full Day') {
              actualPrice = selectedItem.actualPriceFullDay || 0
              customerPrice = selectedItem.customerPriceFullDay || 0
            }
          } else {
            actualPrice = 0
            customerPrice = 0
          }
          
          return { 
            ...eq, 
            timeSlot,
            actualPrice,
            customerPrice
          }
        }
        return eq
      })

      return {
        ...prev,
        selectedEquipment: {
          ...currentSelectedEquipment,
          [eventType]: updatedEquipment
        }
      }
    })
  }

  const handleGlobalTimeSlotChange = (eventType, globalTimeSlot) => {
    setQuotation(prev => {
      const currentSelectedEquipment = prev.selectedEquipment || {}
      const currentEventEquipment = currentSelectedEquipment[eventType] || []
      
      const updatedEquipment = currentEventEquipment.map(eq => {
        const selectedItem = equipmentList.find(item => item.id === parseInt(eq.equipmentId))
        
        let actualPrice = eq.actualPrice
        let customerPrice = eq.customerPrice
        
        if (selectedItem && globalTimeSlot !== '' && eq.equipmentId !== 'Not Selected') {
          if (globalTimeSlot === 'Half Day') {
            actualPrice = selectedItem.actualPriceHalfDay || 0
            customerPrice = selectedItem.customerPriceHalfDay || 0
          } else if (globalTimeSlot === 'Full Day') {
            actualPrice = selectedItem.actualPriceFullDay || 0
            customerPrice = selectedItem.customerPriceFullDay || 0
          }
        } else if (globalTimeSlot === '') {
          actualPrice = 0
          customerPrice = 0
        }
        
        return {
          ...eq,
          timeSlot: globalTimeSlot || 'Not Selected',
          actualPrice,
          customerPrice
        }
      })

      return {
        ...prev,
        eventDates: {
          ...prev.eventDates,
          [eventType]: {
            ...prev.eventDates[eventType],
            timeSlot: globalTimeSlot
          }
        },
        selectedEquipment: {
          ...currentSelectedEquipment,
          [eventType]: updatedEquipment
        }
      }
    })
  }

  const updateCameraModel = (eventType, categoryIndex, modelId) => {
    const selectedItem = equipmentList.find(item => item.id === parseInt(modelId))
    
    setQuotation(prev => {
      const currentSelectedEquipment = prev.selectedEquipment || {}
      const currentEventEquipment = currentSelectedEquipment[eventType] || []
      
      const updatedEquipment = currentEventEquipment.map((eq, idx) => {
        if (idx === categoryIndex) {
          if (modelId === 'Not Selected') {
            return { 
              ...eq, 
              equipmentId: 'Not Selected',
              actualPrice: 0,
              customerPrice: 0
            }
          } else if (selectedItem) {
            const currentTimeSlot = eq.timeSlot || 'Not Selected'
            let actualPrice = 0
            let customerPrice = 0
            
            if (currentTimeSlot === 'Half Day') {
              actualPrice = selectedItem.actualPriceHalfDay || 0
              customerPrice = selectedItem.customerPriceHalfDay || 0
            } else if (currentTimeSlot === 'Full Day') {
              actualPrice = selectedItem.actualPriceFullDay || 0
              customerPrice = selectedItem.customerPriceFullDay || 0
            } else {
              actualPrice = selectedItem.actualPriceHalfDay || 0
              customerPrice = selectedItem.customerPriceHalfDay || 0
            }
            
            return { 
              ...eq, 
              equipmentId: selectedItem.id,
              actualPrice,
              customerPrice
            }
          }
        }
        return eq
      })

      return {
        ...prev,
        selectedEquipment: {
          ...currentSelectedEquipment,
          [eventType]: updatedEquipment
        }
      }
    })
  }

  const updateCustomerPrice = (eventType, categoryIndex, price) => {
    setQuotation(prev => {
      const currentSelectedEquipment = prev.selectedEquipment || {}
      const currentEventEquipment = currentSelectedEquipment[eventType] || []
      
      const updatedEquipment = currentEventEquipment.map((eq, idx) => {
        if (idx === categoryIndex) {
          return { ...eq, customerPrice: parseInt(price) || 0 }
        }
        return eq
      })

      return {
        ...prev,
        selectedEquipment: {
          ...currentSelectedEquipment,
          [eventType]: updatedEquipment
        }
      }
    })
  }

  const getCamerasForCategory = (category) => {
    const categoryMap = {
      'Traditional Photography': 'Camera',
      'Traditional Videography': 'Camera',
      'Candid Photography': 'Camera',
      'Candid Videography': 'Camera',
      'Drone': 'Drone',
      'Live Streaming': 'Net Live',
      'LED Walls': 'LED Wall'
    }
    
    const equipmentCategory = categoryMap[category]
    return equipmentList.filter(item => item.category === equipmentCategory)
  }

  const getSheetTypes = () => {
    return equipmentList.filter(item => item.category === 'Sheets')
  }

  const handleSheetTypeChange = (sheetId) => {
    const selectedSheet = equipmentList.find(item => item.id === parseInt(sheetId))
    
    if (selectedSheet) {
      setQuotation({
        ...quotation,
        sheetsTypeId: selectedSheet.id,
        sheetsPricePerSheet: selectedSheet.customerPriceHalfDay || 0,
        sheetsActualPricePerSheet: selectedSheet.actualPriceHalfDay || 0
      })
    } else {
      setQuotation({
        ...quotation,
        sheetsTypeId: null,
        sheetsPricePerSheet: 0,
        sheetsActualPricePerSheet: 0
      })
    }
  }

  const sendQuotationEmail = async () => {
    if (!quotation.customerEmail) {
      showToast("Please enter customer email", "error")
      return
    }
    if (!quotation.firstName || !quotation.customerPhone) {
      showToast("Please fill customer details", "error")
      return
    }
    try {
      setLoading(true)
      
      const totals = calculateQuotationTotal()
      const pdfWithPrices = generateQuotationPDF(quotation, calculateQuotationTotal, true)
      const pdfWithoutPrices = generateQuotationPDF(quotation, calculateQuotationTotal, false)
      
      const pdfOwnerBlob = pdfWithPrices.output("blob")
      const pdfCustomerBlob = pdfWithoutPrices.output("blob")
      
      const formData = new FormData()
      formData.append("pdfOwner", pdfOwnerBlob, "quotation_owner.pdf")
      formData.append("pdfCustomer", pdfCustomerBlob, "quotation_customer.pdf")
      formData.append("customerEmail", quotation.customerEmail)
      formData.append("subject", `Quotation from Kalakruthi Photography - ${quotation.selectedEvents.join(", ")}`)
      formData.append("customerName", `${quotation.firstName} ${quotation.lastName || ''}`)
      formData.append("eventType", quotation.selectedEvents.join(", "))

      const response = await fetch("/api/send-quotation", {
        method: "POST",
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }
      
      showToast("Quotation sent successfully!", "success")
    } catch (error) {
      console.error("Email error:", error)
      showToast(`Error: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const downloadQuotationPDF = () => {
    const pdf = generateQuotationPDF(quotation, calculateQuotationTotal, true)
    pdf.save(`Quotation_${quotation.firstName}${quotation.lastName || ''}.pdf`)
    showToast("PDF downloaded!", "success")
  }

  const downloadCustomerPDF = () => {
    const pdf = generateQuotationPDF(quotation, calculateQuotationTotal, false)
    pdf.save(`Quotation_Customer_${quotation.firstName}${quotation.lastName || ''}.pdf`)
    showToast("Customer PDF downloaded!", "success")
  }

  const totals = calculateQuotationTotal()

  const eventTypes = [
    'Birthday',
    'Mature Function', 
    'PrePost Wedding', 
    'Engagement',
    'Marriage',
    'Reception',
    'Vratham',
    'Formalties'
  ]

  const timeSlots = ["Half Day", "Full Day"]

  return (
    <div ref={scrollRef}>
      <style>{`
        .quotation-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cancel-event-btn {
          background: #f59e0b !important;
          color: white !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          border-radius: 4px !important;
          margin-left: 4px !important;
          min-width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .cancel-event-btn:hover {
          background: #d97706 !important;
        }

        .requirement-row {
          display: grid;
          grid-template-columns: 30px 180px 200px 120px 120px 120px;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        @media (max-width: 768px) {
          .requirement-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 12px;
          }

          .quotation-section {
            padding: 16px !important;
            margin-bottom: 12px !important;
          }

          .section-title {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }

          .form-group {
            gap: 12px !important;
          }

          .form-input,
          .form-select {
            padding: 8px !important;
            font-size: 13px !important;
          }

          .event-buttons-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
        }
      `}</style>

      <div className="quotation-container">
        {/* Customer Details Section */}
        <div className="quotation-section" style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
            📋 Customer Details
          </h3>
          <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                Name
              </label>
              <input
                type="text"
                value={quotation.firstName || ""}
                onChange={(e) => setQuotation({ ...quotation, firstName: e.target.value })}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                📍 Location
              </label>
              <input
                type="text"
                placeholder="Enter event location"
                value={quotation.location || ""}
                onChange={(e) => setQuotation({ ...quotation, location: e.target.value })}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={quotation.customerPhone || ""}
                onChange={(e) => setQuotation({ ...quotation, customerPhone: e.target.value })}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            
            <div>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={quotation.customerEmail || ""}
                onChange={(e) => setQuotation({ ...quotation, customerEmail: e.target.value })}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div className="quotation-section" style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
            🎉 Select Event Types
          </h3>
          <div className="event-buttons-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {eventTypes.map((eventType) => (
              <button
                key={eventType}
                onClick={() => toggleEventSelection(eventType)}
                className="event-button"
                style={{
                  padding: "12px",
                  border: quotation.selectedEvents.includes(eventType)
                    ? "2px solid #10b981"
                    : "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: quotation.selectedEvents.includes(eventType) ? "#d1fae5" : "white",
                  color: quotation.selectedEvents.includes(eventType) ? "#065f46" : "#4b5563",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {quotation.selectedEvents.includes(eventType) ? "✓ " : ""}{eventType}
              </button>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowCustomEventInput(!showCustomEventInput)}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              + Add Custom Event
            </button>
            {showCustomEventInput && (
              <>
                <input
                  type="text"
                  placeholder="Enter custom event name..."
                  value={newEventName || ""}
                  onChange={(e) => setNewEventName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomEvent()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <button
                  onClick={handleAddCustomEvent}
                  style={{
                    padding: "10px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </>
            )}
          </div>
        </div>

        {/* SELECT REQUIREMENTS */}
        {quotation.selectedEvents.length > 0 && (
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              📸 Select Requirements
            </h3>
            
            <div className="event-tabs" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {quotation.selectedEvents.map((eventType) => (
                <div key={eventType} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => {
                      scrollToTop()
                      setActiveRequirementTab(eventType)
                    }}
                    className="event-tab-button"
                    style={{
                      padding: "10px 16px",
                      background: activeRequirementTab === eventType ? "#10b981" : "#f3f4f6",
                      color: activeRequirementTab === eventType ? "white" : "#4b5563",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {eventType}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cancelEvent(eventType)
                    }}
                    className="cancel-event-btn"
                    title="Cancel this event"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {activeRequirementTab && (
              <>
                {/* Event Date & Global Time Slot */}
                <div className="event-dates-display" style={{
                  background: "#f9fafb",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
                        📅 Event Date
                      </label>
                      <input
                        type="date"
                        value={quotation.eventDates[activeRequirementTab]?.date || ""}
                        onChange={(e) =>
                          setQuotation({
                            ...quotation,
                            eventDates: {
                              ...quotation.eventDates,
                              [activeRequirementTab]: {
                                ...quotation.eventDates[activeRequirementTab],
                                date: e.target.value,
                              },
                            },
                          })
                        }
                        className="date-input"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
                        ⏰ Apply Time Slot to All (Optional)
                      </label>
                      <select
                        value={quotation.eventDates[activeRequirementTab]?.timeSlot || ""}
                        onChange={(e) => handleGlobalTimeSlotChange(activeRequirementTab, e.target.value)}
                        className="form-select"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "2px solid #3b82f6",
                          borderRadius: "6px",
                          fontSize: "13px",
                          background: "white",
                          fontWeight: "600"
                        }}
                      >
                        <option value="">Quick fill all...</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Equipment List */}
                <div style={{ marginBottom: "16px" }}>
                  {loadingEquipment ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                      Loading equipment...
                    </div>
                  ) : (
                    quotation.selectedEquipment?.[activeRequirementTab]?.map((equipment, idx) => {
                      const availableCameras = getCamerasForCategory(equipment.category)
                      
                      return (
                        <div key={idx} className="requirement-row">
                          <input
                            type="checkbox"
                            checked={equipment.selected || false}
                            onChange={() => toggleCategorySelection(activeRequirementTab, idx)}
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                              accentColor: "#10b981"
                            }}
                          />

                          <div style={{ fontWeight: "600", fontSize: "14px", color: "#1f2937" }}>
                            {equipment.category}
                          </div>

                          <select
                            value={equipment.equipmentId || 'Not Selected'}
                            disabled={!equipment.selected}
                            onChange={(e) => updateCameraModel(activeRequirementTab, idx, e.target.value)}
                            style={{
                              padding: "10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              background: equipment.selected ? "white" : "#f3f4f6",
                              cursor: equipment.selected ? "pointer" : "not-allowed",
                            }}
                          >
                            <option value="Not Selected">Not Selected</option>
                            {availableCameras.map(camera => (
                              <option key={camera.id} value={camera.id}>
                                {camera.brand} {camera.model}
                              </option>
                            ))}
                          </select>

                          <select
                            value={equipment.timeSlot || 'Not Selected'}
                            disabled={!equipment.selected}
                            onChange={(e) => updateTimeSlot(activeRequirementTab, idx, e.target.value)}
                            style={{
                              padding: "10px",
                              border: "2px solid #3b82f6",
                              borderRadius: "6px",
                              fontSize: "14px",
                              background: equipment.selected ? "white" : "#f3f4f6",
                              cursor: equipment.selected ? "pointer" : "not-allowed",
                              fontWeight: "600"
                            }}
                          >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Full Day">Full Day</option>
                          </select>

                          <input
                            type="number"
                            value={equipment.actualPrice || 0}
                            readOnly
                            disabled
                            style={{
                              padding: "10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              textAlign: "right",
                              background: "#f3f4f6",
                              color: "#6b7280",
                              cursor: "not-allowed"
                            }}
                          />

                          <input
                            type="number"
                            value={equipment.customerPrice || 0}
                            disabled={!equipment.selected}
                            onChange={(e) => updateCustomerPrice(activeRequirementTab, idx, e.target.value)}
                            style={{
                              padding: "10px",
                              border: "2px solid #10b981",
                              borderRadius: "6px",
                              fontSize: "14px",
                              textAlign: "right",
                              background: equipment.selected ? "#d1fae5" : "#f3f4f6",
                              fontWeight: "600"
                            }}
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* SHEETS INFORMATION SECTION */}
        {quotation.selectedEvents.length > 0 && (
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              📄 Sheets Information
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Sheet Type/Quality
                </label>
                <select
                  value={quotation.sheetsTypeId || ''}
                  onChange={(e) => handleSheetTypeChange(e.target.value)}
                  className="form-select"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: "white"
                  }}
                >
                  <option value="">Select Sheet Type</option>
                  {getSheetTypes().map(sheet => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.brand} - {sheet.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  No. of Sheets
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotation.sheetsCount || 0}
                  onChange={(e) => setQuotation({ ...quotation, sheetsCount: e.target.value })}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Price per Sheet (₹)
                </label>
                <input
                  type="number"
                  value={quotation.sheetsPricePerSheet || 0}
                  onChange={(e) => setQuotation({ ...quotation, sheetsPricePerSheet: parseInt(e.target.value) || 0 })}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #10b981",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: "#d1fae5",
                    fontWeight: "600"
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ✅ UPDATED: QUOTATION SUMMARY WITH ACTUAL PRICES */}
        {quotation.selectedEvents.length > 0 && (
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              💰 Quotation Summary
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quotation.discount || ''}
                onChange={(e) => setQuotation({ ...quotation, discount: e.target.value })}
                className="form-input"
                style={{
                  width: "100%",
                  maxWidth: "200px",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "20px",
              marginBottom: "16px" 
            }}>
              {/* LEFT COLUMN - ACTUAL PRICES */}
              <div style={{ 
                background: "#fef2f2", 
                padding: "16px", 
                borderRadius: "8px",
                border: "2px solid #fecaca"
              }}>
                <h4 style={{ 
                  fontSize: "14px", 
                  fontWeight: "700", 
                  color: "#dc2626", 
                  marginBottom: "12px",
                  borderBottom: "2px solid #dc2626",
                  paddingBottom: "6px"
                }}>
                  📊 Owner View (Actual Prices)
                </h4>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: "13px", color: "#4b5563" }}>Equipment Total:</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626" }}>
                    ₹{totals.equipmentActualTotal || "0"}
                  </span>
                </div>
                
                {parseInt(quotation.sheetsCount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: "13px", color: "#4b5563" }}>Sheets Total:</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626" }}>
                      ₹{totals.sheetsActualTotal || "0"}
                    </span>
                  </div>
                )}
                
                <div style={{ borderTop: "1px solid #fecaca", margin: "8px 0" }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#991b1b" }}>
                    Grand Total (Actual):
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#dc2626" }}>
                    ₹{totals.actualGrandTotal || "0"}
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN - CUSTOMER PRICES */}
              <div style={{ 
                background: "#f0fdf4", 
                padding: "16px", 
                borderRadius: "8px",
                border: "2px solid #86efac"
              }}>
                <h4 style={{ 
                  fontSize: "14px", 
                  fontWeight: "700", 
                  color: "#16a34a", 
                  marginBottom: "12px",
                  borderBottom: "2px solid #16a34a",
                  paddingBottom: "6px"
                }}>
                  👤 Customer View (Customer Prices)
                </h4>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: "13px", color: "#4b5563" }}>Equipment Total:</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a" }}>
                    ₹{totals.equipmentTotal}
                  </span>
                </div>
                
                {parseInt(quotation.sheetsCount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: "13px", color: "#4b5563" }}>Sheets Total:</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a" }}>
                      ₹{totals.sheetsTotal}
                    </span>
                  </div>
                )}
                
                <div style={{ borderTop: "1px solid #86efac", margin: "8px 0" }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: "13px", color: "#4b5563" }}>Subtotal:</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a" }}>
                    ₹{totals.grandTotal}
                  </span>
                </div>
                
                {parseFloat(quotation.discount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: "13px", color: "#dc2626" }}>
                      Discount ({quotation.discount}%):
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626" }}>
                      -₹{totals.discountAmount}
                    </span>
                  </div>
                )}
                
                <div style={{ borderTop: "2px solid #16a34a", margin: "8px 0" }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#065f46" }}>
                    Final Amount:
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: "700", color: "#16a34a" }}>
                    ₹{totals.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        {quotation.selectedEvents.length > 0 && (
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <button
                onClick={sendQuotationEmail}
                disabled={loading}
                className="submit-button"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Sending..." : "📧 Submit Quotation"}
              </button>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  onClick={downloadQuotationPDF}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  📄 Owner PDF
                </button>
                
                <button
                  onClick={downloadCustomerPDF}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  👤 Customer PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
