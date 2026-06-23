/**
 * Просьба повернуть телефон. Показывается только на тач-устройствах в портретной
 * ориентации (через CSS-медиазапрос), перекрывая приложение целиком.
 */
export function RotatePrompt() {
  return (
    <div className="vn-rotate" data-testid="vn-rotate">
      <div className="vn-rotate-inner">
        <div className="vn-rotate-phone" aria-hidden>
          📱
        </div>
        <p className="vn-rotate-text">Поверните телефон горизонтально</p>
        <p className="vn-rotate-sub">Игра работает только в альбомной ориентации</p>
      </div>
    </div>
  );
}
