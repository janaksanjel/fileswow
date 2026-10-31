"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Vibrant bird colors (different color every time!)
const BIRD_COLORS = [
  { body: 0xff6a00, wing: 0xff8c1a, belly: 0xfff3e0, name: "Orange Wowie" },
  { body: 0x2563eb, wing: 0x3b82f6, belly: 0xeff6ff, name: "Blue Jay" },
  { body: 0x10b981, wing: 0x34d399, belly: 0xecfdf5, name: "Emerald Bird" },
  { body: 0x8b5cf6, wing: 0xa78bfa, belly: 0xf5f3ff, name: "Purple Finch" },
  { body: 0xf43f5e, wing: 0xfb7185, belly: 0xfff1f2, name: "Ruby Robin" },
  { body: 0x0ea5e9, wing: 0x38bdf8, belly: 0xf0f9ff, name: "Cyan Kingfisher" },
  { body: 0xeab308, wing: 0xfacc15, belly: 0xfefce8, name: "Golden Canary" },
];

// Curated top tools / for-you tools
const TOP_TOOLS = [
  { slug: "merge-pdf", name: "Merge PDF" },
  { slug: "compress-pdf", name: "Compress PDF" },
  { slug: "pdf-to-word", name: "PDF to Word" },
  { slug: "word-to-pdf", name: "Word to PDF" },
  { slug: "split-pdf", name: "Split PDF" },
  { slug: "jpg-to-pdf", name: "JPG to PDF" },
  { slug: "pdf-to-jpg", name: "PDF to JPG" },
  { slug: "sign-pdf", name: "Sign PDF" },
  { slug: "edit-pdf", name: "Edit PDF" },
  { slug: "remove-watermark-pdf", name: "Remove Watermark PDF" },
  { slug: "remove-watermark-image", name: "Remove Watermark Image" },
  { slug: "background-remove-image", name: "Remove Background" },
  { slug: "resize-image", name: "Resize Image" },
  { slug: "crop-image", name: "Crop Image" },
  { slug: "compress-image", name: "Compress Image" },
  { slug: "ocr-pdf", name: "OCR PDF" },
  { slug: "protect-pdf", name: "Protect PDF" },
  { slug: "excel-to-pdf", name: "Excel to PDF" },
  { slug: "pdf-to-excel", name: "PDF to Excel" },
];

/**
 * FlyingMascot — 3D bird that flies autonomously across the entire website.
 * Roams independently across the screen (does NOT follow cursor).
 * When clicked, it crashes/drops down, vanishes with a sparkle burst,
 * and after 1 second a brand-new bird with a different color swoops in!
 */
