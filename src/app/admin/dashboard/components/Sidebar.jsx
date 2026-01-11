'use client'
import React from 'react'
import { 
  MdDashboard, 
  MdViewCarousel, 
  MdHomeRepairService, 
  MdPhotoLibrary, 
  MdMiscellaneousServices,
  MdBusiness,        // ✅ B2B Icon
  MdRequestQuote,
  MdPeople,
  MdCardGiftcard,
  MdLogout,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md'

const MENU = [
  { name: "Dashboard", icon: MdDashboard },
  { name: "Hero Section", icon: MdViewCarousel },
  { name: "Home Services", icon: MdHomeRepairService },
  { name: "Gallery", icon: MdPhotoLibrary },
  { name: "Services", icon: MdMiscellaneousServices },
  { name: "B2B Images", icon: MdBusiness },     // ✅ FIXED: Added B2B
  { name: "Quotation", icon: MdRequestQuote },
  { name: "Customer Details", icon: MdPeople },
  { name: "Packages", icon: MdCardGiftcard },   // ✅ FIXED: Removed duplicate
]

export default function Sidebar({ active, setActive, sidebarOpen, setSidebarOpen, setOpenPaymentRowId, setOpenAdvanceId }) {
  // ✅ SCROLL TO TOP FUNCTION
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("adminuser"))
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user?.username || "kala-kruthi" }),
      })
      localStorage.removeItem("adminuser")
      localStorage.removeItem("isAdmin")
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    }
  }

  const handleMenuClick = (menuName) => {
    // ✅ SCROLL TO TOP + CLOSE SIDEBAR + RESET STATES
    scrollToTop();
    setActive(menuName);
    setOpenPaymentRowId(null);
    setOpenAdvanceId(null);
    setSidebarOpen(false);
  }

  return (
    <>
    
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: "1001",
          background: "#10b981",
          color: "black",
          border: "none",
          borderRadius: "8px",
          padding: "10px 15px",
          fontSize: "20px",
          cursor: "pointer",
          display: "none",
        }}
        className="mobile-menu-toggle"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          padding: sidebarOpen ? '20px' : '20px 0',
          marginBottom: '20px'
        }}>
          {sidebarOpen && <h2 className="dashboard-logo" style={{ margin: 0 }}>Admin</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="desktop-sidebar-toggle"
          >
            {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
          </button>
        </div>

        {MENU.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.name}
              onClick={() => handleMenuClick(item.name)}  // ✅ USE NEW FUNCTION
              className={`dashboard-menu-btn ${active === item.name ? "active" : ""}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                padding: sidebarOpen ? '12px 20px' : '12px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}
              title={!sidebarOpen ? item.name : ''}
            >
              <IconComponent size={30} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ marginLeft: '12px' }}>{item.name}</span>}
            </button>
          )
        })}
        <button 
          className="dashboard-logout" 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            padding: sidebarOpen ? '12px 20px' : '12px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
          title={!sidebarOpen ? 'Logout' : ''}
        >
          <MdLogout size={20} style={{ flexShrink: 0 }} />
          {sidebarOpen && <span style={{ marginLeft: '12px' }}>Logout</span>}
        </button>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: "999",
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}
      
    </>
  )
}
