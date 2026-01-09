'use client'
import React, { useState } from 'react'

export default function Services({
  services,
  serviceInput,
  setServiceInput,
  addService,
  deleteService,
  handleDirectUpload,
  deleteServiceImage,
  loading,
  activeTab,
  setActiveTab
}) {
  const [fullPageService, setFullPageService] = useState(null)

  const openFullPageView = (service) => {
    setFullPageService(service)
    document.body.style.overflow = 'hidden'
  }

  const closeFullPageView = () => {
    setFullPageService(null)
    document.body.style.overflow = 'auto'
  }

  // Filter services based on active tab
  const filteredServices = services.filter(service => {
    if (activeTab === 'photography') return service.type === 'photography' || !service.type
    if (activeTab === 'videography') return service.type === 'videography'
    return true
  })

  return (
    <div>
      {/* Add Service Form */}
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: "20px",
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
          ➕ Add New Service
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Service name (e.g., Wedding Photography)"
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addService()}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <button
            onClick={addService}
            disabled={loading || !serviceInput.trim()}
            style={{
              padding: "12px 24px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading || !serviceInput.trim() ? "not-allowed" : "pointer",
              opacity: loading || !serviceInput.trim() ? 0.6 : 1,
            }}
          >
            Add Service
          </button>
        </div>
      </div>

      {/* Tab Toggle Buttons */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
      }}>
        <button
          onClick={() => setActiveTab('photography')}
          style={{
            padding: "12px 24px",
            background: activeTab === 'photography' ? "#10b981" : "#f3f4f6",
            color: activeTab === 'photography' ? "white" : "#4b5563",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          📸 Photography
        </button>
        <button
          onClick={() => setActiveTab('videography')}
          style={{
            padding: "12px 24px",
            background: activeTab === 'videography' ? "#10b981" : "#f3f4f6",
            color: activeTab === 'videography' ? "white" : "#4b5563",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🎥 Videography
        </button>
      </div>

      {/* Services Grid */}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
          {activeTab === 'photography' ? '📸 Photography Services' : '🎥 Videography Services'}
        </h3>
        
        {filteredServices.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#f9fafb",
            borderRadius: "12px",
            border: "2px dashed #d1d5db",
          }}>
            <p style={{ fontSize: "16px", color: "#6b7280" }}>
              No {activeTab} services added yet. Create your first service above.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "20px" 
          }}>
            {filteredServices.map((service) => {
              const serviceId = service._id || service.id
              const imageCount = service.images?.length || 0

              return (
                <div
                  key={serviceId}
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Service Header */}
                  <div style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid #e5e7eb",
                  }}>
                    <h4 style={{ 
                      fontSize: "18px", 
                      fontWeight: "700", 
                      color: "#1f2937",
                      marginBottom: "8px"
                    }}>
                      {service.name}
                    </h4>
                    <p style={{ 
                      fontSize: "13px", 
                      color: "#6b7280",
                      fontWeight: "600" 
                    }}>
                      {imageCount} {imageCount === 1 ? 'Image' : 'Images'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
                    <label style={{
                      padding: "10px 16px",
                      background: "#3b82f6",
                      color: "white",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      textAlign: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                    >
                      📤 
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleDirectUpload(serviceId, e)}
                        style={{ display: "none" }}
                      />
                    </label>

                    {imageCount > 0 && (
                      <button
                        onClick={() => openFullPageView(service)}
                        style={{
                          padding: "10px 16px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                      >
                        👁️  
                      </button>
                    )}

                    <button
                      onClick={() => deleteService(serviceId)}
                      disabled={loading}
                      style={{
                        padding: "10px 16px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#dc2626")}
                      onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#ef4444")}
                    >
                      🗑️ 
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full-Page Image Viewer Modal */}
      {fullPageService && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            overflowY: "auto",
            padding: "20px",
          }}
          onClick={closeFullPageView}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              position: "sticky",
              top: 0,
              background: "rgba(0, 0, 0, 0.9)",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
              backdropFilter: "blur(10px)",
            }}>
              <div>
                <h2 style={{ 
                  fontSize: "24px", 
                  fontWeight: "700", 
                  color: "white",
                  marginBottom: "4px"
                }}>
                  {fullPageService.name}
                </h2>
                <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                  {fullPageService.images?.length || 0} Images
                </p>
              </div>
              <button
                onClick={closeFullPageView}
                style={{
                  padding: "12px 24px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
              >
                ✕ Close
              </button>
            </div>

            {/* Images Grid */}
            {fullPageService.images && fullPageService.images.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px",
                paddingBottom: "40px",
              }}>
                {fullPageService.images.map((img, imgIdx) => (
                  <div
                    key={imgIdx}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                      transition: "transform 0.2s",
                      background: "#1f2937",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <img
                      src={img.url || img}
                      alt={`${fullPageService.name} ${imgIdx + 1}`}
                      style={{
                        width: "100%",
                        height: "250px",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      onClick={() => deleteServiceImage(fullPageService._id || fullPageService.id, img.publicId || img)}
                      disabled={loading}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 0.95,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = "0.95")}
                    >
                      🗑️ Delete
                    </button>
                    <div style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}>
                      {imgIdx + 1} / {fullPageService.images.length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "#1f2937",
                borderRadius: "12px",
              }}>
                <p style={{ fontSize: "16px", color: "#9ca3af" }}>
                  No images available for this service.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}