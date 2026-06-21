import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/audioController';
import { useTypewriter } from '../../hooks/useTypewriter';
import { getPrevSceneId, getSceneById, getStartScene } from '../../story/scenes';
import type { Scene, SceneChoice } from '../../types/story';
import { ChoiceList } from './ChoiceList';
import { CreditsRoll } from './CreditsRoll';
import { DialogueBox } from './DialogueBox';
import { SceneLayer } from './SceneLayer';
import { SceneStage } from './SceneStage';
import { StartMenu } from './StartMenu';

const WRONG_FLASH_MS = 600;
const ANSWER_FLASH_MS = 420;

/** Кадры с «Охраной» в сцене 11 — «Назад» возвращает на кадр с выбором. */
const S11_GUARD = new Set(['s11_3', 's11_7', 's11_11', 's11_14']);

export function VisualNovel() {
  const [inMenu, setInMenu] = useState(true);
  const [session, setSession] = useState(0);
  const [currentScene, setCurrentScene] = useState<Scene | undefined>(getStartScene);
  const [isEnding, setIsEnding] = useState(false);
  const [wrongLabel, setWrongLabel] = useState<string | null>(null);
  const [answerFlash, setAnswerFlash] = useState<'correct' | 'wrong' | null>(null);
  // id следующей сцены, ожидающей открытия после ЗТМ (экран чёрный, ждём клик).
  const [pendingNext, setPendingNext] = useState<string | null>(null);
  // Кнопка-действие может появляться с задержкой (см. button.delayMs).
  const [buttonVisible, setButtonVisible] = useState(false);
  const [embedVisible, setEmbedVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswerVisible, setQuizAnswerVisible] = useState(false);

  const fadeSfxTimer = useRef<number | null>(null);
  const goForwardRef = useRef<(scene: Scene) => void>(() => {});
  const returnSceneId = useRef<string | null>(null);
  const pendingChoiceAdvance = useRef<string | null>(null);
  const answerFlashTimer = useRef<number | null>(null);
  const cancelFadeSfx = useCallback(() => {
    if (fadeSfxTimer.current !== null) {
      window.clearTimeout(fadeSfxTimer.current);
      fadeSfxTimer.current = null;
    }
  }, []);
  const clearAnswerFlash = useCallback(() => {
    if (answerFlashTimer.current !== null) {
      window.clearTimeout(answerFlashTimer.current);
      answerFlashTimer.current = null;
    }
    setAnswerFlash(null);
  }, []);

  const text = currentScene?.text ?? '';
  const { displayed, done, finish } = useTypewriter(text);

  // Drive audio from the active scene. Music persists across frames; voice/sfx
  // fire on enter. Keyed on scene id so it runs once per frame.
  const sceneId = currentScene?.id;
  useEffect(() => {
    if (inMenu || !currentScene) return;
    const scene = currentScene;
    audio.resume();
    audio.setMusic(scene.music);

    let showEmbedAfterSfx: (() => void) | null = null;
    let ztmAfterSfx: (() => void) | null = null;
    let advanceAfterSfxTimer: number | null = null;
    let advanceAfterVoiceTimer: number | null = null;
    let afterVoice: (() => void) | null = null;
    if (scene.embedVideoAfterSfx && scene.embedVideo) {
      setEmbedVisible(false);
      setActionVisible(false);
      showEmbedAfterSfx = () => {
        setEmbedVisible(true);
        if (scene.actionAfterSfx && scene.actionLabel) setActionVisible(true);
      };
      if (scene.sfx?.length) audio.onSfxIdle = showEmbedAfterSfx;
      else showEmbedAfterSfx();
    } else if (
      scene.sfx?.length &&
      scene.nextSceneId &&
      (scene.fadeOut || scene.advanceAfterSfx)
    ) {
      ztmAfterSfx = () => {
        const go = () => goForwardRef.current(scene);
        const delay = scene.advanceAfterSfxDelayMs ?? 0;
        if (delay) advanceAfterSfxTimer = window.setTimeout(go, delay);
        else go();
      };
      window.setTimeout(() => {
        audio.onSfxIdle = ztmAfterSfx;
      }, 0);
    } else if (scene.advanceAfterVoice && scene.voice) {
      afterVoice = () => {
        const go = () => goForwardRef.current(scene);
        const delay = scene.advanceAfterVoiceDelayMs ?? 0;
        if (delay) advanceAfterVoiceTimer = window.setTimeout(go, delay);
        else go();
      };
      audio.onVoiceIdle = afterVoice;
    }

    if (scene.voice) audio.playVoice(scene.voice);
    scene.sfx?.forEach((src) => audio.playSfx(src));

    return () => {
      if (showEmbedAfterSfx && audio.onSfxIdle === showEmbedAfterSfx) audio.onSfxIdle = null;
      if (ztmAfterSfx && audio.onSfxIdle === ztmAfterSfx) audio.onSfxIdle = null;
      if (afterVoice && audio.onVoiceIdle === afterVoice) audio.onVoiceIdle = null;
      if (advanceAfterSfxTimer !== null) window.clearTimeout(advanceAfterSfxTimer);
      if (advanceAfterVoiceTimer !== null) window.clearTimeout(advanceAfterVoiceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, inMenu]);

  // Сброс шага квиза при входе на кадр с overlayQuiz.
  useEffect(() => {
    if (inMenu || !currentScene?.overlayQuiz) return;
    setQuizStep(0);
    setQuizStarted(false);
    setQuizAnswerVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, inMenu]);

  // Показ кнопки-действия: сразу, после sfx или с задержкой button.delayMs.
  useEffect(() => {
    const btn = currentScene?.button;
    if (inMenu || !btn) {
      setButtonVisible(false);
      return;
    }
    if (btn.afterSfx) {
      setButtonVisible(false);
      const show = () => setButtonVisible(true);
      // sfx-эффект сцены объявлен выше; 0 ms — дать очереди стартовать.
      const t = window.setTimeout(() => {
        if (audio.sfxActive) audio.onSfxIdle = show;
        else show();
      }, 0);
      return () => {
        window.clearTimeout(t);
        if (audio.onSfxIdle === show) audio.onSfxIdle = null;
      };
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

  // Встроенное видео сразу при входе (без ожидания sfx).
  useEffect(() => {
    const scene = currentScene;
    if (inMenu || !scene?.embedVideo || scene.embedVideoAfterSfx) {
      if (!scene?.embedVideoAfterSfx) {
        setEmbedVisible(false);
        setActionVisible(false);
      }
      return;
    }
    setEmbedVisible(true);
    setActionVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, inMenu]);

  const startAt = useCallback((firstId: string) => {
    const scene = getSceneById(firstId);
    if (!scene) return;
    audio.clearSfx();
    pendingChoiceAdvance.current = null;
    returnSceneId.current = null;
    clearAnswerFlash();
    setCurrentScene(scene);
    setIsEnding(false);
    setWrongLabel(null);
    setPendingNext(null);
    setInMenu(false);
    setSession((s) => s + 1);
  }, [clearAnswerFlash]);

  const openMenu = useCallback(() => {
    audio.stopMusic();
    audio.stopVoice();
    audio.clearSfx();
    cancelFadeSfx();
    returnSceneId.current = null;
    clearAnswerFlash();
    setIsEnding(false);
    setPendingNext(null);
    setInMenu(true);
  }, [cancelFadeSfx, clearAnswerFlash]);

  const goToScene = useCallback((nextId: string) => {
    const nextScene = getSceneById(nextId);
    if (!nextScene) {
      if (import.meta.env.DEV) console.warn(`[VN] unknown scene id: "${nextId}"`);
      return;
    }

    // Звуки «листаются» вместе с кадром: обрываем очередь предыдущего кадра,
    // звуки нового запустит аудио-эффект по смене сцены.
    audio.clearSfx();
    pendingChoiceAdvance.current = null;
    returnSceneId.current = null;
    clearAnswerFlash();
    setCurrentScene(nextScene);
    setWrongLabel(null);
  }, [clearAnswerFlash]);

  // Переход вперёд: либо в чёрный (ЗТМ), либо на следующий кадр, либо в конец.
  // Используется и кликом/клавишей, и авто-переходом по таймингу.
  const goForward = useCallback(
    (scene: Scene) => {
      if (scene.fadeOut && scene.nextSceneId) {
        setPendingNext(scene.nextSceneId);
        audio.stopMusic();
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

  goForwardRef.current = goForward;

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

    // После экрана «Конец» одним кликом переходим к титрам.
    if (isEnding) {
      setIsEnding(false);
      goToScene('credits');
      return;
    }

    if (!currentScene) return;

    // Пропуск озвучки после выбора (ждём доигрывания или клика).
    if (pendingChoiceAdvance.current) {
      const nextId = pendingChoiceAdvance.current;
      pendingChoiceAdvance.current = null;
      audio.clearSfx();
      goToScene(nextId);
      return;
    }

    // Пропуск ожидания sfx перед кнопкой («СЫГРАТЬ» и т.п.).
    if (currentScene.button?.afterSfx && !buttonVisible) {
      audio.clearSfx();
      setButtonVisible(true);
      return;
    }

    // Пропуск реплики → встроенное видео + «Ответ» (сцена 5, кадр 8).
    if (currentScene.embedVideoAfterSfx && !embedVisible && audio.sfxActive) {
      audio.clearSfx();
      setEmbedVisible(true);
      if (currentScene.actionAfterSfx && currentScene.actionLabel) setActionVisible(true);
      return;
    }

    // Пропуск sfx / голоса.
    if (audio.sfxActive || audio.voiceActive) {
      audio.clearSfx();
      audio.stopVoice();
      if (currentScene.id === 's9_2_win' || currentScene.id === 's9_4_win') {
        goForward(currentScene);
        return;
      }
      const blocked =
        currentScene.embedVideoAfterSfx ||
        currentScene.choices?.length ||
        (currentScene.button && buttonVisible);
      if (!blocked) {
        goForward(currentScene);
      }
      return;
    }

    // Пропуск встроенного видео-ответа.
    if (embedVisible && currentScene.embedVideo && currentScene.embedVideoLoop === false) {
      goForward(currentScene);
      return;
    }

    // Квиз поверх кадра (сцена 3): «Ответ» открывает картинку, клик — следующий вопрос.
    const quiz = currentScene.overlayQuiz;
    if (quiz?.length) {
      if (!quizStarted) {
        setQuizStarted(true);
        return;
      }
      if (!quizAnswerVisible) return;
      const nextStep = quizStep + 1;
      if (nextStep < quiz.length) {
        setQuizStep(nextStep);
        setQuizAnswerVisible(false);
        return;
      }
      goForward(currentScene);
      return;
    }

    if (currentScene.choices?.length || (currentScene.button && buttonVisible)) return;

    if (!done) {
      finish();
      return;
    }

    goForward(currentScene);
  }, [
    inMenu,
    pendingNext,
    isEnding,
    currentScene,
    embedVisible,
    buttonVisible,
    done,
    finish,
    goToScene,
    goForward,
    quizAnswerVisible,
    quizStarted,
    quizStep,
  ]);

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
    if (currentScene?.type === 'credits') {
      goToScene('s16_3');
      return;
    }

    const quiz = currentScene?.overlayQuiz;
    if (quiz?.length) {
      if (quizAnswerVisible) {
        setQuizAnswerVisible(false);
        return;
      }
      if (quizStarted) {
        if (quizStep > 0) {
          setQuizStep(quizStep - 1);
          setQuizAnswerVisible(true);
          return;
        }
        setQuizStarted(false);
        return;
      }
    }

    const prevId = getPrevSceneId(currentScene?.id);
    if (prevId) goToScene(prevId);
  }, [inMenu, pendingNext, isEnding, currentScene, goToScene, cancelFadeSfx, quizAnswerVisible, quizStarted, quizStep]);

  const wrongTimer = useRef<number | null>(null);
  const handleChoose = useCallback(
    (choice: SceneChoice) => {
      audio.resume();
      if (!currentScene) return;

      if (currentScene.quiz) {
        if (choice.correct === false) {
          clearAnswerFlash();
          audio.playUiCue('wrong');
          if (currentScene.wrongSfx) audio.playSfx(currentScene.wrongSfx);
          setAnswerFlash('wrong');
          setWrongLabel(choice.label);
          // Если у неправильного ответа есть кадр (некрасивая картинка) — переходим к нему;
          // иначе просто подсвечиваем и остаёмся на вопросе.
          if (choice.nextSceneId) {
            const nextId = choice.nextSceneId;
            answerFlashTimer.current = window.setTimeout(() => {
              setAnswerFlash(null);
              setWrongLabel(null);
              goToScene(nextId);
            }, ANSWER_FLASH_MS);
          } else {
            if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current);
            wrongTimer.current = window.setTimeout(() => {
              setWrongLabel(null);
              setAnswerFlash(null);
            }, WRONG_FLASH_MS);
          }
          return;
        }

        if (choice.correct === true) {
          clearAnswerFlash();
          audio.playUiCue('correct');
          setAnswerFlash('correct');
          answerFlashTimer.current = window.setTimeout(() => {
            setAnswerFlash(null);
            if (choice.nextSceneId) {
              if (S11_GUARD.has(choice.nextSceneId)) returnSceneId.current = currentScene.id;
              else returnSceneId.current = null;
              goToScene(choice.nextSceneId);
            } else {
              setIsEnding(true);
            }
          }, ANSWER_FLASH_MS);
          return;
        }
      }

      if (choice.nextSceneId) {
        if (S11_GUARD.has(choice.nextSceneId)) returnSceneId.current = currentScene.id;
        else returnSceneId.current = null;

        if (choice.sfx) {
          audio.clearSfx();
          audio.playSfx(choice.sfx);
          const nextId = choice.nextSceneId;
          pendingChoiceAdvance.current = nextId;
          audio.onSfxIdle = () => {
            pendingChoiceAdvance.current = null;
            goToScene(nextId);
          };
          return;
        }

        goToScene(choice.nextSceneId);
      } else setIsEnding(true);
    },
    [clearAnswerFlash, currentScene, goToScene],
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
      currentScene.embedVideoAfterSfx ||
      !currentScene.autoAdvanceMs ||
      !done
    ) {
      return;
    }
    const scene = currentScene;
    let advanced = false;
    const fire = () => {
      if (advanced) return;
      advanced = true;
      goForward(scene);
    };
    // Длительность кадра — это минимум: если звук ещё играет, ждём его окончания,
    // чтобы хвост последовательности (например Лай) не обрывался.
    const timer = window.setTimeout(() => {
      if (audio.sfxActive) audio.onSfxIdle = fire;
      else fire();
    }, scene.autoAdvanceMs);

    return () => {
      window.clearTimeout(timer);
      if (audio.onSfxIdle === fire) audio.onSfxIdle = null;
    };
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
  const overlayQuiz = currentScene.overlayQuiz;
  const overlayQuizActive = Boolean(overlayQuiz?.length);
  const overlaySrc =
    overlayQuizActive && quizStarted
      ? quizAnswerVisible
        ? overlayQuiz![quizStep].answer
        : overlayQuiz![quizStep].image
      : null;
  const showQuizAnswerBtn = overlayQuizActive && quizStarted && !quizAnswerVisible;
  const showCursor =
    done &&
    !currentScene.choices?.length &&
    !isEnding &&
    (!overlayQuizActive || !quizStarted || quizAnswerVisible);
  const isCredits = currentScene.type === 'credits';

  return (
    <div className="vn-root" onClick={isCredits ? undefined : advance} data-testid="vn-root">
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

      {!isCredits &&
        (currentScene.type === 'video' ? (
          <SceneLayer scene={currentScene} onVideoEnd={() => goForward(currentScene)} />
        ) : (
          <SceneStage key={session} scene={currentScene} />
        ))}

      {embedVisible && currentScene.embedVideo && (
        <video
          key={currentScene.embedVideo}
          src={currentScene.embedVideo}
          className="vn-embed-video"
          autoPlay
          playsInline
          loop={currentScene.embedVideoLoop !== false}
          onEnded={() => {
            if (currentScene.embedVideoLoop === false) goForward(currentScene);
          }}
          data-testid="vn-embed-video"
        />
      )}

      {overlaySrc && (
        <img
          key={overlaySrc}
          src={overlaySrc}
          alt=""
          className="vn-embed-image"
          data-testid="vn-embed-image"
        />
      )}

      {isCredits && !isEnding && <CreditsRoll onComplete={openMenu} />}

      {showDialogue && (
        <DialogueBox
          speaker={currentScene.speaker}
          text={displayed}
          showCursor={showCursor}
          centered={currentScene.quiz}
        />
      )}

      {showChoices && currentScene.choices && (
        <ChoiceList
          choices={currentScene.choices}
          onChoose={handleChoose}
          wrongLabel={wrongLabel}
          layout={currentScene.choiceLayout}
        />
      )}

      {answerFlash && (
        <div
          className={`vn-answer-flash ${answerFlash === 'correct' ? 'vn-answer-flash-correct' : 'vn-answer-flash-wrong'}`}
          data-testid="vn-answer-flash"
          aria-hidden
        />
      )}

      {(showQuizAnswerBtn ||
        (currentScene.actionLabel && (!currentScene.actionAfterSfx || actionVisible))) && (
        <button
          type="button"
          className="vn-answer-btn"
          data-testid="vn-answer-btn"
          onClick={(event) => {
            event.stopPropagation();
            audio.resume();
            if (showQuizAnswerBtn) {
              setQuizAnswerVisible(true);
              return;
            }
            if (currentScene.actionSfx) {
              audio.clearSfx();
              audio.playSfx(currentScene.actionSfx);
              return;
            }
            goForward(currentScene);
          }}
        >
          {showQuizAnswerBtn ? 'Ответ' : currentScene.actionLabel}
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
            const btn = currentScene.button!;
            const target = returnSceneId.current ?? btn.nextSceneId;
            returnSceneId.current = null;
            goToScene(target);
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
