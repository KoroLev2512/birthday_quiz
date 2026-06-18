# Birthday Quiz — Матвей и Маша

Визуальная новелла + квиз на React.

## Запуск

```bash
npm install
npm run dev
```

## Ассеты

Медиафайлы (фото, видео, музыка) лежат локально в папке `files/` и не включены в репозиторий из‑за размера.

Скачать: [Google Drive](https://drive.google.com/drive/folders/1-JGlIT3g8BDDs4-LmdrzqDVc2WyjI0Rn?usp=sharing)

Сценарий: `scenario.pdf` / `scenario.md` — тоже локально, не в git.

## Стек

- Vite + React + TypeScript
- Tailwind CSS
- Собственный движок визуальной новеллы (`src/components/VisualNovel/`)

## Структура

```
src/
├── components/VisualNovel/   # движок новеллы
├── story/scenes.ts         # сцены
├── audio/                  # управление звуком
└── hooks/useTypewriter.ts  # печать текста
```
