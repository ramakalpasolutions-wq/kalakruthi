"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function About() {
  return (
    <div style={styles.page}>
      {/* ================= ABOUT HEADER ================= */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={styles.section}
      >
        <h1 style={styles.mainTitle}>About Kalakruthi</h1>
        
        <p style={styles.description}>
          Our approach blends timeless tradition with contemporary cinematic
          storytelling, capturing weddings as they naturally unfold—authentic,
          elegant, and deeply personal. From intimate rituals to grand
          celebrations, Kalakruthi preserves not just how your day looked, but
          how it truly felt, with artistry that lasts forever.
        </p>
      </motion.section>

      {/* ================= IMAGE + STORY ================= */}
      <section style={styles.splitSection}>
        <motion.div
          initial={{ opacity: 0, x: -70 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
          style={styles.imageBox}
        >
          <Image
            src="/about/sig3.png"
            alt="Kalakruthi wedding storytelling moment"
            fill
            style={{ objectFit: "cover", borderRadius: "22px" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 70 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
          style={styles.textBox}
        >
          <h2 style={styles.subTitle}>Timeless Storytelling</h2>
          <p style={styles.text}>
            Our approach blends classic wedding traditions with modern cinematic
            storytelling. We believe the most powerful images are the ones that
            feel honest, emotional, and deeply personal.
            
            From intimate rituals to grand celebrations, Kalakruthi captures
            weddings as they naturally unfold — gracefully, artistically, and
            forever.
          </p>
        </motion.div>
      </section>

      {/* ================= B2B SERVICES ================= */}
      <section style={styles.b2bSection}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          style={styles.b2bTitle}
        >
          B2B Services
        </motion.h2>

        <p style={styles.b2bIntro}>
          For studios, production houses, and independent creators, Kalakruthi
          offers reliable business‑to‑business rentals on high‑end cameras,
          lenses, and drones—backed by professional maintenance and on‑time
          delivery for every shoot.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={styles.b2bGrid}
        >
          {/* Cameras */}
          <div style={styles.b2bCard}>
            <div style={styles.b2bImageWrapper}>
              <Image
                src="/about/cam.jpeg"
                alt="Professional cinema camera rental"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 style={styles.b2bCardTitle}>Cinema & Mirrorless Cameras</h3>
            <p style={styles.b2bCardText}>
              Full‑frame cinema and mirrorless bodies with log profiles, 4K/6K
              recording, and dual‑card reliability for long‑format weddings and
              live events.
            </p>
          </div>

          {/* Lenses */}
          <div style={styles.b2bCard}>
            <div style={styles.b2bImageWrapper}>
              <Image
                src="/about/cam2.jpeg"
                alt="Prime and zoom lenses rental"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 style={styles.b2bCardTitle}>Prime & Zoom Lens Kits</h3>
            <p style={styles.b2bCardText}>
              Fast primes and versatile zooms covering ultra‑wide to telephoto—
              perfect for candid coverage, portraits, and detailed ceremonial
              work.
            </p>
          </div>

          {/* Drones */}
          <div style={styles.b2bCard}>
            <div style={styles.b2bImageWrapper}>
              <Image
                src="/about/cam3.jpg"
                alt="Drone rentals for weddings and events"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 style={styles.b2bCardTitle}>Drone & Aerial Support</h3>
            <p style={styles.b2bCardText}>
              Registered drones with experienced pilots for cinematic aerial
              shots, venue overviews, and processions—delivered with safety and
              compliance.
            </p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          style={styles.b2bButton}
        >
          Enquire for B2B Rentals
        </motion.button>
      </section>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#e3fdf9",
    fontFamily: "'Playfair Display', serif",
    color: "#002f49",
    paddingBottom: "140px",
  },

  section: {
    padding: "50px 20px 40px",
    maxWidth: "1100px",
    margin: "0 auto",
    textAlign: "center",
  },

  mainTitle: {
    fontSize: "2.6rem",
    color: "#002f49",
    marginBottom: "14px",
    letterSpacing: "1px",
  },

  line: {
    width: "100px",
    height: "3px",
    background: "#002f49",
    margin: "18px auto 46px",
  },

  description: {
    fontSize: "1.35rem",
    lineHeight: 1.65,maxWidth: "760px",
    maxWidth: "880px",
    margin: "0 auto",
    color: "#002f49",
  },

  splitSection: {
    display: "flex",
    flexWrap: "wrap",
    gap: "90px",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "0 20px",
  },

  imageBox: {
    flex: "1 1 480px",
    height: "300px",
    position: "relative",
  },

  textBox: {
    flex: "1 1 420px",
  },

  subTitle: {
    fontSize: "2.6rem",
    marginBottom: "22px",
    color: "#002f49",
  },

  text: {
    fontSize: "1.35rem",
    lineHeight: 1.65, marginBottom: "14px",
    color: "#002f49",
  },

  /* ===== B2B SECTION ===== */
  b2bSection: {
    maxWidth: "1200px", 
    margin: "60px auto 0",
    padding: "0 20px 40px",
    textAlign: "center",
  },

  b2bTitle: {
    fontSize: "2.1rem", 
    marginBottom: "16px",
    color: "#002f49",
    letterSpacing: "0.06em",
  },

  b2bIntro: {
    fontSize: "1.4rem",
    lineHeight: 1.77,
    maxWidth: "860px",
    margin: "0 auto 40px",
    color: "#01314b",
  },

  b2bGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "26px",
    marginTop: "10px",
  },

  b2bCard: {
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 18px 45px rgba(0, 41, 68, 0.15)",
    overflow: "hidden",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
  },

  b2bImageWrapper: {
    position: "relative",
    width: "100%",
    height: "210px",
    overflow: "hidden",
  },

  b2bCardTitle: {
    fontSize: "1.4rem",
    margin: "18px 20px 8px",
    color: "#002f49",
  },

  b2bCardText: {
    fontSize: "0.98rem",
    lineHeight: 1.8,
    color: "#244757",
    margin: "0 20px 22px",
  },

  b2bButton: {
    marginTop: "40px",
    padding: "14px 40px",
    borderRadius: "999px",
    border: "none",
    background: "#002f49",
    color: "#e3fdf9",
    fontSize: "1rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
};