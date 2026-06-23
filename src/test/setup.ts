import '@testing-library/jest-dom/vitest';

// jsdom не реализует воспроизведение медиа — заглушаем, чтобы audioController не падал.
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
