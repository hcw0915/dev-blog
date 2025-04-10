---
public: true
layout: ../../layouts/BlogPost.astro
title: Shader - template
createdAt: 1743657255679
updatedAt: 1744088094429
tags:
  - Three
  - Shader
  - Blog
heroImage: /placeholder-hero.png
slug: shader-template
---

```js
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
});
```

```js
// vertex.glsl
void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // 基本圍繞著 modelPosition 去做操作
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
}
```

```js
// fragment.glsl
void main(){
    gl_FragColor = vec4(1,0, 1.0, 1.0, 1.0);

    // 確保顏色渲染正確
    #include <colorspace_fragment>

}
```
