---
public: true
slug: three-euler-vs-quaternion
layout: ../../layouts/BlogPost.astro
title: Three - Euler vs Quaternion：觀念、九種旋轉寫法與選擇
createdAt: 1743397454231
updatedAt: 1791197563958
tags:
  - Three
  - Blog
heroImage: /placeholder-hero.png
---

> 在 Three.js 裡，旋轉有兩種表示法：`Euler`（歐拉角）與 `Quaternion`（四元數）。這篇先講兩者各適合什麼情境，再整理實際操作旋轉的九種寫法，最後給一張比較表與選擇建議。

## 1. 兩種表示法

### Euler（歐拉角）

用三個角度描述「依序繞 X、Y、Z 軸轉多少」。直覺、好調，`object.rotation` 就是它。

```js
object.rotation.set(Math.PI / 4, Math.PI / 6, 0) // 繞 X 轉 45°、繞 Y 轉 30°
```

- **適合**：單軸或少量旋轉、要直接看懂和手調數值的情境、簡單動畫
- **問題**：**萬向鎖（Gimbal Lock）** —— 中間那一軸轉到接近 90° 時，另外兩軸會轉到同一個方向，失去一個自由度；在兩組歐拉角之間直接內插，路徑也常常繞遠或不自然

### Quaternion（四元數）

用四個數描述「繞某個軸轉多少」，本身沒有萬向鎖。`object.quaternion` 就是它，跟 `object.rotation` 會自動同步。

```js
const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0))
object.quaternion.multiplyQuaternions(q1, q2) // 組合兩次旋轉
```

- **適合**：多軸組合旋轉、需要避開萬向鎖、旋轉之間要平滑補間（動畫、鏡頭轉場）
- **代價**：不直觀，四個數字看不出轉了多少度；需要跟歐拉角互轉時多一步

> [!TIP]
> 萬向鎖是**歐拉角這種表示法**的問題，不是物體真的卡住。同一個朝向用四元數表示就沒有這個問題 —— 所以關鍵是「在哪一種表示法上做組合與內插」，而不是最後存成哪一種。

## 2. 九種旋轉寫法

### 直接改歐拉角

```js
object.rotation.x = Math.PI / 4 // 45°
```

最簡單；連續多軸調整或內插時會碰到萬向鎖。

### `rotateX()` / `rotateY()` / `rotateZ()`

```js
object.rotateY(Math.PI / 4)
```

以**物體自身**的座標軸累加旋轉，適合「往自己的右邊轉一點」這種局部操作。

### `setFromEuler()`

```js
object.quaternion.setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
```

把一組歐拉角轉成四元數。得到的朝向跟那組歐拉角完全相同；好處是轉成四元數之後，後續的組合（`multiply`）與補間（`slerp`）就不再受萬向鎖影響。

### `setFromAxisAngle()`

```js
object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4)
```

「繞這個軸轉這個角度」，軸可以是任意方向，不限 X / Y / Z。

### `multiplyQuaternions()`

```js
object.quaternion.multiplyQuaternions(q1, q2)
```

組合兩次旋轉。注意順序：四元數乘法不可交換，`q1 × q2` 和 `q2 × q1` 結果不同。

### `applyQuaternion()`

```js
const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4)
object.applyQuaternion(q)
```

在目前的旋轉上再疊一次，適合每一幀累加角速度（例如物理模擬）。

### `slerp()`

```js
const target = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
object.quaternion.slerp(target, 0.1) // 每次往目標靠近 10%
```

球面線性內插，兩個朝向之間走最短的弧，是平滑轉向的標準做法。

### `lookAt()`

```js
object.lookAt(new THREE.Vector3(0, 0, 0))
```

讓物體朝向某個點。鏡頭跟隨、角色轉頭看目標都用它。

### `applyMatrix4()`

```js
const m = new THREE.Matrix4().makeRotationY(Math.PI / 4)
object.applyMatrix4(m)
```

直接套用變換矩陣，可以把縮放、旋轉、位移一次合併套用；平常只要旋轉時，用前面幾種比較好讀。

## 3. 比較表

| 寫法 | 底層表示 | 萬向鎖 | 適合補間 | 典型用途 |
|---|---|---|---|---|
| `.rotation.x/y/z` | 歐拉角 | 會遇到 | ✗ | 直覺設定、手調數值 |
| `rotateX/Y/Z()` | 歐拉角（局部軸） | 會遇到 | ✗ | 依自身座標轉一點 |
| `setFromEuler()` | 歐拉角 → 四元數 | 轉換後的運算不受影響 | ✓（轉成四元數後） | 從角度設定進入四元數流程 |
| `setFromAxisAngle()` | 四元數 | 不會 | ✓ | 繞任意軸旋轉 |
| `multiplyQuaternions()` | 四元數 | 不會 | ✓ | 組合多次旋轉 |
| `applyQuaternion()` | 四元數 | 不會 | ✓ | 每幀累加旋轉 |
| `slerp()` | 四元數 | 不會 | ✓✓ | 平滑轉向、動畫 |
| `lookAt()` | 四元數 | 不會 | 需搭配 `slerp` | 朝向目標 |
| `applyMatrix4()` | 矩陣 | 不會 | ✗ | 同時套用縮放／旋轉／位移 |

## 4. 怎麼選

- **只是把東西擺好角度** → `.rotation` 或 `rotateX/Y/Z()`，最好讀
- **繞某個任意軸轉** → `setFromAxisAngle()`
- **好幾次旋轉疊在一起** → 先轉成四元數，再 `multiplyQuaternions()` / `applyQuaternion()`
- **平滑轉到某個朝向** → `slerp()`；要朝向一個點就先用 `lookAt()` 算出目標朝向，再 `slerp` 過去
- **要跟縮放、位移一起處理** → `applyMatrix4()`

原則就一句：**設定用歐拉角，運算用四元數。**
