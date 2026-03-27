import "./AnimatedHeadline.css";

function AnimatedHeadline({ text, as: Tag = "div", delayStep = 0.07, className = "" }) {
  const words = (text ?? "").split(/\s+/).filter(Boolean);
  return (
    <Tag className={`noir-headline ${className}`.trim()}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="noir-headline-word"
          style={{ "--delay": `${idx * delayStep}s` }}
        >
          <span>{word}</span>
        </span>
      ))}
    </Tag>
  );
}

export default AnimatedHeadline;
