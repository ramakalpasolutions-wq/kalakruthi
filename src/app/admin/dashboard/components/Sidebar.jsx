'use client'
import React, { useState, useEffect } from 'react'
import { 
  MdDashboard, 
  MdViewCarousel, 
  MdPhotoLibrary, 
  MdMiscellaneousServices,
  MdAttachMoney,
  MdRequestQuote,
  MdBusiness,
  MdPeople,
  MdCardGiftcard,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore, // Added for dropdown arrow
  MdExpandLess  // Added for dropdown arrow
} from 'react-icons/md'

// ✅ UPDATED MENU STRUCTURE
const MENU = [
  { 
    name: "Dashboard", 
    icon: MdDashboard,
    // Submenu items
    submenu: [
      { name: "Hero Section", icon: MdViewCarousel },
      { name: "Gallery", icon: MdPhotoLibrary },
      { name: "Services", icon: MdMiscellaneousServices },
      { name: "Packages", icon: MdCardGiftcard },
    ]
  },
  // Remaining items
  { name: "Pricing List", icon: MdAttachMoney },
  { name: "Quotation", icon: MdRequestQuote },
  { name: "Customer Details", icon: MdPeople },
  { name: "B2B Customer", icon: MdBusiness },
]

export default function Sidebar({
  active,
  setActive,
  setOpenPaymentRowId,
  setOpenAdvanceId
}) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // ✅ NEW STATE FOR DASHBOARD DROPDOWN
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)

  const isOpen = isDesktop ? desktopOpen : mobileOpen

  // ✅ DETECT DESKTOP
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ✅ AUTO-EXPAND DASHBOARD IF A CHILD IS ACTIVE
  useEffect(() => {
    const dashboardItem = MENU.find(item => item.name === "Dashboard");
    if (dashboardItem && dashboardItem.submenu) {
      const isSubActive = dashboardItem.submenu.some(sub => sub.name === active);
      if (isSubActive) {
        setIsDashboardOpen(true);
      }
    }
  }, [active]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    } catch {
      window.location.href = "/"
    }
  }

  const toggleSidebar = () => {
    if (isDesktop) {
      setDesktopOpen(prev => !prev)
    } else {
      setMobileOpen(prev => !prev)
    }
  }

  const handleMenuClick = (menuName) => {
    scrollToTop()
    setActive(menuName)
    setOpenPaymentRowId(null)
    setOpenAdvanceId(null)

    // close only on mobile
    if (!isDesktop) {
      setMobileOpen(false)
    }
  }

  // Handle toggling the dropdown
  const handleDropdownToggle = () => {
    // If sidebar is closed, open it so user can see dropdown
    if (!isOpen) {
        if(isDesktop) setDesktopOpen(true);
        else setMobileOpen(true);
    }
    setIsDashboardOpen(!isDashboardOpen);
  }

  return (
    <>
      {/* MOBILE TOGGLE */}
      {!isDesktop && (
        <button
          onClick={toggleSidebar}
          style={{
            position: "absolute",
            top: "70px",
            right: "20px",
            zIndex: "1001",
            background: "#10b981",
            color: "black",
            border: "none",
            borderRadius: "80px",
            padding: "5px 10px",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      )}

      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: isOpen ? '20px' : '20px 0',
          marginBottom: '20px'
        }}>
          {isOpen && <h2 className="dashboard-logo">Admin</h2>}

          {/* DESKTOP TOGGLE */}
          {isDesktop && (
            <button
              onClick={toggleSidebar}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {desktopOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
            </button>
          )}
        </div>

        {/* MENU */}
        {MENU.map(item => {
          const Icon = item.icon
          
          // 🟢 CASE 1: ITEM HAS SUBMENU (DASHBOARD)
          if (item.submenu) {
            const isParentActive = item.submenu.some(sub => sub.name === active);
            
            return (
              <div key={item.name} style={{ width: '100%' }}>
                <button
                  onClick={handleDropdownToggle}
                  className={`dashboard-menu-btn ${isParentActive ? "active" : ""}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'space-between' : 'center', // Space between for arrow
                    padding: isOpen ? '12px 20px' : '12px 0',
                    width: '100%',
                    borderBottom: '1px solid #0f8b99',
                  }}
                  title={!isOpen ? item.name : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icon size={30} />
                    {isOpen && <span style={{ marginLeft: 12 }}>{item.name}</span>}
                  </div>
                  {isOpen && (
                    isDashboardOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />
                  )}
                </button>

                {/* DROPDOWN ITEMS */}
                {isOpen && isDashboardOpen && (
                  <div style={{ background: 'rgba(0,0,0,0.1)' }}>
                    {item.submenu.map(subItem => {
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.name}
                          onClick={() => handleMenuClick(subItem.name)}
                          className={`dashboard-menu-btn ${active === subItem.name ? "active" : ""}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: '10px 20px 10px 45px', // Indented padding
                            width: '100%',
                            fontSize: '0.9em',
                            borderBottom: '1px solid #0f8b99',
                          }}
                        >
                          <SubIcon size={24} />
                          <span style={{ marginLeft: 12 }}>{subItem.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // 🟢 CASE 2: REGULAR ITEM
          return (
            <button
              key={item.name}
              onClick={() => handleMenuClick(item.name)}
              className={`dashboard-menu-btn ${active === item.name ? "active" : ""}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isOpen ? 'flex-start' : 'center',
                padding: isOpen ? '12px 20px' : '12px 0',
                width: '100%',
                borderBottom: '1px solid #0f8b99',
              }}
              title={!isOpen ? item.name : ''}
            >
              <Icon size={30} />
              {isOpen && <span style={{ marginLeft: 12 }}>{item.name}</span>}
            </button>
          )
        })}

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="dashboard-logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            padding: isOpen ? '12px 20px' : '12px 0',
            width: '100%',
          }}
        >
          <MdLogout size={20} />
          {isOpen && <span style={{ marginLeft: 12 }}>Logout</span>}
        </button>
      </aside>

      {/* MOBILE OVERLAY */}
      {!isDesktop && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}
    </>
  )
}