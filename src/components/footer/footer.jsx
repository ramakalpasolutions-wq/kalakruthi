import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-section">
          <h3 className="footer-brand">Kalakruthi</h3>
          <p className="footer-tagline">
            Premium wedding photography for everlasting stories of love.
          </p>
          <p className="footer-love">Made with Memories</p>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/templates">Templates</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>      
          </ul>
        </div>

        {/* SOCIAL */}
<div className="footer-section">
  <h4 className="social-title">Social</h4>

  <ul className="social-text-list">
    <li>
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
        <i className="fab fa-facebook-f icon"></i> Facebook
      </a>
    </li>

    <li>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
        <i className="fab fa-instagram icon"></i> Instagram
      </a>
    </li>

    <li>
      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
        <i className="fab fa-youtube icon"></i> YouTube
      </a>
    </li>

     {/* <li>
      <a href="https://x.com" target="_blank" rel="noopener noreferrer">
        <i className="fab fa-x-twitter icon"></i> X
      </a>
    </li> */}
  </ul>
</div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Kalakruthi. All rights reserved.
      </div>
    </footer>
  );
}
