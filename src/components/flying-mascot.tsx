"use client";

import { useEffect, useRef } from "react";

/**
 * FlyingMascot — a small, playful 3D bird-mascot companion
 * that flies gracefully across the entire website using Three.js.
 * 100% pointer-events-none, highly optimized, runs smoothly across viewports.
 */
export function FlyingMascot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
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

      // Ambient & directional lighting
      scene.add(new THREE.HemisphereLight(0xfff7ed, 0xff7a1a, 1.1));
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
      sunLight.position.set(5, 8, 8);
      scene.add(sunLight);

      // ─── Build Small Bird Mascot ───
      const birdGroup = new THREE.Group();
      scene.add(birdGroup);

      // Body (cute mini sun sphere)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xff6a00,
        roughness: 0.38,
        metalness: 0.05,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 22), bodyMat);
      birdGroup.add(body);

      // Cute white belly patch
      const bellyMat = new THREE.MeshBasicMaterial({ color: 0xfff3e0 });
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), bellyMat);
      belly.position.set(0, -0.06, 0.16);
      belly.scale.set(1, 0.9, 0.45);
      birdGroup.add(belly);

      // Little golden beak
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

      // Cute little wings that flap like a bird!
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xff8c1a,
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

      // Left wing pivot
      const leftWingPivot = new THREE.Group();
      leftWingPivot.position.set(-0.32, 0.05, 0);
      const leftWingMesh = new THREE.Mesh(wingGeo, wingMat);
      leftWingMesh.scale.set(-1, 1, 1); // mirrored outwards
      leftWingPivot.add(leftWingMesh);
      birdGroup.add(leftWingPivot);

      // Right wing pivot
      const rightWingPivot = new THREE.Group();
      rightWingPivot.position.set(0.32, 0.05, 0);
      const rightWingMesh = new THREE.Mesh(wingGeo, wingMat);
      rightWingPivot.add(rightWingMesh);
      birdGroup.add(rightWingPivot);

      // Little tail feathers
      const tailMat = new THREE.MeshStandardMaterial({ color: 0xff7000, roughness: 0.4 });
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), tailMat);
      tail.rotation.x = -Math.PI / 2 + 0.2;
      tail.position.set(0, 0.06, -0.36);
      birdGroup.add(tail);

      // ─── Sparkle Trail ───
      const TRAIL_COUNT = 24;
      const trailPositions = new Float32Array(TRAIL_COUNT * 3).fill(-999);
      const trailColors = new Float32Array(TRAIL_COUNT * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));

      // Canvas circle dot for sparkle
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = 32;
      dotCanvas.height = 32;
      const dotCtx = dotCanvas.getContext("2d")!;
      const dotGrad = dotCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
      dotGrad.addColorStop(0, "rgba(255,255,255,1)");
      dotGrad.addColorStop(0.5, "rgba(255,170,0,0.8)");
      dotGrad.addColorStop(1, "rgba(255,100,0,0)");
      dotCtx.fillStyle = dotGrad;
      dotCtx.fillRect(0, 0, 32, 32);
      const trailTex = new THREE.CanvasTexture(dotCanvas);

      const trailMat = new THREE.PointsMaterial({
        map: trailTex,
        size: 0.28,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const trailPoints = new THREE.Points(trailGeo, trailMat);
      scene.add(trailPoints);

      let trailIdx = 0;
      let lastTrailTime = 0;

      // ─── Resize Handler ───
      const handleResize = () => {
        if (!canvasRef.current) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);
      handleResize();

      // ─── Flight Path Animation ───
      let t = Math.random() * 50; // random starting phase
      let prevPos = new THREE.Vector3();

      function getFlightPosition(time: number, aspect: number) {
        // Broad looping 3D flight trajectory sweeping across the viewport
        const boundX = Math.min(6.5, 4.8 * aspect);
        const boundY = 3.6;

        const x =
          Math.sin(time * 0.42) * boundX * 0.85 +
          Math.cos(time * 0.28) * 1.5;
        const y =
          Math.cos(time * 0.55) * boundY * 0.75 +
          Math.sin(time * 0.85) * 0.8;
        const z = Math.sin(time * 0.65) * 1.6;

        return { x, y, z };
      }

      let isPaused = false;
      const handleVisibilityChange = () => {
        isPaused = document.visibilityState === "hidden";
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (isPaused) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt * 0.85;

        // Current and future positions for tangent direction
        const currentPos = getFlightPosition(t, camera.aspect);
        const nextPos = getFlightPosition(t + 0.04, camera.aspect);

        birdGroup.position.set(currentPos.x, currentPos.y, currentPos.z);

        // Direction of flight
        const dir = new THREE.Vector3(
          nextPos.x - currentPos.x,
          nextPos.y - currentPos.y,
          nextPos.z - currentPos.z
        ).normalize();

        // Orient bird along flight trajectory with smooth banking
        const targetRotY = Math.atan2(dir.x, dir.z);
        const targetRotX = -dir.y * 0.65;
        const targetRotZ = -dir.x * 0.55; // bank into turns

        birdGroup.rotation.y = THREE.MathUtils.lerp(birdGroup.rotation.y, targetRotY, 0.12);
        birdGroup.rotation.x = THREE.MathUtils.lerp(birdGroup.rotation.x, targetRotX, 0.12);
        birdGroup.rotation.z = THREE.MathUtils.lerp(birdGroup.rotation.z, targetRotZ, 0.12);

        // Bird flapping animation: flaps faster when rising or turning
        const flapSpeed = 16 + Math.abs(dir.y) * 8;
        const flapAngle = Math.sin(t * flapSpeed) * 0.48;
        leftWingPivot.rotation.z = flapAngle;
        rightWingPivot.rotation.z = -flapAngle;

        // Subtle body bobbing
        body.position.y = Math.sin(t * flapSpeed * 0.5) * 0.03;

        // Emit trail sparkles behind tail
        if (t - lastTrailTime > 0.045) {
          lastTrailTime = t;
          const tailWorld = new THREE.Vector3(0, 0, -0.4).applyMatrix4(birdGroup.matrixWorld);
          const i = (trailIdx++ % TRAIL_COUNT) * 3;
          trailPositions[i] = tailWorld.x + (Math.random() - 0.5) * 0.1;
          trailPositions[i + 1] = tailWorld.y + (Math.random() - 0.5) * 0.1;
          trailPositions[i + 2] = tailWorld.z + (Math.random() - 0.5) * 0.1;

          // Warm golden/orange color
          trailColors[i] = 1.0;
          trailColors[i + 1] = 0.6 + Math.random() * 0.3;
          trailColors[i + 2] = 0.1;
          trailGeo.attributes.position.needsUpdate = true;
          trailGeo.attributes.color.needsUpdate = true;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    });

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 w-full h-full block"
      style={{ background: "transparent" }}
    />
  );
}

