import type { Scene, SceneEffect, Story } from '../types/story';

/**
 * Содержимое новеллы собирается из готовых ассетов в папке `files/`,
 * которая раздаётся Vite как статика (см. publicDir в vite.config.ts).
 *
 * Сейчас это линейный показ всех кадров по порядку сцен + фоновая музыка,
 * которая переключается на границах сцен (и там, где по сценарию музыка
 * меняется внутри сцены). Текст/озвучка будут добавлены позже звуковыми
 * файлами — поэтому реплик на экране нет.
 */

const DIR: Record<number, string> = {
  0: 'Сцена 0',
  1: 'Сцена 1',
  2: 'Сцена 2',
  3: 'Сцена 3',
  4: 'Сцена 4',
  5: 'Сцена 5',
  6: '6 сцена',
  7: '7 сцена',
  8: '8 сцена',
  9: '9 сцена',
  10: '10 сцена',
  11: '11 сцена',
  12: '12 сцена',
  13: '13 сцена',
  14: '14 сцена',
  15: '15 сцена',
  16: '16 сцена',
};

/** Путь к аудио внутри папки сцены. */
const au = (n: number, name: string) => `/${DIR[n]}/${name}.mp3`;

/** Имена кадров «A кадр.png» … «B кадр.png». */
const kadr = (a: number, b: number, ext = 'png') =>
  Array.from({ length: b - a + 1 }, (_, i) => `${a + i} кадр.${ext}`);

type SceneDef = {
  /** Номер сцены. */
  n: number;
  /** Имена файлов-кадров внутри папки сцены, по порядку. */
  frames: string[];
  /** Музыка, выставляемая на 1-based индексе кадра (между ними играет предыдущая). */
  music?: Record<number, string | null>;
  /** Озвучка поверх музыки на 1-based индексе кадра. */
  voice?: Record<number, string>;
  /** Автопереход (мс) на 1-based индексе кадра; кадр можно пролистнуть раньше клавишей. */
  auto?: Record<number, number>;
};

const SCENES: SceneDef[] = [
  {
    n: 0,
    frames: kadr(1, 5),
    music: { 1: au(0, '1 сцена фоновая музыка') },
    // Голос мамы (одна дорожка) играет поверх музыки всю сцену.
    voice: { 1: au(0, 'Голос_Мамы') },
    // Тайминги кадров по сценарию (последний кадр — кнопка «НАЧАТЬ ИГРУ»).
    auto: { 1: 10000, 2: 13000, 3: 10000, 4: 14000 },
  },
  { n: 1, frames: kadr(1, 13), music: { 1: au(1, 'Фоновый звук 1') } },
  { n: 2, frames: kadr(1, 11), music: { 1: au(2, 'Сцена 2 - фоновая музыка') } },
  {
    n: 3,
    frames: [
      ...kadr(1, 5),
      '1 картинка.png',
      '1 Ответ.jpg',
      '2 картинка.png',
      '2 ответ.jpg',
      '3 картинка.png',
      '3 ответ.jpg',
      '4 картинка.png',
      '4 ответ.jpg',
      '5 картинка.png',
      '5 ответ.JPG',
      '6 картинка.png',
      '6 ответ.JPG',
    ],
    music: {
      1: au(3, 'Сцена 3 - Фоновая музыка 1'),
      6: au(3, 'Сцена 3 - Фоновая музыка 2'),
    },
  },
  { n: 4, frames: kadr(1, 5), music: { 1: au(4, 'Сцена 4 - Фоновая музыка ') } },
  { n: 5, frames: kadr(1, 10), music: { 1: au(5, 'Сцена 5 Фоновый звук') } },
  {
    n: 6,
    frames: kadr(1, 10),
    music: {
      1: au(6, 'Сцена 6 - Фоновая музыка 1 '),
      4: au(6, 'Сцена 6 - Фоновая музыка 2'),
    },
  },
  {
    n: 7,
    frames: kadr(1, 14),
    music: {
      1: au(7, 'Сцена 7 - Фоновая музыка 1'),
      3: au(7, 'Сцена 7 - Фоновая музыка 2'),
    },
  },
  { n: 8, frames: kadr(1, 8), music: { 1: au(8, 'Сцена 8 - Фоновая музыка 1') } },
  {
    n: 9,
    frames: kadr(1, 4),
    music: {
      1: au(9, '16 сцена фоновая музыка 1'),
      4: au(9, '16 сцена фоновая музыка 2'),
    },
  },
  {
    n: 10,
    frames: kadr(1, 7),
    music: {
      1: au(10, 'Страх толпы'),
      4: au(10, '10 Сцена Фоновая музыка'),
    },
  },
  {
    n: 11,
    frames: [...kadr(1, 18), '19 кадр.jpeg'],
    music: { 1: au(11, '11 Сцена Фоновая музыка') },
  },
  { n: 12, frames: kadr(1, 3), music: { 1: au(12, 'Сцена 12 - Фоновая музыка') } },
  {
    n: 13,
    frames: kadr(1, 5),
    music: {
      1: au(13, '13 Сцена Фоновая музыка 1'),
      5: au(13, '13 Сцена Фоновая музыка 2'),
    },
  },
  { n: 14, frames: kadr(1, 12), music: { 1: au(14, '14 Сцена Фоновая музыка') } },
  {
    n: 15,
    // в папке нет «10 кадр», поэтому 1–9, затем 11–21
    frames: [...kadr(1, 9), ...kadr(11, 21)],
    music: {
      1: au(15, '15 Сцена Фоновая музыка 1'),
      13: au(15, '15 Сцена Фоновая музыка 2'),
    },
  },
  {
    n: 16,
    frames: ['1 кадр.png', '2 кадр.png', '2 кадр(1).png', '3 кадр.png'],
    music: { 1: au(16, '16 сцена фоновая музыка') },
  },
];

