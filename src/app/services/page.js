"use client";

import { useState, useRef, useEffect } from "react";

/* ===============================
   STYLES (for JS grid)
================================ */
const styles = {
  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 20px",
    alignItems: "stretch",
  },
};

/* ===============================
   IMAGE POPUP MODAL - SMOOTH ANIMATIONS
================================ */
function ImagePopupModal({ images, initialIndex, onClose, categoryName }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(null);
  const autoPlayRef = useRef(null);

  const getImageIndex = (offset) => {
    const index = currentIndex + offset;
    if (index < 0) return images.length + index;
    if (index >= images.length) return index - images.length;
    return index;
  };

  const leftIndex = getImageIndex(-1);
  const centerIndex = currentIndex;
  const rightIndex = getImageIndex(1);

  useEffect(() => {
    if (images && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 3000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex, images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
        handlePrevious();
      }
      if (e.key === "ArrowRight") {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setDirection("next");
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
      setDirection(null);
    }, 900);
  };

  const handlePrevious = () => {
    if (isTransitioning) return;
    setDirection("prev");
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsTransitioning(false);
      setDirection(null);
    }, 900);
  };

  const handleManualNext = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    handleNext();
  };

  const handleManualPrevious = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    handlePrevious();
  };

  if (!images || images.length === 0) {
    return (
      <div className={`image-popup-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
        <div className="no-images-popup">
          <button className="popup-close-btn" onClick={handleClose}>✕</button>
          <p style={{ fontSize: "64px", marginBottom: "20px" }}>📷</p>
          <p style={{ fontSize: "24px", color: "white" }}>No images found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`image-popup-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`image-popup-content ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="popup-close-btn" onClick={handleClose}>
          ✕
        </button>

        <button 
          className="popup-nav-btn prev-btn" 
          onClick={handleManualPrevious}
          disabled={isTransitioning}
        >
          ‹
        </button>

        <div className="carousel-3d-container">
          <div className={`carousel-3d-wrapper ${isTransitioning ? 'transitioning' : ''} ${direction || ''}`}>
            
            <div 
              className={`carousel-3d-item item-left ${isTransitioning && direction === 'prev' ? 'moving-to-center' : ''} ${isTransitioning && direction === 'next' ? 'moving-out-left' : ''}`}
              onClick={handleManualPrevious}
              key={`left-${leftIndex}`}
            >
              <img
                src={images[leftIndex].url || images[leftIndex].secureUrl}
                alt="Previous"
                loading="eager"
              />
            </div>

            <div 
              className={`carousel-3d-item item-center ${isTransitioning && direction === 'next' ? 'moving-to-right' : ''} ${isTransitioning && direction === 'prev' ? 'moving-to-left' : ''}`}
              key={`center-${centerIndex}`}
            >
              <img
                src={images[centerIndex].url || images[centerIndex].secureUrl}
                alt={`Image ${centerIndex + 1}`}
                loading="eager"
              />
            </div>

            <div 
              className={`carousel-3d-item item-right ${isTransitioning && direction === 'next' ? 'moving-to-center' : ''} ${isTransitioning && direction === 'prev' ? 'moving-out-right' : ''}`}
              onClick={handleManualNext}
              key={`right-${rightIndex}`}
            >
              <img
                src={images[rightIndex].url || images[rightIndex].secureUrl}
                alt="Next"
                loading="eager"
              />
            </div>

          </div>
        </div>

        <button 
          className="popup-nav-btn next-btn" 
          onClick={handleManualNext}
          disabled={isTransitioning}
        >
          ›
        </button>
      </div>
    </div>
  );
}

/* ===============================
   SERVICE CARD - FIXED
================================ */
function ServiceCard({ service, onView, showViewText = true }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const firstImage = service.images && service.images.length > 0 ? service.images[0] : null;

  return (
    <div className="service-card">
      <div className="image-box" onClick={() => onView(service)}>
        {firstImage ? (
          <>
            <img
              src={firstImage.url || firstImage.secureUrl}
              alt={service.name}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.4s ease-in-out",
              }}
            />
            {!imageLoaded && <div className="image-skeleton" />}
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "48px",
            }}
          >
            📸
          </div>
        )}

        {showViewText && <div className="view-text">View</div>}
      </div>

      <div className="category-name">{service.name}</div>
    </div>
  );
}

/* ===============================
   PAGE
================================ */
export default function ServicesPage() {
  const [activePopup, setActivePopup] = useState(null);
  const [dbServices, setDbServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Fetched services:", data);
        setDbServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching services:", err);
        setDbServices([]);
        setLoading(false);
      });
  }, []);

  const handleButtonClick = (service) => {
    setActivePopup(service);
  };

  const handleCardClick = (service) => {
    setActivePopup(service);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const getGridColumns = () => {
    if (windowWidth <= 480) return "1fr";
    if (windowWidth <= 1024) return "repeat(2, 1fr)";
    return "repeat(3, 1fr)";
  };

  const responsiveGridStyle = {
    ...styles.servicesGrid,
    gridTemplateColumns: getGridColumns(),
  };

  if (loading) {
    return (
      <main className="services-page">
        <div className="loading-spinner">Loading services...</div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .carousel-3d-container,
        .carousel-3d-wrapper,
        .carousel-3d-item,
        .carousel-3d-item img {
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }

        .services-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%);
          padding: 40px 16px 60px;
          display: flex;
          justify-content: center;
        }

        .services-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        .services-title {
          font-size: 3rem;
          text-align: center;
          margin: 0 0 24px;
          font-weight: 900;
          background: linear-gradient(
            90deg,
            #ff0000 0%,
            #ff7f00 14.28%,
            #ffff00 28.56%,
            #00ff00 42.84%,
            #0000ff 57.12%,
            #4b0082 71.4%,
            #9400d3 85.68%,
            #ff0000 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbow-animation 6s linear infinite;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15));
        }

        @keyframes rainbow-animation {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .services-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 12px;
          max-width: 1100px;
          margin: 0 auto 32px;
          padding: 0;
        }

        .category-button,
        .services-buttons button {
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          white-space: nowrap;
        }

        .category-button:hover,
        .services-buttons button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 140, 66, 0.3);
          border-color: #ffb380;
          background: #fc8332ff;
          color: #ffffff;
        }

        .category-button.active,
        .services-buttons button.active {
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
          color: #ffffff;
          border-color: #ff6b35;
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
        }

        .image-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.98);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: overlayFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .image-popup-overlay.closing {
          animation: overlayFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes overlayFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .image-popup-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .no-images-popup {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .carousel-3d-container {
          position: relative;
          width: 100%;
          height: 100vh;
          perspective: 2800px;
          perspective-origin: 50% 50%;
          transform-style: preserve-3d;
          overflow: hidden;
        }

        .carousel-3d-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
        }

        .carousel-3d-item {
          position: absolute;
          width: 800px;
          height: 92%;
          transform-style: preserve-3d;
          cursor: pointer;
          overflow: hidden;
          border-radius: 36px;
          will-change: transform, opacity;
          transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .carousel-3d-item img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 36px;
          user-select: none;
          pointer-events: none;
          will-change: filter, transform;
          transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .item-left {
          transform: translate3d(-750px, 0, -500px) rotateY(45deg) scale(0.7);
          opacity: 0.35;
          z-index: 1;
        }

        .item-left img {
          filter: brightness(0.35) blur(5px) saturate(0.8);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }

        .item-center {
          transform: translate3d(0, 0, 100px) rotateY(0deg) scale(1);
          opacity: 1;
          z-index: 10;
        }

        .item-center img {
          filter: brightness(1) blur(0) saturate(1.1);
          box-shadow: 
            0 70px 160px rgba(0, 0, 0, 0.9), 
            0 0 140px rgba(99, 102, 241, 0.6),
            0 0 80px rgba(139, 92, 246, 0.4);
        }

        .item-right {
          transform: translate3d(750px, 0, -500px) rotateY(-45deg) scale(0.7);
          opacity: 0.35;
          z-index: 1;
        }

        .item-right img {
          filter: brightness(0.35) blur(5px) saturate(0.8);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }

        .item-left.moving-out-left {
          transform: translate3d(-1600px, 0, -800px) rotateY(60deg) scale(0.5);
          opacity: 0;
          z-index: 0;
        }

        .item-center.moving-to-right {
          transform: translate3d(750px, 0, -500px) rotateY(-45deg) scale(0.7);
          opacity: 0.35;
          z-index: 1;
        }

        .item-center.moving-to-right img {
          filter: brightness(0.35) blur(5px) saturate(0.8);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }

        .item-right.moving-to-center {
          transform: translate3d(0, 0, 100px) rotateY(0deg) scale(1);
          opacity: 1;
          z-index: 10;
        }

        .item-right.moving-to-center img {
          filter: brightness(1) blur(0) saturate(1.1);
          box-shadow: 
            0 70px 160px rgba(0, 0, 0, 0.9), 
            0 0 140px rgba(99, 102, 241, 0.6),
            0 0 80px rgba(139, 92, 246, 0.4);
        }

        .item-left.moving-to-center {
          transform: translate3d(0, 0, 100px) rotateY(0deg) scale(1);
          opacity: 1;
          z-index: 10;
        }

        .item-left.moving-to-center img {
          filter: brightness(1) blur(0) saturate(1.1);
          box-shadow: 
            0 70px 160px rgba(0, 0, 0, 0.9), 
            0 0 140px rgba(99, 102, 241, 0.6),
            0 0 80px rgba(139, 92, 246, 0.4);
        }

        .item-center.moving-to-left {
          transform: translate3d(-750px, 0, -500px) rotateY(45deg) scale(0.7);
          opacity: 0.35;
          z-index: 1;
        }

        .item-center.moving-to-left img {
          filter: brightness(0.35) blur(5px) saturate(0.8);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }

        .item-right.moving-out-right {
          transform: translate3d(1600px, 0, -800px) rotateY(-60deg) scale(0.5);
          opacity: 0;
          z-index: 0;
        }

        .item-left:hover:not(.moving-to-center):not(.moving-out-left) {
          transform: translate3d(-720px, -25px, -470px) rotateY(40deg) scale(0.73);
          opacity: 0.6;
          transition: all 0.4s ease;
        }

        .item-left:hover:not(.moving-to-center):not(.moving-out-left) img {
          filter: brightness(0.55) blur(3px) saturate(0.9);
          box-shadow: 0 40px 100px rgba(99, 102, 241, 0.4);
          transition: all 0.4s ease;
        }

        .item-right:hover:not(.moving-to-center):not(.moving-out-right) {
          transform: translate3d(720px, -25px, -470px) rotateY(-40deg) scale(0.73);
          opacity: 0.6;
          transition: all 0.4s ease;
        }

        .item-right:hover:not(.moving-to-center):not(.moving-out-right) img {
          filter: brightness(0.55) blur(3px) saturate(0.9);
          box-shadow: 0 40px 100px rgba(139, 92, 246, 0.4);
          transition: all 0.4s ease;
        }

        .item-center:hover:not(.moving-to-right):not(.moving-to-left) {
          transform: translate3d(0, -15px, 120px) rotateY(0deg) scale(1.02);
          transition: all 0.4s ease;
        }

        .item-center:hover:not(.moving-to-right):not(.moving-to-left) img {
          filter: brightness(1.05) blur(0) saturate(1.15);
          box-shadow: 
            0 80px 180px rgba(0, 0, 0, 0.95), 
            0 0 160px rgba(99, 102, 241, 0.8),
            0 0 100px rgba(139, 92, 246, 0.6);
          transition: all 0.4s ease;
        }

        .popup-close-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(220, 38, 38, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.3);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-size: 26px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(20px);
          z-index: 1000001;
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.6);
        }

        .popup-close-btn:hover {
          background: rgba(220, 38, 38, 1);
          transform: rotate(90deg) scale(1.15);
          box-shadow: 0 15px 50px rgba(220, 38, 38, 0.9);
        }

        .popup-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(99, 102, 241, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.4);
          width: 55px;
          height: 55px;
          border-radius: 50%;
          font-size: 36px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(20px);
          z-index: 1000000;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.5);
        }

        .popup-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: translateY(-50%) scale(0.9);
        }

        .prev-btn {
          left: 20px;
        }

        .next-btn {
          right: 20px;
        }

        .popup-nav-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 1);
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 15px 50px rgba(99, 102, 241, 0.8);
        }

        .popup-nav-btn:active:not(:disabled) {
          transform: translateY(-50%) scale(1.05);
        }

        .service-card {
          background: transparent;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.4s ease;
        }

        .service-card:hover {
          transform: translate3d(0, -18px, 0) scale(1.05);
        }

        .service-card .image-box {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 24px;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
          transition: all 0.4s ease;
        }

        .service-card:hover .image-box {
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.4);
          border-radius: 30px;
        }

        .service-card .image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
          border-radius: 24px;
        }

        .service-card:hover .image-box img {
          transform: scale(1.12);
        }

        .image-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 24px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* 🔥 SMALLER VIEW BUTTON */
        .view-text {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translate(-50%, 0);
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
          z-index: 2;
          background: transparent;
          padding: 8px 24px;
          border-radius: 6px;
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          letter-spacing: 0.5px;
          text-transform: capitalize;
        }

        .image-box:hover .view-text {
          opacity: 1;
          transform: translate(-50%, -6px);
          background: rgba(255, 255, 255, 0.1);
        }

        .category-name {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #000000;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          font-size: 24px;
          color: #4b5563;
          font-weight: 600;
        }

        .services-section {
          margin-top: 40px;
        }

        @media (max-width: 1024px) {
          .services-title {
            font-size: 2.5rem;
          }

          .carousel-3d-container {
            perspective: 2400px;
          }

          .carousel-3d-item {
            width: 650px;
            height: 85%;
          }

          .item-left, .item-left.moving-out-left {
            transform: translate3d(-650px, 0, -450px) rotateY(45deg) scale(0.68);
          }

          .item-right, .item-right.moving-out-right {
            transform: translate3d(650px, 0, -450px) rotateY(-45deg) scale(0.68);
          }

          .item-center.moving-to-right {
            transform: translate3d(650px, 0, -450px) rotateY(-45deg) scale(0.68);
          }

          .item-center.moving-to-left {
            transform: translate3d(-650px, 0, -450px) rotateY(45deg) scale(0.68);
          }

          .item-right.moving-to-center,
          .item-left.moving-to-center {
            transform: translate3d(0, 0, 100px) rotateY(0deg) scale(1);
          }
        }

        @media (max-width: 768px) {
          .services-title {
            font-size: 2rem;
          }

          .carousel-3d-container {
            perspective: 2000px;
          }

          .carousel-3d-item {
            width: 550px;
            height: 75%;
          }

          .item-left {
            transform: translate3d(-550px, 0, -400px) rotateY(45deg) scale(0.65);
          }

          .item-right {
            transform: translate3d(550px, 0, -400px) rotateY(-45deg) scale(0.65);
          }

          .item-center.moving-to-right {
            transform: translate3d(550px, 0, -400px) rotateY(-45deg) scale(0.65);
          }

          .item-center.moving-to-left {
            transform: translate3d(-550px, 0, -400px) rotateY(45deg) scale(0.65);
          }
        }

        @media (max-width: 480px) {
          .services-title {
            font-size: 1.75rem;
          }

          .carousel-3d-container {
            perspective: 1600px;
          }

          .carousel-3d-item {
            width: 420px;
            height: 65%;
          }

          .item-left {
            transform: translate3d(-450px, 0, -350px) rotateY(45deg) scale(0.6);
          }

          .item-right {
            transform: translate3d(450px, 0, -350px) rotateY(-45deg) scale(0.6);
          }

          .item-center.moving-to-right {
            transform: translate3d(450px, 0, -350px) rotateY(-45deg) scale(0.6);
          }

          .item-center.moving-to-left {
            transform: translate3d(-450px, 0, -350px) rotateY(45deg) scale(0.6);
          }

          .popup-nav-btn {
            width: 45px;
            height: 45px;
            font-size: 28px;
          }

          .popup-close-btn {
            width: 42px;
            height: 42px;
            font-size: 22px;
          }

          .view-text {
            font-size: 12px;
            padding: 6px 20px;
          }
        }
      `}</style>

      <main className="services-page">
        <div className="services-container">
          <h1 className="services-title">Photography</h1>

          <div className="services-buttons">
            {dbServices.map((service) => (
              <button
                key={service._id || service.id}
                className={activePopup?._id === service._id ? "active" : ""}
                onClick={() => handleButtonClick(service)}
              >
                {service.name}
              </button>
            ))}
          </div>

          <section className="services-section">
            {dbServices.length > 0 ? (
              <div style={responsiveGridStyle}>
                {dbServices.map((service) => (
                  <ServiceCard
                    key={service._id || service.id}
                    service={service}
                    onView={handleCardClick}
                    showViewText={true}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "100px 20px", color: "#9ca3af" }}>
                <p style={{ fontSize: "64px", marginBottom: "20px" }}>🎨</p>
                <p style={{ fontSize: "24px", fontWeight: "600", marginBottom: "10px" }}>
                  No Services Available Yet
                </p>
                <p style={{ fontSize: "16px" }}>
                  Please add services from the admin dashboard to get started.
                </p>
              </div>
            )}
          </section>
        </div>

        {activePopup && (
          <ImagePopupModal
            images={activePopup.images || []}
            initialIndex={0}
            onClose={closePopup}
            categoryName={activePopup.name}
          />
        )}
      </main>
    </>
  );
}