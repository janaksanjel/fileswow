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
  { body: 0xec4899, wing: 0xf472b6, belly: 0xfdf2f8, name: "Pink Flamingo" },
  { body: 0x14b8a6, wing: 0x2dd4bf, belly: 0xf0fdfa, name: "Teal Hummingbird" },
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

interface BirdInstance {
  id: number;
  isPermanent: boolean;
  group: any;
  bodyMat: any;
  bellyMat: any;
  wingMat: any;
  tailMat: any;
  leftWingPivot: any;
  rightWingPivot: any;
  body: any;
  colorIdx: number;
  pos: any;
  vel: any;
  targetWaypoint: any;
  waypointTimer: number;
  state: "flying" | "crashing" | "vanished" | "spawning" | "dismissing";
  spawnProgress: number;
  crashVy: number;
  crashVx: number;
  crashRotSpeed: number;
  createdAt: number;
  lifetime: number;
  dismissProgress: number;
  currentScreenX: number;
  currentScreenY: number;
}

/**
 * FlyingMascot — 3D bird that flies autonomously across the homepage.
 * - One main permanent bird always soars around.
 * - Every time Wowie the mascot is clicked, a new bird of a different color
 *   bursts out from the mascot!
 * - Spawned birds fly freely for 10 seconds, then gracefully auto-dismiss into the sky.
 * - Clicking any bird crashes it with a sparkle burst to open a surprise tool!
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
    let birdIdCounter = 0;
    let nextColorIndex = 0;

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

      // Reusable Wing Shape
      function createWingShape() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.28, 0.22, 0.52, 0.04);
        shape.quadraticCurveTo(0.25, -0.15, 0, 0);
        return shape;
      }
      const wingGeo = new THREE.ShapeGeometry(createWingShape());

      // ─── Sparkle Trail ───
      const TRAIL_COUNT = 72;
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

      // ─── Resize & Frustum ───
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

      const clock = new THREE.Clock();
      let t = 0;

      // ─── Bird Factory ───
      function createBird(
        colorIdx: number,
        isPermanent = false,
        initialPos?: any,
        initialVel?: any
      ): BirdInstance {
        const birdGroup = new THREE.Group();
        scene.add(birdGroup);
        const curColor = BIRD_COLORS[colorIdx % BIRD_COLORS.length];

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

        const pos = initialPos ? initialPos.clone() : new THREE.Vector3(0, 1.5, 0);
        const vel = initialVel ? initialVel.clone() : new THREE.Vector3(1.5, 0.4, 0);
        birdGroup.position.copy(pos);

        if (!isPermanent) {
          birdGroup.scale.set(0.15, 0.15, 0.15);
        }

        const targetWaypoint = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 1.5
        );

        return {
          id: ++birdIdCounter,
          isPermanent,
          group: birdGroup,
          bodyMat,
          bellyMat,
          wingMat,
          tailMat,
          leftWingPivot,
          rightWingPivot,
          body,
          colorIdx,
          pos,
          vel,
          targetWaypoint,
          waypointTimer: 0,
          state: isPermanent ? "flying" : "spawning",
          spawnProgress: isPermanent ? 1 : 0,
          crashVy: 0,
          crashVx: 0,
          crashRotSpeed: 0,
          createdAt: t,
          lifetime: isPermanent ? Infinity : 10, // Auto-dismiss after 10 seconds!
          dismissProgress: 0,
          currentScreenX: -999,
          currentScreenY: -999,
        };
      }

      // ─── Active Birds Array ───
      // 1 Permanent Bird that stays on the home page forever
      const mainBird = createBird(0, true);
      const birds: BirdInstance[] = [mainBird];

      // ─── Spawn New Bird from Mascot on Click ───
      const handleSpawnFromMascot = () => {
        // Read mascot location on page
        const mascotEl = document.querySelector('iframe[src*="mascot.html"]');
        let spawnX = (visibleWidth / 2) * 0.42;
        let spawnY = (visibleHeight / 2) * 0.25;

        if (mascotEl) {
          const rect = mascotEl.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          spawnX = ((cx / window.innerWidth) * 2 - 1) * (visibleWidth / 2);
          spawnY = -((cy / window.innerHeight) * 2 - 1) * (visibleHeight / 2);
        }

        // Guaranteed different color for each click!
        nextColorIndex = (nextColorIndex + 1) % BIRD_COLORS.length;

        // Upward burst launch velocity out from Wowie
        const angle = (Math.random() - 0.5) * 1.3 - Math.PI / 2;
        const speed = 3.6 + Math.random() * 2.4;
        const initVel = new THREE.Vector3(
          Math.cos(angle) * speed,
          -Math.sin(angle) * speed * 0.8 + 1.8,
          (Math.random() - 0.5) * 1.5
        );

        const newBird = createBird(
          nextColorIndex,
          false,
          new THREE.Vector3(spawnX, spawnY, 0.3),
          initVel
        );
        birds.push(newBird);

        // Burst sparkle explosion out from mascot
        for (let k = 0; k < 22; k++) {
          const idx = (trailIdx++ % TRAIL_COUNT) * 3;
          trailPositions[idx] = spawnX + (Math.random() - 0.5) * 0.7;
          trailPositions[idx + 1] = spawnY + (Math.random() - 0.5) * 0.7;
          trailPositions[idx + 2] = (Math.random() - 0.5) * 0.5;
          const c = BIRD_COLORS[nextColorIndex];
          const rgb = new THREE.Color(c.wing);
          trailColors[idx] = rgb.r;
          trailColors[idx + 1] = rgb.g;
          trailColors[idx + 2] = rgb.b;
        }
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;
      };

      // Listen for mascot click from mascot iframe or custom event
      const onWindowMessage = (e: MessageEvent) => {
        if (e.data && e.data.type === "mascot-click") {
          handleSpawnFromMascot();
        }
      };
      const onCustomSpawn = () => {
        handleSpawnFromMascot();
      };
      window.addEventListener("message", onWindowMessage);
      window.addEventListener("spawn-flying-mascot-bird", onCustomSpawn);

      // ─── Interaction & Cursor Hover ───
      let hoveredBird: BirdInstance | null = null;

      const handlePointerMove = (e: MouseEvent) => {
        let nearest: BirdInstance | null = null;
        let minDist = 48;

        for (const bird of birds) {
          if (bird.state === "flying") {
            const dist = Math.hypot(e.clientX - bird.currentScreenX, e.clientY - bird.currentScreenY);
            if (dist < minDist) {
              minDist = dist;
              nearest = bird;
            }
          }
        }

        hoveredBird = nearest;
        if (canvasRef.current) {
          canvasRef.current.style.pointerEvents = nearest ? "auto" : "none";
          canvasRef.current.style.cursor = nearest ? "pointer" : "default";
        }

        if (nearest) {
          setTooltip({
            x: nearest.currentScreenX,
            y: nearest.currentScreenY - 45,
            text: "💥 Tap me to crash & surprise tool!",
          });
        } else {
          setTooltip(null);
        }
      };

      // ─── Click / Crash on Bird ───
      const handleBirdClick = (e: MouseEvent) => {
        if (!hoveredBird || hoveredBird.state !== "flying") return;
        const targetBird = hoveredBird;

        e.stopPropagation();
        e.preventDefault();

        // 1. Crash and drop down!
        targetBird.state = "crashing";
        targetBird.crashVy = 3.5;
        targetBird.crashVx = (Math.random() - 0.5) * 6;
        targetBird.crashRotSpeed = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 8);

        // Burst explosion
        for (let k = 0; k < 18; k++) {
          const idx = (trailIdx++ % TRAIL_COUNT) * 3;
          trailPositions[idx] = targetBird.pos.x + (Math.random() - 0.5) * 0.6;
          trailPositions[idx + 1] = targetBird.pos.y + (Math.random() - 0.5) * 0.6;
          trailPositions[idx + 2] = targetBird.pos.z + (Math.random() - 0.5) * 0.6;
          trailColors[idx] = 1.0;
          trailColors[idx + 1] = 0.5 + Math.random() * 0.5;
          trailColors[idx + 2] = 0.1;
        }
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;

        const pick = TOP_TOOLS[Math.floor(Math.random() * TOP_TOOLS.length)];
        setTooltip({
          x: targetBird.currentScreenX,
          y: targetBird.currentScreenY - 45,
          text: `💥 Crashed! Launching ${pick.name}!`,
        });

        setTimeout(() => {
          router.push(`/tools/${pick.slug}`);
          setTooltip(null);
        }, 650);

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

      // ─── Main Animation Loop ───
      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (isPaused) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt;

        const boundX = Math.max((visibleWidth / 2) * 0.78, 4);
        const boundY = Math.max((visibleHeight / 2) * 0.68, 2.8);

        for (let i = birds.length - 1; i >= 0; i--) {
          const bird = birds[i];

          // Auto-dismiss temporary birds after 10 seconds
          if (!bird.isPermanent && bird.state === "flying") {
            const age = t - bird.createdAt;
            if (age >= bird.lifetime) {
              bird.state = "dismissing";
              bird.dismissProgress = 0;
            }
          }

          if (bird.state === "spawning") {
            // Swoop in / burst outward
            bird.spawnProgress = Math.min(1, bird.spawnProgress + dt * 2.2);
            const scale = THREE.MathUtils.lerp(0.15, 1, bird.spawnProgress);
            bird.group.scale.set(scale, scale, scale);

            bird.pos.addScaledVector(bird.vel, dt);
            bird.group.position.copy(bird.pos);

            const flapAngle = Math.sin(t * 22 + bird.id) * 0.48;
            bird.leftWingPivot.rotation.z = flapAngle;
            bird.rightWingPivot.rotation.z = -flapAngle;

            if (bird.spawnProgress >= 1) {
              bird.state = "flying";
            }
          } else if (bird.state === "flying") {
            // Free roaming flight across screen
            bird.waypointTimer += dt;

            const dx = bird.targetWaypoint.x - bird.pos.x;
            const dy = bird.targetWaypoint.y - bird.pos.y;
            const dz = bird.targetWaypoint.z - bird.pos.z;
            const dist = Math.hypot(dx, dy, dz);

            if (dist < 1.6 || bird.waypointTimer > 6.5) {
              bird.waypointTimer = 0;
              bird.targetWaypoint.set(
                (Math.random() - 0.5) * boundX * 1.8,
                (Math.random() - 0.5) * boundY * 1.6,
                (Math.random() - 0.5) * 1.4
              );
            }

            const cruiseSpeed = 2.4;
            const desiredVx = (dx / (dist + 0.001)) * cruiseSpeed;
            const desiredVy = (dy / (dist + 0.001)) * (cruiseSpeed * 0.75);
            const desiredVz = (dz / (dist + 0.001)) * 1.1;

            bird.vel.x += (desiredVx - bird.vel.x) * 1.8 * dt;
            bird.vel.y += (desiredVy - bird.vel.y) * 1.8 * dt;
            bird.vel.z += (desiredVz - bird.vel.z) * 1.8 * dt;

            bird.vel.y += Math.sin(t * 2.6 + bird.id) * 0.22 * dt;

            // Boundaries
            if (Math.abs(bird.pos.x) > boundX) bird.vel.x -= Math.sign(bird.pos.x) * 4.5 * dt;
            if (Math.abs(bird.pos.y) > boundY) bird.vel.y -= Math.sign(bird.pos.y) * 4.5 * dt;

            bird.pos.addScaledVector(bird.vel, dt * 2.6);
            bird.group.position.copy(bird.pos);

            const speed = bird.vel.length();
            if (speed > 0.05) {
              const targetRotY = Math.atan2(bird.vel.x, bird.vel.z + 0.001);
              const targetRotX = -bird.vel.y * 0.35;
              const targetRotZ = -bird.vel.x * 0.35;

              bird.group.rotation.y = THREE.MathUtils.lerp(bird.group.rotation.y, targetRotY, 0.12);
              bird.group.rotation.x = THREE.MathUtils.lerp(bird.group.rotation.x, targetRotX, 0.12);
              bird.group.rotation.z = THREE.MathUtils.lerp(bird.group.rotation.z, targetRotZ, 0.12);
            }

            const flapSpeed = 12 + speed * 8;
            const flapAngle = Math.sin(t * flapSpeed + bird.id) * 0.45;
            bird.leftWingPivot.rotation.z = flapAngle;
            bird.rightWingPivot.rotation.z = -flapAngle;
            bird.body.position.y = Math.sin(t * flapSpeed * 0.5 + bird.id) * 0.02;

            bird.group.scale.set(1, 1, 1);
          } else if (bird.state === "dismissing") {
            // ─── Auto-Dismissing After 10s: Swoop up into sky & vanish ───
            bird.dismissProgress = Math.min(1, bird.dismissProgress + dt * 1.2);
            const scale = Math.max(0.001, 1 - bird.dismissProgress);
            bird.group.scale.set(scale, scale, scale);

            bird.vel.y += 4 * dt;
            bird.vel.x *= 0.98;
            bird.pos.addScaledVector(bird.vel, dt * 2.5);
            bird.group.position.copy(bird.pos);

            const flapAngle = Math.sin(t * 30 + bird.id) * 0.5;
            bird.leftWingPivot.rotation.z = flapAngle;
            bird.rightWingPivot.rotation.z = -flapAngle;

            if (bird.dismissProgress >= 1 || scale <= 0.01) {
              bird.state = "vanished";
              scene.remove(bird.group);
              birds.splice(i, 1);
              continue;
            }
          } else if (bird.state === "crashing") {
            // Crash & tumble down
            bird.crashVy -= 32 * dt;
            bird.pos.x += bird.crashVx * dt;
            bird.pos.y += bird.crashVy * dt;
            bird.group.position.copy(bird.pos);

            bird.group.rotation.z += bird.crashRotSpeed * dt;
            bird.group.rotation.x += bird.crashRotSpeed * 0.7 * dt;

            const flapAngle = Math.sin(t * 40 + bird.id) * 0.65;
            bird.leftWingPivot.rotation.z = flapAngle;
            bird.rightWingPivot.rotation.z = -flapAngle;

            if (bird.pos.y < -visibleHeight / 2 - 1.5) {
              bird.state = "vanished";
              bird.group.scale.set(0.001, 0.001, 0.001);

              if (bird.isPermanent) {
                // Permanent bird respawns 1s later in a new color
                setTimeout(() => {
                  if (isDisposed) return;
                  bird.colorIdx = (bird.colorIdx + 1) % BIRD_COLORS.length;
                  const c = BIRD_COLORS[bird.colorIdx];
                  bird.bodyMat.color.setHex(c.body);
                  bird.bellyMat.color.setHex(c.belly);
                  bird.wingMat.color.setHex(c.wing);
                  bird.tailMat.color.setHex(c.wing);

                  const spawnSide = Math.random() > 0.5 ? 1 : -1;
                  bird.pos.set(spawnSide * (visibleWidth / 2 + 1.5), visibleHeight / 2 + 1, 0);
                  bird.vel.set(-spawnSide * 4, -3, 0);
                  bird.group.position.copy(bird.pos);
                  bird.group.rotation.set(0, spawnSide > 0 ? -Math.PI / 2 : Math.PI / 2, 0);

                  bird.targetWaypoint.set(
                    -spawnSide * ((visibleWidth / 2) * 0.5),
                    (Math.random() - 0.5) * 3,
                    0
                  );
                  bird.waypointTimer = 0;
                  bird.state = "spawning";
                  bird.spawnProgress = 0;
                }, 1000);
              } else {
                scene.remove(bird.group);
                birds.splice(i, 1);
                continue;
              }
            }
          }

          // Project to 2D screen coordinates
          const projected = new THREE.Vector3(bird.pos.x, bird.pos.y, bird.pos.z);
          projected.project(camera);
          bird.currentScreenX = ((projected.x + 1) / 2) * window.innerWidth;
          bird.currentScreenY = ((-projected.y + 1) / 2) * window.innerHeight;

          // Sparkle trail
          if (bird.state !== "vanished" && t - lastTrailTime > 0.04) {
            lastTrailTime = t;
            const tailWorld = new THREE.Vector3(0, 0, -0.38).applyMatrix4(bird.group.matrixWorld);
            const idx = (trailIdx++ % TRAIL_COUNT) * 3;
            trailPositions[idx] = tailWorld.x + (Math.random() - 0.5) * 0.08;
            trailPositions[idx + 1] = tailWorld.y + (Math.random() - 0.5) * 0.08;
            trailPositions[idx + 2] = tailWorld.z + (Math.random() - 0.5) * 0.08;

            const c = BIRD_COLORS[bird.colorIdx % BIRD_COLORS.length];
            const rgb = new THREE.Color(c.wing);
            trailColors[idx] = rgb.r;
            trailColors[idx + 1] = rgb.g;
            trailColors[idx + 2] = rgb.b;

            trailGeo.attributes.position.needsUpdate = true;
            trailGeo.attributes.color.needsUpdate = true;
          }
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("message", onWindowMessage);
        window.removeEventListener("spawn-flying-mascot-bird", onCustomSpawn);
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
