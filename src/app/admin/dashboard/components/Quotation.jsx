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
      {/* Two Column Layout Container */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        alignItems: "start"
      }}>
        
        {/* LEFT COLUMN - Customer Details and Event Details */}
        <div>
          {/* Customer Details Section */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              📋 Customer Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={quotation.firstName}
                  onChange={(e) => setQuotation({ ...quotation, firstName: e.target.value })}
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  ⏰ Time Slot
                </label>
                <select
                  value={quotation.timeSlot || "Full Day"}
                  onChange={(e) => setQuotation({ ...quotation, timeSlot: e.target.value })}
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  📍 Location
                </label>
                <input
                  type="text"
                  placeholder="Enter event location"
                  value={quotation.location || ""}
                  onChange={(e) => setQuotation({ ...quotation, location: e.target.value })}
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={quotation.customerPhone}
                  onChange={(e) => setQuotation({ ...quotation, customerPhone: e.target.value })}
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={quotation.customerEmail}
                  onChange={(e) => setQuotation({ ...quotation, customerEmail: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Start and End Date Side by Side - MOVED AFTER EMAIL */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                    📅 Start Date
                  </label>
                  <input
                    type="date"
                    value={quotation.globalStartDate || ""}
                    onChange={(e) => setQuotation({ ...quotation, globalStartDate: e.target.value })}
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                    📅 End Date
                  </label>
                  <input
                    type="date"
                    value={quotation.globalEndDate || ""}
                    onChange={(e) => setQuotation({ ...quotation, globalEndDate: e.target.value })}
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
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
              🎉 Select Event Types
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {Object.keys(SERVICES_BY_EVENT).filter(e => e !== "Other").map((eventType) => (
                <button
                  key={eventType}
                  onClick={() => toggleEventSelection(eventType)}
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
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Add custom event..."
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
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
                  📸 Select Requirements
                </h3>
                
                {/* Event Tabs */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {quotation.selectedEvents.map((eventType) => (
                    <button
                      key={eventType}
                      onClick={() => setActiveRequirementTab(eventType)}
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
                  <div style={{
                    background: "#f9fafb",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
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
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
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


                {/* All Requirements in Single Card - No Separate Boxes */}
                {activeRequirementTab && (
                  <div>
                    {(SERVICES_BY_EVENT[activeRequirementTab] || []).map((service) => {
                      const serviceKey = `${activeRequirementTab}-${service.name}`
                      const isSelected = quotation.eventServices?.[serviceKey] || false
                      return (
                        <div
                          key={serviceKey}
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
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={quotation.discount}
                    onChange={(e) => setQuotation({ ...quotation, discount: e.target.value })}
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Total Amount:</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>₹{totals.subtotal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Discount ({totals.discountPercent}%):</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>-₹{totals.discountAmount}</span>
                  </div>
                  <div style={{ 
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "2px solid #e5e7eb"
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>Final Amount:</span>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#10b981" }}>₹{totals.total}</span>
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
