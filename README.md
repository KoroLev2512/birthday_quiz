# Birthday Quiz — Матвей и Маша

Визуальная новелла + квиз на React.

## Запуск

```bash
npm install
npm run dev
```

## Ассеты

Медиафайлы (фото, музыка) в папке `files/` — в репозитории через **Git LFS**.

После клонирования:
```bash
git lfs install
git lfs pull
```

Сценарий (`scenario.pdf` / `scenario.md`) — только локально, не в git.

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
