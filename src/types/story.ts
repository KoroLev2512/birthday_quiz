export type SceneEffect = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

/** Одиночная кнопка-действие поверх кадра (например «НАЧАТЬ ИГРУ»). */
export type SceneButton = {
  label: string;
  nextSceneId: string;
  /** Задержка перед появлением кнопки (мс). */
  delayMs?: number;
  /** Показать кнопку после окончания очереди sfx текущего кадра. */
  afterSfx?: boolean;
};

export type SceneChoice = {
  label: string;
  /** Звук при выборе варианта (проигрывается перед переходом). */
  sfx?: string;
  /** Where this choice leads. Omitted for a wrong quiz answer that stays on the scene. */
  nextSceneId?: string;
  /**
   * Quiz answer correctness:
   *  - true  → correct answer, advances to nextSceneId
   *  - false → wrong answer, buzzes and stays on the question
   *  - undefined → neutral (flavor) choice, just advances
   */
  correct?: boolean;
};

export type Scene = {
  id: string;
  type?: 'image' | 'video' | 'credits';
  src: string;
  effect?: SceneEffect;
  speaker?: string;
  text?: string;
  choices?: SceneChoice[];
  /** Расположение кнопок выбора: в строку (налево/направо) или столбиком. */
  choiceLayout?: 'row' | 'column';
  /** Кнопка-действие внизу по центру; блокирует переход по клику по фону. */
  button?: SceneButton;
  /** Подпись кнопки внизу (например «Ответ»); не блокирует переход — просто листает вперёд. */
  actionLabel?: string;
  /** Звук по кнопке actionLabel; если задан — клик проигрывает звук, а не листает кадр. */
  actionSfx?: string;
  /** Сценарный ЗТМ: уход с этого кадра делается плавным затемнением в чёрный. */
  fadeOut?: boolean;
  /** Звук, который проигрывается во время ЗТМ (с задержкой delayMs после затемнения). */
  fadeOutSfx?: { src: string; delayMs?: number };
  /** When true, wrong choices (correct === false) buzz and keep the player on the scene. */
  quiz?: boolean;
  autoAdvanceMs?: number;
  nextSceneId?: string;

  // --- audio ---
  /**
   * Background music track:
   *  - string    → switch to this track (loops)
   *  - null      → stop the music
   *  - undefined → keep whatever is currently playing
   * Changing music (string or null) also stops any active voice line.
   */
  music?: string | null;
  /** Звуки на входе в кадр, по очереди. Число в массиве = пауза в мс между звуками. */
  sfx?: (string | number)[];
  /** Voice line played when the scene appears (persists until the music changes). */
  voice?: string;
  /** Sound played when a wrong quiz answer is chosen. */
  wrongSfx?: string;
  /** Имена для экрана титров (type === 'credits'). */
  credits?: string[];
};

export type Story = {
  scenes: Scene[];
  startSceneId: string;
};
