"use client";

import type { PointerEvent, ReactElement, WheelEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { AnimationPlaybackControls, MotionValue } from "framer-motion";
import { ArrowLeft, DoorOpen } from "lucide-react";

import { FrequencyWaves } from "@/components/home/FrequencyWaves";
import { GateArch } from "@/components/home/GateArch";
import { GateCircle } from "@/components/home/GateCircle";
import { GateDiamond } from "@/components/home/GateDiamond";
import { GateEmblem } from "@/components/home/GateEmblem";
import {
  GATES,
  FREEDOM_PROTOCOL_HREF,
  FREEDOM_PROTOCOL_TITLE,
} from "@/lib/gates";
import {
  RING_TILT,
  RING_TILT_VERTICAL,
  ambientBackground,
  depthAt,
  frontGateIndex,
  gateAngle,
  ringCenterOffsetX,
  ringConicGradient,
  ringFloorGradient,
  ringPoint,
  signedDeg,
  thetaToFront,
} from "@/lib/gate-ring";
import type { RingOrientation } from "@/lib/gate-ring";
import { cn } from "@/lib/utils";

/** Gate that faces the visitor on arrival: the archive that exists today. */
const INITIAL_GATE_INDEX = 1;
/** Idle rotation speed of the ring. */
const DRIFT_DEG_PER_SEC = 6;
/** Pause after the pointer leaves the gates before the ring drifts again. */
const DRIFT_RESUME_MS = 2600;
/**
 * After a gate is engaged, the pointer must travel this far before hover can switch or
 * release it — the gate slides to the front and may leave a resting cursor behind.
 */
const ENGAGE_HOLD_PX = 30;
/** A gate further than this from the front is brought forward instead of entered. */
const ENTER_MAX_OFFSET_DEG = 20;

/** Below this width the ring stands up as a wheel turned by dragging (mobile). */
const WHEEL_MEDIA_QUERY = "(max-width: 767px)";
/** Ring rotation per pixel of swipe on the wheel. */
const DRAG_DEG_PER_PX = 0.45;
/** A touch that travels less than this is a tap, not a drag. */
const DRAG_THRESHOLD_PX = 8;
/** A swipe at least this long always moves the wheel on by one gate. */
const SWIPE_STEP_PX = 30;
/** Wheel/trackpad scroll rotation per pixel, and the pause before snapping to a gate. */
const SCROLL_DEG_PER_PX = 0.12;
const SCROLL_SNAP_MS = 180;
/** On the wheel a settled gate stays open this long before the ring drifts again. */
const WHEEL_IDLE_MS = 8000;

/**
 * How a gate is drawn: "ellipse" (a tall oval portal), "circle" (a round portal), "diamond"
 * (a faceted standing diamond), "emblem" (its symbol, large and free-standing) or "arch"
 * (a framed doorway). Design exploration — `?gate=<variant>` in the URL switches away from
 * the ellipse.
 */
type GateVariant = "ellipse" | "circle" | "diamond" | "emblem" | "arch";

const GATE_VARIANTS: readonly GateVariant[] = ["ellipse", "circle", "diamond", "emblem", "arch"];

const GATE_WIDTH = 230;
const GATE_HEIGHT = 320;
/** Ring center as a fraction of the stage height, per orientation. */
const RING_CENTER_Y: Record<RingOrientation, number> = { horizontal: 0.6, vertical: 0.46 };
/** Gates are drawn a little smaller on the narrow wheel. */
const GATE_BASE_SCALE: Record<RingOrientation, number> = { horizontal: 1, vertical: 0.8 };

/** Annulus that turns a square into the ring tube (radius 86%–100%). */
const RING_MASK =
  "radial-gradient(closest-side, transparent 85%, #000 86.5%, #000 98.5%, transparent 100%)";
/** Cylindrical shading across the tube width — dark rims, bright ridge. */
const RING_TUBE_SHADING =
  "radial-gradient(closest-side, transparent 85%, rgba(0,0,0,0.55) 86%, rgba(255,255,255,0) 89%, rgba(255,255,255,0.5) 92.5%, rgba(255,255,255,0) 96%, rgba(0,0,0,0.6) 99.5%, transparent 100%)";
/** Gate centers ride along the middle of the tube. */
const TUBE_MID_FRACTION = 0.93;

/**
 * Home portal: three gates riding a 3D ring. The ring drifts while idle, and its colors
 * and the page background follow whichever arc faces the visitor.
 *
 * Desktop: the ring lies flat; hovering a gate brings it to the front and opens it up, and
 * clicking the front gate enters it. Mobile: the ring stands up as a wheel; swiping (up/down
 * or sideways) turns it and it settles on the nearest gate, tapping the front gate enters it.
 */
export function GatePortal(): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const initialTheta = thetaToFront(0, INITIAL_GATE_INDEX);

  const theta = useMotionValue(reduceMotion ? initialTheta : initialTheta - 240);
  const radius = useMotionValue(380);

  const stageRef = useRef<HTMLDivElement>(null);
  const driftingRef = useRef(false);
  const lockedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const rotationRef = useRef<AnimationPlaybackControls | null>(null);
  /** Latest pointer position on the stage, and where it was when the current gate engaged. */
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  const [engaged, setEngaged] = useState<number | null>(null);
  const [variant, setVariant] = useState<GateVariant>("ellipse");
  const [orientation, setOrientation] = useState<RingOrientation>("horizontal");
  const vertical = orientation === "vertical";

  /** Touch drag on the wheel. */
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTheta: number;
    /** Swipe axis, locked once the touch has clearly moved. */
    axis: "x" | "y" | null;
    travel: number;
  } | null>(null);
  /** Set after a drag so the click that ends it does not enter a gate. */
  const suppressClickRef = useRef(false);
  const scrollSnapTimerRef = useRef<number | null>(null);
  const wheelIdleTimerRef = useRef<number | null>(null);

  /**
   * Orientation as a motion value too, so the derived ring styles recompute when it flips
   * (motion transforms only re-run when one of their inputs changes).
   */
  const orientationValue = useMotionValue<RingOrientation>("horizontal");

  useEffect(() => {
    const mq = window.matchMedia(WHEEL_MEDIA_QUERY);
    const update = (): void => {
      const next: RingOrientation = mq.matches ? "vertical" : "horizontal";
      orientationValue.set(next);
      setOrientation(next);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [orientationValue]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("gate");
    const match = GATE_VARIANTS.find((v) => v === requested);
    if (match !== undefined) setVariant(match);
  }, []);

  // Pointer parallax: the whole scene leans toward the cursor.
  const pointerX = useSpring(0, { stiffness: 50, damping: 18 });
  const pointerY = useSpring(0, { stiffness: 50, damping: 18 });
  const sceneRotateY = useTransform(pointerX, (v) => v * 7);
  const sceneRotateX = useTransform(pointerY, (v) => v * -5);

  const background = useTransform(() =>
    ambientBackground(theta.get(), orientationValue.get()),
  );
  const ringGradient = useTransform(() =>
    ringConicGradient(theta.get(), orientationValue.get()),
  );
  const floorGradient = useTransform(() =>
    ringFloorGradient(theta.get(), orientationValue.get()),
  );
  const ringSize = useTransform(radius, (r) => (r * 2) / TUBE_MID_FRACTION);
  const ringOffsetX = useTransform(() =>
    ringCenterOffsetX(radius.get(), orientationValue.get()),
  );

  useAnimationFrame((_, delta) => {
    if (!driftingRef.current) return;
    theta.set(theta.get() - (DRIFT_DEG_PER_SEC * Math.min(delta, 64)) / 1000);
  });

  const clearResumeTimer = (): void => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (wheelIdleTimerRef.current !== null) {
      window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = null;
    }
  };

  const scheduleDrift = useCallback((): void => {
    clearResumeTimer();
    if (reduceMotion) return;
    resumeTimerRef.current = window.setTimeout(() => {
      driftingRef.current = true;
    }, DRIFT_RESUME_MS);
  }, [reduceMotion]);

  /** Bring gate `index` to the front (shortest way round) and open it up. */
  const engage = useCallback(
    (index: number): void => {
      clearResumeTimer();
      driftingRef.current = false;
      setEngaged(index);
      anchorRef.current = pointerRef.current;

      const from = theta.get();
      const to = thetaToFront(from, index);
      if (Math.abs(to - from) < 0.5) return;

      rotationRef.current?.stop();
      lockedRef.current = true;
      rotationRef.current = animate(theta, to, {
        duration: 0.8 + Math.abs(to - from) / 300,
        ease: [0.65, 0, 0.35, 1],
        onComplete: () => {
          lockedRef.current = false;
          anchorRef.current = pointerRef.current;
        },
      });
    },
    [theta],
  );

  const disengage = useCallback((): void => {
    setEngaged(null);
    scheduleDrift();
  }, [scheduleDrift]);

  /**
   * Wheel: settle on gate `index` and keep it open until the visitor has been idle a while,
   * then let the ring drift again (there is no hover to tell us they moved on).
   */
  const settle = useCallback(
    (index: number): void => {
      engage(index);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        wheelIdleTimerRef.current = null;
        disengage();
      }, WHEEL_IDLE_MS);
    },
    [disengage, engage],
  );

  // Intro: the ring spins in and settles on the initial gate, then starts drifting.
  useEffect(() => {
    if (reduceMotion) return;
    lockedRef.current = true;
    const controls = animate(theta, initialTheta, {
      duration: 2.6,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        lockedRef.current = false;
        scheduleDrift();
      },
    });
    return () => controls.stop();
  }, [initialTheta, reduceMotion, scheduleDrift, theta]);

  // Ring radius follows the stage width.
  useEffect(() => {
    const el = stageRef.current;
    if (el === null) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      radius.set(
        vertical
          ? Math.max(200, Math.min(h * 0.33, 280))
          : Math.max(260, Math.min(w * 0.3, 470)),
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [radius, vertical]);

  // Arrow keys turn the ring one gate at a time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const step =
        e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? 1
          : e.key === "ArrowRight" || e.key === "ArrowUp"
            ? -1
            : 0;
      if (step === 0) return;
      const current = frontGateIndex(theta.get());
      engage((current + step + GATES.length) % GATES.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engage, theta]);

  useEffect(
    () => () => {
      clearResumeTimer();
      if (scrollSnapTimerRef.current !== null) window.clearTimeout(scrollSnapTimerRef.current);
    },
    [],
  );

  /** Stop whatever the ring is doing so the visitor's hand takes over. */
  const takeHold = (): void => {
    clearResumeTimer();
    driftingRef.current = false;
    rotationRef.current?.stop();
    lockedRef.current = false;
  };

  const handleWheelPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (!e.isPrimary) return;
    takeHold();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTheta: theta.get(),
      axis: null,
      travel: 0,
    };
  };

  const handleWheelPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.axis === null) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      drag.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      // Only a real swipe captures the pointer — a tap must still reach the gate's link.
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Swiping up or left brings the next gate to the front.
    drag.travel = drag.axis === "y" ? dy : dx;
    theta.set(drag.startTheta + drag.travel * DRAG_DEG_PER_PX);
  };

  const handleWheelPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (drag.axis === null) return; // A tap: the gate's own click handler decides.
    suppressClickRef.current = true;
    // Settle on the gate nearest the finger; a short swipe still moves on by one gate.
    const startIndex = frontGateIndex(drag.startTheta);
    let index = frontGateIndex(theta.get());
    if (index === startIndex && Math.abs(drag.travel) >= SWIPE_STEP_PX) {
      const step = drag.travel < 0 ? 1 : -1;
      index = (startIndex + step + GATES.length) % GATES.length;
    }
    settle(index);
  };

  const handleWheelScroll = (e: WheelEvent<HTMLDivElement>): void => {
    takeHold();
    theta.set(theta.get() - e.deltaY * SCROLL_DEG_PER_PX);
    if (scrollSnapTimerRef.current !== null) window.clearTimeout(scrollSnapTimerRef.current);
    scrollSnapTimerRef.current = window.setTimeout(() => {
      scrollSnapTimerRef.current = null;
      settle(frontGateIndex(theta.get()));
    }, SCROLL_SNAP_MS);
  };

  /** True once for the click that ends a drag, so it does not enter a gate. */
  const consumeDragClick = useCallback((): boolean => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerRef.current = { x: e.clientX, y: e.clientY };

    // Ignore while the ring is travelling, and ignore synthetic moves fired when a
    // gate slides under a resting cursor — only the visitor's own movement counts.
    if (lockedRef.current) return;
    if (e.movementX === 0 && e.movementY === 0) return;

    // Hold the engaged gate until the pointer has clearly moved on from where it engaged.
    const anchor = anchorRef.current;
    if (
      engaged !== null &&
      anchor !== null &&
      Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) < ENGAGE_HOLD_PX
    ) {
      return;
    }

    const gateEl = (e.target as Element).closest<HTMLElement>("[data-gate-index]");
    if (gateEl === null) {
      if (engaged !== null) disengage();
      return;
    }
    const index = Number(gateEl.dataset.gateIndex);
    if (index !== engaged) engage(index);
  };

  const handlePointerLeave = (): void => {
    pointerRef.current = null;
    pointerX.set(0);
    pointerY.set(0);
    if (engaged !== null) disengage();
    else scheduleDrift();
  };

  const ringCenterY = RING_CENTER_Y[orientation];

  return (
    <div className="relative isolate h-[calc(100dvh-4rem)] min-h-[560px] w-full overflow-hidden text-white md:min-h-[640px]">
      {/* Ambient background reflecting the visible arcs of the ring (extends under the header) */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <FrequencyWaves
        theta={theta}
        pointerX={pointerX}
        energized={engaged !== null}
        still={reduceMotion}
      />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-x-0 top-6 z-[200] hidden flex-col items-center gap-2 text-center md:flex"
      >
        <Image
          src="/logo.png"
          alt="תדר-ישר-אל"
          width={1500}
          height={400}
          priority
          className="h-auto w-[min(360px,40vw)] drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]"
        />
      </motion.div>

      {/* Stage */}
      <div
        ref={stageRef}
        {...(vertical
          ? {
              onPointerDown: handleWheelPointerDown,
              onPointerMove: handleWheelPointerMove,
              onPointerUp: handleWheelPointerUp,
              onPointerCancel: handleWheelPointerUp,
              onWheel: handleWheelScroll,
            }
          : {
              onPointerMove: handlePointerMove,
              onPointerLeave: handlePointerLeave,
            })}
        className={cn(
          "absolute inset-0 [perspective:1400px]",
          vertical && "touch-none select-none",
        )}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX: sceneRotateX, rotateY: sceneRotateY }}
        >
          {/* Ring */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2"
            style={{ top: `${ringCenterY * 100}%`, x: ringOffsetX }}
          >
          <motion.div
            className="absolute left-0 top-0"
            style={{
              width: ringSize,
              height: ringSize,
              x: "-50%",
              y: "-50%",
              ...(vertical ? { scaleX: RING_TILT_VERTICAL } : { scaleY: RING_TILT }),
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: floorGradient }}
            />
            <motion.div
              className="absolute inset-[-2%] rounded-full opacity-80 blur-2xl"
              style={{ background: ringGradient, maskImage: RING_MASK, WebkitMaskImage: RING_MASK }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: ringGradient, maskImage: RING_MASK, WebkitMaskImage: RING_MASK }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: RING_TUBE_SHADING }}
            />
            {/* Far side of the ring recedes into shadow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(${vertical ? "to right" : "to bottom"}, rgba(6,6,11,0.75), transparent 55%)`,
                maskImage: RING_MASK,
                WebkitMaskImage: RING_MASK,
              }}
            />
          </motion.div>
          </motion.div>

          {/* Gates */}
          {GATES.map((gate, i) => (
            <GateOnRing
              key={gate.id}
              index={i}
              theta={theta}
              radius={radius}
              engaged={engaged === i}
              variant={variant}
              orientation={orientation}
              orientationValue={orientationValue}
              onActivate={vertical ? settle : engage}
              consumeDragClick={consumeDragClick}
            />
          ))}
        </motion.div>
      </div>

      {/* Freedom protocol */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute inset-x-0 bottom-7 z-[200] flex justify-center"
      >
        <Link
          href={FREEDOM_PROTOCOL_HREF}
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/25 bg-white/[0.06] px-6 py-2.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-md transition hover:border-white/50 hover:text-white"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-[protocol-shine_4.5s_ease-in-out_infinite]"
          />
          <DoorOpen className="size-4" aria-hidden />
          {FREEDOM_PROTOCOL_TITLE}
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-1"
            aria-hidden
          />
        </Link>
      </motion.div>
    </div>
  );
}

