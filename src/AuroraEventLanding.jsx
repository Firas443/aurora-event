import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Sparkles,
  MapPin,
  Ticket,
  ArrowRight,
  Stars,
  Mic,
  Zap,
} from "lucide-react";

/**
 * Aurora Event — Ultra-Premium, immersive landing page
 * - Cinematic parallax + layered aurora background
 * - GPU-friendly particle field + light trails
 * - Horizontal Story journey with snap + micro 3D depth
 * - Holographic speaker cards (flip + shimmer)
 * - Monumental RSVP CTA with micro-confetti burst
 *
 * Notes:
 * - Tailwind is assumed available.
 * - No external assets required.
 * - Everything is self-contained in this component.
 */

// ---------- Utility helpers ----------
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rafThrottle = (fn) => {
  let raf = 0;
  return (...args) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      fn(...args);
    });
  };
};

// ---------- Particles + light trails background ----------
function useResizeObserver(ref, onResize) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => onResize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, onResize]);
}

function ParticleField({ intensity = 1 }) {
  

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cursor = useRef({ x: 0.5, y: 0.35, vx: 0, vy: 0, down: false });
  const dprRef = useRef(1);

  const settings = useMemo(
    () => ({
      baseCount: 70,
      speed: 0.35,
      jitter: 0.6,
      trail: 0.08,
      glow: 0.85,
    }),
    []
  );

  const resize = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    dprRef.current = dpr;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  useResizeObserver(wrapRef, resize);

  useEffect(() => {
    resize();

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const mkParticles = () => {
      const count = Math.floor(settings.baseCount * intensity);
      const particles = new Array(count).fill(0).map(() => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        r: lerp(0.7, 2.0, Math.random()),
        s: lerp(0.25, 1.15, Math.random()),
        hue: lerp(250, 320, Math.random()),
      }));
      return particles;
    };

    let particles = mkParticles();

    const onPointerMove = rafThrottle((e) => {
      const rect = wrap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const px = clamp(nx, 0, 1);
      const py = clamp(ny, 0, 1);
      cursor.current.vx = px - cursor.current.x;
      cursor.current.vy = py - cursor.current.y;
      cursor.current.x = px;
      cursor.current.y = py;
    });

    const onPointerDown = () => (cursor.current.down = true);
    const onPointerUp = () => (cursor.current.down = false);

    wrap.addEventListener("pointermove", onPointerMove, { passive: true });
    wrap.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });

    let t = 0;
    let rafId = 0;

    const drawAuroraBand = (ctx2, w, h, phase) => {
      // Subtle animated aurora ribbons; cursor adds local warp.
      const dpr = dprRef.current;
      const cx = cursor.current.x * w;
      const cy = cursor.current.y * h;

      // Soft fade pass
      ctx2.globalCompositeOperation = "source-over";
      ctx2.fillStyle = `rgba(5, 3, 15, ${settings.trail})`;
      ctx2.fillRect(0, 0, w, h);

      // Aurora ribbons
      ctx2.globalCompositeOperation = "lighter";

      for (let i = 0; i < 3; i++) {
        const baseY = lerp(0.18, 0.55, i / 2);
        const amp = lerp(26, 54, i / 2) * dpr;
        const freq = lerp(1.4, 2.0, i / 2);
        const drift = lerp(0.0012, 0.0021, i / 2);
        const hueA = 250 + i * 20;
        const hueB = 310 - i * 10;

        const g = ctx2.createLinearGradient(0, h * baseY, w, h * (baseY + 0.18));
        g.addColorStop(0, `hsla(${hueA}, 95%, 68%, 0.0)`);
        g.addColorStop(0.25, `hsla(${hueA}, 95%, 68%, 0.18)`);
        g.addColorStop(0.55, `hsla(${hueB}, 95%, 70%, 0.22)`);
        g.addColorStop(1, `hsla(${hueB}, 95%, 70%, 0.0)`);

        ctx2.beginPath();
        const startX = -w * 0.08;
        ctx2.moveTo(startX, h * baseY);
        for (let x = startX; x <= w * 1.08; x += 18 * dpr) {
          const nx = x / w;
          const cursorWarp = Math.exp(-(((x - cx) ** 2 + (h * baseY - cy) ** 2) / (2 * (220 * dpr) ** 2))) * (cursor.current.down ? 1.25 : 0.65);
          const wave = Math.sin((nx * Math.PI * 2 * freq) + phase * 1.35 + i);
          const wave2 = Math.sin((nx * Math.PI * 2 * (freq * 0.6)) + phase * 0.9 + i * 2.2);
          const y = h * baseY + (wave * amp + wave2 * amp * 0.35) + cursorWarp * (cursor.current.vy * 900 * dpr);
          ctx2.lineTo(x, y);
        }
        ctx2.lineTo(w * 1.08, h * (baseY + 0.28));
        ctx2.lineTo(-w * 0.08, h * (baseY + 0.28));
        ctx2.closePath();
        ctx2.fillStyle = g;
        ctx2.filter = `blur(${6 * dpr}px) saturate(1.2)`;
        ctx2.fill();
      }

      // Cursor spotlight
      const spot = ctx2.createRadialGradient(cx, cy, 0, cx, cy, 320 * dpr);
      spot.addColorStop(0, "rgba(160, 120, 255, 0.12)");
      spot.addColorStop(0.5, "rgba(90, 190, 255, 0.05)");
      spot.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx2.filter = `blur(${10 * dpr}px)`;
      ctx2.fillStyle = spot;
      ctx2.fillRect(0, 0, w, h);

      // Reset
      ctx2.filter = "none";
    };

    const drawParticles = (ctx2, w, h, phase) => {
      const dpr = dprRef.current;
      ctx2.globalCompositeOperation = "lighter";

      for (const p of particles) {
        // drift
        const sp = settings.speed * p.s;
        const vx = (Math.sin(phase * 0.5 + p.z * 8) * 0.00018 + cursor.current.vx * 0.0009) * intensity;
        const vy = (Math.cos(phase * 0.45 + p.z * 8) * 0.00022 + cursor.current.vy * 0.0009) * intensity;
        p.x = (p.x + vx + sp * 0.00014) % 1;
        p.y = (p.y + vy + sp * 0.00008) % 1;
        if (p.x < 0) p.x += 1;
        if (p.y < 0) p.y += 1;

        const x = p.x * w;
        const y = p.y * h;
        const r = p.r * dpr;

        // glow blob
        const g = ctx2.createRadialGradient(x, y, 0, x, y, r * 12);
        g.addColorStop(0, `hsla(${p.hue}, 98%, 70%, ${0.22 * settings.glow})`);
        g.addColorStop(0.25, `hsla(${p.hue + 15}, 98%, 70%, ${0.12 * settings.glow})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx2.fillStyle = g;
        ctx2.beginPath();
        ctx2.arc(x, y, r * 10, 0, Math.PI * 2);
        ctx2.fill();
      }

      // Sparse streaks
      if (Math.random() < 0.08 * intensity) {
        const x = (0.15 + Math.random() * 0.7) * w;
        const y = (0.15 + Math.random() * 0.7) * h;
        const len = (40 + Math.random() * 120) * dpr;
        const ang = (-0.25 + Math.random() * 0.5) * Math.PI;
        const x2 = x + Math.cos(ang) * len;
        const y2 = y + Math.sin(ang) * len;
        const grad = ctx2.createLinearGradient(x, y, x2, y2);
        grad.addColorStop(0, "rgba(120, 210, 255, 0)");
        grad.addColorStop(0.35, "rgba(180, 120, 255, 0.18)");
        grad.addColorStop(1, "rgba(255, 90, 210, 0)");
        ctx2.strokeStyle = grad;
        ctx2.lineWidth = 2.2 * dpr;
        ctx2.beginPath();
        ctx2.moveTo(x, y);
        ctx2.lineTo(x2, y2);
        ctx2.stroke();
      }
    };

    let last = performance.now();
    const FPS = 30;
    const frameMs = 1000 / FPS;

    const loop = (now) => {
      rafId = requestAnimationFrame(loop);

      // stop rendering when tab is hidden
      if (document.hidden) return;

      // FPS cap
      if (now - last < frameMs) return;
      last = now;

      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;

      t += 0.008;

      // Base background darkness
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(4, 3, 12, 0.35)";
      ctx.fillRect(0, 0, w, h);

      drawAuroraBand(ctx, w, h, t);
      drawParticles(ctx, w, h, t);
    };

    rafId = requestAnimationFrame(loop);


    const onVis = () => {
      // re-seed when returning to tab
      if (!document.hidden) particles = mkParticles();
    };

    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [intensity, resize, settings]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Cinematic vignette + grain */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),rgba(0,0,0,0.55)_62%,rgba(0,0,0,0.85))]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.16] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}

// ---------- Confetti burst (micro) ----------
function ConfettiBurst({ trigger }) {
  const ref = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    const mk = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const origin = { x: W / 2, y: H / 2 };
      const n = 22;
      const pieces = new Array(n).fill(0).map((_, i) => {
        const a = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.3;
        const s = 3 + Math.random() * 2;
        return {
          x: origin.x,
          y: origin.y,
          vx: Math.cos(a) * (3.5 + Math.random() * 3.5),
          vy: Math.sin(a) * (3.2 + Math.random() * 3.2) - 2.5,
          r: 2 + Math.random() * 2.2,
          life: 1,
          spin: (Math.random() - 0.5) * 0.25,
          ang: Math.random() * Math.PI,
          hue: 250 + Math.random() * 90,
          s,
        };
      });
      return pieces;
    };

    let pieces = [];

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!activeRef.current) return;

      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      pieces.forEach((p) => {
        p.life -= 0.018;
        p.vy += 0.08;
        p.x += p.vx;
        p.y += p.vy;
        p.ang += p.spin;

        const a = clamp(p.life, 0, 1);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grad.addColorStop(0, `hsla(${p.hue}, 98%, 72%, ${0.35 * a})`);
        grad.addColorStop(0.4, `hsla(${p.hue + 20}, 98%, 70%, ${0.18 * a})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang);
        ctx.fillStyle = `hsla(${p.hue}, 98%, 68%, ${0.65 * a})`;
        ctx.fillRect(-p.s, -p.s / 2, p.s * 2, p.s);
        ctx.restore();
      });

      pieces = pieces.filter((p) => p.life > 0);
      if (pieces.length === 0) {
        activeRef.current = false;
        ctx.clearRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // store pieces in closure via property
    // eslint-disable-next-line no-underscore-dangle
    if (!canvas.__mkPieces) {
      // eslint-disable-next-line no-underscore-dangle
      canvas.__mkPieces = () => [];
    }

    // Recreate pieces via a simple hack: dispatch a custom event with factory
    const ev = new CustomEvent("aurora-confetti", { detail: { ctx } });
    canvas.dispatchEvent(ev);

    // Actual pieces factory & activation lives in the first effect; we toggle through a shared ref
    // Using a tiny trick: set a flag on the canvas that the loop reads
    // eslint-disable-next-line no-underscore-dangle
    canvas.__confettiRequested = (canvas.__confettiRequested || 0) + 1;

    // Activate with a lightweight re-init by painting a small flash
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(160,120,255,0.08)";
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    ctx.fillRect(0, 0, W, H);
  }, [trigger]);

  // Bridge: listen for requests and build pieces into a hidden property.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let pieces = [];
    let active = false;

    const mk = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const origin = { x: W / 2, y: H / 2 };
      const n = 24;
      const arr = new Array(n).fill(0).map((_, i) => {
        const a = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.35;
        const s = 3 + Math.random() * 2.4;
        return {
          x: origin.x,
          y: origin.y,
          vx: Math.cos(a) * (3.8 + Math.random() * 3.8),
          vy: Math.sin(a) * (3.2 + Math.random() * 3.2) - 3.1,
          r: 2 + Math.random() * 2.4,
          life: 1,
          spin: (Math.random() - 0.5) * 0.3,
          ang: Math.random() * Math.PI,
          hue: 245 + Math.random() * 95,
          s,
        };
      });
      return arr;
    };

    const onReq = () => {
      pieces = mk();
      active = true;
      activeRef.current = true;
      // eslint-disable-next-line no-underscore-dangle
      canvas.__pieces = pieces;
      // eslint-disable-next-line no-underscore-dangle
      canvas.__active = active;
    };

    canvas.addEventListener("aurora-confetti", onReq);

    // Patch the loop in the earlier effect by exposing pieces via canvas properties
    // eslint-disable-next-line no-underscore-dangle
    canvas.__getPieces = () => pieces;

    // Keep activeRef in sync
    const sync = () => {
      // eslint-disable-next-line no-underscore-dangle
      const req = canvas.__confettiRequested || 0;
      if (req > 0) {
        // eslint-disable-next-line no-underscore-dangle
        canvas.__confettiRequested = 0;
        onReq();
      }
      requestAnimationFrame(sync);
    };
    const raf = requestAnimationFrame(sync);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("aurora-confetti", onReq);
    };
  }, []);

  // Render overlay; actual drawing is handled inside effects
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
}