export function FlyingMascot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let isDisposed = false;
    let animId: number;

    const loadThree = (): Promise<any> => {
      if ((window as any).THREE) return Promise.resolve((window as any).THREE);
      return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src*="three.min.js"]');
        if (existing) {
          if ((window as any).THREE) return resolve((window as any).THREE);
          existing.addEventListener("load", () => resolve((window as any).THREE));
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.async = true;
        script.onload = () => resolve((window as any).THREE);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadThree().then((THREE) => {
      if (isDisposed || !canvasRef.current) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 14);

      // Lighting
      scene.add(new THREE.HemisphereLight(0xfff7ed, 0xff7a1a, 1.1));
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
      sunLight.position.set(5, 8, 8);
      scene.add(sunLight);

      // ─── Build Bird Mascot ───
      const birdGroup = new THREE.Group();
      scene.add(birdGroup);

      let colorIdx = 0;
      const curColor = BIRD_COLORS[colorIdx];

      // Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: curColor.body,
        roughness: 0.38,
        metalness: 0.05,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 22), bodyMat);
      birdGroup.add(body);

      // Belly
      const bellyMat = new THREE.MeshBasicMaterial({ color: curColor.belly });
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), bellyMat);
      belly.position.set(0, -0.06, 0.16);
      belly.scale.set(1, 0.9, 0.45);
      birdGroup.add(belly);

      // Golden beak
      const beakMat = new THREE.MeshStandardMaterial({
        color: 0xffa000,
        roughness: 0.3,
      });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 16), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.02, 0.38);
      birdGroup.add(beak);

      // Eyes
      const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0f1c });
      const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      [-1, 1].forEach((dir) => {
        const eyeGroup = new THREE.Group();
        const sc = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), eyeWhite);
        sc.scale.z = 0.45;
        eyeGroup.add(sc);

        const pu = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), pupilMat);
        pu.position.set(0, 0, 0.025);
        pu.scale.z = 0.45;
        eyeGroup.add(pu);

        const sh = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), shineMat);
        sh.position.set(0.015, 0.02, 0.04);
        eyeGroup.add(sh);

        eyeGroup.position.set(dir * 0.13, 0.11, 0.27);
        eyeGroup.rotation.y = dir * 0.25;
        birdGroup.add(eyeGroup);
      });

      // Wings
      const wingMat = new THREE.MeshStandardMaterial({
        color: curColor.wing,
        roughness: 0.45,
        side: THREE.DoubleSide,
      });

      function createWingShape() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.28, 0.22, 0.52, 0.04);
        shape.quadraticCurveTo(0.25, -0.15, 0, 0);
        return shape;
      }
      const wingGeo = new THREE.ShapeGeometry(createWingShape());

      const leftWingPivot = new THREE.Group();
      leftWingPivot.position.set(-0.32, 0.05, 0);
      const leftWingMesh = new THREE.Mesh(wingGeo, wingMat);
      leftWingMesh.scale.set(-1, 1, 1);
      leftWingPivot.add(leftWingMesh);
      birdGroup.add(leftWingPivot);

      const rightWingPivot = new THREE.Group();
      rightWingPivot.position.set(0.32, 0.05, 0);
      const rightWingMesh = new THREE.Mesh(wingGeo, wingMat);
      rightWingPivot.add(rightWingMesh);
      birdGroup.add(rightWingPivot);

      // Tail
      const tailMat = new THREE.MeshStandardMaterial({ color: curColor.wing, roughness: 0.4 });
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), tailMat);
      tail.rotation.x = -Math.PI / 2 + 0.2;
      tail.position.set(0, 0.06, -0.36);
      birdGroup.add(tail);

      // Function to apply a new different color to the bird
      function applyNewColor() {
        // Pick guaranteed different color
        const nextIdx = (colorIdx + 1 + Math.floor(Math.random() * (BIRD_COLORS.length - 1))) % BIRD_COLORS.length;
        colorIdx = nextIdx;
        const c = BIRD_COLORS[colorIdx];

        bodyMat.color.setHex(c.body);
        bellyMat.color.setHex(c.belly);
        wingMat.color.setHex(c.wing);
        tailMat.color.setHex(c.wing);
      }

      // ─── Sparkle Trail ───
      const TRAIL_COUNT = 36;
      const trailPositions = new Float32Array(TRAIL_COUNT * 3).fill(-999);
      const trailColors = new Float32Array(TRAIL_COUNT * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));

      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = 32;
      dotCanvas.height = 32;
      const dotCtx = dotCanvas.getContext("2d")!;
      const dotGrad = dotCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
      dotGrad.addColorStop(0, "rgba(255,255,255,1)");
      dotGrad.addColorStop(0.5, "rgba(255,180,0,0.85)");
      dotGrad.addColorStop(1, "rgba(255,100,0,0)");
      dotCtx.fillStyle = dotGrad;
      dotCtx.fillRect(0, 0, 32, 32);
      const trailTex = new THREE.CanvasTexture(dotCanvas);

      const trailMat = new THREE.PointsMaterial({
        map: trailTex,
        size: 0.35,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const trailPoints = new THREE.Points(trailGeo, trailMat);
      scene.add(trailPoints);

      let trailIdx = 0;
      let lastTrailTime = 0;

      // ─── Resize & Visible Frustum Calc ───
      let visibleHeight = 11.6;
      let visibleWidth = 11.6 * (window.innerWidth / window.innerHeight);

      const handleResize = () => {
        if (!canvasRef.current) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        const halfFovRad = (45 * Math.PI) / 360;
        visibleHeight = 2 * 14 * Math.tan(halfFovRad);
        visibleWidth = visibleHeight * (w / h);
      };
      window.addEventListener("resize", handleResize);
      handleResize();

      // ─── State Management ───
      // "flying" | "crashing" | "vanished" | "spawning"
      let birdState: "flying" | "crashing" | "vanished" | "spawning" = "flying";
      let crashVy = 0;
      let crashVx = 0;
      let crashRotSpeed = 0;
      let spawnProgress = 1;

      // Current bird world position & velocity
      const birdPos = new THREE.Vector3(0, 1.5, 0);
      const birdVel = new THREE.Vector3(1.5, 0.4, 0);

      // Autonomous flight target waypoint (never chases cursor)
      const targetWaypoint = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 1.5
      );
      let waypointTimer = 0;

      // Current 2D screen coordinates for click detection
      let currentScreenX = -999;
      let currentScreenY = -999;
      let isHovering = false;

      // Check if cursor hovers over the bird (for tap/click interaction only — does NOT follow cursor)
      const handlePointerMove = (e: MouseEvent) => {
        if (birdState === "flying") {
          const dist = Math.hypot(e.clientX - currentScreenX, e.clientY - currentScreenY);
          const isNear = dist < 48;

          if (isNear !== isHovering) {
            isHovering = isNear;
            if (canvasRef.current) {
              canvasRef.current.style.pointerEvents = isNear ? "auto" : "none";
              canvasRef.current.style.cursor = isNear ? "pointer" : "default";
            }
            if (isNear) {
              setTooltip({
                x: currentScreenX,
                y: currentScreenY - 45,
                text: "💥 Tap me to crash & surprise tool!",
              });
            } else {
              setTooltip(null);
            }
          } else if (isNear) {
            setTooltip((prev) =>
              prev ? { ...prev, x: currentScreenX, y: currentScreenY - 45 } : null
            );
          }
        }
      };

      // ─── Click / Crash Handler ───
      const handleBirdClick = (e: MouseEvent) => {
        if (birdState !== "flying") return;
        const dist = Math.hypot(e.clientX - currentScreenX, e.clientY - currentScreenY);
        if (dist >= 55) return;

        e.stopPropagation();
        e.preventDefault();

        // 1. Crash and drop down!
        birdState = "crashing";
        crashVy = 3.5; // little upward recoil then falls with gravity
        crashVx = (Math.random() - 0.5) * 6;
        crashRotSpeed = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 8);

        // Burst explosion of particles
        for (let k = 0; k < 18; k++) {
          const idx = (trailIdx++ % TRAIL_COUNT) * 3;
          trailPositions[idx] = birdPos.x + (Math.random() - 0.5) * 0.6;
          trailPositions[idx + 1] = birdPos.y + (Math.random() - 0.5) * 0.6;
          trailPositions[idx + 2] = birdPos.z + (Math.random() - 0.5) * 0.6;
          trailColors[idx] = 1.0;
          trailColors[idx + 1] = 0.5 + Math.random() * 0.5;
          trailColors[idx + 2] = 0.1;
        }
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;

        // Select random top tool / for-you tool
        const pick = TOP_TOOLS[Math.floor(Math.random() * TOP_TOOLS.length)];
        setTooltip({
          x: currentScreenX,
          y: currentScreenY - 45,
          text: `💥 Crashed! Launching ${pick.name}!`,
        });

        // Navigate to the chosen tool
        setTimeout(() => {
          router.push(`/tools/${pick.slug}`);
          setTooltip(null);
        }, 650);

        // Turn off pointer events immediately while crashing
        if (canvasRef.current) {
          canvasRef.current.style.pointerEvents = "none";
          canvasRef.current.style.cursor = "default";
        }
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      canvas.addEventListener("click", handleBirdClick);

      let isPaused = false;
      const handleVisibilityChange = () => {
        isPaused = document.visibilityState === "hidden";
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const clock = new THREE.Clock();
      let t = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (isPaused) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt;

        if (birdState === "flying") {
          // ─── Autonomous Flight Physics (Free Roaming — No Cursor Tracking) ───
          waypointTimer += dt;
          const boundX = Math.max((visibleWidth / 2) * 0.78, 4);
          const boundY = Math.max((visibleHeight / 2) * 0.68, 2.8);

          const dx = targetWaypoint.x - birdPos.x;
          const dy = targetWaypoint.y - birdPos.y;
          const dz = targetWaypoint.z - birdPos.z;
          const dist = Math.hypot(dx, dy, dz);

          // Pick new waypoint when close or after roaming for 5-7s
          if (dist < 1.6 || waypointTimer > 6.5) {
            waypointTimer = 0;
            targetWaypoint.set(
              (Math.random() - 0.5) * boundX * 1.8,
              (Math.random() - 0.5) * boundY * 1.6,
              (Math.random() - 0.5) * 1.4
            );
          }

          // Smooth steering toward target waypoint
          const cruiseSpeed = 2.4;
          const desiredVx = (dx / (dist + 0.001)) * cruiseSpeed;
          const desiredVy = (dy / (dist + 0.001)) * (cruiseSpeed * 0.75);
          const desiredVz = (dz / (dist + 0.001)) * 1.1;

          birdVel.x += (desiredVx - birdVel.x) * 1.8 * dt;
          birdVel.y += (desiredVy - birdVel.y) * 1.8 * dt;
          birdVel.z += (desiredVz - birdVel.z) * 1.8 * dt;

          // Gentle organic bobbing
          birdVel.y += Math.sin(t * 2.6) * 0.22 * dt;

          // Soft boundary turn margin
          if (Math.abs(birdPos.x) > boundX) birdVel.x -= Math.sign(birdPos.x) * 4.5 * dt;
          if (Math.abs(birdPos.y) > boundY) birdVel.y -= Math.sign(birdPos.y) * 4.5 * dt;

          birdPos.addScaledVector(birdVel, dt * 2.6);
          birdGroup.position.copy(birdPos);

          // Orientation towards movement direction
          const speed = birdVel.length();
          if (speed > 0.05) {
            const targetRotY = Math.atan2(birdVel.x, birdVel.z + 0.001);
            const targetRotX = -birdVel.y * 0.35;
            const targetRotZ = -birdVel.x * 0.35; // banking into turns

            birdGroup.rotation.y = THREE.MathUtils.lerp(birdGroup.rotation.y, targetRotY, 0.12);
            birdGroup.rotation.x = THREE.MathUtils.lerp(birdGroup.rotation.x, targetRotX, 0.12);
            birdGroup.rotation.z = THREE.MathUtils.lerp(birdGroup.rotation.z, targetRotZ, 0.12);
          }

          // Flapping wings
          const flapSpeed = 12 + speed * 8;
          const flapAngle = Math.sin(t * flapSpeed) * 0.45;
          leftWingPivot.rotation.z = flapAngle;
          rightWingPivot.rotation.z = -flapAngle;
          body.position.y = Math.sin(t * flapSpeed * 0.5) * 0.02;

          // Normal scale
          birdGroup.scale.set(1, 1, 1);
        } else if (birdState === "crashing") {
          // ─── Crash & Drop Down Animation ───
          // Gravity accelerates downward
          crashVy -= 32 * dt;
          birdPos.x += crashVx * dt;
          birdPos.y += crashVy * dt;
          birdGroup.position.copy(birdPos);

          // Wild tumble spin
          birdGroup.rotation.z += crashRotSpeed * dt;
          birdGroup.rotation.x += crashRotSpeed * 0.7 * dt;

          // Rapid panicked wing flail
          const flapAngle = Math.sin(t * 40) * 0.65;
          leftWingPivot.rotation.z = flapAngle;
          rightWingPivot.rotation.z = -flapAngle;

          // When it drops below the visible screen bottom, it vanishes!
          if (birdPos.y < -visibleHeight / 2 - 1.5) {
            birdState = "vanished";
            birdGroup.scale.set(0.001, 0.001, 0.001);

            // Exactly 1 second later, spawn a new bird with a DIFFERENT color!
            setTimeout(() => {
              if (isDisposed) return;
              applyNewColor();

              // Spawn swooping in from above/offscreen
              const spawnSide = Math.random() > 0.5 ? 1 : -1;
              birdPos.set(
                spawnSide * (visibleWidth / 2 + 1.5),
                visibleHeight / 2 + 1,
                0
              );
              birdVel.set(-spawnSide * 4, -3, 0);
              birdGroup.position.copy(birdPos);
              birdGroup.rotation.set(0, spawnSide > 0 ? -Math.PI / 2 : Math.PI / 2, 0);

              // Target opposite side of screen
              targetWaypoint.set(
                -spawnSide * ((visibleWidth / 2) * 0.5),
                (Math.random() - 0.5) * 3,
                0
              );
              waypointTimer = 0;

              birdState = "spawning";
              spawnProgress = 0;
            }, 1000);
          }
        } else if (birdState === "spawning") {
          // Swoop in smoothly from offscreen
          spawnProgress = Math.min(1, spawnProgress + dt * 2.2);
          const scale = THREE.MathUtils.lerp(0.2, 1, spawnProgress);
          birdGroup.scale.set(scale, scale, scale);

          birdPos.x += birdVel.x * dt;
          birdPos.y += birdVel.y * dt;
          birdGroup.position.copy(birdPos);

          const flapAngle = Math.sin(t * 22) * 0.48;
          leftWingPivot.rotation.z = flapAngle;
          rightWingPivot.rotation.z = -flapAngle;

          if (spawnProgress >= 1) {
            birdState = "flying";
          }
        }

        // Project 3D position to 2D viewport coordinates
        const projected = new THREE.Vector3(birdPos.x, birdPos.y, birdPos.z);
        projected.project(camera);
        currentScreenX = ((projected.x + 1) / 2) * window.innerWidth;
        currentScreenY = ((-projected.y + 1) / 2) * window.innerHeight;

        // Sparkle trail
        if (birdState !== "vanished" && t - lastTrailTime > 0.04) {
          lastTrailTime = t;
          const tailWorld = new THREE.Vector3(0, 0, -0.38).applyMatrix4(birdGroup.matrixWorld);
          const i = (trailIdx++ % TRAIL_COUNT) * 3;
          trailPositions[i] = tailWorld.x + (Math.random() - 0.5) * 0.08;
          trailPositions[i + 1] = tailWorld.y + (Math.random() - 0.5) * 0.08;
          trailPositions[i + 2] = tailWorld.z + (Math.random() - 0.5) * 0.08;

          const c = BIRD_COLORS[colorIdx];
          const rgb = new THREE.Color(c.wing);
          trailColors[i] = rgb.r;
          trailColors[i + 1] = rgb.g;
          trailColors[i + 2] = rgb.b;

          trailGeo.attributes.position.needsUpdate = true;
          trailGeo.attributes.color.needsUpdate = true;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("click", handleBirdClick);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    });

    const currentCanvas = canvas;
    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      if (currentCanvas) {
        currentCanvas.style.pointerEvents = "none";
      }
    };
  }, [router]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-30 w-full h-full block"
        style={{ background: "transparent" }}
      />
      {tooltip && (
        <div
          className="fixed pointer-events-none z-40 transform -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-full bg-bg-surface text-text-primary text-[12px] font-bold shadow-lg border border-border-strong whitespace-nowrap animate-fade-in-up"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
