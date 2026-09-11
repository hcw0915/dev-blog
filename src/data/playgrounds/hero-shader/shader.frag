#version 300 es
precision highp float;

// ── 可以玩的旋鈕 ─────────────────────────────────────────────
const float SPEED = 0.06;   // 流動速度
const float SCALE = 1.6;    // 噪聲尺度：越大花紋越細
const float WARP  = 0.9;    // 域扭曲強度：越大越像流體
const vec3  CYAN   = vec3(0.13, 0.83, 0.93);   // #22d3ee
const vec3  VIOLET = vec3(0.65, 0.55, 0.98);   // #a78bfa
// ────────────────────────────────────────────────────────────

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;   // 0..1，左下為原點
uniform float u_dark;    // 1 = 深色主題，0 = 淺色
uniform float u_hue;     // 色相旋轉（弧度）；沒設定就是 0 = 上面的原色

out vec4 outColor;

// 2D simplex noise（Ashima / Ian McEwan）
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 繞灰階軸 (1,1,1) 旋轉顏色：亮度大致不變，只換色相
vec3 hueRotate(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float cs = cos(a);
  return clamp(c * cs + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cs), 0.0, 1.0);
}

// 疊幾層噪聲 = fbm
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * snoise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p  = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;   // 置中、等比
  float t = u_time * SPEED;

  // 游標把整個場推開一點；沒有滑鼠時 u_mouse 是 (0.5, 0.5)
  vec2 m = (u_mouse - 0.5) * 0.6;

  // 域扭曲：先算一層噪聲當位移，再拿位移後的座標算第二層
  vec2 q = vec2(fbm(p * SCALE + t), fbm(p * SCALE - t * 0.7 + 3.1));
  float n = fbm(p * SCALE + WARP * q + m);

  // 兩個品牌色之間來回，noise 決定在哪
  float k = smoothstep(-0.6, 0.6, n);
  vec3 tint = hueRotate(mix(CYAN, VIOLET, k), u_hue);

  // 邊緣淡出，讓它安靜地待在文字後面（放很寬：這片是全寬背景，左右不該黑掉）
  float vignette = smoothstep(1.9, 0.2, length(p * vec2(0.55, 1.1)));
  float glow = vignette * (0.35 + 0.65 * smoothstep(-0.2, 0.9, n));

  // 深色主題：黑底加色光；淺色主題：白底減一點點色，都留得很淡
  vec3 dark  = vec3(0.035, 0.035, 0.043) + tint * glow * 0.20;
  vec3 light = vec3(0.98, 0.98, 0.973) - (1.0 - tint) * glow * 0.11;
  outColor = vec4(mix(light, dark, u_dark), 1.0);
}
