import "../styles/celebration.css";

export default function CelebrationOverlay({
  visible,
  mainText,
  flavorText,
  isLoss,
}) {
  if (!visible) return null;

  return (
    <div className={`celebration-overlay${isLoss ? " celebration-overlay--loss" : ""}`}>
      <div className="celebration-card">
        <p className="celebration-main">{mainText}</p>
        <p className="celebration-flavor">{flavorText}</p>
      </div>
    </div>
  );
}