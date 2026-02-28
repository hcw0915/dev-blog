---
public: true
layout: ../../layouts/BlogPost.astro
title: Shader - Built-in Variables
createdAt: 1744087968894
updatedAt: 1744088077329
tags:
  - Three
  - Shader
  - Blog
heroImage: /placeholder-hero.png
slug: shader-built-in-variables
---

# GLSL 內置變數筆記

GLSL (OpenGL Shading Language) 中的內置變數是以 `gl_` 開頭的特殊變數，它們提供與 OpenGL 渲染管線的交互。以下是常用的內置變數及其用途。

## 頂點著色器中的內置變數

| 變數名 | 數據類型 | 描述 | 範例 |
|-------|---------|------|------|
| `gl_Position` | `vec4` | 頂點的裁剪空間座標 | `gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);` |
| `gl_PointSize` | `float` | 點精靈的大小（像素）| `gl_PointSize = 10.0;` |
| `gl_VertexID` | `int` | 當前頂點的索引 | `if (gl_VertexID % 2 == 0) { color = vec3(1.0); }` |
| `gl_InstanceID` | `int` | 當前實例的索引 | `offset = instanceOffsets[gl_InstanceID];` |

## 片段著色器中的內置變數

| 變數名 | 數據類型 | 描述 | 範例 |
|-------|---------|------|------|
| `gl_FragCoord` | `vec4` | 片段在窗口座標系中的位置 (x,y,z,1/w) | `vec2 texCoord = gl_FragCoord.xy / resolution;` |
| `gl_FrontFacing` | `bool` | 表示片段是否屬於正面 | `if (gl_FrontFacing) { color = frontColor; } else { color = backColor; }` |
| `gl_FragDepth` | `float` | 允許修改片段的深度值 | `gl_FragDepth = gl_FragCoord.z * 0.5;` |
| `gl_PointCoord` | `vec2` | 點精靈內的座標 (0,0 至 1,1) | `color = texture(pointSprite, gl_PointCoord);` |
| `gl_FragColor` | `vec4` | 片段的最終顏色 (舊版GLSL使用) | `gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);` |

## 幾何著色器中的內置變數

| 變數名 | 數據類型 | 描述 | 範例 |
|-------|---------|------|------|
| `gl_in[]` | 數組 | 來自上一階段的頂點資料陣列 | `vec4 position = gl_in[i].gl_Position;` |
| `gl_PrimitiveIDIn` | `int` | 當前圖元的 ID | `if (gl_PrimitiveIDIn % 2 == 0) { EmitVertex(); }` |
| `gl_Layer` | `int` | 指定渲染的目標層 | `gl_Layer = i % 6;` |

## 共享的內置常量

| 常量名 | 數據類型 | 描述 |
|-------|---------|------|
| `gl_MaxVertexAttribs` | `int` | 支持的最大頂點屬性數 |
| `gl_MaxTextureUnits` | `int` | 支持的最大紋理單元數 |
| `gl_MaxDrawBuffers` | `int` | 支持的最大繪圖緩衝數 |
| `gl_MaxVaryingFloats` | `int` | 支持的最大 varying 變數數量 |

## 使用範例

### 基本頂點和片段著色器

```js
// 頂點著色器
#version 300 es
in vec3 position;
in vec3 normal;
in vec2 texCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    // 計算並輸出裁剪空間座標
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    
    // 傳遞法線和紋理座標到片段著色器
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vTexCoord = texCoord;
}

// 片段著色器
#version 300 es
precision highp float;

in vec3 vNormal;
in vec2 vTexCoord;

uniform sampler2D diffuseMap;
uniform vec3 lightDir;

out vec4 fragColor;

void main() {
    // 計算基本漫反射光照
    vec3 normal = normalize(vNormal);
    float diffuse = max(dot(normal, normalize(lightDir)), 0.0);
    
    // 基於片段是正面還是背面應用不同效果
    if (gl_FrontFacing) {
        // 正面：使用紋理和全光照
        vec4 texColor = texture(diffuseMap, vTexCoord);
        fragColor = texColor * vec4(vec3(0.2 + diffuse * 0.8), 1.0);
    } else {
        // 背面：使用紅色並降低光照強度
        fragColor = vec4(0.8, 0.2, 0.2, 1.0) * vec4(vec3(0.2 + diffuse * 0.4), 1.0);
    }
    
    // 根據片段深度調整透明度
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    fragColor.a *= smoothstep(20.0, 10.0, depth);
}
```

### 使用 gl_PointCoord 創建自定義點精靈

```js
// 頂點著色器
#version 300 es
in vec3 position;
in float size;

uniform mat4 mvpMatrix;

void main() {
    gl_Position = mvpMatrix * vec4(position, 1.0);
    gl_PointSize = size;
}

// 片段著色器
#version 300 es
precision highp float;

uniform vec4 color;

out vec4 fragColor;

void main() {
    // 創建圓形點精靈
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float dist = length(coord);
    
    // 如果在圓外則丟棄片段
    if (dist > 1.0) {
        discard;
    }
    
    // 添加圓形漸變效果
    float alpha = smoothstep(1.0, 0.0, dist);
    fragColor = vec4(color.rgb, color.a * alpha);
}
```

## 版本差異注意事項

- GLSL 130 以前使用 `gl_FragColor` 作為片段著色器輸出
- GLSL 150+ 推薦使用自定義輸出變數而非 `gl_FragColor`
- GLSL ES 3.00+ 必須使用自定義輸出變數
- 某些變數（如 `gl_ClipDistance`）僅在桌面 GL 中可用
- 現代 OpenGL 建議儘量減少對內置變數的依賴，使用用戶定義的輸入/輸出和 uniform 變數

## 其他重要內置變數

| 變數名 | 著色器類型 | 描述 |
|-------|---------|------|
| `gl_ClipDistance[]` | 頂點 | 用戶定義的裁剪平面距離 |
| `gl_PrimitiveID` | 片段 | 當前處理的圖元 ID |
| `gl_SamplePosition` | 片段 | 當前樣本在片段中的位置 (多重採樣) |
| `gl_SampleID` | 片段 | 當前樣本的索引 (多重採樣) |
| `gl_SampleMask` | 片段 | 指定樣本掩碼 (多重採樣) |
| `gl_NumWorkGroups` | 計算 | 調度的工作組總數 |
| `gl_WorkGroupID` | 計算 | 當前工作組的 ID |
| `gl_LocalInvocationID` | 計算 | 當前工作組內的本地 ID |
| `gl_GlobalInvocationID` | 計算 | 全局工作項的 ID |