'use client';

import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';
import './SpecularButton.css';

const PAD = 20;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  // Dark base stroke hugging the edge for a sense of thickness
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  // Symmetric specular: the edges facing toward/away from the light both
  // catch a streak. The angular window (size + fade) is measured with an
  // elliptical normal so it varies continuously along straight edges.
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

import { Loader2 } from 'lucide-react';

export interface SpecularButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'primary' | 'secondary' | 'emerald' | 'plum' | 'dark' | 'outline' | 'destructive';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const SpecularButton = React.forwardRef<HTMLButtonElement, SpecularButtonProps>(
  (
    {
      children = 'Get Started',
      size = 'lg',
      radius,
      tint,
      tintOpacity,
      blur = 0,
      textColor,
      lineColor,
      baseColor,
      intensity = 1,
      shineSize = 10,
      shineFade = 40,
      thickness = 1,
      speed = 0.35,
      followMouse = true,
      proximity = 250,
      autoAnimate,
      disabled = false,
      onClick,
      className = '',
      type = 'button',
      style,
      variant = 'default',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ...rest
    },
    forwardedRef
  ) => {
    const internalBtnRef = useRef<HTMLButtonElement | null>(null);
    const fxRef = useRef<HTMLSpanElement | null>(null);
    const propsRef = useRef<any>({});

    // Variant defaults
    let defaultRadius = 18;
    let defaultTint = '#ffffff';
    let defaultTintOpacity = 0;
    let defaultTextColor = '#f5f5f5';
    let defaultLineColor = '#ffffff';
    let defaultBaseColor = '#525252';

    if (variant === 'primary') {
      defaultRadius = 16;
      defaultTint = '#4f46e5';
      defaultTintOpacity = 1;
      defaultTextColor = '#ffffff';
      defaultLineColor = '#c7d2fe';
      defaultBaseColor = '#3730a3';
    } else if (variant === 'emerald') {
      defaultRadius = 16;
      defaultTint = '#059669';
      defaultTintOpacity = 1;
      defaultTextColor = '#ffffff';
      defaultLineColor = '#a7f3d0';
      defaultBaseColor = '#065f46';
    } else if (variant === 'plum') {
      defaultRadius = 16;
      defaultTint = '#581c87';
      defaultTintOpacity = 1;
      defaultTextColor = '#ffffff';
      defaultLineColor = '#f0abfc';
      defaultBaseColor = '#3b0764';
    } else if (variant === 'dark') {
      defaultRadius = 16;
      defaultTint = '#0f172a';
      defaultTintOpacity = 0.95;
      defaultTextColor = '#f8fafc';
      defaultLineColor = '#60a5fa';
      defaultBaseColor = '#334155';
    } else if (variant === 'secondary') {
      defaultRadius = 14;
      defaultTint = '#ffffff';
      defaultTintOpacity = 0.95;
      defaultTextColor = '#1e293b';
      defaultLineColor = '#cbd5e1';
      defaultBaseColor = '#94a3b8';
    }

    const effectiveRadius = radius !== undefined ? radius : defaultRadius;
    const effectiveTint = tint !== undefined ? tint : defaultTint;
    const effectiveTintOpacity = tintOpacity !== undefined ? tintOpacity : defaultTintOpacity;
    const effectiveTextColor = textColor !== undefined ? textColor : defaultTextColor;
    const effectiveLineColor = lineColor !== undefined ? lineColor : defaultLineColor;
    const effectiveBaseColor = baseColor !== undefined ? baseColor : defaultBaseColor;
    // On touch devices or when autoAnimate is explicitly true, keep shine sweeping
    const effectiveAutoAnimate = autoAnimate !== undefined ? autoAnimate : false;

    // Expose ref to caller if provided
    React.useImperativeHandle(forwardedRef, () => internalBtnRef.current as HTMLButtonElement);

    propsRef.current = {
      radius: effectiveRadius,
      lineColor: effectiveLineColor,
      baseColor: effectiveBaseColor,
      intensity,
      shineSize,
      shineFade,
      thickness,
      speed,
      followMouse,
      proximity,
      autoAnimate: effectiveAutoAnimate,
    };

    useEffect(() => {
      const btn = internalBtnRef.current;
      const fx = fxRef.current;
      if (!btn || !fx || typeof window === 'undefined') return;

      let raf = 0;
      let ro: ResizeObserver | null = null;
      let cleanupPointer: (() => void) | null = null;
      let renderer: Renderer | null = null;

      try {
        const dpr = window.devicePixelRatio || 1;
        renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
        const gl = renderer.gl;
        if (!gl) return;

        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        const geometry = new Triangle(gl);
        if ((geometry.attributes as any).uv) delete (geometry.attributes as any).uv;

        const program = new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms: {
            uCenter: { value: [0, 0] },
            uHalfSize: { value: [1, 1] },
            uRadius: { value: 0 },
            uAngle: { value: 2.4 },
            uPx: { value: dpr },
            uLineColor: { value: [1, 1, 1] },
            uBaseColor: { value: [0.32, 0.32, 0.32] },
            uIntensity: { value: 1 },
            uShineSize: { value: 0.17 },
            uShineFade: { value: 0.7 },
            uThickness: { value: 1 },
            uBaseWidth: { value: dpr },
          },
        });

        const mesh = new Mesh(gl, { geometry, program });
        fx.appendChild(gl.canvas);

        const sizeRef = { w: 1, h: 1 };
        const resize = () => {
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const w = rect.width;
          const h = rect.height;
          sizeRef.w = w;
          sizeRef.h = h;
          renderer?.setSize(w + PAD * 2, h + PAD * 2);
          program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr];
          program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr];
        };

        ro = new ResizeObserver(resize);
        ro.observe(btn);
        resize();

        let pointerAngle: number | null = null;
        let proximityT = 0;
        const onPointerMove = (e: PointerEvent) => {
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
          const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
          const dist = Math.hypot(dx, dy);

          if (dist === 0) {
            const nx = (e.clientX - cx) / (rect.width / 2);
            const ny = (cy - e.clientY) / (rect.height / 2);
            pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
          } else {
            pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
          }
          const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1));
          proximityT = t * t * (3 - 2 * t);
        };

        window.addEventListener('pointermove', onPointerMove);
        cleanupPointer = () => window.removeEventListener('pointermove', onPointerMove);

        let angle = 2.4;
        let idleAngle = 2.4;
        let bright = 0;
        let last = performance.now();

        const lineC = new Color();
        const baseC = new Color();

        const update = (now: number) => {
          raf = requestAnimationFrame(update);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          const p = propsRef.current;

          idleAngle += p.speed * dt;
          const steer = p.followMouse && pointerAngle != null && (!p.autoAnimate || proximityT > 0);
          const target = steer ? pointerAngle : idleAngle;
          const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          angle += diff * (1 - Math.exp(-dt * 7));

          const brightTarget = p.autoAnimate ? 1 : proximityT;
          bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

          lineC.set(p.lineColor);
          baseC.set(p.baseColor);
          program.uniforms.uAngle.value = angle;
          program.uniforms.uRadius.value =
            Math.min(p.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr;
          program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b];
          program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b];
          program.uniforms.uIntensity.value = p.intensity * bright;
          program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180;
          program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180;
          program.uniforms.uThickness.value = p.thickness * dpr;
          renderer?.render({ scene: mesh });
        };
        raf = requestAnimationFrame(update);

        return () => {
          if (raf) cancelAnimationFrame(raf);
          if (ro) ro.disconnect();
          if (cleanupPointer) cleanupPointer();
          try {
            if (gl?.canvas && gl.canvas.parentNode === fx) {
              fx.removeChild(gl.canvas);
            }
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
          } catch {
            // Ignore cleanup errors
          }
        };
      } catch (err) {
        console.warn('WebGL specular highlights unavailable:', err);
      }
    }, []);

    return (
      <button
        ref={internalBtnRef}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`specular-button specular-button--${size}${fullWidth ? ' specular-button--full w-full' : ''}${className ? ` ${className}` : ''}`}
        style={
          {
            '--sb-radius': `${effectiveRadius}px`,
            '--sb-tint': effectiveTint,
            '--sb-tint-opacity': effectiveTintOpacity,
            '--sb-blur': `${blur}px`,
            '--sb-text-color': effectiveTextColor,
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      >
        <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
        <span className="specular-button__label">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>{loadingText || children}</span>
            </>
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              <span>{children}</span>
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </span>
      </button>
    );
  }
);

SpecularButton.displayName = 'SpecularButton';

export default SpecularButton;
