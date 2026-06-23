import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderQuiz } from './OrderQuiz';

describe('OrderQuiz', () => {
  it('calls onCorrect when the order already matches', () => {
    const onCorrect = vi.fn();
    const onWrong = vi.fn();
    render(
      <OrderQuiz
        quiz={{ title: 'T', items: ['a', 'b', 'c'], correct: ['a', 'b', 'c'] }}
        onCorrect={onCorrect}
        onWrong={onWrong}
      />,
    );
    fireEvent.click(screen.getByText('Ответить'));
    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(onWrong).not.toHaveBeenCalled();
  });

  it('calls onWrong when the order is incorrect', () => {
    const onCorrect = vi.fn();
    const onWrong = vi.fn();
    render(
      <OrderQuiz
        quiz={{ items: ['b', 'a'], correct: ['a', 'b'] }}
        onCorrect={onCorrect}
        onWrong={onWrong}
      />,
    );
    fireEvent.click(screen.getByText('Ответить'));
    expect(onWrong).toHaveBeenCalledTimes(1);
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('renders every item', () => {
    render(
      <OrderQuiz
        quiz={{ items: ['Пацаны', 'Шерлок'], correct: ['Пацаны', 'Шерлок'] }}
        onCorrect={vi.fn()}
        onWrong={vi.fn()}
      />,
    );
    expect(screen.getByText('Пацаны')).toBeInTheDocument();
    expect(screen.getByText('Шерлок')).toBeInTheDocument();
  });
});
