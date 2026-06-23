import { sceneMenu } from '../../story/scenes';

type StartMenuProps = {
  onSelect: (firstId: string) => void;
};

export function StartMenu({ onSelect }: StartMenuProps) {
  return (
    <div className="vn-menu" data-testid="vn-menu">
      <div className="vn-menu-body">
      <div className="vn-menu-head">
        <h1>Выбрать сцену</h1>
        <p>Начните историю с начала любой главы</p>
      </div>

      <div className="vn-menu-grid">
        {sceneMenu.map((item) => (
          <button
            key={item.firstId}
            type="button"
            className="vn-menu-item"
            data-testid="vn-menu-item"
            onClick={() => onSelect(item.firstId)}
          >
            <span className="vn-menu-thumb">
              <img src={item.thumb} alt="" loading="lazy" decoding="async" />
              <span className="vn-menu-num">{item.n}</span>
            </span>
            <span className="vn-menu-label">{item.label}</span>
          </button>
        ))}

        <button
          type="button"
          className="vn-menu-item"
          data-testid="vn-menu-credits-card"
          onClick={() => onSelect('credits')}
        >
          <span className="vn-menu-thumb vn-menu-thumb-credits">
            <span className="vn-menu-credits-icon">🎬</span>
          </span>
          <span className="vn-menu-label">Титры</span>
        </button>
      </div>
      </div>

      <footer className="vn-menu-footer" data-testid="vn-menu-footer">
        <span>
          Дизайн и разработка —{' '}
          <a href="https://dev-by-yurii.vercel.app" target="_blank" rel="noopener noreferrer">
            dev-by-yurii
          </a>
        </span>
      </footer>
    </div>
  );
}
