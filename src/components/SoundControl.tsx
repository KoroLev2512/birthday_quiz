import { useEffect, useState } from 'react';
import { audio } from '../audio/audioController';

const LS_VOL = 'vn-volume';
const LS_MUTE = 'vn-muted';

function initialVolume(): number {
  const raw = localStorage.getItem(LS_VOL);
  if (raw === null) return 1; // по умолчанию звук включён на полную
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
}

/**
 * Управление звуком в правом верхнем углу: кнопка mute + ползунок громкости.
 * Скрыто, проявляется по наведению/фокусу — как кнопка «Сцены».
 */
export function SoundControl() {
  const [muted, setMuted] = useState(() => localStorage.getItem(LS_MUTE) === '1');
  const [volume, setVolume] = useState(initialVolume);

  useEffect(() => {
    audio.setMasterVolume(volume);
  }, [volume]);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(LS_MUTE, next ? '1' : '0');
      return next;
    });
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    setVolume(v);
    localStorage.setItem(LS_VOL, String(v));
    if (v > 0 && muted) {
      setMuted(false);
      localStorage.setItem(LS_MUTE, '0');
    }
  };

  const icon = muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';

  return (
    <div className="vn-sound" data-testid="vn-sound">
      <button
        type="button"
        className="vn-sound-btn"
        onClick={toggleMute}
        aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      >
        {icon}
      </button>
      <input
        type="range"
        className="vn-sound-slider"
        min={0}
        max={100}
        value={Math.round((muted ? 0 : volume) * 100)}
        onChange={onVolume}
        aria-label="Громкость"
      />
    </div>
  );
}
