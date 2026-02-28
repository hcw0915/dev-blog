---
public: true
layout: ../../layouts/BlogPost.astro
title: Shader - uniform/attribute/varying
createdAt: 1743577743844
updatedAt: 1744088069213
tags:
  - Three
  - Shader
  - Blog
heroImage: /placeholder-hero.png
slug: shader-uniform-attribute-varying
---

# GLSL 著色器中 uniform、attribute 和 varying 的使用指南

## 基本概念

在 GLSL (OpenGL Shading Language) 中，`uniform`、`attribute` 和 `varying` 是三種重要的變數類型，各自有不同的用途和特性：

| 變數類型    | 描述                                               | 訪問權限                                 | 常見前綴 |
| ----------- | -------------------------------------------------- | ---------------------------------------- | -------- |
| `uniform`   | 全局變數，在整個渲染過程中保持不變                 | vertex 和 fragment shader 均可讀取       | `u`      |
| `attribute` | 每個頂點特有的數據                                 | 只能在 vertex shader 中讀取              | `a*`     |
| `varying`   | 從 vertex shader 傳遞到 fragment shader 的插值數據 | vertex shader 寫入，fragment shader 讀取 | `v*`     |

> **注意**：在 OpenGL 3.3+ 和 WebGL 2.0 中，`attribute` 被 `in` 取代，`varying` 被 `in`/`out` 取代。

## 使用案例示範

以下是一個包含 vertex shader 和 fragment shader 的完整示例，展示了這三種變數類型的使用方法：

### Vertex Shader

```glsl
// uniform 變數：全局變數，從 JavaScript 傳入
uniform mat4 u_modelViewMatrix;    // 模型視圖矩陣
uniform mat4 u_projectionMatrix;   // 投影矩陣
uniform float u_time;              // 時間變數，用於動畫

// attribute 變數：每個頂點特有的數據
attribute vec3 a_position;         // 頂點位置
attribute vec3 a_normal;           // 頂點法線
attribute vec2 a_texCoord;         // 紋理坐標

// varying 變數：傳遞給 fragment shader 的數據
varying vec2 v_texCoord;           // 插值後的紋理坐標
varying vec3 v_normal;             // 插值後的法線
varying vec3 v_position;           // 插值後的位置

void main() {
    // 計算最終頂點位置
    vec4 worldPosition = u_modelViewMatrix * vec4(a_position, 1.0);
    gl_Position = u_projectionMatrix * worldPosition;

    // 將數據傳遞給 fragment shader
    v_texCoord = a_texCoord;
    v_normal = (u_modelViewMatrix * vec4(a_normal, 0.0)).xyz;
    v_position = worldPosition.xyz;

    // 可以使用 uniform 變數進行動態變換
    // 例如基於時間的頂點位移
    gl_Position.y += sin(u_time * 0.01 + a_position.x) * 0.1;
}
```

### Fragment Shader

```glsl
precision mediump float;

// uniform 變數：全局變數，從 JavaScript 傳入
uniform sampler2D u_texture;       // 紋理採樣器
uniform vec3 u_lightPosition;      // 光源位置
uniform vec3 u_lightColor;         // 光源顏色
uniform float u_shininess;         // 材質光澤度

// varying 變數：從 vertex shader 接收的數據
varying vec2 v_texCoord;           // 插值後的紋理坐標
varying vec3 v_normal;             // 插值後的法線
varying vec3 v_position;           // 插值後的位置

void main() {
    // 正規化法線向量
    vec3 normal = normalize(v_normal);

    // 計算光照方向
    vec3 lightDir = normalize(u_lightPosition - v_position);

    // 環境光
    vec3 ambient = vec3(0.2, 0.2, 0.2);

    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_lightColor;

    // 高光反射
    vec3 viewDir = normalize(-v_position);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_shininess);
    vec3 specular = spec * u_lightColor * 0.5;

    // 從紋理採樣
    vec4 texColor = texture2D(u_texture, v_texCoord);

    // 最終顏色 = 紋理顏色 * (環境光 + 漫反射 + 高光反射)
    vec3 result = texColor.rgb * (ambient + diffuse + specular);
    gl_FragColor = vec4(result, texColor.a);
}
```

## JavaScript 初始化代碼

以下是在 WebGL 中如何設置這些變數的 JavaScript 代碼：

