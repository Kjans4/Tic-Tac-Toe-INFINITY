import "../styles/cell.css";

export default function Cell({ value, highlight, isNew, onClick }) {
  const classNames = [
    "cell",
    value === "X" ? "cell--x" : value === "O" ? "cell--o" : "",
    highlight === "winner"  ? "cell--winner"  : "",
    highlight === "warning" ? "cell--warning" : "",
    highlight === "vanish"  ? "cell--vanish"  : "",
    isNew                   ? "cell--placed"  : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} onClick={onClick}>
      {value}
    </button>
  );
}