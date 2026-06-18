type DialogueBoxProps = {
  speaker?: string;
  text: string;
  showCursor: boolean;
};

export function DialogueBox({ speaker, text, showCursor }: DialogueBoxProps) {
  return (
    <div className="vn-dialogue" data-testid="vn-dialogue">
      {speaker && (
        <div className="vn-speaker" data-testid="vn-speaker">
          {speaker}
        </div>
      )}
      <p className="vn-text" data-testid="vn-text">
        {text}
        {showCursor && (
          <span className="vn-cursor" data-testid="vn-cursor">
            ▼
          </span>
        )}
      </p>
    </div>
  );
}
