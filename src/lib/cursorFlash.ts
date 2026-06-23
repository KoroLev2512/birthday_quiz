/** Вспышка курсора при ответе в квизе (зелёный/красный). */
export function flashCursor(kind: 'correct' | 'wrong') {
  window.dispatchEvent(new CustomEvent('vn-cursor-flash', { detail: kind }));
}
