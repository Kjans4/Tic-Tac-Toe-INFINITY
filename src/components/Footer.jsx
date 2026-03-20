import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span className="footer-title">TIC-TAC-TOE INFINITY</span>
        <span className="footer-version">v1.0.0</span>
      </div>

      <div className="footer-right">
        <span className="footer-credit">
          Built by{" "}
          <a
            className="footer-link"
            href="https://github.com/YOUR_USERNAME"
            target="_blank"
            rel="noopener noreferrer"
          >
            YOUR NAME
          </a>
        </span>
        <span className="footer-divider">·</span>
        <a
          className="footer-link"
          href="https://github.com/YOUR_USERNAME/YOUR_REPO"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span className="footer-divider">·</span>
        <a
          className="footer-link"
          href="mailto:YOUR_EMAIL"
        >
          Feedback
        </a>
      </div>

      <div className="footer-bottom">
        <span className="footer-copyright">© 2026 YOUR NAME. All rights reserved.</span>
        <span className="footer-sounds">SFX from YOUR_SFX_SOURCE</span>
      </div>
    </footer>
  );
}