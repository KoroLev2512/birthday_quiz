import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { getSceneById } from '../../story/scenes';
import {
  CURTAIN_IN_MS,
  CURTAIN_OUT_MS,
  effectForGroup,
  parseSceneGroup,
  TRANSITION_MS,
  transitionFor,
  type TransitionKind,
} from '../../lib/sceneGroup';
import type { Scene, SceneEffect } from '../../types/story';

const EFFECT_CLASS: Record<SceneEffect, string> = {
  'zoom-in': 'vn-effect-zoom-in',
  'zoom-out': 'vn-effect-zoom-out',
  'pan-left': 'vn-effect-pan-left',
  'pan-right': 'vn-effect-pan-right',
};

type SceneStageProps = {
  scene: Scene;
};

function applySwap(
  target: 'a' | 'b',
  scene: Scene,
  setSlotA: (s: Scene) => void,
  setSlotB: (s: Scene) => void,
  setActiveSlot: (s: 'a' | 'b') => void,
  activeRef: MutableRefObject<'a' | 'b'>,
  prevGroup: number,
  nextGroup: number,
  setMotionEffect: (e: SceneEffect) => void,
  prevIdRef: MutableRefObject<string>,
) {
  if (target === 'a') setSlotA(scene);
  else setSlotB(scene);

  requestAnimationFrame(() => {
    activeRef.current = target;
    setActiveSlot(target);
    if (prevGroup !== nextGroup) {
      setMotionEffect(effectForGroup(nextGroup));
    }
    prevIdRef.current = scene.id;
  });
}

export function SceneStage({ scene }: SceneStageProps) {
  const prevIdRef = useRef(scene.id);
  const activeRef = useRef<'a' | 'b'>('a');
  const timersRef = useRef<number[]>([]);

  const [slotA, setSlotA] = useState(scene);
  const [slotB, setSlotB] = useState<Scene | null>(null);
  const [activeSlot, setActiveSlot] = useState<'a' | 'b'>('a');
  const [transition, setTransition] = useState<TransitionKind>('dissolve');
  const [curtain, setCurtain] = useState(false);
  const [motionEffect, setMotionEffect] = useState(() => effectForGroup(parseSceneGroup(scene.id)));

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (scene.id === prevIdRef.current) return;

    const prevGroup = parseSceneGroup(prevIdRef.current);
    const nextGroup = parseSceneGroup(scene.id);
    const kind = transitionFor(prevGroup, nextGroup);
    const target = activeRef.current === 'a' ? 'b' : 'a';

    setTransition(kind);
    clearTimers();

    const img = new Image();

    img.onload = () => {
      if (kind === 'fade-black') {
        setCurtain(true);

        later(() => {
          applySwap(
            target,
            scene,
            setSlotA,
            setSlotB,
            setActiveSlot,
            activeRef,
            prevGroup,
            nextGroup,
            setMotionEffect,
            prevIdRef,
          );

          later(() => setCurtain(false), 120);
        }, CURTAIN_IN_MS);
      } else {
        applySwap(
          target,
          scene,
          setSlotA,
          setSlotB,
          setActiveSlot,
          activeRef,
          prevGroup,
          nextGroup,
          setMotionEffect,
          prevIdRef,
        );
      }
    };

    img.onerror = () => {
      prevIdRef.current = scene.id;
    };

    img.src = scene.src;
  }, [scene]);

  useEffect(() => {
    if (!scene.nextSceneId) return;
    const next = getSceneById(scene.nextSceneId);
    if (!next) return;
    const img = new Image();
    img.src = next.src;
  }, [scene.nextSceneId]);

  const fadeMs = TRANSITION_MS[transition];
  const effectClass = EFFECT_CLASS[motionEffect];

  return (
    <div
      className={`vn-scene-layer vn-tr-${transition}`}
      data-testid="vn-scene"
      style={
        {
          '--vn-fade-ms': `${fadeMs}ms`,
          '--vn-curtain-in-ms': `${CURTAIN_IN_MS}ms`,
          '--vn-curtain-out-ms': `${CURTAIN_OUT_MS}ms`,
        } as React.CSSProperties
      }
    >
      <div className={`vn-motion ${effectClass}`}>
        <img
          src={slotA.src}
          alt=""
          className={`vn-frame ${activeSlot === 'a' ? 'vn-frame-active' : ''}`}
          data-testid="scene-image"
        />
        {slotB && (
          <img
            src={slotB.src}
            alt=""
            className={`vn-frame ${activeSlot === 'b' ? 'vn-frame-active' : ''}`}
          />
        )}
      </div>

      <div className="vn-overlay" />
      <div className={`vn-curtain ${curtain ? 'vn-curtain-visible' : ''}`} aria-hidden />
    </div>
  );
}
