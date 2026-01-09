// QuotationPDF.js
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { SERVICES_BY_EVENT } from './constants'

export const generateQuotationPDF = (quotation, calculateQuotationTotal) => {
  // ✅ COMPRESSION ENABLED - compress: true reduces file size dramatically
  const doc = new jsPDF({
    compress: true,  // Compress text and graphics
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Header
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 210, 50, "F")

  // Logo/Icon
  const logoImage = "/klogo.png"

  try {
    // ✅ Use JPEG compression for images
    doc.addImage(logoImage, "JPEG", 15, 12, 20, 20, undefined, "FAST")
  } catch (error) {
    console.warn("Logo not found")
    // Fallback icon
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text("📸", 20, 26)
  }

  // Company Title - Smaller fonts
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)  // Reduced from 24
  doc.setFont(undefined, "bold")
  doc.text("Kalakruthi Photography", 45, 25)

  doc.setFontSize(9)  // Reduced from 10
  doc.setFont(undefined, "normal")
  doc.text("Professional Photography & Videography", 45, 33)

  // Quotation title
  doc.setFillColor(245, 245, 245)
  doc.rect(15, 58, 180, 12, "F")  // Reduced height
  doc.setTextColor(16, 185, 129)
  doc.setFontSize(14)  // Reduced from 18
  doc.setFont(undefined, "bold")
  doc.text("QUOTATION", 20, 66)

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)  // Reduced from 10
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 175, 66, { align: "right" })

  // Customer Information - Compact
  doc.setDrawColor(16, 185, 129)
  doc.rect(15, 72, 180, 25)  // Reduced height
  doc.setFillColor(16, 185, 129)
  doc.rect(15, 72, 180, 7, "F")  // Reduced height

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)  // Reduced
  doc.setFont(undefined, "bold")
  doc.text("CUSTOMER INFORMATION", 20, 77)

  doc.setTextColor(50, 50, 50)
  doc.setFontSize(9)  // Reduced
  doc.setFont(undefined, "bold")
  doc.text("Name:", 20, 84)
  doc.text("Phone:", 20, 89)
  doc.text("Email:", 20, 94)

  doc.setFont(undefined, "normal")
  doc.setFontSize(9)  // Reduced
  doc.text(`${quotation.firstName} ${quotation.lastName}`, 45, 84)
  doc.text(quotation.customerPhone, 45, 89)
  doc.text(quotation.customerEmail, 45, 94)

  // Events table - Compact
  const eventRows = quotation.selectedEvents.map((eventType) => {
    const dates = quotation.eventDates[eventType]
    const dateStr = dates?.startDate && dates?.endDate
      ? `${dates.startDate} to ${dates.endDate}`
      : "Dates TBD"
    return [eventType, dateStr]
  })

  autoTable(doc, {
    startY: 100,
    head: [["Event Type", "Duration"]],
    body: eventRows,
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,  // Reduced
    },
    bodyStyles: { fontSize: 8 },  // Reduced
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 90 },
    },
    margin: { top: 5, bottom: 5, left: 15, right: 15 },
  })

  // Requirements Section - Simplified
  let requirementsY = doc.lastAutoTable.finalY + 8

  doc.setFontSize(11)  // Reduced
  doc.setFont(undefined, "bold")
  doc.setTextColor(16, 185, 129)
  doc.text("Selected Requirements", 15, requirementsY)
  requirementsY += 6

  quotation.selectedEvents.forEach((eventType) => {
    const eventServicesData = SERVICES_BY_EVENT[eventType] || []
    const selectedServices = eventServicesData.filter((service) => {
      const serviceKey = `${eventType}-${service.name}`
      return quotation.eventServices?.[serviceKey]
    })

    if (selectedServices.length > 0) {
      doc.setFontSize(9)  // Reduced
      doc.setFont(undefined, "bold")
      doc.setTextColor(50, 50, 50)
      doc.text(`${eventType}:`, 20, requirementsY)
      requirementsY += 4

      doc.setFontSize(8)  // Reduced
      doc.setFont(undefined, "normal")
      selectedServices.forEach((service) => {
        doc.text(`• ${service.name}`, 25, requirementsY)
        requirementsY += 3  // Reduced spacing
      })
      requirementsY += 2
    }
  })

  // Total Amount Section - Compact
// Total Amount Section - Amounts INSIDE box
// Total Amount Section - Use "Rs." instead of ₹ to avoid subscript issue
const calc = calculateQuotationTotal()
let finalY = requirementsY + 6

// Main box
doc.setDrawColor(200, 200, 200)
doc.rect(100, finalY, 95, 30)

// Subtotal row
doc.setTextColor(80, 80, 80)
doc.setFontSize(10)
doc.setFont(undefined, "normal")
doc.text("Subtotal:", 105, finalY + 6)
doc.setFont(undefined, "bold")
doc.text(`Rs. ${calc.subtotal}`, 180, finalY + 6, { align: "right" })  // ✅ Changed to "Rs."

// Discount row
doc.setFont(undefined, "normal")
doc.setFontSize(9)
doc.text(`Discount (${calc.discountPercent}%):`, 105, finalY + 12)
doc.setTextColor(239, 68, 68)
doc.setFont(undefined, "bold")
doc.text(`-Rs. ${calc.discountAmount}`, 180, finalY + 12, { align: "right" })  // ✅ Changed to "Rs."

// Separator line
doc.setDrawColor(16, 185, 129)
doc.setLineWidth(1)
doc.line(105, finalY + 17, 190, finalY + 17)

// Total row - Highlighted box
doc.setFillColor(220, 252, 231)
doc.rect(100, finalY + 19, 95, 10, "F")
doc.setTextColor(16, 185, 129)
doc.setFontSize(11)
doc.setFont(undefined, "bold")
doc.text("TOTAL:", 105, finalY + 26)
doc.text(`Rs. ${calc.total}`, 180, finalY + 26, { align: "right" })  // ✅ Changed to "Rs."

// Separator line
doc.setDrawColor(16, 185, 129)
doc.setLineWidth(1)
doc.line(105, finalY + 17, 190, finalY + 17)  // ✅ Updated line coordinates

// Total row - Highlighted box
// Total row - Highlighted box
doc.setFillColor(220, 252, 231)
doc.rect(100, finalY + 19, 95, 10, "F")
doc.setTextColor(16, 185, 129)
doc.setFontSize(11)
doc.setFont(undefined, "bold")
doc.text("TOTAL:", 105, finalY + 26)
doc.text(`Rs. ${calc.total}`, 180, finalY + 26, { align: "right" })  // ✅ Changed from ₹ to Rs.


  // Footer - Simplified
  doc.setFillColor(245, 245, 245)
  doc.rect(0, 260, 210, 37, "F")
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(2)
  doc.line(0, 260, 210, 260)

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)  // Reduced
  doc.setFont(undefined, "bold")
  doc.text("Thank you for choosing Kalakruthi Photography!", 105, 268, { align: "center" })

  doc.setFontSize(8)  // Reduced
  doc.setFont(undefined, "normal")
  doc.text("Contact: +91-XXXXXXXXXX | info@kalakruthi.com", 105, 275, { align: "center" })
  doc.text("www.kalakruthi.com", 105, 281, { align: "center" })

  return doc
}
