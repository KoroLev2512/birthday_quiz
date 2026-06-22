import { useState } from 'react';
import type { OrderQuiz as OrderQuizData } from '../../types/story';

type OrderQuizProps = {
  quiz: OrderQuizData;
  onCorrect: () => void;
  onWrong?: () => void;
};

export function OrderQuiz({ quiz, onCorrect, onWrong }: OrderQuizProps) {
  const [order, setOrder] = useState(quiz.items);
  const [wrong, setWrong] = useState(false);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setWrong(false);
  };

  const submit = () => {
    const ok = order.length === quiz.correct.length && order.every((v, i) => v === quiz.correct[i]);
    if (ok) {
      onCorrect();
    } else {
      setWrong(true);
      onWrong?.();
    }
  };

  return (
    <div className={`vn-order ${wrong ? 'vn-order-wrong' : ''}`} data-testid="vn-order">
      {quiz.title && <div className="vn-order-title">{quiz.title}</div>}
      <ol className="vn-order-list">
        {order.map((item, i) => (
          <li key={item} className="vn-order-item">
            <span className="vn-order-rank">{i + 1}</span>
            <span className="vn-order-label">{item}</span>
            <span className="vn-order-ctrls">
              <button
                type="button"
                className="vn-order-move"
                aria-label="Выше"
                disabled={i === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  move(i, -1);
                }}
              >
                ▲
              </button>
              <button
                type="button"
                className="vn-order-move"
                aria-label="Ниже"
                disabled={i === order.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  move(i, 1);
                }}
              >
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="vn-order-submit"
        onClick={(e) => {
          e.stopPropagation();
          submit();
        }}
      >
        Ответить
      </button>
    </div>
  );
}