// ---------- Horizontal story journey ----------
function HorizontalJourney({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e) => {
      // Convert vertical wheel to horizontal scroll with a cinematic feel
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.15;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={ref}
      className="relative -mx-4 mt-8 flex gap-6 overflow-x-auto px-4 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory"
    >
      {items.map((it, idx) => (
        <motion.div
          key={it.k}
          className="snap-center min-w-[86%] sm:min-w-[68%] lg:min-w-[42%]"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.7, delay: idx * 0.06 }}
        >
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(1200px_circle_at_30%_30%,rgba(150,120,255,0.18),transparent_55%),radial-gradient(900px_circle_at_70%_20%,rgba(60,200,255,0.14),transparent_60%),radial-gradient(900px_circle_at_50%_90%,rgba(255,70,190,0.12),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs tracking-[0.22em] text-white/80">
                  <Stars className="h-4 w-4" />
                  <span>{it.tag}</span>
                </div>
                <div className="text-xs text-white/55">0{idx + 1}</div>
              </div>
              <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                {it.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {it.body}
              </p>

              {/* Micro 3D depth */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {it.stats.map((s) => (
                  <div
                    key={s.k}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="absolute inset-0 opacity-60 [background:linear-gradient(120deg,rgba(255,255,255,0.08),transparent,rgba(150,120,255,0.10))]" />
                    <div className="relative text-xs text-white/60">{s.k}</div>
                    <div className="relative mt-1 text-lg font-semibold text-white">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/60 shadow-[0_0_20px_rgba(170,120,255,0.7)]" />
                <span className="opacity-80">Scroll to continue</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------- Holographic flip speaker cards ----------
function HoloSpeakerCard({ s }) {
  const ref = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rx = useTransform(my, [0, 1], [8, -8]);
  const ry = useTransform(mx, [0, 1], [-10, 10]);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.3 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = rafThrottle((e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      mx.set(clamp(nx, 0, 1));
      my.set(clamp(ny, 0, 1));
    });

    const onLeave = () => {
      mx.set(0.5);
      my.set(0.5);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      style={{
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: "radial-gradient(800px circle at var(--x) var(--y), rgba(120,210,255,0.22), transparent 58%), radial-gradient(700px circle at calc(var(--x) * 0.9) calc(var(--y) * 1.1), rgba(255,80,200,0.18), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent, rgba(150,120,255,0.10))",
          filter: "blur(0px)",
        }}
      />

      <motion.div
        className="relative"
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Avatar */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="absolute inset-0 [background:radial-gradient(900px_circle_at_30%_30%,rgba(150,120,255,0.18),transparent_60%),radial-gradient(800px_circle_at_80%_30%,rgba(60,200,255,0.12),transparent_55%),radial-gradient(800px_circle_at_50%_90%,rgba(255,70,190,0.10),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_30px_rgba(160,120,255,0.35)]">
              <Mic className="h-6 w-6 text-white/90" />
              <div className="absolute -inset-6 opacity-40 blur-2xl [background:radial-gradient(circle,rgba(160,120,255,0.38),transparent_70%)]" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{s.name}</div>
              <div className="text-sm text-white/70">{s.role}</div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/70">{s.bio}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {s.tags.map((t) => (
            <span
              key={t}
              className="relative inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] tracking-[0.18em] text-white/80"
            >
              <span className="absolute inset-0 -z-10 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle,rgba(120,210,255,0.25),transparent_70%)]" />
              {t}
            </span>
          ))}
        </div>

        {/* Holographic sheen line */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-full w-full rounded-3xl"
          style={{
            background:
              "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.14) 38%, rgba(255,255,255,0.06) 44%, transparent 58%)",
            transform: "translateZ(24px)",
            opacity: 0.0,
          }}
          whileHover={{ opacity: 0.75, x: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </motion.div>

      {/* CSS variables for shimmer position */}
      <motion.div
        className="absolute inset-0"
        style={{
          // @ts-ignore
          "--x": useTransform(sx, (v) => `${Math.round(v * 100)}%`),
          // @ts-ignore
          "--y": useTransform(sy, (v) => `${Math.round(v * 100)}%`),
        }}
      />

      {/* Flip hint */}
      <div className="mt-6 flex items-center justify-between text-xs text-white/55">
        <span className="inline-flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>Hover to shimmer</span>
        </span>
        <span className="opacity-70">Aurora Holo</span>
      </div>
    </motion.div>
  );
}

// ---------- Main page ----------
export default function AuroraEventLanding() {
  const [rsvpBurst, setRsvpBurst] = useState(0);

  // Cursor parallax for hero layers
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.4);
  const smx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.35 });
  const smy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.35 });

  const heroGlowX = useTransform(smx, [0, 1], ["18%", "82%"]);
  const heroGlowY = useTransform(smy, [0, 1], ["20%", "76%"]);

  const heroFloat1 = useTransform(smx, [0, 1], [-18, 18]);
  const heroFloat2 = useTransform(smy, [0, 1], [14, -14]);

  const onHeroMove = useMemo(
    () =>
      rafThrottle((e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        mx.set(clamp(nx, 0, 1));
        my.set(clamp(ny, 0, 1));
      }),
    [mx, my]
  );

  const storyItems = useMemo(
    () => [
      {
        k: "pulse",
        tag: "ORIGIN",
        title: "A night where light becomes language",
        body:
          "Aurora Event is a cinematic gathering for creators, engineers, designers, and dreamers — a ritual of neon, sound, and story that turns the room into a living sky.",
        stats: [
          { k: "Atmosphere", v: "Immersive" },
          { k: "Energy", v: "Electric" },
          { k: "Mood", v: "Cinematic" },
        ],
      },
      {
        k: "journey",
        tag: "JOURNEY",
        title: "Scenes, not sections",
        body:
          "Every moment transitions like a film cut: parallax layers, soft lens bloom, and glass surfaces that catch aurora reflections as you glide through the narrative.",
        stats: [
          { k: "Motion", v: "Parallax" },
          { k: "Depth", v: "3D" },
          { k: "Texture", v: "Grain" },
        ],
      },
      {
        k: "signal",
        tag: "SIGNAL",
        title: "Future-ready ideas",
        body:
          "Keynotes and experiences focused on the intersection of creativity and computation — the kind of ideas that feel like a signal from tomorrow.",
        stats: [
          { k: "Talks", v: "5" },
          { k: "Sessions", v: "10+" },
          { k: "Afterglow", v: "∞" },
        ],
      },
      {
        k: "finale",
        tag: "FINALE",
        title: "A finale you can feel",
        body:
          "The night ends with a luminous crescendo: ambient lights, subtle confetti sparks, and a final aurora flare that leaves the audience breathless.",
        stats: [
          { k: "Vibe", v: "Monumental" },
          { k: "Light", v: "Aurora" },
          { k: "Sound", v: "Pulse" },
        ],
      },
    ],
    []
  );

  const schedule = useMemo(
    () => [
      { time: "18:30", title: "Doors + Neon Welcome", note: "Aurora lounge & particle wall" },
      { time: "19:10", title: "Opening Sequence", note: "Cinematic intro, live visuals" },
      { time: "19:30", title: "Keynote: The Future of Feeling", note: "Designing emotion at scale" },
      { time: "20:20", title: "Intermission", note: "Glass bar + soundscapes" },
      { time: "20:45", title: "Panel: Holographic Interfaces", note: "Motion, depth, illusion" },
      { time: "21:30", title: "Afterglow Session", note: "DJ + reactive auroras" },
    ],
    []
  );

  const speakers = useMemo(
    () => [
      {
        name: "Nova Kline",
        role: "Creative Technologist",
        bio: "Builds immersive experiences where motion becomes narrative. Known for luminous UI systems and emotional interaction design.",
        tags: ["MOTION", "AURORA", "INTERACTION"],
      },
      {
        name: "Orion Vale",
        role: "Realtime Graphics Lead",
        bio: "Obsessed with light simulation and cinematic depth. Turns shaders + particles into living atmospheres.",
        tags: ["PARTICLES", "REALTIME", "DEPTH"],
      },
      {
        name: "Mira Sato",
        role: "Product Designer",
        bio: "Designs futuristic interfaces with human warmth — glassmorphism done with purpose, rhythm, and story.",
        tags: ["GLASS", "TYPE", "SYSTEMS"],
      },
      {
        name: "Cassio Grey",
        role: "Sound + Visual Artist",
        bio: "Creates synesthetic performances that sync typography, color, and sound into a single pulse.",
        tags: ["SOUND", "PULSE", "SCENE"],
      },
    ],
    []
  );

  const onRSVP = () => {
    setRsvpBurst((x) => x + 1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030e] text-white">
      {/* Background engine */}
      <ParticleField intensity={1} />

      {/* Global neon aura wash */}
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(1200px_circle_at_15%_10%,rgba(150,120,255,0.22),transparent_55%),radial-gradient(1000px_circle_at_85%_25%,rgba(60,200,255,0.18),transparent_55%),radial-gradient(900px_circle_at_55%_85%,rgba(255,70,190,0.14),transparent_60%)]" />

      {/* Top nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_40px_rgba(160,120,255,0.25)] backdrop-blur">
            <Sparkles className="h-5 w-5" />
            <div className="absolute -inset-8 opacity-40 blur-2xl [background:radial-gradient(circle,rgba(120,210,255,0.32),transparent_70%)]" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.28em]">AURORA</div>
            <div className="text-[11px] tracking-[0.32em] text-white/60">EVENT EXPERIENCE</div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {["Story", "Schedule", "Speakers", "RSVP"].map((t) => (
            <a
              key={t}
              href={`#${t.toLowerCase()}`}
              className="relative transition-colors hover:text-white"
            >
              <span className="relative z-10">{t}</span>
              <span className="absolute -bottom-2 left-0 right-0 h-px origin-left scale-x-0 bg-white/40 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <a
          href="#rsvp"
          className="group relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.22em] text-white/90 shadow-[0_0_60px_rgba(160,120,255,0.20)] backdrop-blur transition hover:bg-white/[0.10]"
        >
          <Ticket className="h-4 w-4" />
          <span>GET ACCESS</span>
          <span className="absolute -inset-8 -z-10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60 [background:radial-gradient(circle,rgba(255,70,190,0.34),transparent_70%)]" />
        </a>
      </header>

      {/* HERO */}
      <section
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 pt-12 md:pb-18 md:pt-16"
        onPointerMove={onHeroMove}
      >
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.22em] text-white/80 shadow-[0_0_90px_rgba(120,210,255,0.18)] backdrop-blur"
            >
              <Calendar className="h-4 w-4" />
              <span>FRI • 13 FEB 2026 • TUNIS</span>
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-white/70 shadow-[0_0_18px_rgba(160,120,255,0.85)]" />
            </motion.div>

            {/* Staggered headline */}
            <div className="mt-6">
              <motion.h1
                className="text-balance text-5xl font-semibold leading-[0.96] tracking-tight sm:text-6xl md:text-7xl"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.06 } },
                }}
              >
                {[
                  "A", "URORA", " ", "E", "VENT", " ", "—", " ", "A", " ", "C", "INEMATIC", " ", "N", "IGHT",
                ].map((chunk, i) => (
                  <motion.span
                    key={i}
                    className={
                      chunk.trim() === "URORA" || chunk.trim() === "CINEMATIC"
                        ? "relative inline-block"
                        : "inline-block"
                    }
                    variants={{
                      hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
                      show: { opacity: 1, y: 0, filter: "blur(0px)" },
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  >
                    {chunk}
                    {(chunk.trim() === "URORA" || chunk.trim() === "CINEMATIC") && (
                      <span className="pointer-events-none absolute -inset-2 -z-10 rounded-2xl opacity-70 blur-2xl [background:radial-gradient(circle,rgba(160,120,255,0.55),rgba(60,200,255,0.25),transparent_70%)]" />
                    )}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                className="mt-6 max-w-xl text-sm leading-relaxed text-white/75 md:text-base"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35 }}
              >
                An ultra-premium immersive experience where neon, motion, and story collide.
                Parallax scenes. Holographic speakers. An RSVP moment that lights up the room.
              </motion.p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.a
                  href="#rsvp"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] px-6 py-4 text-sm font-semibold tracking-[0.14em] shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                >
                  <span className="absolute inset-0 opacity-70 [background:radial-gradient(900px_circle_at_20%_30%,rgba(150,120,255,0.34),transparent_58%),radial-gradient(900px_circle_at_85%_60%,rgba(60,200,255,0.24),transparent_55%),radial-gradient(800px_circle_at_50%_95%,rgba(255,70,190,0.22),transparent_60%)]" />
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.16),transparent)]" />
                  <span className="relative">RSVP NOW</span>
                  <ArrowRight className="relative h-4 w-4 opacity-90" />
                  <span className="absolute -inset-10 -z-10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70 [background:radial-gradient(circle,rgba(255,70,190,0.38),transparent_70%)]" />
                </motion.a>

                <a
                  href="#story"
                  className="group relative inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm tracking-[0.14em] text-white/80 backdrop-blur-xl transition hover:bg-white/[0.06]"
                >
                  <span className="relative">ENTER THE STORY</span>
                  <span className="relative h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_22px_rgba(120,210,255,0.8)]" />
                </a>

                <div className="ml-auto hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs text-white/70 backdrop-blur-xl lg:flex">
                  <MapPin className="h-4 w-4" />
                  <div>
                    <div className="font-semibold tracking-[0.18em] text-white/90">The Glass Atrium</div>
                    <div className="mt-1 tracking-[0.18em] opacity-80">Tunis • Waterfront District</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero cinematic module */}
          <div className="relative md:col-span-5">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_35px_140px_rgba(0,0,0,0.70)] backdrop-blur-xl">
              {/* Interactive glow follows cursor */}
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(1000px circle at var(--gx) var(--gy), rgba(160,120,255,0.26), transparent 58%), radial-gradient(900px circle at calc(var(--gx) * 0.9) calc(var(--gy) * 1.1), rgba(60,200,255,0.22), transparent 60%), radial-gradient(900px circle at calc(var(--gx) * 1.05) calc(var(--gy) * 0.95), rgba(255,70,190,0.18), transparent 60%)",
                }}
              />
              <motion.div
                className="pointer-events-none absolute -inset-20 opacity-70 blur-3xl"
                style={{
                  x: heroFloat1,
                  y: heroFloat2,
                  background:
                    "radial-gradient(circle, rgba(120,210,255,0.28), transparent 65%), radial-gradient(circle, rgba(255,70,190,0.24), transparent 62%), radial-gradient(circle, rgba(160,120,255,0.24), transparent 64%)",
                }}
              />

              {/* Morphing shapes */}
              <div className="relative grid gap-4">
                <motion.div
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-5"
                  animate={{
                    borderRadius: ["28px", "44px", "32px", "28px"],
                  }}
                  transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 opacity-70 [background:radial-gradient(900px_circle_at_25%_35%,rgba(150,120,255,0.24),transparent_60%),radial-gradient(900px_circle_at_85%_55%,rgba(60,200,255,0.18),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent)]" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="text-xs tracking-[0.28em] text-white/75">LIVE AURORA</div>
                      <div className="text-xs text-white/60">REACTIVE</div>
                    </div>
                    <div className="mt-4 text-3xl font-semibold tracking-tight">
                      <span className="text-white">Light</span>
                      <span className="text-white/70"> / </span>
                      <span className="text-white">Motion</span>
                      <span className="text-white/70"> / </span>
                      <span className="text-white">Pulse</span>
                    </div>
                    <div className="mt-4 text-sm text-white/70">
                      Cursor-driven glow, layered parallax, cinematic shadows.
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  >
                    <div className="absolute inset-0 opacity-60 [background:radial-gradient(700px_circle_at_30%_20%,rgba(255,70,190,0.16),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent)]" />
                    <div className="relative text-xs tracking-[0.24em] text-white/70">SECTIONS</div>
                    <div className="relative mt-2 text-2xl font-semibold">5</div>
                    <div className="relative mt-1 text-xs text-white/60">Hero • Story • Schedule • Speakers • RSVP</div>
                  </motion.div>

                  <motion.div
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  >
                    <div className="absolute inset-0 opacity-60 [background:radial-gradient(700px_circle_at_70%_20%,rgba(60,200,255,0.18),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent)]" />
                    <div className="relative text-xs tracking-[0.24em] text-white/70">MODE</div>
                    <div className="relative mt-2 text-2xl font-semibold">IMAX</div>
                    <div className="relative mt-1 text-xs text-white/60">Glassmorphism + neon gradients</div>
                  </motion.div>
                </div>
              </div>

              {/* gx/gy variables */}
              <motion.div
                className="absolute inset-0"
                style={{
                  // @ts-ignore
                  "--gx": heroGlowX,
                  // @ts-ignore
                  "--gy": heroGlowY,
                }}
              />
            </div>
          </div>
        </div>

        {/* Hero divider */}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </section>

      {/* STORY (Horizontal Journey) */}
      <section id="story" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.22em] text-white/75 backdrop-blur">
              <Stars className="h-4 w-4" />
              <span>STORY JOURNEY</span>
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              A horizontal scroll narrative,
              <span className="text-white/70"> like a film sequence.</span>
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">
            Glide through scenes with snap points, micro-interactions, and subtle 3D depth.
            Every card catches light like glass under auroras.
          </p>
        </div>

        <HorizontalJourney items={storyItems} />
      </section>

      {/* SCHEDULE */}
      <section id="schedule" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.22em] text-white/75 backdrop-blur">
              <Calendar className="h-4 w-4" />
              <span>SCHEDULE</span>
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight">The night unfolds</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Structured like a movie: opening sequence, keynotes, intermission, a final luminous afterglow.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_35px_140px_rgba(0,0,0,0.60)] backdrop-blur-xl">
              <div className="absolute inset-0 opacity-60 [background:radial-gradient(1000px_circle_at_20%_20%,rgba(150,120,255,0.18),transparent_58%),radial-gradient(900px_circle_at_85%_30%,rgba(60,200,255,0.12),transparent_55%),radial-gradient(900px_circle_at_55%_95%,rgba(255,70,190,0.10),transparent_60%)]" />
              <div className="relative divide-y divide-white/10">
                {schedule.map((row, idx) => (
                  <motion.div
                    key={row.time}
                    className="group grid grid-cols-12 items-center gap-4 px-6 py-5"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  >
                    <div className="col-span-12 sm:col-span-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs tracking-[0.22em] text-white/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_18px_rgba(120,210,255,0.8)]" />
                        {row.time}
                      </div>
                    </div>
                    <div className="col-span-12 sm:col-span-7">
                      <div className="text-lg font-semibold text-white">{row.title}</div>
                      <div className="mt-1 text-sm text-white/65">{row.note}</div>
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/75 transition group-hover:bg-white/[0.08]">
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)]" />
                        <div className="relative flex items-center justify-between">
                          <span>Seat</span>
                          <span className="font-semibold">Limited</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPEAKERS */}
      <section id="speakers" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.22em] text-white/75 backdrop-blur">
              <Mic className="h-4 w-4" />
              <span>SPEAKERS</span>
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Holographic minds,
              <span className="text-white/70"> shimmering ideas.</span>
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">
            Cards flip with light. Shimmer follows your cursor. Each speaker is a living hologram.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {speakers.map((s) => (
            <HoloSpeakerCard key={s.name} s={s} />
          ))}
        </div>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-white/[0.05] p-8 shadow-[0_45px_160px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:p-12">
          <div className="absolute inset-0 opacity-70 [background:radial-gradient(1200px_circle_at_30%_20%,rgba(150,120,255,0.26),transparent_60%),radial-gradient(1100px_circle_at_80%_30%,rgba(60,200,255,0.20),transparent_60%),radial-gradient(1000px_circle_at_55%_95%,rgba(255,70,190,0.18),transparent_64%)]" />

          {/* Ambient light trails */}
          <motion.div
            className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full opacity-60 blur-3xl"
            animate={{ x: [0, 160, -40, 0], y: [0, 40, 120, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: "radial-gradient(circle, rgba(120,210,255,0.34), transparent 70%)" }}
          />
          <motion.div
            className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full opacity-60 blur-3xl"
            animate={{ x: [0, -140, 60, 0], y: [0, -30, -110, 0] }}
            transition={{ duration: 11.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: "radial-gradient(circle, rgba(255,70,190,0.30), transparent 70%)" }}
          />

          <div className="relative grid gap-10 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.22em] text-white/75">
                <Ticket className="h-4 w-4" />
                <span>RSVP</span>
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Claim your seat
                <span className="text-white/70"> inside the aurora.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
                A single click triggers a micro-confetti flare and seals your entry into the most cinematic night of the year.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="text-xs tracking-[0.22em] text-white/65">DRESS CODE</div>
                  <div className="mt-2 text-lg font-semibold">Neon Noir</div>
                  <div className="mt-1 text-sm text-white/65">Black base + aurora accents</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="text-xs tracking-[0.22em] text-white/65">ENTRY</div>
                  <div className="mt-2 text-lg font-semibold">Invite-only</div>
                  <div className="mt-1 text-sm text-white/65">Limited capacity</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_110px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                <ConfettiBurst trigger={rsvpBurst} />

                <div className="absolute inset-0 opacity-60 [background:linear-gradient(135deg,rgba(255,255,255,0.08),transparent,rgba(150,120,255,0.10))]" />
                <div className="relative">
                  <div className="text-xs tracking-[0.26em] text-white/70">ACCESS FORM</div>

                  <div className="mt-5 grid gap-3">
                    <label className="text-xs tracking-[0.22em] text-white/60">NAME</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none ring-0 focus:border-white/25"
                      placeholder="Your full name"
                    />

                    <label className="mt-3 text-xs tracking-[0.22em] text-white/60">EMAIL</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none ring-0 focus:border-white/25"
                      placeholder="you@gmail.com"
                    />

                    <label className="mt-3 text-xs tracking-[0.22em] text-white/60">TICKET TYPE</label>
                    <select className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none ring-0 focus:border-white/25">
                      <option>General — Aurora Floor</option>
                      <option>Premium — Glass Balcony</option>
                      <option>Ultra — Backstage Afterglow</option>
                    </select>
                  </div>

                  <motion.button
                    onClick={onRSVP}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.985 }}
                    className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-6 py-4 text-sm font-semibold tracking-[0.16em] shadow-[0_30px_130px_rgba(0,0,0,0.55)]"
                  >
                    <span className="absolute inset-0 opacity-80 [background:radial-gradient(900px_circle_at_30%_40%,rgba(150,120,255,0.36),transparent_58%),radial-gradient(900px_circle_at_85%_55%,rgba(60,200,255,0.26),transparent_58%),radial-gradient(800px_circle_at_50%_95%,rgba(255,70,190,0.22),transparent_62%)]" />
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)]" />
                    <span className="relative">LOCK IN RSVP</span>
                    <Sparkles className="relative h-4 w-4" />
                  </motion.button>

                  <div className="mt-4 text-center text-xs text-white/55">
                    By clicking RSVP, you agree to be contacted about event access.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="relative z-10 mx-auto mt-12 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-2 pb-10 text-xs text-white/55">
          <div className="tracking-[0.24em]">AURORA EVENT • IMMERSIVE EXPERIENCE</div>
          <div className="flex items-center gap-4">
            <span className="opacity-80">© 2026</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <a className="hover:text-white" href="#hero">Back to top</a>
          </div>
        </footer>
      </section>

      {/* Floating cinematic pulse */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed bottom-8 left-1/2 z-0 h-1 w-[70vw] max-w-4xl -translate-x-1/2 opacity-70 [background:linear-gradient(90deg,transparent,rgba(120,210,255,0.35),rgba(160,120,255,0.55),rgba(255,70,190,0.35),transparent)]"
        animate={{ opacity: [0.35, 0.85, 0.45] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Accessibility: reduced motion support */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { scroll-behavior: auto !important; }
        }
      `}</style>
    </div>
  );
}
