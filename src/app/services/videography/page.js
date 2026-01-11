"use client";

import { useState, useRef, useEffect } from "react";

/* =============================== 
   VIDEO PLAYER WITH EMBED SUPPORT
================================ */
function VideoPlayer({ video, onClose }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(new URL(url).search).get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    // Direct video URL
    return url;
  };

  const videoUrl = video.url || video.secureUrl;
  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = embedUrl && !embedUrl.includes('youtube') && !embedUrl.includes('vimeo');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="video-modal" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
        
        {isDirectVideo ? (
          <video
            src={embedUrl}
            controls
            autoPlay
            className="video-player"
          />
        ) : (
          <iframe
            src={embedUrl}
            className="video-player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}

/* ===============================
   VIDEO CARD WITH AUTO THUMBNAILS
================================ */
function VideoCard({ video, onClick, categoryName }) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const getThumbnail = () => {
    const url = video.url || video.secureUrl || video;
    
    if (typeof url === 'string') {
      // YouTube thumbnail
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : new URLSearchParams(new URL(url).search).get('v');
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      // Vimeo placeholder
      if (url.includes('vimeo.com')) {
        return `https://via.placeholder.com/640x360/667eea/ffffff?text=Vimeo+Video`;
      }
    }

    return `https://via.placeholder.com/640x360/667eea/ffffff?text=Video`;
  };

  const thumbnail = getThumbnail();

  return (
    <div className="video-card" onClick={() => onClick(video)}>
      <div className="video-thumbnail">
        <img
          src={thumbnail}
          alt={categoryName || "Video"}
          onLoad={() => setThumbnailLoaded(true)}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/640x360/667eea/ffffff?text=Video';
          }}
          style={{
            opacity: thumbnailLoaded ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
        {!thumbnailLoaded && <div className="thumbnail-skeleton" />}
        
        <div className="play-overlay">
          <div className="play-button">▶</div>
        </div>
      </div>
      <div className="video-name">{categoryName}</div>
    </div>
  );
}

/* ===============================
   VIDEOGRAPHY PAGE
================================ */
export default function VideographyPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const buttonsRef = useRef(null);
  const videosRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Fetch videography services from API
    fetch("/api/services?type=videography")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Fetched services:", data);
        const videographyServices = Array.isArray(data) 
          ? data.filter(s => s.type === 'videography') 
          : [];
        setDbCategories(videographyServices);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching videography:", err);
        setDbCategories([]);
        setLoading(false);
      });
  }, []);

  const handleToggle = (category) => {
    setActiveCategory(activeCategory?._id === category._id ? null : category);

    setTimeout(() => {
      if (activeCategory?._id !== category._id) {
        videosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const getGridColumns = () => {
    if (windowWidth <= 480) return "1fr";
    if (windowWidth <= 1024) return "repeat(2, 1fr)";
    return "repeat(3, 1fr)";
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: getGridColumns(),
    gap: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 20px",
  };

  if (loading) {
    return (
      <main className="videography-page">
        <div className="loading-spinner">Loading videos...</div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        .videography-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%);
          padding: 40px 16px 60px;
        }

        .videography-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .videography-title {
          font-size: 2.5rem;
          text-align: center;
          color: #111827;
          margin: 0 0 24px;
          font-weight: 800;
        }

        .category-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin: 0 auto 32px;
        }

        .category-button {
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .category-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
          border-color: #6366f1;
          color: #4338ca;
        }

        .category-button.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .video-card {
          background: transparent;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .video-card:hover {
          transform: translateY(-4px);
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 16px;
          background: #000000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .video-card:hover .play-overlay {
          opacity: 1;
        }

        .play-button {
          width: 70px;
          height: 70px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #6366f1;
          transition: transform 0.3s ease;
        }

        .video-card:hover .play-button {
          transform: scale(1.1);
        }

        .video-name {
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        }

        .thumbnail-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .video-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .video-modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: rgba(220, 38, 38, 0.9);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 24px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(220, 38, 38, 1);
          transform: rotate(90deg) scale(1.1);
        }

        .video-player {
          width: 100%;
          height: 80vh;
          display: block;
          border: none;
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

        .no-videos-message {
          text-align: center;
          padding: 100px 20px;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .videography-title {
            font-size: 2rem;
          }

          .video-modal-content {
            max-width: 95%;
          }

          .play-button {
            width: 60px;
            height: 60px;
            font-size: 20px;
          }
        }
      `}</style>

      <main className="videography-page">
        <div className="videography-container">
          <h1 className="videography-title">Videography Services</h1>

          <div className="category-buttons" ref={buttonsRef}>
            {dbCategories.map((category) => (
              <button
                key={category._id || category.id}
                className={`category-button ${
                  activeCategory?._id === category._id ? "active" : ""
                }`}
                onClick={() => handleToggle(category)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {activeCategory && (
            <div ref={videosRef} style={{ marginTop: "40px" }}>
              {activeCategory.images && activeCategory.images.length > 0 ? (
                <div style={gridStyle}>
                  {activeCategory.images.map((video, index) => (
                    <VideoCard
                      key={index}
                      video={video}
                      onClick={setSelectedVideo}
                      categoryName={activeCategory.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-videos-message">
                  <p style={{ fontSize: "64px", marginBottom: "20px" }}>🎬</p>
                  <p style={{ fontSize: "20px", fontWeight: "600" }}>
                    No videos available for this category
                  </p>
                </div>
              )}
            </div>
          )}

          {!activeCategory && dbCategories.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <div style={gridStyle}>
                {dbCategories.map((category) => {
                  const firstVideo =
                    category.images && category.images.length > 0
                      ? category.images[0]
                      : null;
                  return (
                    <div
                      key={category._id || category.id}
                      onClick={() => handleToggle(category)}
                      style={{ cursor: 'pointer' }}
                    >
                      {firstVideo ? (
                        <VideoCard
                          video={firstVideo}
                          onClick={(video) => {
                            // ✅ FIXED: Separate handler for preview click
                            setSelectedVideo(video);
                          }}
                          categoryName={category.name}
                        />
                      ) : (
                        <div className="video-card">
                          <div className="video-thumbnail">
                            <div style={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <span style={{ fontSize: "48px" }}>🎬</span>
                            </div>
                            <div className="play-overlay">
                              <div className="play-button">▶</div>
                            </div>
                          </div>
                          <div className="video-name">{category.name}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dbCategories.length === 0 && !loading && (
            <div className="no-videos-message">
              <p style={{ fontSize: "64px", marginBottom: "20px" }}>🎬</p>
              <p style={{ fontSize: "24px", fontWeight: "600", marginBottom: "10px" }}>
                No Videography Services Available Yet
              </p>
              <p style={{ fontSize: "16px" }}>
                Please add video services from the admin dashboard.
              </p>
            </div>
          )}
        </div>

        {selectedVideo && (
          <VideoPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </main>
    </>
  );
}
