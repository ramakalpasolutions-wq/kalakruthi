'use client'
import React from 'react'
import { SERVICES_BY_EVENT } from './constants'
import { generateQuotationPDF } from './QuotationPDF'



export default function Quotation({ 
  quotation, 
  setQuotation, 
  activeRequirementTab, 
  setActiveRequirementTab,
  newEventName,
  setNewEventName,
  loading,
  setLoading,
  showToast 
}) {
  
  const calculateQuotationTotal = () => {
    let subtotal = 0
    quotation.selectedEvents.forEach((eventType) => {
      const eventServicesData = SERVICES_BY_EVENT[eventType] || []
      eventServicesData.forEach((service) => {
        const serviceKey = `${eventType}-${service.name}`
        if (quotation.eventServices?.[serviceKey]) {
          const amount = quotation.serviceAmounts?.[serviceKey] || service.amount
          subtotal += amount
        }
      })
    })



    const discountPercent = parseFloat(quotation.discount) || 0
    const discountAmount = (subtotal * discountPercent) / 100
    const total = subtotal - discountAmount



    const formatNumber = (num) => {
      return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }



    return {
      subtotal: formatNumber(subtotal),
      discountAmount: formatNumber(discountAmount),
      total: formatNumber(total),
      discountPercent: discountPercent,
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
        
        const servicesForEvent = SERVICES_BY_EVENT[eventType] || []
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
        return {
          ...prev,
          selectedEvents: [...prev.selectedEvents, eventType],
          eventDates: {
            ...prev.eventDates,
            [eventType]: { startDate: "", endDate: "" }
          }
        }
      }
    })
    
    if (!quotation.selectedEvents.includes(eventType)) {
      setTimeout(() => {
        setActiveRequirementTab(eventType)
      }, 0)
    }
  }



  const handleAddCustomEvent = () => {
    const trimmed = newEventName.trim()
    if (!trimmed) return



    if (quotation.selectedEvents.includes(trimmed)) {
      setActiveRequirementTab(trimmed)
      setNewEventName("")
      return
    }



    const baseServices = SERVICES_BY_EVENT["Other"] || []
    const newEventServices = { ...quotation.eventServices }
    const newServiceAmounts = { ...quotation.serviceAmounts }



    baseServices.forEach((service) => {
      const key = `${trimmed}-${service.name}`
      newEventServices[key] = true
      newServiceAmounts[key] = service.amount
    })



    setQuotation((prev) => ({
      ...prev,
      selectedEvents: [...prev.selectedEvents, trimmed],
      eventDates: {
        ...prev.eventDates,
        [trimmed]: { startDate: "", endDate: "" }
      },
      eventServices: newEventServices,
      serviceAmounts: newServiceAmounts
    }))



    setActiveRequirementTab(trimmed)
    setNewEventName("")
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
      const pdf = generateQuotationPDF(quotation, calculateQuotationTotal)
      const pdfBlob = pdf.output("blob")
      const formData = new FormData()
      formData.append("pdf", pdfBlob, "quotation.pdf")
      formData.append("to", quotation.customerEmail)
      formData.append(
        "subject",
        `Quotation from Kalakruthi Photography - ${quotation.selectedEvents.join(", ")}`
      )
      formData.append("customerName", `${quotation.firstName} ${quotation.lastName}`)
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
    const pdf = generateQuotationPDF(quotation, calculateQuotationTotal)
    pdf.save(`Quotation_${quotation.firstName}${quotation.lastName}.pdf`)
    showToast("PDF downloaded!", "success")
  }



  const totals = calculateQuotationTotal()



  return (
    <div>
      <style>{`
        /* Main Container - Responsive Grid */
        .quotation-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        /* Desktop & Tablet: 2 columns */
        @media (max-width: 1024px) {
          .quotation-container {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        /* Mobile: 1 column with reduced spacing */
        @media (max-width: 640px) {
          .quotation-container {
            gap: 12px;
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

          .custom-event-container {
            gap: 6px !important;
          }

          .custom-event-input {
            padding: 8px !important;
            font-size: 13px !important;
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

          .event-dates-display {
            padding: 10px !important;
            margin-bottom: 12px !important;
          }

          .date-input {
            padding: 6px !important;
            font-size: 12px !important;
          }

          .requirements-list {
            gap: 0 !important;
          }

          .requirement-item {
            padding: 8px 0 !important;
          }

          .requirement-label {
            font-size: 13px !important;
          }

          .requirement-input {
            width: 100px !important;
            padding: 6px !important;
            font-size: 12px !important;
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
            font-size: 16px !important;
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

      {/* Two Column Layout Container */}
      <div className="quotation-container" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        alignItems: "start"
      }}>
        
        {/* LEFT COLUMN - Customer Details and Event Details */}
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
              
              {/* Time Slot Field - Half Day / Full Day */}
              <div>
                <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  ⏰ Time Slot
                </label>
                <select
                  value={quotation.timeSlot || "Full Day"}
                  onChange={(e) => setQuotation({ ...quotation, timeSlot: e.target.value })}
                  className="form-select"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              {/* Location Field */}
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

              {/* Start and End Date Side by Side */}
              <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                    📅 Start Date
                  </label>
                  <input
                    type="date"
                    value={quotation.globalStartDate || ""}
                    onChange={(e) => setQuotation({ ...quotation, globalStartDate: e.target.value })}
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
                    📅 End Date
                  </label>
                  <input
                    type="date"
                    value={quotation.globalEndDate || ""}
                    onChange={(e) => setQuotation({ ...quotation, globalEndDate: e.target.value })}
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
          </div>

          {/* Event Selection */}
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
              {Object.keys(SERVICES_BY_EVENT).filter(e => e !== "Other").map((eventType) => (
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
            
            {/* Custom Event Input */}
            <div className="custom-event-container" style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Add custom event..."
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCustomEvent()}
                className="custom-event-input"
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
                className="custom-event-btn"
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Total and Actions */}
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
                Submit
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Requirements with Event Tabs at Top and Totals at Bottom */}
        <div>
          {quotation.selectedEvents.length > 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              {/* Event Tabs and Dates Card */}
              <div className="quotation-section" style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <h3 className="section-title" style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
                  📸 Select Requirements
                </h3>
                
                {/* Event Tabs */}
                <div className="event-tabs" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {quotation.selectedEvents.map((eventType) => (
                    <button
                      key={eventType}
                      onClick={() => setActiveRequirementTab(eventType)}
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
                  ))}
                </div>

                {/* Event Dates Display */}
                {activeRequirementTab && (
                  <div className="event-dates-display" style={{
                    background: "#f9fafb",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={quotation.eventDates[activeRequirementTab]?.startDate || ""}
                          onChange={(e) =>
                            setQuotation({
                              ...quotation,
                              eventDates: {
                                ...quotation.eventDates,
                                [activeRequirementTab]: {
                                  ...quotation.eventDates[activeRequirementTab],
                                  startDate: e.target.value,
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
                          End Date
                        </label>
                        <input
                          type="date"
                          value={quotation.eventDates[activeRequirementTab]?.endDate || ""}
                          onChange={(e) =>
                            setQuotation({
                              ...quotation,
                              eventDates: {
                                ...quotation.eventDates,
                                [activeRequirementTab]: {
                                  ...quotation.eventDates[activeRequirementTab],
                                  endDate: e.target.value,
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
                    </div>
                  </div>
                )}

                {/* All Requirements in Single Card */}
                {activeRequirementTab && (
                  <div className="requirements-list">
                    {(SERVICES_BY_EVENT[activeRequirementTab] || []).map((service) => {
                      const serviceKey = `${activeRequirementTab}-${service.name}`
                      const isSelected = quotation.eventServices?.[serviceKey] || false
                      return (
                        <div
                          key={serviceKey}
                          className="requirement-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 0",
                            borderBottom: "1px solid #f3f4f6"
                          }}
                        >
                          <input
                            type="checkbox"
                            id={serviceKey}
                            checked={isSelected}
                            onChange={() => {
                              setQuotation({
                                ...quotation,
                                eventServices: {
                                  ...quotation.eventServices,
                                  [serviceKey]: !isSelected,
                                },
                              })
                            }}
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                              accentColor: "#10b981",
                              flexShrink: 0
                            }}
                          />
                          <label
                            htmlFor={serviceKey}
                            className="requirement-label"
                            style={{
                              flex: 1,
                              fontWeight: "600",
                              fontSize: "14px",
                              color: "#1f2937",
                              cursor: "pointer"
                            }}
                          >
                            {service.name}
                          </label>
                          <input
                            type="number"
                            value={quotation.serviceAmounts?.[serviceKey] || service.amount}
                            onChange={(e) => {
                              setQuotation({
                                ...quotation,
                                serviceAmounts: {
                                  ...quotation.serviceAmounts,
                                  [serviceKey]: parseInt(e.target.value) || 0,
                                },
                              })
                            }}
                            className="requirement-input"
                            style={{
                              width: "120px",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "13px",
                              textAlign: "right",
                              flexShrink: 0
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Discount and Totals Card */}
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
                    value={quotation.discount}
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

                {/* Totals Display */}
                <div style={{ 
                  paddingTop: "16px",
                  borderTop: "2px solid #e5e7eb"
                }}>
                  <div className="total-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Total Amount:</span>
                    <span className="total-value" style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>₹{totals.subtotal}</span>
                  </div>
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