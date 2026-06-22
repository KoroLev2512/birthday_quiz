import { useRef, useState } from 'react';
import type { OrderQuiz as OrderQuizData } from '../../types/story';

type OrderQuizProps = {
  quiz: OrderQuizData;
  onCorrect: () => void;
  onWrong?: () => void;
};

export function OrderQuiz({ quiz, onCorrect, onWrong }: OrderQuizProps) {
  const [order, setOrder] = useState(quiz.items);
  const [wrong, setWrong] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);

  const reorder = (to: number) => {
    const from = dragIndex.current;
    if (from === null || from === to) return;
    setOrder((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    dragIndex.current = to;
    setDragging(to);
    setWrong(false);
  };

  const submit = () => {
    const ok =
      order.length === quiz.correct.length && order.every((v, i) => v === quiz.correct[i]);
    if (ok) onCorrect();
    else {
      setWrong(true);
      onWrong?.();
    }
  };

  return (
    <div className="vn-order-overlay" data-testid="vn-order">
      <div className={`vn-order ${wrong ? 'vn-order-wrong' : ''}`}>
        {quiz.title && <div className="vn-order-title">{quiz.title}</div>}
        <ul className="vn-order-list">
          {order.map((item, i) => (
            <li
              key={item}
              className={`vn-order-item ${dragging === i ? 'vn-order-item-drag' : ''}`}
              draggable
              onDragStart={(e) => {
                dragIndex.current = i;
                setDragging(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnter={() => reorder(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragging(null);
              }}
            >
              <span className="vn-order-rank">{i + 1}</span>
              <span className="vn-order-label">{item}</span>
              <span className="vn-order-grip" aria-hidden>
                ⠿
              </span>
            </li>
          ))}
        </ul>
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
    </div>
  );
}
