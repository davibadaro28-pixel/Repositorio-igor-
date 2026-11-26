// Hambúrguer 3D do site (three.js). Cada camada é um serviço:
// pão de baixo = sistema, carne = cardápio digital, queijo e bacon = site, pão de cima = tráfego pago.
// montagem(p): p = 0 (camadas soltas, flutuando) … 1 (lanche montado). destaque(i): realça a camada i.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

export async function criarHamburguer(canvas, { reduzido = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  cam.position.set(0, 2.4, 13.5);
  cam.lookAt(0, 0.55, 0);
  cena.add(new THREE.HemisphereLight(0xfff1d6, 0x6b3a12, 1.0));
  const sol = new THREE.DirectionalLight(0xffffff, 2.4); sol.position.set(4, 7, 6); cena.add(sol);
  const contra = new THREE.DirectionalLight(0xffb060, 1.4); contra.position.set(-5, 3, -5); cena.add(contra);

  // ---------------------------------------------------------------- peças
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const mat = (cor, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: r, envMapIntensity: 0.55, ...extra });
  const torno = (pts, m) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72), m);

  const paoBaixo = torno([[0, 0], [1.3, 0], [1.46, 0.08], [1.5, 0.24], [1.44, 0.38], [0, 0.38]], mat(0xd98a3a, 0.55));
  const carneG = new THREE.CylinderGeometry(1.52, 1.55, 0.46, 80, 6);
  const pc = carneG.attributes.position;
  for (let i = 0; i < pc.count; i++) {
    // borda irregular só na lateral (a tampa continua plana, sem sombras em raio)
    const x = pc.getX(i), z = pc.getZ(i), y = pc.getY(i), a = Math.atan2(z, x);
    const n = 1 + 0.025 * Math.sin(a * 7 + y * 9) + 0.015 * Math.sin(a * 13);
    pc.setXYZ(i, x * n, y, z * n);
  }
  carneG.computeVertexNormals();
  const carne = new THREE.Mesh(carneG, mat(0x4a2414, 0.95));
  carne.position.y = 0.23;
  const carneGr = new THREE.Group(); carneGr.add(carne);

  const fatia = (rot) => {
    const q = new THREE.PlaneGeometry(2.9, 2.9, 44, 44); q.rotateX(-Math.PI / 2);
    const p = q.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x);
      if (r > 1.35) {
        const c = r - 1.35;
        p.setY(i, -c * (0.55 + 0.35 * Math.max(0, Math.sin(a * 3 + 0.7))));
        const enc = 1 - Math.min(0.35, c * 0.25); p.setX(i, x * enc); p.setZ(i, z * enc);
      }
    }
    q.computeVertexNormals();
    const m = new THREE.Mesh(q, mat(0xf5a623, 0.38, { side: THREE.DoubleSide, emissive: 0x4a2200, emissiveIntensity: 0.22 }));
    m.rotation.y = rot; return m;
  };
  const queijo = new THREE.Group(); queijo.add(fatia(0.3)); const f2 = fatia(0.95); f2.position.y = 0.03; queijo.add(f2);
  for (let k = 0; k < 3; k++) {
    const pts = []; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(-1.45 + i * 0.145, 0.06 + Math.sin(i * 0.9 + k) * 0.06, 0));
    const tira = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.07, 8), mat(0x8e2a1c, 0.5));
    tira.scale.set(1, 1, 2.6); tira.position.z = (k - 1) * 0.55; tira.rotation.y = k * 0.25; queijo.add(tira);
  }

  const topo = [[0, 0], [1.42, 0], [1.54, 0.1]];
  for (let i = 1; i <= 20; i++) { const a = (i / 21) * Math.PI / 2; topo.push([Math.cos(a) * 1.54, 0.1 + Math.sin(a) * 1.02]); }
  topo.push([0, 1.12]);
  const paoCima = new THREE.Group();
  paoCima.add(torno(topo, mat(0xd9822c, 0.5)));
  const gergelim = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xfff4d6, 0.6), 70);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 1.28, y = 0.1 + Math.sqrt(Math.max(0, 1 - (r / 1.54) ** 2)) * 1.02;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, y + 0.01, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())), new THREE.Vector3(1, 0.55, 0.7));
    gergelim.setMatrixAt(i, m4);
  }
  paoCima.add(gergelim);

  // ordem de baixo para cima; y = altura montada; solto = posição flutuando
  const CAMADAS = [
    { obj: paoBaixo, y: 0, solto: [-0.9, -0.55, 0.4], giro: 0.4 },
    { obj: carneGr, y: 0.36, solto: [0.95, 0.55, -0.3], giro: -0.6 },
    { obj: queijo, y: 0.84, solto: [-0.75, 1.55, 0.2], giro: 0.8 },
    { obj: paoCima, y: 1.05, solto: [0.7, 2.45, 0.4], giro: -0.5 },
  ];
  const lanche = new THREE.Group();
  CAMADAS.forEach((c) => lanche.add(c.obj));
  lanche.position.y = -0.6;
  cena.add(lanche);

  // sombra no "balcão"
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), new THREE.MeshBasicMaterial({ color: 0x5a2c00, transparent: true, opacity: 0.22, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = -0.62; cena.add(sombra);

  // ---------------------------------------------------------------- estado
  let prog = reduzido ? 1 : 0, alvo = prog, foco = -1, t0 = performance.now(), visivel = true, chegada = reduzido ? 1 : 0;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  function tamanho() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.fov = w / h < 0.8 ? 34 : 28;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(tamanho).observe(canvas);
  tamanho();

  function desenha(agora) {
    const t = (agora - t0) / 1000;
    prog += (alvo - prog) * 0.12;
    if (!reduzido) chegada = cl(t / 1.4);
    CAMADAS.forEach((c, i) => {
      // cada camada encaixa num trecho da montagem, em sequência de baixo para cima
      const k = ease(cl((prog - i * 0.22) / 0.3));
      const flut = (1 - k) * Math.sin(t * 1.3 + i * 1.7) * 0.12;
      const entra = ease(cl(chegada * 1.6 - i * 0.18));
      const [sx, sy, sz] = c.solto;
      c.obj.position.set(sx * (1 - k), (c.y * k + sy * (1 - k)) + flut + (1 - entra) * 6, sz * (1 - k));
      c.obj.rotation.set((1 - k) * 0.35 * Math.sin(t * 0.7 + i), (1 - k) * c.giro + (1 - k) * t * 0.25, (1 - k) * 0.25 * Math.cos(t * 0.6 + i));
      const realce = foco === i ? 1 : 0;
      c.obj.scale.setScalar(1 + realce * 0.06 * (1 - k) + (foco === i ? 0.03 : 0));
    });
    // montado: gira devagar; quando acaba de montar, um "aperto" de leve
    lanche.rotation.y = t * (reduzido ? 0 : 0.18) + 0.5;
    const ap = cl((prog - 0.92) / 0.08);
    lanche.scale.set(1 + ap * 0.03, 1 - ap * 0.05 * Math.sin(ap * Math.PI), 1 + ap * 0.03);
    sombra.material.opacity = 0.1 + 0.16 * prog;
    sombra.scale.setScalar(0.75 + 0.3 * prog);
    renderer.render(cena, cam);
  }
  function laco(agora) {
    if (visivel) desenha(agora);
    requestAnimationFrame(laco);
  }
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);
  if (reduzido) { tamanho(); desenha(performance.now()); new ResizeObserver(() => desenha(performance.now())).observe(canvas); }
  else requestAnimationFrame(laco);

  return {
    montagem(p) { alvo = cl(p); if (reduzido) { prog = alvo; desenha(performance.now()); } },
    destaque(i) { foco = i; },
  };
}
