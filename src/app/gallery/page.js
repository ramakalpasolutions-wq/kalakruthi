"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =======================================
   🔌 ADMIN DATA (API READY)
   ======================================= */
const mockGalleryData = {
  photos: [], // { id, url }
};

/* =======================================
   🖼️ IMAGE WITH LOADING STATE
   ======================================= */
function ImageWithLoader({ src, alt, className, onClick }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={() => setLoaded(true)}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.6s ease-in-out",
        }}
        onClick={onClick}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
      )}
    </div>
  );
}

/* =======================================
   🖼️ IMAGE MODAL
   ======================================= */
function ImagePopup({ src, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0" onClick={onClose} />
        <motion.img
          src={src}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
        />
      </motion.div>
    </AnimatePresence>
  );
}

/* =======================================
   🧱 SKELETON CARD
   ======================================= */
function SkeletonCard() {
  return (
    <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
  );
}

/* =======================================
   🖼️ MAIN PAGE
   ======================================= */
export default function GalleryPage() {
  const [gallery, setGallery] = useState({ photos: [] });
  const [activeImage, setActiveImage] = useState(null);
  
  // Hero Section State - Uses ALL gallery images
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Autoplay - cycles through ALL images
  useEffect(() => {
    const interval = setInterval(() => {
      if (gallery.photos.length > 0) {
        setCurrentHeroIndex((prev) => (prev + 1) % gallery.photos.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [gallery.photos.length]);

  const goToPrev = () => {
    if (gallery.photos.length > 0) {
      setCurrentHeroIndex((prev) => 
        prev === 0 ? gallery.photos.length - 1 : prev - 1
      );
    }
  };

  const goToNext = () => {
    if (gallery.photos.length > 0) {
      setCurrentHeroIndex((prev) => (prev + 1) % gallery.photos.length);
    }
  };

  useEffect(() => {
    // Fetch gallery data from API
    const fetchGallery = async () => {
      try {
        console.log('📸 Fetching gallery images...');
        const res = await fetch('/api/gallery');
        const data = await res.json();
        console.log('✅ Gallery data received:', data);
        
        // Only photos
        const photos = data.media
          ?.filter(item => item.type === 'image')
          .map(item => ({
            id: item._id || item.public_id,
            url: item.secure_url || item.url
          })) || [];

        setGallery({ photos });
      } catch (error) {
        console.error('❌ Error loading gallery:', error);
        setGallery(mockGalleryData);
      }
    };

    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* 🎨 HERO SECTION - CLEAN IMAGE CAROUSEL ONLY (NO TEXT) */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden shadow-2xl">
        {/* Hero Background Images - ALL FROM GALLERY */}
        {gallery.photos.length > 0 && (
          <>
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHeroIndex}
                  className="w-full h-full relative"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <ImageWithLoader
                    src={gallery.photos[currentHeroIndex]?.url || ''}
                    alt="Hero image"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* LEFT ARROW BUTTON */}
            <motion.button
              onClick={goToPrev}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white backdrop-blur-xl rounded-full shadow-xl border-2 border-white/50 flex items-center justify-center text-black text-xl md:text-2xl font-bold hover:scale-110 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={gallery.photos.length === 0}
            >
              ‹
            </motion.button>

            {/* RIGHT ARROW BUTTON */}
            <motion.button
              onClick={goToNext}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white backdrop-blur-xl rounded-full shadow-xl border-2 border-white/50 flex items-center justify-center text-black text-xl md:text-2xl font-bold hover:scale-110 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={gallery.photos.length === 0}
            >
              ›
            </motion.button>

            {/* Progress Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
              {gallery.photos.slice(0, Math.min(10, gallery.photos.length)).map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentHeroIndex 
                      ? 'bg-white scale-125 shadow-lg' 
                      : 'bg-white/50 hover:bg-white'
                  }`}
                  whileHover={{ scale: 1.3 }}
                />
              ))}
              {gallery.photos.length > 10 && (
                <div className="text-white/70 text-sm ml-2">
                  +{gallery.photos.length - 10}
                </div>
              )}
            </div>
          </>
        )}

        {/* Loading state for hero */}
        {gallery.photos.length === 0 && (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-24 h-24 bg-white/50 rounded-full animate-ping" />
          </div>
        )}
      </section>

      {/* ================= GAP BETWEEN HERO AND GRID ================= */}
      <div className="py-16" />

      {/* ================= PHOTOS SECTION (4x4 GRID) ================= */}
      <section className="flex justify-center px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full max-w-6xl">
          {gallery.photos.length === 0
            ? Array.from({ length: 16 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : gallery.photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setActiveImage(photo.url)}
                  className="cursor-pointer overflow-hidden rounded-2xl gallery-card shadow-lg relative"
                >
                  <ImageWithLoader
                    src={photo.url}
                    alt=""
                    className="w-full h-80 object-cover"
                  />
                </motion.div>
              ))}
        </div>
      </section>

      {/* ================= GAP BETWEEN GRID AND FOOTER ================= */}
      <div className="py-16" />

      {/* MODALS */}
      {activeImage && (
        <ImagePopup src={activeImage} onClose={() => setActiveImage(null)} />
      )}
    </div>
  );
}
