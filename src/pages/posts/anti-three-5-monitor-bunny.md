---
public: true
layout: ../../layouts/BlogPost.astro
title: AntiThree(5) - Monitor Bunny
createdAt: 1744536718423
updatedAt: 1744544524886
tags:
  - Blog
  - Anti-Three
  - Three
heroImage: /placeholder-hero.png
slug: anti-three-5-monitor-bunny
---

## Monitor Bunny

#### 🔥 可利用概念

-

> - [codesandbox.io/p/sandbox/bst0cy](https://codesandbox.io/p/sandbox/bst0cy)

![clipboard.png](/posts/anti-three-5-monitor-bunny_23.png)

- `<hemisphereLight intensity={9} groundColor="black" />`
  用來模擬自然環境中天空與地面的光照效果。它不像點光源或聚光燈那樣有明確的方向，而是從上面（天空）與下面（地面）發出光，來營造一種柔和且自然的環境光效果。

  `intensity={9}`

  ![clipboard.png](/posts/anti-three-5-monitor-bunny_22.png)

  `intensity={0.15}`

  ![clipboard.png](/posts/anti-three-5-monitor-bunny_21.png)

- `MeshReflectorMaterial`: 讓一個表面（比如地板、水面、鏡子）**看起來像真的會反射環境或物體**，比基本的 `MeshStandardMaterial` 或 `MeshPhysicalMaterial` 的反射更進一步 —— 帶有模糊、模擬光照、景深、甚至波紋等效果。 (不用的時候, 需要拿別的材質取代否則 `Three.js` 預設會把 `planeGeometry` 的 `mesh` 使用標準材質渲染，但你沒有手動指定材質，**Three.js 就用一個非常基礎、明亮的 `MeshBasicMaterial` 來渲染這個地板**, 會變超亮）

```js
<MeshReflectorMaterial
  blur={[300, 30]} // 模糊程度，[x, y] -> x 是反射模糊程度，y 是模糊品質（越高越滑順，但越吃效能）
  resolution={2048} // 反射貼圖的解析度，越高越清晰，但也越耗性能
  mixBlur={1} // 模糊與原始反射之間的混合程度（0 ~ 1）
  mixStrength={180} // 反射強度（類似鏡子的清晰度），越高越亮越清楚
  roughness={1} // 表面粗糙程度，越高越模糊、越不反光（1 = 完全粗糙）
  depthScale={1.2} // 深度影響反射的程度，可製造地板「有厚度」的感覺
  minDepthThreshold={0.4} // 深度影響的最小門檻，決定哪些物體會被影響
  maxDepthThreshold={1.4} // 深度影響的最大門檻，搭配 min 調整反射模糊或透明過渡
  color="#202020" // 地板基本顏色（非反射部分）
  metalness={0.8} // 金屬度，越高越像鏡面，越低越像塑膠或石頭
/>
```

- `cameraRig 組件`: 可以復用的 `camera / pointer` 的視角交互效果。

```js
useFrame((state, delta) => {
  easing.damp3(
    state.camera.position,
    [
      -1 + (state.pointer.x * state.viewport.width) / 3,
      (1 + state.pointer.y) / 2,
      5.5,
    ],
    0.5,
    delta
  );
  state.camera.lookAt(0, 0, 0); // 始終看向 (0, 0, 0)
});
```

- `suspend-react`: 讓資料還沒來時，React 能自動幫你處理 loading，等資料準備好了再渲染畫面. (有點謎, 但應該是不需要的)。

```js
// lazy import
import { suspend } from "suspend-react";

const { nodes } = useGLTF(suspend(suzi).default);
const suzi = import("@pmndrs/assets/models/bunny.glb");

// normal import
import Suzi from "@pmndrs/assets/models/bunny.glb";
const { nodes } = useGLTF(Suzi);
```

- `<Bloom>`: 你會看到亮區變得更有光暈效果，像是螢幕中非常亮的區域會有一種散發的光，而不是僅僅是一個硬邊的亮點。這能讓畫面看起來更加夢幻、夢幻或充滿魔法感。

```js
<Bloom
  luminanceThreshold={0} // 設定亮度閾值，0 表示所有亮區都會產生光暈效果
  mipmapBlur // 啟用 mipmap 模糊，讓大範圍的光暈看起來更加平滑
  luminanceSmoothing={0.0} // 設定亮區的平滑程度，0.0 表示邊界不會平滑，過渡較為銳利
  intensity={5} // 設定光暈的強度，數值越大，光暈越強烈
/>
```

`ScreenText`(提供照明, 動畫, 視角, 燈光) -> `Screen`(提供文字渲染, 非文字電腦網格外觀) -> `Computers`

- `RenderTexture`: `attach="map"` 把這個 `{children}` 輸出結果掛到上一層物件的 `map` 屬性。

[codesandbox.io/p/sandbox/0z8i2c](https://codesandbox.io/p/sandbox/0z8i2c)

![clipboard.png](/posts/anti-three-5-monitor-bunny_20.png)

```js
<mesh>
  <meshBasicMaterial>
    <RenderTexture attach="map">...</RenderTexture>
  </meshBasicMaterial>
</mesh>;

const mesh = new THREE.Mesh();
const material = new THREE.MeshBasicMaterial();
material.map = renderTexture; // RenderTexture 是個自定義 render target
mesh.material = material;
```

```js
function Screen({ frame, panel, children, ...props }) {
  const { nodes, materials } = useGLTF("/computers_1-transformed.glb");
  return (
    <group {...props}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes[frame].geometry}
        material={materials.Texture}
      />
      <mesh geometry={nodes[panel].geometry} scale={1}>
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
      <mesh geometry={nodes[panel].geometry} scale={1}>
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}
```

- `PerspectiveCamera`: 相機負責渲染場景中的物體，並控制畫面顯示的方式，可以自己改變一下參數。

`aspect={1/1}`

![clipboard.png](/posts/anti-three-5-monitor-bunny_19.png)

`aspect={1.5}`

![clipboard.png](/posts/anti-three-5-monitor-bunny_18.png)

```js
/* Renders a monitor with some text */
function ScreenText({ invert, x = 0, y = 1.2, ...props }) {
  const textRef = useRef();
  const rand = Math.random() * 10000;
  useFrame(
    (state) =>
      (textRef.current.position.x =
        x + Math.sin(rand + state.clock.elapsedTime / 4) * 8)
  );
  return (
    <Screen {...props}>
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={[invert ? "black" : "#35c19f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Text
        font="/Inter-Medium.woff"
        position={[x, y, 0]}
        ref={textRef}
        fontSize={4}
        letterSpacing={-0.1}
        color={!invert ? "black" : "#35c19f"}
      >
        Antonio.
      </Text>
    </Screen>
  );
}
```

![clipboard.png](/posts/anti-three-5-monitor-bunny_17.png)

- `SpinningBox`:

- `useCursor`: 根據 `hovered` 的狀態，自動變更滑鼠游標（變成 pointer 手指樣式）。

```js
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";

export function SpinningBox({ scale, ...props }) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  useCursor(hovered);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame(
    (state, delta) => (ref.current.rotation.x = ref.current.rotation.y += delta)
  );
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? scale * 1.4 : scale * 1.2}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? "hotpink" : "indianred"} />
    </mesh>
  );
}
```

---

```js
// App.js
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, MeshReflectorMaterial, BakeShadows } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ToneMapping,
} from "@react-three/postprocessing";
import { easing } from "maath";
import { suspend } from "suspend-react";
import { Instances, Computers } from "./Computers";

const suzi = import("@pmndrs/assets/models/bunny.glb");

export default function App() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-1.5, 1, 5.5], fov: 45, near: 1, far: 20 }}
      eventSource={document.getElementById("root")}
      eventPrefix="client"
    >
      {/* Lights */}
      <color attach="background" args={["black"]} />
      <hemisphereLight intensity={0.15} groundColor="black" />
      <spotLight
        decay={0}
        position={[10, 20, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      {/* Main scene */}
      <group position={[-0, -1, 0]}>
        {/* Auto-instanced sketchfab model */}
        <Instances>
          <Computers scale={0.5} />
        </Instances>
        {/* Plane reflections + distance blur */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <MeshReflectorMaterial
            blur={[300, 30]}
            resolution={2048}
            mixBlur={1}
            mixStrength={180}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#202020"
            metalness={0.8}
          />
        </mesh>
        {/* Bunny and a light give it more realism */}
        <Bun
          scale={0.4}
          position={[0, 0.3, 0.5]}
          rotation={[0, -Math.PI * 0.85, 0]}
        />
        <pointLight
          distance={1.5}
          intensity={1}
          position={[-0.15, 0.7, 0]}
          color="orange"
        />
      </group>
      {/* Postprocessing */}
      <EffectComposer disableNormalPass>
        <Bloom
          luminanceThreshold={0}
          mipmapBlur
          luminanceSmoothing={0.0}
          intensity={5}
        />
        <DepthOfField
          target={[0, 0, 13]}
          focalLength={0.3}
          bokehScale={15}
          height={700}
        />
      </EffectComposer>
      {/* Camera movements */}
      <CameraRig />
      {/* Small helper that freezes the shadows for better performance */}
      <BakeShadows />
    </Canvas>
  );
}

function Bun(props) {
  const { nodes } = useGLTF(suspend(suzi).default);
  console.log(nodes);
  return (
    <mesh receiveShadow castShadow geometry={nodes.mesh.geometry} {...props}>
      <meshStandardMaterial color="#222" roughness={0.5} />
    </mesh>
  );
}

function CameraRig() {
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [
        -1 + (state.pointer.x * state.viewport.width) / 3,
        (1 + state.pointer.y) / 2,
        5.5,
      ],
      0.5,
      delta
    );
    state.camera.lookAt(0, 0, 0);
  });
}
```

---

```js
// Computers.js
import * as THREE from "three";
import { useMemo, useContext, createContext, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Merged,
  RenderTexture,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import { SpinningBox } from "./SpinningBox";
THREE.ColorManagement.legacyMode = false;

/*
The following was auto-generated by: npx gltfjsx computers.glb --transform --instance
By using the --instance flag it detects similar geometry and instances it, thereby minimizing draw-calls

Author: Rafael Rodrigues (https://sketchfab.com/RafaelBR873D)
License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
Source: https://sketchfab.com/3d-models/old-computers-7bb6e720499a467b8e0427451d180063
Title: Old Computers
*/

const context = createContext();
export function Instances({ children, ...props }) {
  const { nodes } = useGLTF("/computers_1-transformed.glb");
  const instances = useMemo(
    () => ({
      Object: nodes.Object_4,
      Object1: nodes.Object_16,
      Object3: nodes.Object_52,
      Object13: nodes.Object_172,
      Object14: nodes.Object_174,
      Object23: nodes.Object_22,
      Object24: nodes.Object_26,
      Object32: nodes.Object_178,
      Object36: nodes.Object_28,
      Object45: nodes.Object_206,
      Object46: nodes.Object_207,
      Object47: nodes.Object_215,
      Object48: nodes.Object_216,
      Sphere: nodes.Sphere,
    }),
    [nodes]
  );
  return (
    <Merged castShadow receiveShadow meshes={instances} {...props}>
      {(instances) => (
        <context.Provider value={instances} children={children} />
      )}
    </Merged>
  );
}

export function Computers(props) {
  const { nodes: n, materials: m } = useGLTF("/computers_1-transformed.glb");
  const instances = useContext(context);
  return (
    <group {...props} dispose={null}>
      <instances.Object
        position={[0.16, 0.79, -1.97]}
        rotation={[-0.54, 0.93, -1.12]}
        scale={0.5}
      />
      <instances.Object
        position={[-2.79, 0.27, 1.82]}
        rotation={[-1.44, 1.22, 1.43]}
        scale={0.5}
      />
      <instances.Object
        position={[-5.6, 4.62, -0.03]}
        rotation={[-1.96, 0.16, 1.2]}
        scale={0.5}
      />
      <instances.Object
        position={[2.62, 1.98, -2.47]}
        rotation={[-0.42, -0.7, -1.85]}
        scale={0.5}
      />
      <instances.Object
        position={[4.6, 3.46, 1.19]}
        rotation={[-1.24, -0.72, 0.48]}
        scale={0.5}
      />
      <instances.Object1
        position={[0.63, 0, -3]}
        rotation={[0, 0.17, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.36, 0.32, -2.02]}
        rotation={[0, 0.53, -Math.PI / 2]}
        scale={1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_24.geometry}
        material={m.Texture}
        position={[-2.42, 0.94, -2.25]}
        rotation={[0, 0.14, Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-3.53, 0, 0.59]}
        rotation={[Math.PI, -1.09, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.53, 1.53, 0.59]}
        rotation={[0, 0.91, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[3.42, 0, 0]}
        rotation={[-Math.PI, 1.13, -Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[4.09, 2.18, 2.41]}
        rotation={[0, -1.55, 1.57]}
        scale={1.52}
      />
      <instances.Object3
        position={[4.31, 1.57, 2.34]}
        rotation={[0, -1.15, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object3
        position={[-3.79, 0, 1.66]}
        rotation={[Math.PI, -1.39, 0]}
        scale={-1.52}
      />
      <instances.Object3
        position={[-3.79, 1.53, 1.66]}
        rotation={[0, 1.22, -Math.PI]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-3.69, 0, 2.59]}
        rotation={[0, -1.57, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.36, 2.18, 0.81]}
        rotation={[0, 0.77, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object3
        position={[-5.56, 1.57, 0.69]}
        rotation={[0, 1.17, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-5.47, 2.79, 0.74]}
        rotation={[Math.PI, -1.16, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object3
        position={[-5.29, 3.41, 0.89]}
        rotation={[Math.PI, -0.76, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-5.28, 0, -2.33]}
        rotation={[0, 0.75, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.49, 0, -1.38]}
        rotation={[Math.PI, -0.99, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.01, 0, -3.79]}
        rotation={[0, 0.6, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.08, 0, -4.32]}
        rotation={[Math.PI, -0.6, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.02, 0, -4.49]}
        rotation={[0, 0.31, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.31, 1.83, -1.41]}
        rotation={[0, 1.06, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-4.18, 1.83, -3.06]}
        rotation={[-Math.PI, -0.46, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.76, 1.83, -3.6]}
        rotation={[0, -1.16, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-0.25, 1.83, -5.54]}
        rotation={[0, 1.55, 1.57]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.28, 2.14, -2.33]}
        rotation={[Math.PI, -0.75, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.49, 2.14, -1.38]}
        rotation={[0, 0.99, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.01, 2.14, -3.79]}
        rotation={[Math.PI, -0.6, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.08, 2.14, -4.32]}
        rotation={[0, 0.6, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.02, 2.14, -4.49]}
        rotation={[Math.PI, -0.31, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.31, 3.98, -1.41]}
        rotation={[0, 1.06, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-4.18, 3.98, -3.06]}
        rotation={[-Math.PI, -0.46, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.17, 3.98, -4.45]}
        rotation={[0, 0.17, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-0.94, 3.98, -4.66]}
        rotation={[Math.PI, 0.02, -Math.PI / 2]}
        scale={1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_140.geometry}
        material={m.Texture}
        position={[5.53, 2.18, 0.17]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_144.geometry}
        material={m.Texture}
        position={[5.74, 1.57, 0.05]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_148.geometry}
        material={m.Texture}
        position={[5.65, 2.79, 0.11]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_152.geometry}
        material={m.Texture}
        position={[5.46, 3.41, 0.26]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_156.geometry}
        material={m.Texture}
        position={[4.86, 0, -2.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_160.geometry}
        material={m.Texture}
        position={[5.06, 0, -1.6]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_164.geometry}
        material={m.Texture}
        position={[2.59, 0, -4]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_168.geometry}
        material={m.Texture}
        position={[1.66, 0, -4.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_170.geometry}
        material={m.Texture}
        position={[0.59, 0, -4.7]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object13
        position={[4.89, 1.83, -1.62]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object14
        position={[3.75, 1.83, -3.28]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_176.geometry}
        material={m.Texture}
        position={[1.33, 1.83, -3.82]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_180.geometry}
        material={m.Texture}
        position={[4.86, 2.14, -2.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_184.geometry}
        material={m.Texture}
        position={[5.06, 2.14, -1.6]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_188.geometry}
        material={m.Texture}
        position={[2.59, 2.14, -4]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_192.geometry}
        material={m.Texture}
        position={[1.66, 2.14, -4.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_194.geometry}
        material={m.Texture}
        position={[0.59, 2.14, -4.7]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object13
        position={[4.89, 3.98, -1.62]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object14
        position={[3.75, 3.98, -3.28]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_200.geometry}
        material={m.Texture}
        position={[0.75, 3.98, -4.66]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_18.geometry}
        material={m.Texture}
        position={[-0.19, 0, -2.96]}
        rotation={[0, -0.06, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-2.29, 1.56, -2.26]}
        rotation={[0, -0.005, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[-2.19, 2.19, -1.87]}
        rotation={[0, 0.51, Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-2.9, 0.3, -1.47]}
        rotation={[Math.PI, -1.35, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object23
        position={[3.22, 0, -0.8]}
        rotation={[0, -1.32, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[3.53, 1.83, 0.44]}
        rotation={[-Math.PI, 1.32, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object23
        position={[4.26, 0.94, 2.22]}
        rotation={[0, -1, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[3.87, 0.32, 2.35]}
        rotation={[0, -1.53, -1.57]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.61, 0.94, 0.82]}
        rotation={[0, 1.32, 1.57]}
        scale={1.52}
      />
      <instances.Object24
        position={[-5.26, 0.32, 1.01]}
        rotation={[0, 0.79, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.39, 4.03, 0.99]}
        rotation={[Math.PI, -0.61, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[-5.7, 4.66, 0.72]}
        rotation={[Math.PI, -1.13, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.95, 0, -0.64]}
        rotation={[0, 0.95, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-4.48, 0, -2.75]}
        rotation={[Math.PI, -0.57, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-3.72, 0, -2.89]}
        rotation={[0, 0.64, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-0.08, 0, -5.03]}
        rotation={[Math.PI, -0.04, Math.PI]}
        scale={1.52}
      />
      <instances.Object24
        position={[-4.19, 1.84, -2.77]}
        rotation={[Math.PI, -0.66, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.95, 2.14, -0.64]}
        rotation={[Math.PI, -0.95, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-4.48, 2.14, -2.75]}
        rotation={[0, 0.57, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-3.73, 2.14, -3.1]}
        rotation={[Math.PI, -0.64, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-0.08, 2.14, -5.03]}
        rotation={[0, 0.04, 0]}
        scale={1.52}
      />
      <instances.Object24
        position={[-4.19, 3.98, -2.77]}
        rotation={[Math.PI, -0.66, -Math.PI / 2]}
        scale={-1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_142.geometry}
        material={m.Texture}
        position={[5.79, 0.94, 0.18]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_146.geometry}
        material={m.Texture}
        position={[5.43, 0.32, 0.37]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_150.geometry}
        material={m.Texture}
        position={[5.56, 4.03, 0.35]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_154.geometry}
        material={m.Texture}
        position={[5.87, 4.66, 0.08]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_158.geometry}
        material={m.Texture}
        position={[5.53, 0, -0.85]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_162.geometry}
        material={m.Texture}
        position={[4.05, 0, -2.96]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_166.geometry}
        material={m.Texture}
        position={[3.29, 0, -3.1]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object32
        position={[3.77, 1.84, -2.98]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_182.geometry}
        material={m.Texture}
        position={[5.53, 2.14, -0.85]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_186.geometry}
        material={m.Texture}
        position={[4.05, 2.14, -2.96]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_190.geometry}
        material={m.Texture}
        position={[3.3, 2.14, -3.31]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object32
        position={[3.77, 3.98, -2.98]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object36
        position={[0.35, 2.35, -3.34]}
        rotation={[-0.26, 0, 0]}
      />
      <instances.Object36
        position={[0.18, 2.8, -2.85]}
        rotation={[0.09, 0.15, -0.005]}
      />
      <instances.Object36
        position={[1.89, 0, -1.94]}
        rotation={[0, -0.44, 0]}
        scale={[1.5, 1, 1.5]}
      />
      <instances.Object36
        position={[1.86, 1.61, -1.81]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      <instances.Object36
        position={[3.95, 2.49, 1.61]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      <instances.Object36
        position={[-1.1, 4.29, -4.43]}
        rotation={[0, 0.36, 0]}
      />
      <instances.Object36
        position={[-5.25, 4.29, -1.47]}
        rotation={[0, 1.25, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={n.Object_204.geometry}
        material={m.Texture}
        position={[3.2, 4.29, -3.09]}
        rotation={[-Math.PI, 0.56, 0]}
        scale={-1}
      />
      <ScreenInteractive
        frame="Object_206"
        panel="Object_207"
        position={[0.27, 1.53, -2.61]}
      />
      <ScreenText
        frame="Object_209"
        panel="Object_210"
        y={5}
        position={[-1.43, 2.5, -1.8]}
        rotation={[0, 1, 0]}
      />
      <ScreenText
        invert
        frame="Object_212"
        panel="Object_213"
        x={-5}
        y={5}
        position={[-2.73, 0.63, -0.52]}
        rotation={[0, 1.09, 0]}
      />
      <ScreenText
        invert
        frame="Object_215"
        panel="Object_216"
        position={[1.84, 0.38, -1.77]}
        rotation={[0, -Math.PI / 9, 0]}
      />
      <ScreenText
        invert
        frame="Object_218"
        panel="Object_219"
        x={-5}
        position={[3.11, 2.15, -0.18]}
        rotation={[0, -0.79, 0]}
        scale={0.81}
      />
      <ScreenText
        frame="Object_221"
        panel="Object_222"
        y={5}
        position={[-3.42, 3.06, 1.3]}
        rotation={[0, 1.22, 0]}
        scale={0.9}
      />
      <ScreenText
        invert
        frame="Object_224"
        panel="Object_225"
        position={[-3.9, 4.29, -2.64]}
        rotation={[0, 0.54, 0]}
      />
      <ScreenText
        frame="Object_227"
        panel="Object_228"
        position={[0.96, 4.28, -4.2]}
        rotation={[0, -0.65, 0]}
      />
      <ScreenText
        frame="Object_230"
        panel="Object_231"
        position={[4.68, 4.29, -1.56]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      <Leds instances={instances} />
    </group>
  );
}

/* This component renders a monitor (taken out of the gltf model)
   It renders a custom scene into a texture and projects it onto monitors screen */
function Screen({ frame, panel, children, ...props }) {
  const { nodes, materials } = useGLTF("/computers_1-transformed.glb");
  return (
    <group {...props}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes[frame].geometry}
        material={materials.Texture}
      />
      <mesh geometry={nodes[panel].geometry}>
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

/* Renders a monitor with some text */
function ScreenText({ invert, x = 0, y = 1.2, ...props }) {
  const textRef = useRef();
  const rand = Math.random() * 10000;
  useFrame(
    (state) =>
      (textRef.current.position.x =
        x + Math.sin(rand + state.clock.elapsedTime / 4) * 8)
  );
  return (
    <Screen {...props}>
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={[invert ? "black" : "#35c19f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Text
        font="/Inter-Medium.woff"
        position={[x, y, 0]}
        ref={textRef}
        fontSize={4}
        letterSpacing={-0.1}
        color={!invert ? "black" : "#35c19f"}
      >
        Poimandres.
      </Text>
    </Screen>
  );
}

/* Renders a monitor with a spinning box */
function ScreenInteractive(props) {
  return (
    <Screen {...props}>
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 10]}
      />
      <color attach="background" args={["orange"]} />
      <ambientLight intensity={Math.PI / 2} />
      <pointLight decay={0} position={[10, 10, 10]} intensity={Math.PI} />
      <pointLight decay={0} position={[-10, -10, -10]} />
      <SpinningBox position={[-3.15, 0.75, 0]} scale={0.5} />
    </Screen>
  );
}

// Renders flashing LED's
function Leds({ instances }) {
  const ref = useRef();
  const { nodes } = useGLTF("/computers_1-transformed.glb");
  useMemo(() => {
    nodes.Sphere.material = new THREE.MeshBasicMaterial();
    nodes.Sphere.material.toneMapped = false;
  }, []);
  useFrame((state) => {
    ref.current.children.forEach((instance) => {
      const rand = Math.abs(2 + instance.position.x);
      const t = Math.round(
        (1 + Math.sin(rand * 10000 + state.clock.elapsedTime * rand)) / 2
      );
      instance.color.setRGB(0, t * 1.1, t);
    });
  });
  return (
    <group ref={ref}>
      <instances.Sphere
        position={[-0.41, 1.1, -2.21]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[0.59, 1.32, -2.22]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.77, 1.91, -1.17]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[2.44, 1.1, -0.79]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[4.87, 3.8, -0.1]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.93, 3.8, -3.69]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-2.35, 3.8, -3.48]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-4.71, 4.59, -1.81]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-3.03, 2.85, 1.19]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-1.21, 1.73, -1.49]}
        scale={0.005}
        color={[1, 2, 1]}
      />
    </group>
  );
}
```

```js
// Spinning.js
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";

export function SpinningBox({ scale, ...props }) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  useCursor(hovered);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame(
    (state, delta) => (ref.current.rotation.x = ref.current.rotation.y += delta)
  );
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? scale * 1.4 : scale * 1.2}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? "hotpink" : "indianred"} />
    </mesh>
  );
}
```
