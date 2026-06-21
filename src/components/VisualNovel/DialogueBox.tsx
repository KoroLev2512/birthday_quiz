type DialogueBoxProps = {
  speaker?: string;
  text: string;
  showCursor: boolean;
  /** Центрировать текст (для вопросов квиза). */
  centered?: boolean;
};

export function DialogueBox({ speaker, text, showCursor, centered }: DialogueBoxProps) {
  return (
    <div className="vn-dialogue" data-testid="vn-dialogue">
      {speaker && (
        <div className="vn-speaker" data-testid="vn-speaker">
          {speaker}
        </div>
      )}
      <p className={`vn-text ${centered ? 'vn-text-center' : ''}`} data-testid="vn-text">
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
