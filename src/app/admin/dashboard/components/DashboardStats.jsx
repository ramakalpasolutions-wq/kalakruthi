'use client'
import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

export default function DashboardStats({ customers, setActive, setCustomerFilter }) {
  const barChartRef = useRef(null)
  const donutChartRef = useRef(null)
  const barChartInstance = useRef(null)
  const donutChartInstance = useRef(null)

  const calculateDashboardTotals = () => {
    let totalRevenue = 0
    let totalPaid = 0
    let totalDue = 0
    customers.forEach((customer) => {
      totalRevenue += parseInt(customer.totalAmount) || 0
      const paidFromAdvances = (customer.advances || []).reduce(
        (sum, adv) => sum + (parseInt(adv.amount) || 0),
        0
      )
      totalPaid += paidFromAdvances
      totalDue += parseInt(customer.dueAmount) || 0
    })
    return {
      totalRevenue,
      totalPaid,
      totalDue,
      totalRevenueFormatted: totalRevenue.toLocaleString("en-IN"),
      totalPaidFormatted: totalPaid.toLocaleString("en-IN"),
      totalDueFormatted: totalDue.toLocaleString("en-IN"),
    }
  }

  const dashboardTotals = calculateDashboardTotals()

  // Bar Chart - Clean & Simple
  useEffect(() => {
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d')
      
      if (barChartInstance.current) {
        barChartInstance.current.destroy()
      }

      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Total Revenue', 'Collected', 'Pending'],
          datasets: [{
            data: [dashboardTotals.totalRevenue, dashboardTotals.totalPaid, dashboardTotals.totalDue],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f2937',
              titleColor: 'white',
              bodyColor: 'white',
              cornerRadius: 8,
              callbacks: {
                label: context => `₹${context.parsed.y.toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => `₹${(value/1000).toLocaleString()}K`,
                color: '#6b7280'
              },
              grid: { color: '#f3f4f6' }
            },
            x: {
              ticks: { color: '#374151', font: { weight: '600' } },
              grid: { display: false }
            }
          }
        }
      })
    }
  }, [dashboardTotals])

  // Donut Chart - Clean & Simple
  useEffect(() => {
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d')
      
      if (donutChartInstance.current) {
        donutChartInstance.current.destroy()
      }

      donutChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Collected', 'Pending'],
          datasets: [{
            data: [dashboardTotals.totalPaid, dashboardTotals.totalDue],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 0,
            cutout: '65%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 12, weight: '600' }
              }
            },
            tooltip: {
              backgroundColor: '#1f2937',
              titleColor: 'white',
              bodyColor: 'white',
              cornerRadius: 8,
              callbacks: {
                label: context => `₹${context.parsed.toLocaleString('en-IN')}`
              }
            }
          }
        }
      })
    }
  }, [dashboardTotals])

  return (
    <>
      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}>
        <StatCard
          icon="👥"
          title="Total Customers"
          value={customers.length}
          color="#3b82f6"
          onClick={() => {
            setActive("Customer Details")
            setCustomerFilter("All")
          }}
        />
        <StatCard
          icon="⏳"
          title="Pending"
          value={customers.filter((c) => c.status === "Pending").length}
          color="#f59e0b"
          onClick={() => {
            setActive("Customer Details")
            setCustomerFilter("Pending")
          }}
        />
        <StatCard
          icon="✅"
          title="Completed"
          value={customers.filter((c) => c.status === "Paid").length}
          color="#10b981"
          onClick={() => {
            setActive("Customer Details")
            setCustomerFilter("Paid")
          }}
        />
        <StatCard
          icon="⚡"
          title="Quick Access"
          value="Manage All"
          color="#8b5cf6"
          valueSize="16px"
          onClick={() => {
            setActive("Customer Details")
            setCustomerFilter("All")
          }}
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "20px",
        marginBottom: "24px",
      }}>
        {/* Bar Chart Card */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          height: "340px"
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '20px' }}>📈</div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: '#1f2937'
            }}>Revenue Breakdown</h3>
          </div>
          <div style={{ height: '280px', position: 'relative' }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          height: "340px"
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '20px' }}>🍩</div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: '#1f2937'
            }}>Payment Status</h3>
          </div>
          <div style={{ height: '280px', position: 'relative' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ icon, title, value, color, onClick, valueSize = "28px" }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.3s",
        borderLeft: `4px solid ${color}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 16px ${color}33`
        e.currentTarget.style.transform = "translateY(-4px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <p style={{
        color: "#6b7280",
        fontSize: "11px",
        fontWeight: "600",
        marginBottom: "6px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {title}
      </p>
      <h3 style={{
        fontSize: valueSize,
        fontWeight: "800",
        color: "#1f2937",
        margin: 0,
      }}>
        {value}
      </h3>
    </div>
  )
}
