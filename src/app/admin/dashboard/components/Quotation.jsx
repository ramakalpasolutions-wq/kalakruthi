'use client'
import React, { useCallback, useRef, useState, useEffect } from 'react'
//import { SERVICES_BY_EVENT } from './constants'
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

 const calculateQuotationTotal = () => {
  let servicesTotal = 0

  // ✅ ONLY SERVICES
  quotation.selectedEvents.forEach((eventType) => {
    const eventServicesData =
      SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT["Other"] || []

    eventServicesData.forEach((service) => {
      const serviceKey = `${eventType}-${service.name}`
      if (quotation.eventServices?.[serviceKey]) {
        const amount =
          quotation.serviceAmounts?.[serviceKey] || service.amount
        servicesTotal += amount
      }
    })
  })

  // ✅ SHEETS SEPARATE
  const sheetsTotal = parseInt(quotation.sheetsCustomerPrice) || 0

  // ✅ DISCOUNT ONLY ON SERVICES
  const discountPercent = parseFloat(quotation.discount) || 0
  const discountAmount = Math.round(
    (servicesTotal * discountPercent) / 100
  )

  // ✅ FINAL TOTAL
  const finalTotal = servicesTotal - discountAmount + sheetsTotal

  const formatNumber = (num) =>
    Math.round(num)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return {
    servicesTotal: formatNumber(servicesTotal),
    sheetsCustomerPrice: formatNumber(sheetsTotal),
    discountAmount: formatNumber(discountAmount),
    discountPercent,
    total: formatNumber(finalTotal),
    sheetsCount: Math.max(0, parseInt(quotation.sheetsCount) || 0),
  }
}


  const toggleEventSelection = (eventType) => {
    setQuotation((prev) => {
      const isSelected = prev.selectedEvents.includes(eventType)
      
      if (isSelected) {
        const newEventDates = { ...prev.eventDates }
        delete newEventDates[eventType]
        
        const newEventServices = { ...prev.eventServices }
        const newServiceAmounts = { ...prev.serviceAmounts }
        
        const servicesForEvent = SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT["Other"] || []
        servicesForEvent.forEach((service) => {
         const key = `${eventType}-${service.name}`
         delete newEventServices[key]
         delete newServiceAmounts[key]
        })
        
        return {
          ...prev,
          selectedEvents: prev.selectedEvents.filter((e) => e !== eventType),
          eventDates: newEventDates,
          eventServices: newEventServices,
          serviceAmounts: newServiceAmounts
        }
      } else {
        // When adding a new event, DO NOT pre-select any services
        const newEventServices = { ...prev.eventServices }
        const newServiceAmounts = { ...prev.serviceAmounts }
        
        const servicesForEvent = SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT["Other"] || []
        servicesForEvent.forEach((service) => {
          const key = `${eventType}-${service.name}`
          // Initialize as NOT selected (false) instead of true
          newEventServices[key] = false
          // Still store the default amount for reference
          newServiceAmounts[key] = service.amount
        })
        
        return {
          ...prev,
          selectedEvents: [...prev.selectedEvents, eventType],
          eventDates: {
            ...prev.eventDates,
            [eventType]: { date: "", timeSlot: "" }
          },
          eventServices: newEventServices,
          serviceAmounts: newServiceAmounts
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
      
      const newEventServices = { ...prev.eventServices }
      const newServiceAmounts = { ...prev.serviceAmounts }
      
      const servicesForEvent = SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT["Other"] || []
      servicesForEvent.forEach((service) => {
        const key = `${eventType}-${service.name}`
        delete newEventServices[key]
        delete newServiceAmounts[key]
      })
      
      return {
        ...prev,
        selectedEvents: prev.selectedEvents.filter((e) => e !== eventType),
        eventDates: newEventDates,
        eventServices: newEventServices,
        serviceAmounts: newServiceAmounts
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

    const baseServices = SERVICES_BY_EVENT["Other"] || []
    const newEventServices = { ...quotation.eventServices }
    const newServiceAmounts = { ...quotation.serviceAmounts }

    // FIXED: Do NOT auto-select services for custom events
    baseServices.forEach((service) => {
      const key = `${trimmed}-${service.name}`
      // Initialize as NOT selected (false)
      newEventServices[key] = false
      // Store the default amount for reference
      newServiceAmounts[key] = service.amount
    })

    setQuotation((prev) => ({
      ...prev,
      selectedEvents: [...prev.selectedEvents, trimmed],
      eventDates: {
        ...prev.eventDates,
        [trimmed]: { date: "", timeSlot: "" }
      },
      eventServices: newEventServices,
      serviceAmounts: newServiceAmounts
    }))

    scrollToTop()
    setActiveRequirementTab(trimmed)
    setNewEventName("")
    setShowCustomEventInput(false)
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

  // Event types in desired order with Vratham and Formalties next to Reception
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

  // Time slot options - only Half Day or Full Day
  const timeSlots = [
    "Half Day",
    "Full Day"
  ]

  return (
    <div ref={scrollRef}>
      <style>{`
        .quotation-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        .remove-event-btn {
          background: #ef4444 !important;
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
        .remove-event-btn:hover {
          background: #dc2626 !important;
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

        @media (max-width: 1024px) {
          .quotation-container {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .quotation-container {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .quotation-container > div:nth-child(2) {
            order: 3 !important;
          }

          .quotation-container > div:first-child > div:last-child {
            order: 2 !important;
            margin-top: 12px !important;
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

          .form-label {
            font-size: 11px !important;
            margin-bottom: 4px !important;
          }

          .event-buttons-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }

          .event-button {
            padding: 10px !important;
            font-size: 12px !important;
          }

          .custom-event-btn {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }

          .event-tabs {
            gap: 6px !important;
            margin-bottom: 12px !important;
          }

          .event-tab-button {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }

          .remove-event-btn, .cancel-event-btn {
            padding: 2px 6px !important;
            font-size: 10px !important;
            min-width: 20px !important;
            height: 20px !important;
          }

          .event-dates-display {
            padding: 10px !important;
            margin-bottom: 12px !important;
          }

          .date-input {
            padding: 6px !important;
            font-size: 12px !important;
          }

          /* 📸 Select Requirements – Mobile Fix */
.requirements-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}

.requirement-item select,
.requirement-item input[type="number"] {
  grid-column: 2 / -1 !important;
  width: 100% !important;
}

.requirement-item select {
  margin-bottom: 6px !important;
}

.requirement-label {
  grid-column: 2 / -1 !important;
}

.requirement-input {
  display: block !important;
  width: 100% !important;
  min-width: 120px !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  visibility: visible !important;
  opacity: 1 !important;
}


          .totals-section {
            padding: 16px !important;
            gap: 8px !important;
          }

          .total-row {
            font-size: 13px !important;
          }

          .total-value {
            font-size: 14px !important;
          }

          .total-final {
            fontSize: 16px !important;
          }

          .submit-button {
            padding: 10px !important;
            font-size: 13px !important;
          }

          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>

      <div className="quotation-container">
        <div>
          {/* Customer Details Section */}
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}>
            <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              📋 Customer Details
            </h3>
            <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <div>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={quotation.firstName}
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
                  value={quotation.customerPhone}
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
                  value={quotation.customerEmail}
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

          {/* Event Selection - Now includes Vratham & Formalties next to Reception */}
          <div className="quotation-section" style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}>
            <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              🎉 Select Event Types
            </h3>
            <div className="event-buttons-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
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
                +
              </button>
              {showCustomEventInput && (
                <>
                  <input
                    type="text"
                    placeholder="Enter custom event name..."
                    value={newEventName}
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

          {/* Submit Button */}
          {quotation.selectedEvents.length > 0 && (
            <div
              className="quotation-section"
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
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
                  {loading ? "Sending..." : "Submit Quotation"}
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
                    Full PDF
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
                    Customer PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Requirements */}
        <div>
          {quotation.selectedEvents.length > 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
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
                          ⏰ Time Slot
                        </label>
                        <select
                          value={quotation.eventDates[activeRequirementTab]?.timeSlot || ""}
                          onChange={(e) =>
                            setQuotation({
                              ...quotation,
                              eventDates: {
                                ...quotation.eventDates,
                                [activeRequirementTab]: {
                                  ...quotation.eventDates[activeRequirementTab],
                                  timeSlot: e.target.value,
                                },
                              },
                            })
                          }
                          className="form-select"
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "13px",
                            background: "white",
                          }}
                        >
                          <option value="">Select time slot</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeRequirementTab && (
                  <div className="requirements-list">
  {(SERVICES_BY_EVENT[activeRequirementTab] || SERVICES_BY_EVENT["Other"] || []).map((service) => {
    const serviceKey = `${activeRequirementTab}-${service.name}`
    const isSelected = quotation.eventServices?.[serviceKey] || false
    const timeValue = quotation.serviceTimes?.[serviceKey] ?? ""

    return (
      <div
        key={serviceKey}
        className="requirement-item"
        style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 120px 120px",
          alignItems: "center",
          gap: "12px",
          padding: "10px 0",
          borderBottom: "1px solid #f3f4f6"
        }}
      >
        {/* Checkbox */}
        <input
            type="checkbox"
  checked={isSelected}
  onChange={() => {
    const cameraKey = SERVICE_TO_CAMERA_MAP[service.name]

    const priceFromPricingList =
      cameraKey && quotationPricing?.[cameraKey]?.price
        ? quotationPricing[cameraKey].price
        : service.amount

    const timeFromPricingList =
      cameraKey && quotationPricing?.[cameraKey]?.time
        ? quotationPricing[cameraKey].time
        : ""

    setQuotation({
      ...quotation,
      eventServices: {
        ...quotation.eventServices,
        [serviceKey]: !isSelected,
      },
      serviceAmounts: {
        ...quotation.serviceAmounts,
        [serviceKey]: priceFromPricingList,
      },
      serviceTimes: {
        ...quotation.serviceTimes,
        [serviceKey]: timeFromPricingList,
      },
    })
  }}
  style={{
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#10b981"
  }}
        />

        {/* Requirement Name */}
        <div
          className="requirement-label"
          style={{
            fontWeight: "600",
            fontSize: "14px",
            color: "#1f2937"
          }}
        >
          {service.name}
        </div>

        {/* Time Slot */}
        <select
  value={timeValue}
  disabled={!isSelected}
  onChange={(e) => {
    setQuotation({
      ...quotation,
      serviceTimes: {
        ...quotation.serviceTimes,
        [serviceKey]: e.target.value,
      },
    })
  }}
  style={{
    padding: "6px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    background: isSelected ? "white" : "#f3f4f6",
    cursor: isSelected ? "pointer" : "not-allowed",
  }}
>
  <option value="">Not Selected</option>
  <option value="Half Day">Half Day</option>
  <option value="Full Day">Full Day</option>
</select>


        {/* Price */}
        <input
          type="number"
          value={
  quotation.serviceAmounts?.[serviceKey] ??
  //pricingFromList ??
  service.amount
}
          disabled={!isSelected}
          onChange={(e) => {
            setQuotation({
              ...quotation,
              serviceAmounts: {
                ...quotation.serviceAmounts,
                [serviceKey]: parseInt(e.target.value) || 0,
              },
            })
          }}
          style={{
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "13px",
            textAlign: "right",
            background: isSelected ? "white" : "#f3f4f6"
          }}
        />
      </div>
    )
  })}
</div>

                )}
              </div>

              {/* Sheets Section */}
              <div className="quotation-section" style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
                  📄 Sheets Information
                </h3>
                
                <div style={{ display: "grid", gap: "16px" }}>
                  {/* No. of Sheets */}
                  <div>
                    <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                      No. of Sheets
                    </label>
                    <input
                      type="number"
                       min="0"
                       value={Math.max(0, quotation.sheetsCount || 0)}
                      onChange={(e) => setQuotation({ ...quotation, sheetsCount: e.target.value })}
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                      placeholder="Enter number of sheets"
                    />
                  </div>

                  {/* Total Sheets Amount */}
                  <div>
                    <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                      Sheets Total Amount
                    </label>
                    <input
                      type="number"
                      value={quotation.sheetsCustomerPrice || ''}
                      onChange={(e) => setQuotation({ ...quotation, sheetsCustomerPrice: e.target.value })}
                      onWheel={(e) => e.target.blur()}   // ✅ FIX
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                      placeholder="Enter total sheets amount"
                    />
                  </div>
                  
                  {/* Sheets Total Display */}
                  {quotation.sheetsCustomerPrice && (
                    <div style={{
                      padding: "12px",
                      background: "#f0f9ff",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0369a1" }}>
                          Sheets Total:
                        </span>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "#0369a1" }}>
                          ₹{totals.sheetsCustomerPrice}
                        </span>
                      </div>
                      {quotation.sheetsCount > 0 && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                          Quantity: {Math.max(0, quotation.sheetsCount || 0)} sheets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="totals-section quotation-section" style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <div style={{ marginBottom: "16px" }}>
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
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ 
                  paddingTop: "16px",
                  borderTop: "2px solid #e5e7eb"
                }}>
                  <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Services Total:</span>
                    <span className="total-value" style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>₹{totals.servicesTotal}</span>
                  </div>
                  
                  {/* Sheets Total Row */}
                  {quotation.sheetsCustomerPrice && (
                    <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>
                        Sheets Total:
                      </span>
                      <span className="total-value" style={{ fontSize: "16px", fontWeight: "700", color: "#0369a1" }}>₹{totals.sheetsCustomerPrice}</span>
                    </div>
                  )}
                  
                  <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Discount ({totals.discountPercent}%):</span>
                    <span className="total-value" style={{ fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>-₹{totals.discountAmount}</span>
                  </div>
                  
                  <div style={{ 
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "2px solid #e5e7eb"
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>Final Amount:</span>
                    <span className="total-final" style={{ fontSize: "20px", fontWeight: "800", color: "#10b981" }}>₹{totals.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}