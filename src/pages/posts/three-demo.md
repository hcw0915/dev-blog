---
public: true
layout: ../../layouts/BlogPost.astro
title: Three 玩家控制 demo
createdAt: 1743489947000
updatedAt: 1743490225811
tags:
  - Three
  - Blog
heroImage: /placeholder-hero.png
slug: three-demo
---

```js
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { useGame } from "./stores/useGame";

const groundLevel = 0.32;

export const Player = () => {
  const start = useGame((state) => state.start);
  const restart = useGame((state) => state.restart);
  const end = useGame((state) => state.end);
  const blocksCount = useGame((state) => state.blocksCount);

  const [subscribeKeys, getKeys] = useKeyboardControls();
  // const { rapier, world } = useRapier();

  const bodyRef = useRef();

  const smoothedCameraPosition = new THREE.Vector3(10, 10, 10);
  const smoothedCameraTarget = new THREE.Vector3();

  const jump = () => {
    // 偷雞, 只有球體在 y 軸 0.32以下 才可以二次跳躍
    if (bodyRef.current.translation().y <= groundLevel) {
      bodyRef.current.applyImpulse({ x: 0, y: 0.5, z: 0 });
    }
    
    // 下方為正式作法
    // const origin = bodyRef.current.translation();
    // origin.y -= 0.31;
    // const direction = { x: 0, y: -1, z: 0 };
    // const ray = new rapier.Ray(origin, direction);

    // const hit = world.castRay(ray, 10, true);
    // if (hit.timeOfImpact < 0.15)
    //   bodyRef.current.applyImpulse({ x: 0, y: 0.5, z: 0 });
  };

  const reset = () => {
    bodyRef.current.setTranslation({ x: 0, y: 1, z: 0 });
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 });
  };

  useFrame((state, delta) => {
    if (!bodyRef.current) return;
    const { forward, backward, leftward, rightward } = getKeys();

    const impulse = { x: 0, y: 0, z: 0 };
    const torque = { x: 0, y: 0, z: 0 };

    const impulseStrength = 0.4 * delta;
    const torqueStrength = 0.2 * delta;

    if (forward) {
      impulse.z -= impulseStrength;
      torque.x -= torqueStrength;
    }

    if (rightward) {
      impulse.x += impulseStrength;
      torque.z -= torqueStrength;
    }

    if (backward) {
      impulse.z += impulseStrength;
      torque.x += torqueStrength;
    }

    if (leftward) {
      impulse.x -= impulseStrength;
      torque.z += torqueStrength;
    }

    bodyRef.current?.applyImpulse(impulse);
    bodyRef.current?.applyTorqueImpulse(torque);

    // camera
    const bodyPosition = bodyRef.current?.translation();

    let cameraPosition = new THREE.Vector3();
    const { x, y, z } = bodyPosition;
    cameraPosition = { x, y: y + 0.65, z: z + 2.25 };

    /** 設定相機目標點位於球體上方 */
    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    // 從 smoothedCameraPosition 平滑到 cameraPosition 
    smoothedCameraPosition.lerp(cameraPosition, 5 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

    state.camera.position.copy(smoothedCameraPosition);
    state.camera.lookAt(smoothedCameraTarget);
  });

  // 如果球的位置低于-1，则将其重置到(0, 1, 0)
  useFrame((state, delta) => {
    if (!bodyRef.current) return;
    const position = bodyRef.current.translation();
    if (position.y < -2) {
      restart();
      // // 重置球的位置
      // bodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true);

      // // 重置線性速度，避免繼續掉落
      // bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // // 重置角速度，避免旋轉異常
      // bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    if (position.z < -(blocksCount * 4 + 2)) {
      end();
    }
  });

  useEffect(() => {
    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (value) => {
        if (value === "ready") reset();
      }
    );

    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value) jump();
      }
    );

    const unsubscribeAny = subscribeKeys(() => {
      start();
    });
    // ...

    return () => {
      unsubscribeReset();
      unsubscribeJump();
      unsubscribeAny();
    };
  }, []);

  return (
    <>
      <RigidBody
        ref={bodyRef}
        position={[0, 1, 0]}
        colliders="ball"
        restitution={0.2}
        friction={1}
        canSleep={false}
        linearDamping={0.5}
        angularDamping={0.5}
      >
        <mesh castShadow>
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial flatShading color="mediumpurple" />
        </mesh>
      </RigidBody>
    </>
  );
};

```