```javascript
// 獲取 shader 程序
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// 設置 uniform 變數
const uModelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
const uProjectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");
const uTime = gl.getUniformLocation(program, "u_time");
const uTexture = gl.getUniformLocation(program, "u_texture");
const uLightPosition = gl.getUniformLocation(program, "u_lightPosition");
const uLightColor = gl.getUniformLocation(program, "u_lightColor");
const uShininess = gl.getUniformLocation(program, "u_shininess");

// 傳遞 uniform 數據
gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
gl.uniform1f(uTime, currentTime);
gl.uniform1i(uTexture, 0); // 紋理單元 0
gl.uniform3fv(uLightPosition, [1.0, 1.0, 1.0]);
gl.uniform3fv(uLightColor, [1.0, 1.0, 1.0]);
gl.uniform1f(uShininess, 32.0);

// 設置 attribute 變數
const aPosition = gl.getAttribLocation(program, "a_position");
const aNormal = gl.getAttribLocation(program, "a_normal");
const aTexCoord = gl.getAttribLocation(program, "a_texCoord");

// 啟用 attribute
gl.enableVertexAttribArray(aPosition);
gl.enableVertexAttribArray(aNormal);
gl.enableVertexAttribArray(aTexCoord);

// 綁定頂點緩衝區並指定頂點數據格式
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
```

## 具體應用場景

### 1. 基本 2D 紋理渲染

最簡單的應用是將紋理映射到平面上：

```glsl
// Vertex Shader
attribute vec3 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_mvpMatrix;
varying vec2 v_texCoord;

void main() {
    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
    v_texCoord = a_texCoord;
}

// Fragment Shader
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
}
```

### 2. 時間動畫效果

使用 `uniform` 時間變數創建動態效果：

```glsl
// Vertex Shader
attribute vec3 a_position;
uniform float u_time;
uniform mat4 u_mvpMatrix;

void main() {
    vec3 pos = a_position;
    pos.y += sin(pos.x * 10.0 + u_time) * 0.1;
    gl_Position = u_mvpMatrix * vec4(pos, 1.0);
}

// Fragment Shader
precision mediump float;
uniform float u_time;

void main() {
    vec3 color = vec3(0.5 + 0.5 * sin(u_time), 0.5 + 0.5 * cos(u_time), 0.5);
    gl_FragColor = vec4(color, 1.0);
}
```

### 3. 頂點顏色插值

使用 `attribute` 和 `varying` 進行顏色插值：

```glsl
// Vertex Shader
attribute vec3 a_position;
attribute vec3 a_color;
uniform mat4 u_mvpMatrix;
varying vec3 v_color;

void main() {
    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
    v_color = a_color;
}

// Fragment Shader
precision mediump float;
varying vec3 v_color;

void main() {
    gl_FragColor = vec4(v_color, 1.0);
}
```

## 使用建議與最佳實踐

1. **命名規範**：

   - 使用前綴來區分不同類型的變數（`u_` 表示 uniform，`a_` 表示 attribute，`v_` 表示 varying）
   - 保持命名一致性以提高代碼可讀性

2. **效能考量**：

   - 盡量減少 uniform 變數的數量，特別是在處理大量對象時
   - 考慮使用 uniform buffer objects (UBO) 來組織相關的 uniform 變數
   - 避免在 fragment shader 中進行複雜計算，如果可能，將計算移至 vertex shader

3. **精度聲明**：

   - 在 fragment shader 中明確聲明浮點數精度（`precision highp/mediump/lowp float;`）
   - 根據需要選擇適當的精度以平衡效能與視覺質量

4. **相容性**：

   - 在現代 GLSL 中（OpenGL 3.3+，WebGL 2.0），使用 `in`/`out` 替代 `attribute`/`varying`
   - 如需同時支援新舊版本，可考慮使用宏定義

```glsl
// 相容性處理示例
#ifdef GL_ES
precision mediump float;
#endif

#ifdef GL_VERSION_330
#define attribute in
#define varying out
#endif
```

## 常見錯誤與調試技巧

1. **未初始化的 uniform**：檢查是否正確獲取和設置了所有 uniform 位置
2. **attribute 綁定錯誤**：確保正確啟用了 attribute 陣列並設置了正確的數據格式
3. **著色器編譯錯誤**：使用 `gl.getShaderInfoLog()` 檢查著色器編譯錯誤
4. **著色器連接錯誤**：使用 `gl.getProgramInfoLog()` 檢查程序連接錯誤
5. **顏色顯示問題**：檢查 fragment shader 是否正確設置了 `gl_FragColor`
