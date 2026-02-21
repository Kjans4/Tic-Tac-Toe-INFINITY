import "../styles/cell.css";

export default function Cell({ value, highlight, onClick }) {
  const classNames = [
    "cell",
    value === "X" ? "cell--x" : value === "O" ? "cell--o" : "",
    highlight === "winner" ? "cell--winner" : "",
    highlight === "warning" ? "cell--warning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} onClick={onClick}>
      {value}
    </button>
  );
}