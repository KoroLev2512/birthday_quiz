import type { Scene, SceneChoice, SceneEffect, Story } from '../types/story';
import { CREDITS_CAST } from './credits';

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

/** Путь к аудио внутри папки сцены (NFC — иначе на macOS пути не совпадут с файлами). */
const au = (n: number, name: string) => `/${DIR[n]}/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/доп. звукам в подпапке «Звуки» сцены 1. */
const z1 = (name: string) => `/${DIR[1]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/доп. звукам в подпапке «Звуки» сцены 2. */
const z2 = (name: string) => `/${DIR[2]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 5. */
const z5 = (name: string) => `/${DIR[5]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к ассетам мини-игры в подпапке «Игра» сцены 5. */
const g5 = (name: string) => `/${DIR[5]}/Игра/${name.normalize('NFC')}`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 6. */
const z6 = (name: string) => `/${DIR[6]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 7. */
const z7 = (name: string) => `/${DIR[7]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 8. */
const z8 = (name: string) => `/${DIR[8]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 9. */
const z9 = (name: string) => `/${DIR[9]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 10. */
const z10 = (name: string) => `/${DIR[10]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 11. */
const z11 = (name: string) => `/${DIR[11]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 12. */
const z12 = (name: string) => `/${DIR[12]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 14. */
const z14 = (name: string) => `/${DIR[14]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Путь к озвучке/музыке в подпапке «Звуки» сцены 15. */
const z15 = (name: string) => `/${DIR[15]}/Звуки/${name.normalize('NFC')}.mp3`;

/** Имена кадров «A кадр.png» … «B кадр.png». */
const kadr = (a: number, b: number, ext = 'png') =>
  Array.from({ length: b - a + 1 }, (_, i) => `${a + i} кадр.${ext}`);

const S16_PAPA = 'Папа';

const g3 = (name: string) => `/${DIR[3]}/${name.normalize('NFC')}`;

/** Квиз суда на 5-м кадре: картинки и ответы поверх зала. */
const S3_QUIZ = [
  { image: g3('1 картинка.png'), answer: g3('1 Ответ.jpg') },
  { image: g3('2 картинка.png'), answer: g3('2 ответ.jpg') },
  { image: g3('3 картинка.png'), answer: g3('3 ответ.jpg') },
  { image: g3('4 картинка.png'), answer: g3('4 ответ.jpg') },
  { image: g3('5 картинка.png'), answer: g3('5 ответ.JPG') },
  { image: g3('6 картинка.png'), answer: g3('6 ответ.JPG') },
];

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
  /** Переопределение nextSceneId (1-based индекс кадра → id следующего кадра). */
  next?: Record<number, string>;
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
    music: { 1: null, 8: z1('Фоновый звук 1') },
    // Вся озвучка и эффекты — только из подпапки «Звуки». Число = пауза в мс.
    sfx: {
      1: [
        z1('Сметана'),
        z1('Маша, мне надоело смотреть это все по кругу! Дай сюда!'),
        z1('Телевизор'),
        z1('Пацаны'),
      ],
      2: [
        z1('Фу, как можно смотреть это убежище. А ну отдай… и попкорн тоже'),
        z1('Телевизор'),
        z1('Сметана'),
      ],
      3: [
        z1('Маша, у меня для тебя подарок на День Рождения. Хочешь посмотреть_'),
        z1('Так, оно же завтра… Ну ладно, давай'),
      ],
      4: [z1(' Вауу, братишка, спа…')],
      5: [z1('Смех'), z1('Ах ты…А ну стой!'), z1('Лай')],
      7: [z1('Стой.. стой… смотри… Это же дом, куда мы лазили в детстве')],
      9: [z1('Ух, я без тебя бы не забралась _ Конеееш.. блин')],
      10: [z1('Тут ничего не поменялось'), 2000, z1('А это что_'), z1('Лай')],
      11: [
        z1('Волшебство'),
        z1('Может кто-то Airpodсы оставил_ Неважно, я забираю это! _ Мы вместе это нашли! _ Это я нашла!'),
      ],
      12: [z1('А я тебя сюда привел!'), z1('Лай')],
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
      12: 5000,
    },
  },
  {
    n: 2,
    frames: kadr(1, 9),
    music: { 1: z1('Сцена 2 - фоновая музыка') },
    sfx: {
      1: [
        z2('Так, значит эти двое провели здесь всю ночь_'),
        z2('Дааа, это полное безобразие. Я сегодня с утра занималась своими обычными делами…'),
      ],
      2: [z2('всю морковку мне отлежали')],
      3: [
        z2(
          'Я готовила ежеденельную летопись для купеческой культуры и искала хлопцов для Промысел Night.',
        ),
      ],
      4: [z2('из чего теперь аджику делать ')],
      5: [
        z2('Как вдруг спускаюсь мужу за вареньем, а тут лежат эти два молодца.'),
        z2('Ясно… Вы кто_'),
      ],
      8: [
        z2(
          'Товарищ офицер, немедленно выведите этих крестьян из нашего дома. Камилла, где мое варенье и хачапури_',
        ),
      ],
      9: [
        z2(
          's2-v1',
        ),
      ],
    },
    auto: { 1: 10000, 2: 4000, 3: 6000, 4: 3000, 5: 7000, 8: 8000 },
  },
  {
    n: 3,
    frames: kadr(1, 5),
    music: {
      1: au(3, 'Сцена 3 - Фоновая музыка 1'),
      5: au(3, 'Сцена 3 - Фоновая музыка 2'),
    },
  },
  {
    n: 4,
    frames: kadr(1, 5),
    music: { 1: au(4, 'Сцена 4 - Фоновая музыка ') },
    sfx: {
      2: [au(4, 'Эй, вы дорогу загородили!')],
      3: [au(4, 'Монатик')],
      4: [au(4, 'Вам помочь_ Я еду на свадьбу Императрицы на Дворцовой площади. Поехали со мной!')],
      5: [au(4, 'Монатик')],
    },
    auto: { 1: 5000, 2: 3000, 3: 10000, 4: 7000, 5: 10000 },
  },
  {
    n: 5,
    frames: [...kadr(1, 9), '10 кадр.jpg'],
    music: { 2: z5('Сцена 5 Фоновый звук') },
    sfx: {
      1: [z5('Лошадь')],
      2: [z5('Ну вот, здесь повеселее! Пойдемте, посмотрим, что тут есть!')],
      3: [
        z5(
          's5-v2',
        ),
      ],
      4: [g5('Золото_кон.mp3')],
      5: [g5('Нойз_кон.mp3')],
      6: [g5('Дмитриенко_кон.mp3')],
      7: [g5('Свинки_кон.mp3')],
      8: [
        z5(
          's5-v1',
        ),
      ],
      9: [z5('Спасибо, молодой человек! Вы настоящий джентльмен!')],
    },
    auto: { 1: 5000, 2: 5000, 10: 3000 },
  },
  {
    n: 6,
    frames: kadr(1, 10),
    music: {
      1: z6('Сцена 6 - Фоновая музыка 1 '),
      4: z6('Сцена 6 - Фоновая музыка 2'),
    },
    sfx: {
      1: [z6('Именем ее Величества, стоять!')],
      3: [z6('Монатик'), z6('Проходите, очаровательная леди!')],
      5: [z6('Генерал, приветствую вас. Вы кого-то сопровождаете_')],
      6: [z6('Да, это мои новые товарищи! Мы раньше… служили (врет)')],
      7: [z6('Служили… где_')],
      8: [z6('Да к это… Финов под полтавой разгромили')],
      9: [z6('Понятно. Вы никогда не умели врать, КАЛЕГА!')],
      10: [z6('Псс..Вы можете пройти через кухню!')],
    },
    auto: { 1: 5000, 3: 15000, 4: 5000, 5: 5000, 6: 5000, 7: 5000, 8: 4000, 9: 6000, 10: 5000 },
  },
  {
    n: 7,
    frames: kadr(1, 14),
    music: {
      1: z7('Сцена 7 - Фоновая музыка 1'),
      3: z7('Сцена 7 - Фоновая музыка 2'),
    },
    sfx: {
      1: [z7('На приеме у ее Величества соберутся вся знать Империи и ключевые иностранные делегаты.')],
      2: [
        z7(
          's7-v1',
        ),
      ],
      14: [z7('Отлично! Выносите блюда в главный зал!')],
    },
    // Кадры-ответы (красивые 4/7/10 и некрасивые 5/8/11) показываются 3 сек и ведут к следующему вопросу.
    auto: { 1: 1000, 4: 3000, 5: 3000, 7: 3000, 8: 3000, 10: 3000, 11: 3000, 14: 1000 },
    next: {
      4: 's7_6',
      5: 's7_6',
      7: 's7_9',
      8: 's7_9',
      10: 's7_12',
      11: 's7_12',
    },
  },
  {
    n: 8,
    frames: kadr(1, 8),
    music: { 1: z8('Сцена 8 - Фоновая музыка 1') },
    sfx: {
      1: [
        z8(
          's8-v1',
        ),
      ],
      2: [z8('Слава Императрице!')],
      3: [
        z8(
          's8-v3',
        ),
      ],
      4: [z8('Тряпка')],
      5: [
        z8('Восхищение толпы'),
        z8('Этот символ посвящен братьям и сестрам – людям, которые всегда будут ближе всех!'),
      ],
      6: [
        z8(
          's8-v2',
        ),
      ],
      7: [z8('Да будет пир!')],
      8: [z8('Удар1'), z8('Удар2')],
    },
    auto: { 1: 10000, 2: 3000, 3: 17000, 4: 3000, 5: 12000, 6: 10000, 7: 3000, 8: 2000 },
  },
  {
    n: 9,
    frames: kadr(1, 4),
    music: {
      1: z9('9 Сцена Фоновая музыка 1'),
      3: z9('9 Сцена Фоновая музыка 1'),
    },
    sfx: {
      2: [
        z9(
          's9-v1',
        ),
      ],
      4: [
        z9(
          's9-v2',
        ),
      ],
    },
    auto: { 1: 5000, 2: 10000, 3: 5000, 4: 17000 },
  },
  {
    n: 10,
    frames: kadr(1, 7),
    music: {
      1: z10('Страх толпы'),
      4: z10('10 Сцена Фоновая музыка'),
    },
    sfx: {
      2: [z10('Появление')],
      3: [z10('Стекло')],
      4: [z10('Солдаты')],
      5: [z10('Опять вы, разбойники!')],
      6: [z10('Скорее!'), z10('Бегите сюда!')],
    },
    auto: { 1: 3000, 2: 3000, 3: 3000, 4: 5000, 5: 3000, 6: 5000, 7: 5000 },
  },
  {
    n: 11,
    frames: [...kadr(1, 18), '19 кадр.jpeg'],
    music: { 1: z11('11 Сцена Фоновая музыка') },
    sfx: {
      3: [z11('Охрана')],
      6: [
        z11(
          'Эй, вы мне на ногу наступили! Вы куда торопитесь_ Зажигайте со мной! Текилу или сразу кальян_ Куда вы…_',
        ),
      ],
      7: [z11('Охрана')],
      11: [z11('Охрана')],
      14: [z11('Охрана')],
    },
    auto: { 1: 8000, 4: 3000, 6: 10000, 9: 3000, 12: 3000, 15: 3000, 16: 3000, 17: 3000, 18: 3000, 19: 3000 },
    // Кадр 6 — правильный путь, линейно ведём на 8-й (минуя тупик 7).
    next: { 6: 's11_8' },
  },
  {
    n: 12,
    frames: kadr(1, 3),
    music: { 1: z12('Сцена 12 - Фоновая музыка') },
    sfx: {
      1: [
        z12('Ну вот, опять бегают тут, ублюдки'),
        z12('Да уж, кстати ты сдала машину и питон_'),
        z12(
          's12-v1',
        ),
        z12('Да, я тоже так сделала. Ой… а вы чего тут_ Вам нужно помочь_'),
      ],
      2: [z12('Пропустите, пожалуйста')],
      3: [z12('Здравствуйте, хотите я расскажу вам как завайбкодить пропускную систему_')],
    },
  },
  {
    n: 13,
    frames: kadr(1, 5),
    music: {
      1: au(13, '13 Сцена Фоновая музыка 1'),
      5: au(13, '13 Сцена Фоновая музыка 2'),
    },
  },
  {
    n: 14,
    frames: kadr(1, 12),
    music: { 1: z14('14 Сцена Фоновая музыка') },
    sfx: {
      2: [z14('Схватите их!')],
      3: [z14('Я буду мясо и виски, спасибо!')],
      4: [z14('Эй, я что похож на поручень_')],
      5: [z14('Зачем вам эта статуэтка_')],
      6: [
        z14('Да, она принадлежит нам! Это символ нашей футбольно-волейбольной команды Барс!'),
      ],
      7: [z14('Кто вы такие_ Мы ждем объяснений.')],
      8: [
        z14('Расскажите моим людям, ваши секреты и пусть второй из вас их нам расскажет!'),
      ],
      9: [
        z14('Простите! Вы настоящие брат и сестра! Забирайте и возвращайтесь скорее домой!'),
      ],
      10: [z14('Прямо в девяточку! Да Динамо чемпион! Ой… простите! Привет, ребята!')],
      11: [z14('Взрыв дирижабля 1')],
      12: [z14('Взрыв дерижабля 2')],
    },
    auto: { 5: 3000, 6: 6000, 10: 5000, 11: 6000, 12: 5000 },
    next: { 2: 's14_5' },
  },
  {
    n: 15,
    // в папке нет «10 кадр», поэтому 1–9, затем 11–21
    frames: [...kadr(1, 9), ...kadr(11, 21)],
    music: {
      1: z15('15 Сцена Фоновая музыка 1'),
      14: z15('15 Сцена Фоновая музыка 2'),
    },
    sfx: {
      1: [z15('Давайте руку!')],
      2: [z15('Скорее! Я знаю, где статуэтка!')],
      3: [z15('Вот это да! Сделаю из этого сережки! Буду самая красивая на деревне!')],
      4: [z15('Лошадь'), z15('Стой, отдай нам эту статуэтку! Она очень важна для Матвея и Маши!')],
      5: [
        z15('Пожалуйста, гражданка! Отдайте нам эту статуэтку.'),
        z15('Именем ее Величества! Стоять!'),
      ],
      6: [z15('Солдаты'), z15('Ну вот вы и попались!')],
      7: [z15('Сердцебиение'), z15('Вот вы и одни!'), z15('Они не одни!')],
      9: [z15('Мстители'), z15('Труба'), z15('Ваше величество!')],
      10: [z15('Опустите оружия!'), z15('Что здесь происходит_')],
      11: [z15('Им просто нужно вернуться домой!'), z15('Мы должны им помочь!')],
      12: [z15('Отпустите их!'), z15(' В добрый путь, друзья!')],
      14: [z15('Это тебе! ')],
      15: [z15('До встречи, Мотя!')],
      18: [z15('Но почему_'), z15('Но почему_(1)')],
      19: [
        z15(
          's15-v1',
        ),
        z15('Лай'),
      ],
      20: [z15('Волшебство')],
    },
    auto: {
      1: 3000,
      2: 2000,
      3: 6000,
      4: 5000,
      5: 6000,
      6: 4000,
      7: 10000,
      8: 3000,
      9: 27000,
      10: 6000,
      11: 5000,
      12: 5000,
      13: 3000,
      14: 3000,
      15: 2000,
      16: 3000,
      17: 3000,
      18: 3000,
      19: 15000,
      20: 3000,
    },
  },
  {
    n: 16,
    frames: ['1 кадр.png', '2 кадр.png', '3 кадр.png'],
    music: { 1: au(16, '16 сцена фоновая музыка') },
    sfx: {
      1: [au(16, 'Сестренка и братик!')],
      2: [au(16, 'С Днем Рождения!')],
    },
    voice: {
      3: au(16, S16_PAPA),
    },
    auto: { 1: 1000 },
  },
];

// Ken Burns — один эффект на всю сцену (папку), кадры внутри плавно сменяют друг друга.
const EFFECTS: SceneEffect[] = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];

// Кнопки-действия по сценарию (id кадра → кнопка).
const BUTTONS: Record<string, { label: string; nextSceneId: string; delayMs?: number; afterSfx?: boolean }> = {
  s0_5: { label: 'НАЧАТЬ ИГРУ', nextSceneId: 's1_1', delayMs: 9000 },
  s5_3: { label: 'СЫГРАТЬ', nextSceneId: 's5_4', afterSfx: true },
  s7_2: { label: 'ГОТОВИТЬ', nextSceneId: 's7_3', afterSfx: true },
  s11_3: { label: 'Назад', nextSceneId: 's11_2' },
  s11_7: { label: 'Назад', nextSceneId: 's11_6' },
  s11_11: { label: 'Назад', nextSceneId: 's11_10' },
  s11_14: { label: 'Назад', nextSceneId: 's11_13' },
  s14_3: { label: 'Назад', nextSceneId: 's14_1' },
  s14_4: { label: 'Назад', nextSceneId: 's14_1' },
  s14_9: { label: 'ВЗЯТЬ СТАТУЭТКУ', nextSceneId: 's14_10', afterSfx: true },
  s15_16: { label: 'ВЕРНУТЬСЯ ДОМОЙ', nextSceneId: 's15_17' },
};

// Варианты выбора на кадре (все ведут на nextSceneId).
const CHOICES: Record<string, SceneChoice[]> = {
  s2_6: [
    { label: 'Что здесь происходит?', nextSceneId: 's2_7a' },
    { label: 'Где мы?', nextSceneId: 's2_7b' },
    { label: 'Нас зовут Матвей и Маша', nextSceneId: 's2_7c' },
  ],
  s12_1_pick: [
    { label: 'Вы видели статуэтку?', nextSceneId: 's12_1a' },
    { label: 'Вы видели мужчину в черном?', nextSceneId: 's12_1b' },
  ],
  s14_1: [
    { label: 'Налево', nextSceneId: 's14_2' },
    { label: 'По центру', nextSceneId: 's14_3' },
    { label: 'Направо', nextSceneId: 's14_4' },
  ],
  s14_7: [
    { label: 'Мы семья! Нам нужно вернуться домой', nextSceneId: 's14_8' },
    { label: 'Она моя сестра! Отпустите его!', nextSceneId: 's14_8' },
    { label: 'Он мой брат! Отпустите ее!', nextSceneId: 's14_8' },
  ],
  // Сцена 7 — кулинарный квиз. Q1–Q3: правильный → красивый кадр, неправильный → некрасивый.
  s7_3: [
    { label: 'Творог + Яйцо + Сахар', nextSceneId: 's7_4', correct: true },
    { label: 'Сахар + Соль', nextSceneId: 's7_5', correct: false },
    { label: 'Ванилин + Мука', nextSceneId: 's7_5', correct: false },
  ],
  s7_6: [
    { label: 'Лосось + Авокадо', nextSceneId: 's7_8', correct: false },
    { label: 'Рис', nextSceneId: 's7_7', correct: true },
    { label: 'Соус', nextSceneId: 's7_8', correct: false },
  ],
  s7_9: [
    { label: 'Кукурузный крахмал', nextSceneId: 's7_11', correct: false },
    { label: 'Вода + растительное масло', nextSceneId: 's7_11', correct: false },
    { label: 'Рисовая мука + Сахарная пудра', nextSceneId: 's7_10', correct: true },
  ],
  // Q4–Q5: без кадров-ответов — неправильный подсвечивается и остаёшься на вопросе.
  s7_12: [
    { label: 'вилкой с двумя зубцами', nextSceneId: 's7_13', correct: true },
    { label: 'вилкой с тремя зубцами', correct: false },
    { label: 'руками', correct: false },
  ],
  s7_13: [
    { label: 'вилкой с двумя зубцами', correct: false },
    { label: 'вилкой с тремя зубцами', correct: false },
    { label: 'Руками', nextSceneId: 's7_14', correct: true },
  ],
  s6_2: [
    { label: 'Вижу вы совсем один… Может вам нужна связка?', nextSceneId: 's6_3' },
    { label: 'Как вам идет эта форма! Вы как Андрей Болконский!', nextSceneId: 's6_3' },
    { label: 'Какая у вас огромная шпага! Вы наверняка разбиваете ей сердца!', nextSceneId: 's6_3' },
  ],
  s5_9: [
    {
      label: 'Вы невероятно красивая!',
      nextSceneId: 's5_10',
      sfx: z5('Что_ А… Спасибо!'),
    },
    {
      label: 'Мы с вами как лучший певица и танцор!',
      nextSceneId: 's5_10',
      sfx: z5('Ну где-нибудь в альтернативной вселенной да!'),
    },
    {
      label: 'Вы как будто с открытки!',
      nextSceneId: 's5_10',
      sfx: z5('Хаха надеюсь, вы как-нибудь придете на мою выставку!'),
    },
  ],
  s11_2: [
    { label: 'Налево', nextSceneId: 's11_4' },
    { label: 'Направо', nextSceneId: 's11_3' },
  ],
  s11_5: [
    { label: 'Налево', nextSceneId: 's11_3' },
    { label: 'Направо', nextSceneId: 's11_6' },
  ],
  s11_8: [
    { label: 'Налево', nextSceneId: 's11_9' },
    { label: 'Направо', nextSceneId: 's11_9' },
  ],
  s11_10: [
    { label: 'Налево', nextSceneId: 's11_12' },
    { label: 'Направо', nextSceneId: 's11_11' },
  ],
  s11_13: [
    { label: 'Налево', nextSceneId: 's11_14' },
    { label: 'Направо', nextSceneId: 's11_15' },
  ],
};

// Кадры с кнопками «Налево» / «Направо» в одну строку.
const CHOICE_LAYOUT: Record<string, 'row'> = {
  s11_2: 'row',
  s11_5: 'row',
  s11_8: 'row',
  s11_10: 'row',
  s11_13: 'row',
  s14_1: 'row',
};

// Кадры мини-игры «Угадай мелодию» (сцена 5): кнопка «Ответ» проигрывает полную мелодию.
const S5_GAME_ACTIONS: Record<string, string> = {
  s5_4: 'Золото.mp3',
  s5_5: 'Нойз.mp3',
  s5_6: 'Дмитриенко.mp3',
  s5_7: 'Свинки.mp3',
};

// Звуки на ЗТМ (id кадра → звук с задержкой после затемнения).
const FADE_SFX: Record<string, { src: string; delayMs?: number }> = {
  s1_12: { src: z1('Взрыв') },
  s2_9: { src: z1('ЗТМ') },
  s10_7: { src: z10('ЗТМ') },
  s15_20: { src: z15('ЗТМ') },
};

// Текст вопроса на кадре (id → текст).
const TEXT: Record<string, string> = {
  s7_3: 'Что сначала нужно сделать для приготовления Сырников?',
  s7_6: 'Что сначала нужно сделать для приготовления Поке?',
  s7_9: 'Что сначала нужно сделать для приготовления Моти?',
  s7_12: 'Как правильно есть гребешки?',
  s7_13: 'Как правильно есть завертыши?',
};

// Кадры-квизы (id): неправильный ответ подсвечивается красным, правильный — зелёным.
const QUIZ = new Set<string>(['s7_3', 's7_6', 's7_9', 's7_12', 's7_13']);

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
        nextSceneId: def.next?.[i + 1] ?? next,
      };
      const music = def.music?.[i + 1];
      if (music !== undefined) scene.music = music;
      const voice = def.voice?.[i + 1];
      if (voice !== undefined) scene.voice = voice;
      const sfx = def.sfx?.[i + 1];
      if (sfx !== undefined) scene.sfx = sfx;
      const auto = def.auto?.[i + 1];
      if (auto !== undefined) scene.autoAdvanceMs = auto;
      if (TEXT[id]) scene.text = TEXT[id];
      if (QUIZ.has(id)) scene.quiz = true;
      if (BUTTONS[id]) scene.button = BUTTONS[id];
      if (CHOICES[id]) scene.choices = CHOICES[id];
      if (CHOICE_LAYOUT[id]) scene.choiceLayout = CHOICE_LAYOUT[id];
      if (FADE_SFX[id]) scene.fadeOutSfx = FADE_SFX[id];
      if (S5_GAME_ACTIONS[id]) {
        scene.actionLabel = 'Ответ';
        scene.actionSfx = g5(S5_GAME_ACTIONS[id]);
      }
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

const S2_EXTRA_SCENES: Scene[] = [
  {
    id: 's2_7a',
    src: `/${DIR[2]}/7 кадр.png`,
    effect: EFFECTS[2 % EFFECTS.length],
    sfx: [z2('Вы что так сильно напились_ В Российской Империи нет места пьяницам!')],
    advanceAfterSfx: true,
    nextSceneId: 's2_8',
  },
  {
    id: 's2_7b',
    src: `/${DIR[2]}/7 кадр.png`,
    effect: EFFECTS[2 % EFFECTS.length],
    sfx: [z2('В самом красивом городе нашей Империи, в Санкт-Петербурге!')],
    advanceAfterSfx: true,
    nextSceneId: 's2_8',
  },
  {
    id: 's2_7c',
    src: `/${DIR[2]}/7 кадр.png`,
    effect: EFFECTS[2 % EFFECTS.length],
    sfx: [z2('Так и запишем в протокол. Матвей и Маша нарушили закон Российской Империи.')],
    advanceAfterSfx: true,
    nextSceneId: 's2_8',
  },
];

const S12_EXTRA_SCENES: Scene[] = [
  {
    id: 's12_1_pick',
    src: `/${DIR[12]}/1 кадр.png`,
    effect: EFFECTS[12 % EFFECTS.length],
  },
  {
    id: 's12_1a',
    src: `/${DIR[12]}/1 кадр.png`,
    effect: EFFECTS[12 % EFFECTS.length],
    sfx: [z12('Да кажется она там')],
    advanceAfterSfx: true,
    nextSceneId: 's12_2',
  },
  {
    id: 's12_1b',
    src: `/${DIR[12]}/1 кадр.png`,
    effect: EFFECTS[12 % EFFECTS.length],
    sfx: [z12(' Кажется он побежал туда. Но как он пробежал через охрану_')],
    advanceAfterSfx: true,
    nextSceneId: 's12_2',
  },
];

const S5_EXTRA_SCENES: Scene[] = [
  {
    id: 's5_8_ans',
    src: `/${DIR[5]}/8 кадр.png`,
    effect: EFFECTS[5 % EFFECTS.length],
    embedVideo: g5('Ответ.mp4'),
    embedVideoLoop: false,
    nextSceneId: 's5_9',
  },
  {
    id: 's5_11',
    src: `/${DIR[5]}/11 кадр.png`,
    effect: EFFECTS[5 % EFFECTS.length],
    sfx: [z5('Вы что ищите это_ Я знаю, как туда попасть, идемте.')],
    fadeOut: true,
    nextSceneId: 's6_1',
  },
];

const S9_QUIZ_SCENES: Scene[] = [
  {
    id: 's9_q1',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    music: z9('9 Сцена фоновая музыка 2'),
    text: 'Какой латиноамериканский танец переводится как «праздник» или «веселье», а его ритмы пришли из древних ритуальных танцев?',
    quiz: true,
    choices: [
      { label: 'Самба', nextSceneId: 's9_q2', correct: true },
      { label: 'Пасадобль', correct: false },
      { label: 'Джайв', correct: false },
    ],
  },
  {
    id: 's9_q2',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Как называется самый масштабный и престижный многодневный турнир России, наш внутренний «Блэкпул»?',
    quiz: true,
    choices: [
      { label: 'ROC', nextSceneId: 's9_q3', correct: true },
      { label: 'Russian Masters', correct: false },
      { label: 'Кубок Спартака', correct: false },
    ],
  },
  {
    id: 's9_q3',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Какое главное требование судьи предъявляют к хвату рук (левая рука партнера и правая партнерши) в стандартной программе?',
    quiz: true,
    choices: [
      { label: 'замок из пальцев', correct: false },
      { label: 'расстояние между запястьями', correct: false },
      { label: 'легко касание ладоней без сжатия пальцев', nextSceneId: 's9_q4', correct: true },
    ],
  },
  {
    id: 's9_q4',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Кому принадлежит абсолютный рекорд — 13 побед подряд на Блэкпульском фестивале в Профессионалах латины?',
    quiz: true,
    choices: [
      { label: 'Рикардо Кокки', correct: false },
      { label: 'Михаэль Малитовски', correct: false },
      { label: 'Брайан Ватсон', nextSceneId: 's9_q5', correct: true },
    ],
  },
  {
    id: 's9_q5',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Чьей легендарной фразой «Танцуйте и будьте счастливы!» уже много лет открываются турниры в Кремле?',
    quiz: true,
    choices: [
      { label: 'Станислав Попов', nextSceneId: 's9_2_win', correct: true },
      { label: 'Владимир Марченко', correct: false },
      { label: 'Сергей Рюпин', correct: false },
    ],
  },
  {
    id: 's9_2_win',
    src: `/${DIR[9]}/2 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    sfx: [z9('Вы один из лучших бальных танцоров в мире!')],
    nextSceneId: 's9_3',
    autoAdvanceMs: 1,
  },
];

const S9_IR_QUIZ_SCENES: Scene[] = [
  {
    id: 's9_ir_q1',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    music: z9('9 Сцена фоновая музыка 4'),
    text: 'Как в дипломатии называется официальный документ с выражением позиции или протеста одной страны другой?',
    quiz: true,
    choices: [
      { label: 'коммюнике', correct: false },
      { label: 'дипломатическая нота', nextSceneId: 's9_ir_q2', correct: true },
      { label: 'конвенция', nextSceneId: 's9_ir_q2', correct: true },
    ],
  },
  {
    id: 's9_ir_q2',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Как называется официальный отказ государства от договора (выход из него)?',
    quiz: true,
    choices: [
      { label: 'сегрегация', correct: false },
      { label: 'денонсация', nextSceneId: 's9_ir_q3', correct: true },
      { label: 'аннексия', correct: false },
    ],
  },
  {
    id: 's9_ir_q3',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Как в истории называют войны XIX века, которые Великобритания навязала Китаю, чтобы заставить его открыть порты для торговли конкретным товаром?',
    quiz: true,
    choices: [
      { label: 'Опиумные войны', nextSceneId: 's9_ir_q4', correct: true },
      { label: 'Чайные войны', correct: false },
      { label: 'Шелковые войны', correct: false },
    ],
  },
  {
    id: 's9_ir_q4',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'Как называют формальный юридический повод для объявления войны (например, убийство эрцгерцога в 1914 году)?',
    quiz: true,
    choices: [
      { label: 'Казус белли', nextSceneId: 's9_ir_q5', correct: true },
      { label: 'Статус-кво', correct: false },
      { label: 'Ультиматум', correct: false },
    ],
  },
  {
    id: 's9_ir_q5',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    text: 'В 1989 году СССР расплатился с PepsiCo за газировку военным флотом: 17 подлодками и тремя кораблями. Какой статус из-за этого на пару дней получила компания?',
    quiz: true,
    choices: [
      { label: 'Официальный спонсор ВМФ СССР', correct: false },
      { label: 'Крупнейший частный экспортер вооружения', correct: false },
      { label: 'Шестая военно-морская армия мира', nextSceneId: 's9_4_win', correct: true },
    ],
  },
  {
    id: 's9_4_win',
    src: `/${DIR[9]}/4 кадр.png`,
    effect: EFFECTS[9 % EFFECTS.length],
    sfx: [z9('Вы лучшие в Международных отношениях! Проходите!')],
    fadeOut: true,
    nextSceneId: 's10_1',
    autoAdvanceMs: 1,
  },
];

const CREDITS_SCENE: Scene = {
  id: 'credits',
  type: 'credits',
  src: '',
  credits: CREDITS_CAST,
};

function buildStoryScenes() {
  const scenes = buildScenes(SCENES);

  scenes.push(...S2_EXTRA_SCENES, ...S12_EXTRA_SCENES);

  const s3_5 = scenes.find((scene) => scene.id === 's3_5');
  if (s3_5) s3_5.overlayQuiz = S3_QUIZ;

  const s12_1 = scenes.find((scene) => scene.id === 's12_1');
  if (s12_1) {
    s12_1.advanceAfterSfx = true;
    s12_1.nextSceneId = 's12_1_pick';
  }

  const s12_1_pick = scenes.find((scene) => scene.id === 's12_1_pick');
  if (s12_1_pick) s12_1_pick.choices = CHOICES.s12_1_pick;

  const s14_2 = scenes.find((scene) => scene.id === 's14_2');
  if (s14_2) {
    s14_2.advanceAfterSfx = true;
    s14_2.advanceAfterSfxDelayMs = 1000;
  }

  const s5_10 = scenes.find((scene) => scene.id === 's5_10');
  if (s5_10) {
    s5_10.fadeOut = false;
    s5_10.fadeOutSfx = undefined;
    s5_10.autoAdvanceMs = 3000;
    s5_10.nextSceneId = 's5_11';
  }

  const s5InsertAt = scenes.findIndex((scene) => scene.id === 's5_9');
  if (s5InsertAt !== -1) scenes.splice(s5InsertAt, 0, ...S5_EXTRA_SCENES.filter((s) => s.id === 's5_8_ans'));

  const s5_11InsertAt = scenes.findIndex((scene) => scene.id === 's6_1');
  const s5_11 = S5_EXTRA_SCENES.find((s) => s.id === 's5_11');
  if (s5_11InsertAt !== -1 && s5_11) scenes.splice(s5_11InsertAt, 0, s5_11);

  const s5_8 = scenes.find((scene) => scene.id === 's5_8');
  if (s5_8) {
    s5_8.embedVideo = g5('Видео.mp4');
    s5_8.embedVideoAfterSfx = true;
    s5_8.actionLabel = 'Ответ';
    s5_8.actionAfterSfx = true;
    s5_8.nextSceneId = 's5_8_ans';
  }

  const insertAt = scenes.findIndex((scene) => scene.id === 's9_3');
  if (insertAt !== -1) scenes.splice(insertAt, 0, ...S9_QUIZ_SCENES);
  const s9_2 = scenes.find((scene) => scene.id === 's9_2');
  if (s9_2) s9_2.nextSceneId = 's9_q1';

  const s9_4 = scenes.find((scene) => scene.id === 's9_4');
  if (s9_4) {
    s9_4.fadeOut = false;
    s9_4.fadeOutSfx = undefined;
    s9_4.nextSceneId = 's9_ir_q1';
  }

  const insertIrAt = scenes.findIndex((scene) => scene.id === 's10_1');
  if (insertIrAt !== -1) scenes.splice(insertIrAt, 0, ...S9_IR_QUIZ_SCENES);

  const s16_2 = scenes.find((scene) => scene.id === 's16_2');
  if (s16_2) {
    s16_2.advanceAfterSfx = true;
    s16_2.advanceAfterSfxDelayMs = 2000;
  }

  const s16_3 = scenes.find((scene) => scene.id === 's16_3');
  if (s16_3) {
    s16_3.fadeOut = false;
    s16_3.nextSceneId = undefined;
    s16_3.advanceAfterVoice = true;
    s16_3.advanceAfterVoiceDelayMs = 3000;
  }

  return [...scenes, CREDITS_SCENE];
}

export const story: Story = {
  startSceneId: 's0_1',
  scenes: buildStoryScenes(),
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
