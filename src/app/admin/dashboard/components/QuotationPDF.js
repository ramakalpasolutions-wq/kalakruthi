// QuotationPDF.js — WITH QUANTITY SUPPORT (FIXED IMPORT)
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const THEME_COLOR = [13, 148, 136]
const SAFE_MARGIN = 15
const CONTENT_WIDTH = 180
const PAGE_HEIGHT = 297

const HEADER_SAFE_START_Y = 70
const FOOTER_SAFE_END_Y = 260

const addPageHeader = (doc) => {
  doc.addImage("/letterhead.jpeg", "JPEG", 0, 0, 210, PAGE_HEIGHT)
}

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

  doc.setFont("helvetica", "normal")

  addPageHeader(doc)

  const totals = calculateQuotationTotal()

  let equipmentActualTotal = 0
  let equipmentCustomerTotal = 0

  const itemsByEvent = {}

  // ✅ UPDATED: Extract equipment with quantity
  if (quotation.selectedEquipment) {
    Object.keys(quotation.selectedEquipment).forEach((eventType) => {
      const eventEquipment = quotation.selectedEquipment[eventType] || []

      const eventItems = []
      eventEquipment.forEach((eq) => {
        if (eq.selected && eq.equipmentId && eq.equipmentId !== "Not Selected") {
          const quantity = eq.quantity || 1
          const unitActualPrice = eq.unitActualPrice || 0
          const unitCustomerPrice = eq.unitCustomerPrice || 0
          
          const totalActual = unitActualPrice * quantity
          const totalCustomer = unitCustomerPrice * quantity

          equipmentActualTotal += totalActual
          equipmentCustomerTotal += totalCustomer

          eventItems.push({
            name: `${eq.category} - ${eq.timeSlot || "N/A"}`,
            quantity: quantity,
            unitActualPrice: unitActualPrice,
            unitCustomerPrice: unitCustomerPrice,
            totalActual: totalActual,
            totalCustomer: totalCustomer,
          })
        }
      })

      if (eventItems.length > 0) {
        itemsByEvent[eventType] = eventItems
      }
    })
  }

  const sheetsQuantity = parseInt(quotation.sheetsCount) || 0
  const sheetsPricePerSheet = quotation.sheetsPricePerSheet || 0
  const sheetsActualPrice = quotation.sheetsActualPricePerSheet || 0
  const sheetsCustomerTotal = sheetsQuantity * sheetsPricePerSheet
  const sheetsActualTotal = sheetsQuantity * sheetsActualPrice

  const actualGrandTotal = equipmentActualTotal + sheetsActualTotal
  const customerGrandTotal = equipmentCustomerTotal + sheetsCustomerTotal

  const discountPercent = parseFloat(quotation.discount) || 0
  const discountAmount = Math.round((customerGrandTotal * discountPercent) / 100)
  const finalTotal = customerGrandTotal - discountAmount

  // QUOTATION TITLE
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...THEME_COLOR)
  doc.text("QUOTATION", SAFE_MARGIN, 75)

  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-IN")}`,
    210 - SAFE_MARGIN,
    60,
    { align: "right" }
  )

  // CUSTOMER INFORMATION BOX
  const CUSTOMER_BOX_Y = 82
  doc.setDrawColor(...THEME_COLOR)
  doc.setLineWidth(0.6)
  doc.rect(SAFE_MARGIN, CUSTOMER_BOX_Y, CONTENT_WIDTH, 28)

  doc.setFillColor(...THEME_COLOR)
  doc.rect(SAFE_MARGIN, CUSTOMER_BOX_Y, CONTENT_WIDTH, 7, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text("CUSTOMER INFORMATION", SAFE_MARGIN + 3, CUSTOMER_BOX_Y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(0)

  doc.text(
    `Name: ${quotation.firstName} ${quotation.lastName || ""}`,
    SAFE_MARGIN + 3,
    CUSTOMER_BOX_Y + 13
  )
  doc.text(
    `Phone: ${quotation.customerPhone}`,
    SAFE_MARGIN + 3,
    CUSTOMER_BOX_Y + 18
  )
  doc.text(
    `Email: ${quotation.customerEmail}`,
    SAFE_MARGIN + 3,
    CUSTOMER_BOX_Y + 23
  )

  // EVENT TABLE
  let contentY = CUSTOMER_BOX_Y + 35

  // ✅ FIXED: Use autoTable function directly
  autoTable(doc, {
    startY: contentY,
    head: [["Event", "Schedule"]],
    body: quotation.selectedEvents.map((e) => [
      e,
      quotation.eventDates?.[e]?.date
        ? `${new Date(
            quotation.eventDates[e].date
          ).toLocaleDateString("en-IN")} (${quotation.eventDates[e].timeSlot || "TBD"})`
        : "To be scheduled",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: THEME_COLOR,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { 
      fontSize: 8.5, 
      cellPadding: 3,
    },
    margin: { left: SAFE_MARGIN, right: SAFE_MARGIN, top: 5, bottom: 5 },
  })

  contentY = doc.lastAutoTable.finalY + 10

  let equipmentHeaderPrinted = false

  Object.keys(itemsByEvent).forEach((eventType, eventIndex) => {
    const eventItems = itemsByEvent[eventType]
    const eventDate = quotation.eventDates?.[eventType]?.date
      ? new Date(quotation.eventDates[eventType].date).toLocaleDateString("en-IN")
      : "TBD"

    if (contentY > FOOTER_SAFE_END_Y) {
      doc.addPage()
      addPageHeader(doc)
      contentY = HEADER_SAFE_START_Y
      equipmentHeaderPrinted = false
    }

    if (!equipmentHeaderPrinted) {
      doc.setDrawColor(...THEME_COLOR)
      doc.setLineWidth(0.6)
      doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 7)
      doc.setFillColor(...THEME_COLOR)
      doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 7, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text("EQUIPMENT BREAKDOWN", SAFE_MARGIN + 3, contentY + 5)
      contentY += 10
      equipmentHeaderPrinted = true
    }

    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(...THEME_COLOR)
    doc.setLineWidth(0.5)
    doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 6, "F")
    doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 6)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...THEME_COLOR)
    doc.text(`${eventType} - ${eventDate}`, SAFE_MARGIN + 3, contentY + 4)

    contentY += 8

    // ✅ Table headers with Quantity column
    const tableHeaders = showPrices
      ? [["Item", "Qty", "Actual (₹)", "Customer (₹)"]]
      : [["Item", "Qty", "Price (₹)"]]

    // ✅ Table body with quantity and total prices
    const tableBody = eventItems.map((item) => {
      if (showPrices) {
        return [
          item.name,
          item.quantity.toString(),
          `${item.unitActualPrice.toLocaleString("en-IN")} × ${item.quantity} = ${item.totalActual.toLocaleString("en-IN")}`,
          `${item.unitCustomerPrice.toLocaleString("en-IN")} × ${item.quantity} = ${item.totalCustomer.toLocaleString("en-IN")}`,
        ]
      } else {
        return [
          item.name,
          item.quantity.toString(),
          `${item.unitCustomerPrice.toLocaleString("en-IN")} × ${item.quantity} = ${item.totalCustomer.toLocaleString("en-IN")}`,
        ]
      }
    })

    // ✅ FIXED: Use autoTable function directly
    autoTable(doc, {
      startY: contentY,
      head: tableHeaders,
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: THEME_COLOR,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: showPrices
        ? {
            0: { cellWidth: 60, halign: "left" },
            1: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 50, halign: "right" },
            3: { cellWidth: 50, halign: "right" },
          }
        : {
            0: { cellWidth: 90, halign: "left" },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 60, halign: "right" },
          },
      margin: { left: SAFE_MARGIN, right: SAFE_MARGIN },
      pageBreak: "avoid",
    })

    contentY = doc.lastAutoTable.finalY + 6
  })

  if (sheetsQuantity > 0 && quotation.sheetsTypeId) {
    if (contentY > FOOTER_SAFE_END_Y) {
      doc.addPage()
      addPageHeader(doc)
      contentY = HEADER_SAFE_START_Y
    }

    doc.setDrawColor(...THEME_COLOR)
    doc.setLineWidth(0.6)
    doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 7)

    doc.setFillColor(...THEME_COLOR)
    doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 7, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text("SHEETS", SAFE_MARGIN + 3, contentY + 5)

    contentY += 10

    const sheetsTableHeaders = showPrices
      ? [["Description", "Qty", "Actual (₹)", "Customer (₹)"]]
      : [["Description", "Qty", "Price (₹)"]]

    const sheetsTableBody = showPrices
      ? [
          [
            "Photo Sheets",
            sheetsQuantity.toString(),
            `${sheetsActualPrice.toLocaleString("en-IN")} × ${sheetsQuantity} = ${sheetsActualTotal.toLocaleString("en-IN")}`,
            `${sheetsPricePerSheet.toLocaleString("en-IN")} × ${sheetsQuantity} = ${sheetsCustomerTotal.toLocaleString("en-IN")}`,
          ],
        ]
      : [
          [
            "Photo Sheets",
            sheetsQuantity.toString(),
            `${sheetsPricePerSheet.toLocaleString("en-IN")} × ${sheetsQuantity} = ${sheetsCustomerTotal.toLocaleString("en-IN")}`,
          ],
        ]

    // ✅ FIXED: Use autoTable function directly
    autoTable(doc, {
      startY: contentY,
      head: sheetsTableHeaders,
      body: sheetsTableBody,
      theme: "striped",
      headStyles: {
        fillColor: THEME_COLOR,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: showPrices
        ? {
            0: { cellWidth: 60, halign: "left" },
            1: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 50, halign: "right" },
            3: { cellWidth: 50, halign: "right" },
          }
        : {
            0: { cellWidth: 90, halign: "left" },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 60, halign: "right" },
          },
      margin: { left: SAFE_MARGIN, right: SAFE_MARGIN },
      pageBreak: "avoid",
    })

    contentY = doc.lastAutoTable.finalY + 8
  }

  if (contentY > 220) {
    doc.addPage()
    addPageHeader(doc)
    contentY = HEADER_SAFE_START_Y
  }

  const summaryBoxHeight = showPrices ? 50 : 32

  doc.setDrawColor(...THEME_COLOR)
  doc.setLineWidth(0.6)
  doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, summaryBoxHeight)

  doc.setFillColor(...THEME_COLOR)
  doc.rect(SAFE_MARGIN, contentY, CONTENT_WIDTH, 7, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text("PAYMENT SUMMARY", SAFE_MARGIN + 3, contentY + 5)

  contentY += 11

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(0)

  const PRICE_RIGHT_X = SAFE_MARGIN + CONTENT_WIDTH - 10

  if (showPrices) {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(220, 38, 38)
    doc.text("Actual Price Total:", SAFE_MARGIN + 3, contentY)
    doc.text(
      `₹ ${actualGrandTotal.toLocaleString("en-IN")}`,
      PRICE_RIGHT_X,
      contentY,
      { align: "right" }
    )
    contentY += 6

    doc.setFont("helvetica", "normal")
    doc.setTextColor(0)
  }

  doc.setFont("helvetica", "bold")
  doc.text("Customer Price Total:", SAFE_MARGIN + 3, contentY)
  doc.text(
    `₹ ${customerGrandTotal.toLocaleString("en-IN")}`,
    PRICE_RIGHT_X,
    contentY,
    { align: "right" }
  )
  contentY += 6

  if (discountPercent > 0) {
    doc.setFont("helvetica", "normal")
    doc.setTextColor(220, 38, 38)
    doc.text(`Discount (${discountPercent}%):`, SAFE_MARGIN + 3, contentY)
    doc.text(
      `-₹ ${discountAmount.toLocaleString("en-IN")}`,
      PRICE_RIGHT_X,
      contentY,
      { align: "right" }
    )
    contentY += 6
    doc.setTextColor(0)
  }

  doc.setDrawColor(...THEME_COLOR)
  doc.setLineWidth(0.4)
  doc.line(SAFE_MARGIN + 5, contentY, SAFE_MARGIN + CONTENT_WIDTH - 5, contentY)
  contentY += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...THEME_COLOR)
  doc.text("FINAL AMOUNT:", SAFE_MARGIN + 3, contentY)
  doc.text(
    `₹ ${finalTotal.toLocaleString("en-IN")}`,
    PRICE_RIGHT_X,
    contentY,
    { align: "right" }
  )

  return doc
}
