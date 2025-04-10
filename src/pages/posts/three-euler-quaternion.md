---
public: true
layout: ../../layouts/BlogPost.astro
title: Three - Euler / Quaternion - 旋轉設定
createdAt: 1743396872582
updatedAt: 1744088129141
tags:
  - Three
  - Blog
heroImage: /placeholder-hero.png
slug: three-euler-quaternion
---

# Three.js 旋轉方式整理

## 🎯 旋轉的幾種方式

### 1️⃣ 直接修改 Euler 角

```tsx
object.rotation.x = Math.PI / 4; // 旋轉 45 度
```

✅ 簡單直覺，但可能會遇到萬向鎖（Gimbal Lock）。

***

### 2️⃣ 使用 `setFromEuler()`

```tsx
object.quaternion.setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0));
```

✅ 轉換成 Quaternion，適合多軸旋轉，但仍可能有萬向鎖。

***

### 3️⃣ 使用 `setFromAxisAngle()`

```tsx
const axis = new THREE.Vector3(0, 1, 0); // Y 軸
const angle = Math.PI / 4; // 旋轉 45 度
object.quaternion.setFromAxisAngle(axis, angle);
```

✅ 適合單一軸旋轉，避免萬向鎖。

***

### 4️⃣ 使用 `multiplyQuaternions()`

```tsx
const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0));
const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0));
object.quaternion.multiplyQuaternions(q1, q2);
```

✅ 適合組合旋轉，無萬向鎖問題。

***

## 🔹 其他進階方式

### 5️⃣ 使用 `lookAt()`（朝向目標）

```tsx
object.lookAt(new THREE.Vector3(0, 0, 0));
```

✅ 讓物體自動朝向目標。

***

### 6️⃣ 使用 `applyQuaternion()`（累加旋轉）

```tsx
const q = new THREE.Quaternion();
q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
object.applyQuaternion(q);
```

✅ 適合剛體或物理引擎。

***

### 7️⃣ 使用 `applyMatrix4()`（直接修改矩陣）

```tsx
const matrix = new THREE.Matrix4();
matrix.makeRotationY(Math.PI / 4);
object.applyMatrix4(matrix);
```

✅ 最高效能，適合同時處理縮放、旋轉、位移。

***

### 8️⃣ 使用 `slerp()`（平滑補間旋轉）

```tsx
const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
object.quaternion.slerp(targetRotation, 0.1); // 以 10% 速度補間
```

✅ 適合動畫或平滑轉場。

***

### 9️⃣ 使用 `rotateX()` / `rotateY()` / `rotateZ()`

```tsx
object.rotateY(Math.PI / 4);
```

✅ 適合局部旋轉，但可能有萬向鎖。

***

## 🚀 旋轉方式比較

| 方式                      | 萬向鎖   | 適合補間動畫   | 適合單一軸 | 適合多軸  | 特色                   |
| ----------------------- | ----- | -------- | ----- | ----- | -------------------- |
| `.rotation.x/y/z`       | ❌ 有   | ❌ 不適合    | ✅ 適合  | ❌ 不適合 | 簡單直覺，但有萬向鎖           |
| `setFromEuler()`        | ❌ 有   | ❌ 不適合    | ✅ 適合  | ❌ 不適合 | 轉成 Quaternion，但仍有萬向鎖 |
| `setFromAxisAngle()`    | ✅ 無   | ❌ 不適合    | ✅ 最適合 | ❌ 不適合 | 適合固定軸旋轉              |
| `multiplyQuaternions()` | ✅ 無   | ✅ 最適合    | ✅ 可以  | ✅ 最適合 | 適合複合旋轉               |
| `lookAt()`              | ✅ 無   | ❌ 需要額外處理 | ❌ 不適合 | ✅ 最適合 | 讓物體面向目標              |
| `applyQuaternion()`     | ✅ 無   | ✅ 可補間    | ✅ 適合  | ✅ 適合  | 適合物理引擎               |
| `applyMatrix4()`        | ✅ 無   | ❌ 不適合    | ✅ 適合  | ✅ 適合  | 最高性能，適合變換矩陣          |
| `slerp()`               | ✅ 無   | ✅ 最適合    | ✅ 適合  | ✅ 適合  | 平滑補間旋轉               |
| `rotateX/Y/Z()`         | ❌ 可能有 | ❌ 不適合    | ✅ 適合  | ❌ 不適合 | 以自身座標旋轉              |

***

## 🎯 最佳選擇

- **單純旋轉** → `setFromAxisAngle()` ✅

- **平滑動畫** → `slerp()` ✅

- **物件面向某方向** → `lookAt()` ✅

- **組合多個旋轉** → `multiplyQuaternions()` ✅

這樣你就能完全掌握 Three.js 的旋轉方式了！ 🚀


