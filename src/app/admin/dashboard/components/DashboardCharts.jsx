 'use client'
import React from 'react'
import { formatAmount } from './constants'

export default function DashboardCharts({ customers }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: "16px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <h3 style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "20px",
        }}>
          📊 Monthly Performance
        </h3>
        <svg width="100%" height="260" viewBox="0 0 700 260">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            points="50,160 150,130 250,150 350,100 450,140 550,70 650,120"
          />
          {[
            { x: 50, y: 160 },
            { x: 150, y: 130 },
            { x: 250, y: 150 },
            { x: 350, y: 100 },
            { x: 450, y: 140 },
            { x: 550, y: 70 },
            { x: 650, y: 120 },
          ].map((point, i) => (
            <circle key={i} cx={point.x} cy={point.y} r="5" fill="#3b82f6" />
          ))}
          {[
            { x: 50, label: "Jan" },
            { x: 150, label: "Mar" },
            { x: 250, label: "May" },
            { x: 350, label: "Jul" },
            { x: 450, label: "Sep" },
            { x: 550, label: "Nov" },
            { x: 650, label: "Dec" },
          ].map((m, i) => (
            <text
              key={i}
              x={m.x}
              y="200"
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              fontWeight="600"
            >
              {m.label}
            </text>
          ))}
        </svg>
      </div>

      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <h3 style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "16px",
        }}>
          👥 Recent Customers
        </h3>
        <div style={{ maxHeight: "240px", overflowY: "auto" }}>
          {customers.slice(0, 5).map((c, i) => (
            <div
              key={c.id || c._id || i}
              style={{
                padding: "10px 0",
                borderBottom: i < 4 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}>
                <p style={{
                  fontWeight: "600",
                  color: "#1f2937",
                  fontSize: "13px",
                }}>
                  {c.name}
                </p>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: c.status === "Paid" ? "#dcfce7" : "#fef3c7",
                  color: c.status === "Paid" ? "#065f46" : "#92400e",
                }}>
                  {c.status}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
              }}>
                <p style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                }}>
                  {c.date || "N/A"}
                </p>
                <p style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}>
                  ₹{formatAmount(c.totalAmount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
