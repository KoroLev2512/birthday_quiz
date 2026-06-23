import { useCallback, useEffect, useRef } from 'react';
import { CREDITS_CAST, CREDITS_DURATION_MS } from '../../story/credits';

type CreditsRollProps = {
  onComplete: () => void;
};

export function CreditsRoll({ onComplete }: CreditsRollProps) {
  const done = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(finish, CREDITS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  const skip = () => {
    if (scrollRef.current) {
      scrollRef.current.style.animation = 'none';
      scrollRef.current.style.transform = 'translateY(-100%)';
    }
    finish();
  };

  return (
    <div className="vn-credits" data-testid="vn-credits" onClick={skip}>
      <div
        ref={scrollRef}
        className="vn-credits-scroll"
        style={{ animationDuration: `${CREDITS_DURATION_MS}ms` }}
      >
        <p className="vn-credits-heading">В ролях:</p>
        {CREDITS_CAST.map((name) => (
          <p key={name} className="vn-credits-name">
            {name}
          </p>
        ))}
        <div className="vn-credits-tail" aria-hidden />
      </div>
    </div>
  );
}
