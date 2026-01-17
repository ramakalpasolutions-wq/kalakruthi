// QuotationPDF.js — FINAL (Letterhead + Boxes + Teal Headers)
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { SERVICES_BY_EVENT } from "./constants"

const CUSTOMER_BOX_Y = 80
const THEME_COLOR = [13, 148, 136] // ✅ TEAL

export const generateQuotationPDF = (
  quotation,
  calculateQuotationTotal,
  showPrices = true
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  /* ============================================================
     LETTERHEAD BACKGROUND
  ============================================================ */
  doc.addImage("/letterhead.jpeg", "JPEG", 0, 0, 210, 297)

  const totals = calculateQuotationTotal()

  /* ============================================================
     SERVICE SUBTOTAL (SAFE)
  ============================================================ */
  let serviceSubtotal = 0

  quotation.selectedEvents.forEach((eventType) => {
    const services =
      SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT.Other || []

    services.forEach((service) => {
      const key = `${eventType}-${service.name}`
      if (quotation.eventServices?.[key]) {
        const amount =
          Number(quotation.serviceAmounts?.[key]) ||
          Number(service.amount) ||
          0
        serviceSubtotal += amount
      }
    })
  })

  const sheetsAmount =
    Number(totals.sheetsCustomerPrice?.replace(/,/g, "")) || 0

  const discountPercent = Number(totals.discountPercent) || 0
  const discountAmount = Math.round(
    (serviceSubtotal * discountPercent) / 100
  )

  const finalTotal = serviceSubtotal - discountAmount + sheetsAmount

  /* ============================================================
     QUOTATION TITLE
  ============================================================ */
  doc.setFontSize(16)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...THEME_COLOR)
  doc.text("QUOTATION", 20, 75)

  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-IN")}`,
    190,
    60,
    { align: "right" }
  )

  /* ============================================================
     CUSTOMER INFORMATION BOX
  ============================================================ */
  doc.setDrawColor(...THEME_COLOR)
  doc.setLineWidth(0.6)
  doc.rect(15, CUSTOMER_BOX_Y, 180, 30)

  doc.setFillColor(...THEME_COLOR)
  doc.rect(15, CUSTOMER_BOX_Y, 180, 8, "F")

  doc.setFont(undefined, "bold")
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.text("CUSTOMER INFORMATION", 20, CUSTOMER_BOX_Y + 6)

  doc.setFont(undefined, "normal")
  doc.setFontSize(10)
  doc.setTextColor(0)

  doc.text(
    `Name: ${quotation.firstName} ${quotation.lastName || ""}`,
    20,
    CUSTOMER_BOX_Y + 16
  )

  doc.text(
    `Phone: ${quotation.customerPhone}`,
    20,
    CUSTOMER_BOX_Y + 22
  )

  doc.text(
    `Email: ${quotation.customerEmail}`,
    20,
    CUSTOMER_BOX_Y + 28
  )

  /* ============================================================
     EVENT TABLE
  ============================================================ */
  let yPos = CUSTOMER_BOX_Y + 40

  autoTable(doc, {
    startY: yPos,
    head: [["Event", "Schedule"]],
    body: quotation.selectedEvents.map((e) => [
      e,
      quotation.eventDates?.[e]?.date
        ? `${new Date(
            quotation.eventDates[e].date
          ).toLocaleDateString("en-IN")} (${quotation.eventDates[e].timeSlot})`
        : "To be scheduled",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: THEME_COLOR,
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
    },
  })

  let contentY = doc.lastAutoTable.finalY + 10

  /* ============================================================
     SHEETS INFORMATION
  ============================================================ */
  if (sheetsAmount > 0) {
    doc.setDrawColor(...THEME_COLOR)
    doc.rect(15, contentY, 180, 16)

    doc.setFillColor(...THEME_COLOR)
    doc.rect(15, contentY, 180, 7, "F")

    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.setTextColor(255)
    doc.text("SHEETS INFORMATION", 20, contentY + 5)

    doc.setFont(undefined, "normal")
    doc.setTextColor(0)
    doc.text(
      `Sheets Amount: Rs. ${sheetsAmount.toLocaleString("en-IN")}`,
      20,
      contentY + 12
    )

    contentY += 22
  }

  /* ============================================================
     SELECTED REQUIREMENTS
  ============================================================ */
  doc.setDrawColor(...THEME_COLOR)
  doc.rect(15, contentY, 180, 10)

  doc.setFillColor(...THEME_COLOR)
  doc.rect(15, contentY, 180, 7, "F")

  doc.setFont(undefined, "bold")
  doc.setTextColor(255)
  doc.text("SELECTED REQUIREMENTS", 20, contentY + 5)

  contentY += 14
  doc.setFont(undefined, "normal")
  doc.setTextColor(0)

  quotation.selectedEvents.forEach((eventType) => {
    const services =
      SERVICES_BY_EVENT[eventType] || SERVICES_BY_EVENT.Other || []

    const selectedServices = services.filter(
      (s) => quotation.eventServices?.[`${eventType}-${s.name}`]
    )

    if (!selectedServices.length) return

    doc.setFont(undefined, "bold")
    doc.text(`${eventType}:`, 20, contentY)
    contentY += 5

    doc.setFont(undefined, "normal")

    selectedServices.forEach((service) => {
      const key = `${eventType}-${service.name}`
      const amount =
        quotation.serviceAmounts?.[key] || service.amount

      const timeSlot =
        quotation.serviceTimes?.[key] || "Half Day"

      const line = showPrices
        ? `• ${service.name} (${timeSlot}) - Rs. ${Number(amount).toLocaleString("en-IN")}`
        : `• ${service.name} (${timeSlot})`

      doc.text(line, 25, contentY)
      contentY += 4
    })

    contentY += 3
  })

  /* ============================================================
     PAYMENT SUMMARY BOX (FIXED RIGHT SIDE)
  ============================================================ */
  const PAYMENT_SUMMARY_Y = contentY - 30

  doc.setDrawColor(...THEME_COLOR)
  doc.rect(105, PAYMENT_SUMMARY_Y, 90, 40)

  doc.setFillColor(220, 252, 231)
  doc.rect(105, PAYMENT_SUMMARY_Y, 90, 10, "F")

  doc.setFont(undefined, "bold")
  doc.setTextColor(...THEME_COLOR)
  doc.text("PAYMENT SUMMARY", 110, PAYMENT_SUMMARY_Y + 7)

  doc.setFont(undefined, "normal")
  doc.setTextColor(0)

  doc.text("Services:", 110, PAYMENT_SUMMARY_Y + 16)
  doc.text(
    `Rs. ${serviceSubtotal.toLocaleString("en-IN")}`,
    190,
    PAYMENT_SUMMARY_Y + 16,
    { align: "right" }
  )

  doc.text("Sheets:", 110, PAYMENT_SUMMARY_Y + 22)
  doc.text(
    `Rs. ${sheetsAmount.toLocaleString("en-IN")}`,
    190,
    PAYMENT_SUMMARY_Y + 22,
    { align: "right" }
  )

  doc.setTextColor(220, 38, 38)
  doc.text("Discount:", 110, PAYMENT_SUMMARY_Y + 28)
  doc.text(
    `- Rs. ${discountAmount.toLocaleString("en-IN")}`,
    190,
    PAYMENT_SUMMARY_Y + 28,
    { align: "right" }
  )

  doc.setFont(undefined, "bold")
  doc.setTextColor(...THEME_COLOR)
  doc.text("TOTAL:", 110, PAYMENT_SUMMARY_Y + 36)
  doc.text(
    `Rs. ${finalTotal.toLocaleString("en-IN")}`,
    190,
    PAYMENT_SUMMARY_Y + 36,
    { align: "right" }
  )

  return doc
}
