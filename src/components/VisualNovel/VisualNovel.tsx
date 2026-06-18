import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/audioController';
import { useTypewriter } from '../../hooks/useTypewriter';
import { getSceneById, getStartScene } from '../../story/scenes';
import type { Scene, SceneChoice } from '../../types/story';
import { ChoiceList } from './ChoiceList';
import { DialogueBox } from './DialogueBox';
import { SceneLayer } from './SceneLayer';
import { StartMenu } from './StartMenu';

const CROSSFADE_MS = 800;
const WRONG_FLASH_MS = 600;

export function VisualNovel() {
  const [inMenu, setInMenu] = useState(true);
  const [currentScene, setCurrentScene] = useState<Scene | undefined>(getStartScene);
  const [previousScene, setPreviousScene] = useState<Scene | null>(null);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [wrongLabel, setWrongLabel] = useState<string | null>(null);

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

  const startAt = useCallback((firstId: string) => {
    const scene = getSceneById(firstId);
    if (!scene) return;
    setPreviousScene(null);
    setCurrentScene(scene);
    setIsEnding(false);
    setIsCrossfading(false);
    setWrongLabel(null);
    setInMenu(false);
  }, []);

  const openMenu = useCallback(() => {
    audio.stopMusic();
    audio.stopVoice();
    setPreviousScene(null);
    setIsEnding(false);
    setInMenu(true);
  }, []);

  const goToScene = useCallback(
    (nextId: string) => {
      const nextScene = getSceneById(nextId);
      if (!nextScene) {
        if (import.meta.env.DEV) console.warn(`[VN] unknown scene id: "${nextId}"`);
        return;
      }

      setPreviousScene(currentScene ?? null);
      setCurrentScene(nextScene);
      setWrongLabel(null);
      setIsCrossfading(true);

      window.setTimeout(() => {
        setPreviousScene(null);
        setIsCrossfading(false);
      }, CROSSFADE_MS);
    },
    [currentScene],
  );

  const advance = useCallback(() => {
    if (inMenu) return;
    audio.resume();
    if (!currentScene) return;
    if (currentScene.choices?.length) return;

    if (!done) {
      finish();
      return;
    }

    if (currentScene.nextSceneId) {
      goToScene(currentScene.nextSceneId);
      return;
    }

    setIsEnding(true);
  }, [inMenu, currentScene, done, finish, goToScene]);

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

  // Auto-advance timed scenes once the text has finished typing.
  useEffect(() => {
    if (!currentScene || currentScene.choices?.length || !currentScene.autoAdvanceMs || !done) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (currentScene.nextSceneId) goToScene(currentScene.nextSceneId);
      else setIsEnding(true);
    }, currentScene.autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [currentScene, done, goToScene]);

  // Keyboard: Space / Enter advance the story.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  const handleVideoEnd = useCallback(() => {
    if (currentScene?.nextSceneId) goToScene(currentScene.nextSceneId);
    else setIsEnding(true);
  }, [currentScene, goToScene]);

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

      {previousScene && (
        <div className="vn-scene-layer" data-testid="vn-scene-prev">
          <SceneLayer scene={previousScene} />
          <div className="vn-overlay" />
        </div>
      )}

      <div
        className={`vn-scene-layer ${isCrossfading ? 'vn-crossfade-in' : ''}`}
        data-testid="vn-scene"
      >
        <SceneLayer scene={currentScene} onVideoEnd={handleVideoEnd} />
        <div className="vn-overlay" />
      </div>

      {showDialogue && (
        <DialogueBox speaker={currentScene.speaker} text={displayed} showCursor={showCursor} />
      )}

      {showChoices && currentScene.choices && (
        <ChoiceList choices={currentScene.choices} onChoose={handleChoose} wrongLabel={wrongLabel} />
      )}

      {isEnding && (
        <div className="vn-end" data-testid="vn-end">
          Конец
        </div>
      )}
    </div>
  );
}
