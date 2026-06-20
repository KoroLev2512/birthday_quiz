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

/** Путь к озвучке/доп. звукам в подпапке «Звуки» сцены 1. */
const z1 = (name: string) => `/${DIR[1]}/Звуки/${name}.mp3`;

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
  /** Звуки на входе в кадр (1-based индекс кадра). Число = пауза в мс. */
  sfx?: Record<number, (string | number)[]>;
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
  {
    n: 1,
    // По обновлённому сценарию — кадры 1–12, ЗТМ после 12 (файл «13 кадр» не используется).
    frames: kadr(1, 12),
    // На 1 кадре глушим музыку/голос сцены 0; «Фоновый звук 1» (дом) — с 8 кадра.
    music: { 1: null, 8: au(1, 'Фоновый звук 1') },
    // Полная последовательность по сценарию: реплики/Телевизор/Волшебство — из «Звуки»,
    // эффекты — из папки сцены. Число = пауза в мс.
    sfx: {
      1: [
        au(1, 'Сметана1'),
        z1('Маша, мне надоело смотреть это все по кругу! Дай сюда!'),
        z1('Телевизор'),
        au(1, 'Пацаны'),
      ],
      2: [
        z1('Фу, как можно смотреть это убежище. А ну отдай… и попкорн тоже'),
        z1('Телевизор'),
        au(1, 'Сметана2'),
      ],
      3: [
        z1('Маша, у меня для тебя подарок на День Рождения. Хочешь посмотреть_'),
        z1('Так, оно же завтра… Ну ладно, давай'),
      ],
      4: [z1(' Вауу, братишка, спа…')],
      5: [au(1, 'Смех'), z1('Ах ты…А ну стой!'), au(1, 'Лай1')],
      7: [z1('Стой.. стой… смотри… Это же дом, куда мы лазили в детстве')],
      9: [z1('Ух, я без тебя бы не забралась _ Конеееш.. блин')],
      10: [z1('Тут ничего не поменялось'), 2000, z1('А это что_'), au(1, 'Лай2')],
      11: [
        z1('Волшебство'),
        z1('Может кто-то Airpodсы оставил_ Неважно, я забираю это! _ Мы вместе это нашли! _ Это я нашла!'),
      ],
      12: [z1('А я тебя сюда привел!'), au(1, 'Лай3'), au(1, 'Взрыв')],
    },
    // Тайминги кадров по сценарию (последний кадр авто-уводит в ЗТМ).
    auto: {
      1: 32000,
      2: 19000,
      3: 8000,
      4: 2000,
      5: 6000,
      6: 3000,
      7: 5000,
      8: 5000,
      9: 5000,
      10: 7000,
      11: 7000,
      12: 7000,
    },
  },
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

// Звуки на ЗТМ (id кадра → звук с задержкой после затемнения).
const FADE_SFX: Record<string, { src: string; delayMs?: number }> = {};

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
      const sfx = def.sfx?.[i + 1];
      if (sfx !== undefined) scene.sfx = sfx;
      const auto = def.auto?.[i + 1];
      if (auto !== undefined) scene.autoAdvanceMs = auto;
      if (BUTTONS[id]) scene.button = BUTTONS[id];
      if (FADE_SFX[id]) scene.fadeOutSfx = FADE_SFX[id];
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