interface GateOnRingProps {
  index: number;
  theta: MotionValue<number>;
  radius: MotionValue<number>;
  engaged: boolean;
  onActivate: (index: number) => void;
  /** True if this click ends a drag of the wheel and must not enter the gate. */
  consumeDragClick: () => boolean;
  variant: GateVariant;
  orientation: RingOrientation;
  orientationValue: MotionValue<RingOrientation>;
}

/** Places one gate on the ring and scales / dims it by depth. */
function GateOnRing({
  index,
  theta,
  radius,
  engaged,
  onActivate,
  consumeDragClick,
  variant,
  orientation,
  orientationValue,
}: GateOnRingProps): ReactElement {
  const gate = GATES[index];
  const vertical = orientation === "vertical";
  const baseScale = GATE_BASE_SCALE[orientation];
  const phi = useTransform(theta, (t) => gateAngle(t, index));
  const depth = useTransform(phi, depthAt);
  const x = useTransform(
    () => ringPoint(phi.get(), radius.get(), orientationValue.get()).x,
  );
  const y = useTransform(
    () => ringPoint(phi.get(), radius.get(), orientationValue.get()).y,
  );
  const scale = useTransform(depth, (d) => (0.5 + 0.5 * d) * baseScale);
  const opacity = useTransform(depth, (d) => 0.4 + 0.6 * d);
  const zIndex = useTransform(depth, (d) => Math.round(d * 100));
  const filter = useTransform(
    depth,
    (d) => `blur(${((1 - d) * 2.5).toFixed(2)}px) saturate(${(0.55 + 0.45 * d).toFixed(2)})`,
  );

  return (
    <motion.div
      className="absolute left-1/2"
      style={{
        top: `${RING_CENTER_Y[orientation] * 100}%`,
        width: GATE_WIDTH,
        height: GATE_HEIGHT,
        marginLeft: -GATE_WIDTH / 2,
        // Flat ring: gates stand on it. Standing wheel: gates are centered on its rim.
        marginTop: vertical ? -GATE_HEIGHT / 2 : -GATE_HEIGHT,
        transformOrigin: vertical ? "50% 50%" : "50% 100%",
        x,
        y,
        scale,
        opacity,
        zIndex,
        filter,
      }}
    >
      <Link
        href={gate.href}
        data-gate-index={index}
        aria-label={`כניסה ל${gate.title}`}
        onFocus={() => onActivate(index)}
        draggable={false}
        onClick={(e) => {
          if (consumeDragClick()) {
            e.preventDefault();
            return;
          }
          // A gate away from the front is brought forward first; entering takes a second click.
          if (Math.abs(signedDeg(phi.get())) > ENTER_MAX_OFFSET_DEG) {
            e.preventDefault();
            onActivate(index);
          }
        }}
        className={cn(
          "block h-full w-full focus-visible:outline-none",
          variant === "arch" && "rounded-t-full",
        )}
      >
        {variant === "arch" ? (
          <GateArch gate={gate} engaged={engaged} />
        ) : variant === "emblem" ? (
          <GateEmblem gate={gate} engaged={engaged} />
        ) : variant === "diamond" ? (
          <GateDiamond gate={gate} engaged={engaged} />
        ) : (
          <GateCircle
            gate={gate}
            engaged={engaged}
            shape={variant === "ellipse" ? "ellipse" : "circle"}
          />
        )}
      </Link>
    </motion.div>
  );
}
