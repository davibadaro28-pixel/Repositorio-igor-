// Fundo da abertura: fagulhas de brasa subindo devagar (three.js, shader próprio).
// Discreto de propósito: dá calor à página sem competir com o produto.
import * as THREE from 'three';

export function criarBrasa(canvas, { reduzido = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  const cena = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

  const N = 520;
  const pos = new Float32Array(N * 3), sem = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = Math.random() * 2 - 1;
    pos[i * 3 + 1] = Math.random() * 2 - 1;
    pos[i * 3 + 2] = 0;
    // velocidade, tamanho, fase, brilho
    sem.set([0.025 + Math.random() * 0.07, 1 + Math.random() * 3.2, Math.random() * 100, 0.35 + Math.random() * 0.65], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('semente', new THREE.BufferAttribute(sem, 4));
  const uni = { t: { value: 0 }, aspecto: { value: 1 }, mouse: { value: new THREE.Vector2(0, 0) }, escala: { value: renderer.getPixelRatio() } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 semente;
      uniform float t; uniform float aspecto; uniform vec2 mouse; uniform float escala;
      varying float vBrilho; varying float vVida;
      void main() {
        float vel = semente.x, fase = semente.z;
        float y = mod(position.y + 1.0 + t * vel, 2.0) - 1.0;            // sobe e volta por baixo
        float x = position.x + sin(t * 0.6 + fase) * 0.035 + sin(t * 1.7 + fase * 2.0) * 0.012;
        x += mouse.x * 0.05 * (y + 1.0) * 0.5;                            // o calor "puxa" um pouco para o mouse
        vVida = smoothstep(-1.0, -0.55, y) * (1.0 - smoothstep(0.35, 1.0, y));
        vBrilho = semente.w * (0.65 + 0.35 * sin(t * 3.0 + fase * 5.0));
        gl_Position = vec4(x, y, 0.0, 1.0);
        gl_PointSize = semente.y * escala * (0.6 + vVida * 0.6);
      }`,
    fragmentShader: `
      varying float vBrilho; varying float vVida;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        vec3 cor = mix(vec3(0.94, 0.30, 0.06), vec3(1.0, 0.78, 0.42), a * a);
        gl_FragColor = vec4(cor, a * vBrilho * vVida * 0.85);
      }`,
  });
  cena.add(new THREE.Points(geo, mat));

  let visivel = true;
  const alvoMouse = new THREE.Vector2();
  function tamanho() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uni.aspecto.value = w / h;
  }
  new ResizeObserver(tamanho).observe(canvas);
  tamanho();
  window.addEventListener('pointermove', (e) => { alvoMouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)); }, { passive: true });
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);

  const t0 = performance.now();
  function laco(agora) {
    if (visivel) {
      uni.t.value = (agora - t0) / 1000;
      uni.mouse.value.lerp(alvoMouse, 0.04);
      renderer.render(cena, cam);
    }
    requestAnimationFrame(laco);
  }
  if (reduzido) { uni.t.value = 12; renderer.render(cena, cam); }
  else requestAnimationFrame(laco);
}
