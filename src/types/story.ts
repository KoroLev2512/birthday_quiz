export type SceneEffect = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

export type SceneChoice = {
  label: string;
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
  type?: 'image' | 'video';
  src: string;
  effect?: SceneEffect;
  speaker?: string;
  text?: string;
  choices?: SceneChoice[];
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
  /** One-shot sound effects played when the scene appears. */
  sfx?: string[];
  /** Voice line played when the scene appears (persists until the music changes). */
  voice?: string;
  /** Sound played when a wrong quiz answer is chosen. */
  wrongSfx?: string;
};

export type Story = {
  scenes: Scene[];
  startSceneId: string;
};
