import "../styles/game.css";

export default function HeartsDisplay({ hearts, maxHearts = 5, animate }) {
  return (
    <div className="hearts-display">
      {Array.from({ length: maxHearts }, (_, i) => (
        <span
          key={i}
          className={[
            "heart",
            i < hearts ? "heart--filled" : "heart--empty",
            animate && i === hearts - 1 && animate === "gain" ? "heart--gain" : "",
            animate && i === hearts && animate === "lose" ? "heart--lose" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {i < hearts ? "♥" : "♡"}
        </span>
      ))}
    </div>
  );
}