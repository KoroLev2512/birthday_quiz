import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('types the text out over time', () => {
    const { result } = renderHook(() => useTypewriter('abc', 10));
    expect(result.current.displayed).toBe('');
    expect(result.current.done).toBe(false);

    act(() => vi.advanceTimersByTime(10));
    expect(result.current.displayed).toBe('a');

    act(() => vi.advanceTimersByTime(20));
    expect(result.current.displayed).toBe('abc');
    expect(result.current.done).toBe(true);
  });

  it('finish() shows the full text and stops the interval (no rollback)', () => {
    const { result } = renderHook(() => useTypewriter('hello world', 10));
    act(() => vi.advanceTimersByTime(10)); // печатается 'h'

    act(() => result.current.finish());
    expect(result.current.displayed).toBe('hello world');
    expect(result.current.done).toBe(true);

    // Интервал остановлен — текст не «откатывается» назад.
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.displayed).toBe('hello world');
  });

  it('marks empty text as done immediately', () => {
    const { result } = renderHook(() => useTypewriter('', 10));
    expect(result.current.done).toBe(true);
    expect(result.current.displayed).toBe('');
  });
});
