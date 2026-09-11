// 最小的 WebGL2 全螢幕 shader 設定：一個三角形蓋滿畫面，所有事情都在 fragment shader 裡發生。
import frag from './shader.frag'

const canvas = document.getElementById('c')
const gl = canvas.getContext('webgl2')
if (!gl) throw new Error('這個瀏覽器沒有 WebGL2')

const vert = `#version 300 es
void main() {
  // 用 gl_VertexID 直接畫一個蓋滿裁剪空間的大三角形，不需要 buffer
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const compile = (type, src) => {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh))
  }
  return sh
}
const prog = gl.createProgram()
gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert))
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
gl.linkProgram(prog)
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
gl.useProgram(prog)

const u = name => gl.getUniformLocation(prog, name)
const mouse = { x: 0.5, y: 0.5 }
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX / innerWidth
  mouse.y = 1 - e.clientY / innerHeight // GL 的 y 朝上
})

const resize = () => {
  const dpr = Math.min(devicePixelRatio, 2)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  gl.viewport(0, 0, canvas.width, canvas.height)
}
window.addEventListener('resize', resize)
resize()

const start = performance.now()
const frame = () => {
  gl.uniform2f(u('u_resolution'), canvas.width, canvas.height)
  gl.uniform1f(u('u_time'), (performance.now() - start) / 1000)
  gl.uniform2f(u('u_mouse'), mouse.x, mouse.y)
  gl.uniform1f(u('u_dark'), 1)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  requestAnimationFrame(frame)
}
frame()