// Ken Burns — один эффект на всю сцену (папку), кадры внутри плавно сменяют друг друга.
const EFFECTS: SceneEffect[] = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];

// Кнопки-действия по сценарию (id кадра → кнопка).
const BUTTONS: Record<string, { label: string; nextSceneId: string; delayMs?: number }> = {
  s0_5: { label: 'НАЧАТЬ ИГРУ', nextSceneId: 's1_1', delayMs: 9000 },
};

function buildScenes(defs: SceneDef[]): Scene[] {
  // Плоский список id всех кадров, чтобы связать nextSceneId по порядку.
  const ids: string[] = [];
  for (const def of defs) {
    def.frames.forEach((_, i) => ids.push(`s${def.n}_${i + 1}`));
  }

  const scenes: Scene[] = [];
  let flatIndex = 0;

  for (const def of defs) {
    def.frames.forEach((file, i) => {
      const id = `s${def.n}_${i + 1}`;
      const next = ids[flatIndex + 1];
      const scene: Scene = {
        id,
        src: `/${DIR[def.n]}/${file}`,
        effect: EFFECTS[def.n % EFFECTS.length],
        nextSceneId: next, // у самого последнего кадра будет undefined → экран «Конец»
      };
      const music = def.music?.[i + 1];
      if (music !== undefined) scene.music = music;
      const voice = def.voice?.[i + 1];
      if (voice !== undefined) scene.voice = voice;
      const auto = def.auto?.[i + 1];
      if (auto !== undefined) scene.autoAdvanceMs = auto;
      if (BUTTONS[id]) scene.button = BUTTONS[id];
      // Кадры-«картинки» квиза (сцена 3) — кнопка «Ответ» внизу.
      if (file.includes('картинка')) scene.actionLabel = 'Ответ';

      // ЗТМ по сценарию стоит в конце сцен 1–15: последний кадр сцены,
      // у которого есть следующая сцена, уводим в чёрный затемнением.
      const isLastFrame = i === def.frames.length - 1;
      if (isLastFrame && def.n !== 0 && next) scene.fadeOut = true;

      scenes.push(scene);
      flatIndex += 1;
    });
  }

  return scenes;
}

export const story: Story = {
  startSceneId: 's0_1',
  scenes: buildScenes(SCENES),
};

export type SceneMenuItem = {
  n: number;
  label: string;
  /** id первого кадра сцены — точка входа. */
  firstId: string;
  /** превью (первый кадр сцены). */
  thumb: string;
};

/** Список сцен для стартового меню навигации. */
export const sceneMenu: SceneMenuItem[] = SCENES.map((def) => ({
  n: def.n,
  label: `Сцена ${def.n}`,
  firstId: `s${def.n}_1`,
  thumb: `/${DIR[def.n]}/${def.frames[0]}`,
}));

export function getSceneById(id: string) {
  return story.scenes.find((scene) => scene.id === id);
}

export function getStartScene() {
  return getSceneById(story.startSceneId);
}

/** id предыдущего кадра в общем порядке (для перелистывания назад). */
export function getPrevSceneId(id?: string): string | undefined {
  if (!id) return undefined;
  const i = story.scenes.findIndex((scene) => scene.id === id);
  return i > 0 ? story.scenes[i - 1].id : undefined;
}
