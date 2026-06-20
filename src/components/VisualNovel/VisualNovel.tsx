import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/audioController';
import { useTypewriter } from '../../hooks/useTypewriter';
import { getPrevSceneId, getSceneById, getStartScene } from '../../story/scenes';
import type { Scene, SceneChoice } from '../../types/story';
import { ChoiceList } from './ChoiceList';
import { DialogueBox } from './DialogueBox';
import { SceneStage } from './SceneStage';
import { StartMenu } from './StartMenu';

const WRONG_FLASH_MS = 600;

export function VisualNovel() {
  const [inMenu, setInMenu] = useState(true);
  const [session, setSession] = useState(0);
  const [currentScene, setCurrentScene] = useState<Scene | undefined>(getStartScene);
  const [isEnding, setIsEnding] = useState(false);
  const [wrongLabel, setWrongLabel] = useState<string | null>(null);
  // id следующей сцены, ожидающей открытия после ЗТМ (экран чёрный, ждём клик).
  const [pendingNext, setPendingNext] = useState<string | null>(null);
  // Кнопка-действие может появляться с задержкой (см. button.delayMs).
  const [buttonVisible, setButtonVisible] = useState(false);

  const fadeSfxTimer = useRef<number | null>(null);
  const cancelFadeSfx = useCallback(() => {
    if (fadeSfxTimer.current !== null) {
      window.clearTimeout(fadeSfxTimer.current);
      fadeSfxTimer.current = null;
    }
  }, []);

  const text = currentScene?.text ?? '';
  const { displayed, done, finish } = useTypewriter(text);

  // Drive audio from the active scene. Music persists across frames; voice/sfx
  // fire on enter. Keyed on scene id so it runs once per frame.
  const sceneId = currentScene?.id;
  useEffect(() => {
    if (inMenu || !currentScene) return;
    audio.setMusic(currentScene.music);
    if (currentScene.voice) audio.playVoice(currentScene.voice);
    currentScene.sfx?.forEach((src) => audio.playSfx(src));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, inMenu]);

  // Показ кнопки-действия: сразу или с задержкой button.delayMs.
  useEffect(() => {
    const btn = currentScene?.button;
    if (inMenu || !btn) {
      setButtonVisible(false);
      return;
    }
    if (!btn.delayMs) {
      setButtonVisible(true);
      return;
    }
    setButtonVisible(false);
    const t = window.setTimeout(() => setButtonVisible(true), btn.delayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, inMenu]);

  const startAt = useCallback((firstId: string) => {
    const scene = getSceneById(firstId);
    if (!scene) return;
    audio.clearSfx();
    setCurrentScene(scene);
    setIsEnding(false);
    setWrongLabel(null);
    setPendingNext(null);
    setInMenu(false);
    setSession((s) => s + 1);
  }, []);

  const openMenu = useCallback(() => {
    audio.stopMusic();
    audio.stopVoice();
    audio.clearSfx();
    cancelFadeSfx();
    setIsEnding(false);
    setPendingNext(null);
    setInMenu(true);
  }, [cancelFadeSfx]);

  const goToScene = useCallback((nextId: string) => {
    const nextScene = getSceneById(nextId);
    if (!nextScene) {
      if (import.meta.env.DEV) console.warn(`[VN] unknown scene id: "${nextId}"`);
      return;
    }

    // Звуки «листаются» вместе с кадром: обрываем очередь предыдущего кадра,
    // звуки нового запустит аудио-эффект по смене сцены.
    audio.clearSfx();
    setCurrentScene(nextScene);
    setWrongLabel(null);
  }, []);

  // Переход вперёд: либо в чёрный (ЗТМ), либо на следующий кадр, либо в конец.
  // Используется и кликом/клавишей, и авто-переходом по таймингу.
  const goForward = useCallback(
    (scene: Scene) => {
      if (scene.fadeOut && scene.nextSceneId) {
        setPendingNext(scene.nextSceneId);
        const fx = scene.fadeOutSfx;
        if (fx) {
          if (fadeSfxTimer.current !== null) window.clearTimeout(fadeSfxTimer.current);
          fadeSfxTimer.current = window.setTimeout(() => audio.playSfx(fx.src), fx.delayMs ?? 0);
        }
        return;
      }
      if (scene.nextSceneId) goToScene(scene.nextSceneId);
      else setIsEnding(true);
    },
    [goToScene],
  );

  const advance = useCallback(() => {
    if (inMenu) return;
    audio.resume();

    // Экран чёрный после ЗТМ — следующая сцена открывается только по клику.
    if (pendingNext) {
      const next = pendingNext;
      setPendingNext(null);
      goToScene(next);
      return;
    }

    if (!currentScene) return;
    if (currentScene.choices?.length || currentScene.button) return;

    if (!done) {
      finish();
      return;
    }

    goForward(currentScene);
  }, [inMenu, pendingNext, currentScene, done, finish, goToScene, goForward]);

  const goBack = useCallback(() => {
    if (inMenu) return;
    audio.resume();

    // На чёрном экране после ЗТМ — стрелка влево отменяет затемнение.
    if (pendingNext) {
      setPendingNext(null);
      cancelFadeSfx();
      return;
    }
    if (isEnding) {
      setIsEnding(false);
      return;
    }

    const prevId = getPrevSceneId(currentScene?.id);
    if (prevId) goToScene(prevId);
  }, [inMenu, pendingNext, isEnding, currentScene, goToScene]);

  const wrongTimer = useRef<number | null>(null);
  const handleChoose = useCallback(
    (choice: SceneChoice) => {
      audio.resume();
      if (!currentScene) return;

      if (currentScene.quiz && choice.correct === false) {
        if (currentScene.wrongSfx) audio.playSfx(currentScene.wrongSfx);
        setWrongLabel(choice.label);
        if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
        wrongTimer.current = window.setTimeout(() => setWrongLabel(null), WRONG_FLASH_MS);
        return;
      }

      if (choice.nextSceneId) goToScene(choice.nextSceneId);
      else setIsEnding(true);
    },
    [currentScene, goToScene],
  );

  // Авто-переход по таймингу. Не работает в меню, на чёрном экране и на
  // кадрах с кнопкой/выбором.
  useEffect(() => {
    if (
      inMenu ||
      pendingNext ||
      !currentScene ||
      currentScene.choices?.length ||
      currentScene.button ||
      !currentScene.autoAdvanceMs ||
      !done
    ) {
      return;
    }
    const timer = window.setTimeout(() => goForward(currentScene), currentScene.autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [inMenu, pendingNext, currentScene, done, goForward]);

  // Клавиатура: Space / Enter / → — вперёд, ← — назад.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        advance();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, goBack]);


  if (inMenu) {
    return <StartMenu onSelect={startAt} />;
  }

  if (!currentScene) {
    return (
      <div className="vn-root vn-placeholder" data-testid="vn-placeholder">
        <div className="vn-placeholder-inner">
          <div className="vn-placeholder-icon">📽</div>
          <h1>Визуальная новелла</h1>
          <p>Добавь сцены в src/story/scenes.ts</p>
        </div>
      </div>
    );
  }

  const showDialogue = Boolean(currentScene.text || currentScene.speaker);
  const showChoices = Boolean(currentScene.choices?.length && done);
  const showCursor = done && !currentScene.choices?.length && !isEnding;

  return (
    <div className="vn-root" onClick={advance} data-testid="vn-root">
      <button
        type="button"
        className="vn-menu-btn"
        data-testid="vn-menu-btn"
        onClick={(event) => {
          event.stopPropagation();
          openMenu();
        }}
      >
        ☰ Сцены
      </button>

      <SceneStage key={session} scene={currentScene} />

      {showDialogue && (
        <DialogueBox speaker={currentScene.speaker} text={displayed} showCursor={showCursor} />
      )}

      {showChoices && currentScene.choices && (
        <ChoiceList choices={currentScene.choices} onChoose={handleChoose} wrongLabel={wrongLabel} />
      )}

      {currentScene.actionLabel && (
        <button
          type="button"
          className="vn-answer-btn"
          data-testid="vn-answer-btn"
          onClick={(event) => {
            event.stopPropagation();
            advance();
          }}
        >
          {currentScene.actionLabel}
        </button>
      )}

      {currentScene.button && buttonVisible && (
        <button
          type="button"
          className="vn-start-btn"
          data-testid="vn-start-btn"
          onClick={(event) => {
            event.stopPropagation();
            audio.resume();
            goToScene(currentScene.button!.nextSceneId);
          }}
        >
          {currentScene.button.label}
        </button>
      )}

      <div
        className={`vn-blackout ${pendingNext ? 'vn-blackout-on' : ''}`}
        data-testid="vn-blackout"
        aria-hidden
      />

      {isEnding && (
        <div className="vn-end" data-testid="vn-end">
          Конец
        </div>
      )}
    </div>
  );
}
