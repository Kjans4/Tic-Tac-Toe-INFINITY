import "../styles/celebration.css";

export default function CelebrationOverlay({
  visible,
  mainText,
  flavorText,
  isLoss,
}) {
  if (!visible) return null;

  return (
    <div className={`celebration-overlay ${isLoss ? "celebration-overlay--loss" : ""}`}>
      <div className="celebration-content">
        <p className={`celebration-main ${isLoss ? "celebration-main--loss" : ""}`}>
          {mainText}
        </p>
        <p className="celebration-flavor">{flavorText}</p>
      </div>
    </div>
  );
}