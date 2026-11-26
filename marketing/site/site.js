// Site da Sua Hamburgueria: abertura com o produto e avisos de pedido, fagulhas de brasa (three.js),
// serviços com tela que troca na rolagem, demonstração ao vivo, calculadora e faixa de anúncios.
import { criarBrasa } from './brasa.js';

// ------------------------------------------------------------------ CONFIGURAÇÃO
// WhatsApp da empresa com DDI e DDD, só números (ex.: '5511912345678').
// Vazio: o botão abre o WhatsApp com a mensagem pronta para a pessoa escolher o contato.
const WHATSAPP = '';
// ------------------------------------------------------------------

const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const um = (s, el = document) => el.querySelector(s);
const todos = (s, el = document) => [...el.querySelectorAll(s)];

for (const a of todos('a.whats')) {
  const txt = encodeURIComponent(a.dataset.whats || 'Olá! Vi o site e quero saber mais.');
  a.href = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${txt}` : `https://wa.me/?text=${txt}`;
  a.target = '_blank';
  a.rel = 'noopener';
}

const topo = um('#topo');
const marcaTopo = () => topo.classList.toggle('rolou', window.scrollY > 20);
window.addEventListener('scroll', marcaTopo, { passive: true });
marcaTopo();

// fagulhas de brasa no fundo da abertura
try { criarBrasa(um('.brasa'), { reduzido }); } catch (e) { um('.brasa')?.remove(); }

await new Promise((ok) => (window.gsap ? ok() : window.addEventListener('DOMContentLoaded', ok, { once: true })));
const gsap = window.gsap;
const comGsap = !!(gsap && window.ScrollTrigger) && !reduzido;
if (comGsap) gsap.registerPlugin(window.ScrollTrigger);

// ------------------------------------------------------------------ abertura
const avisos = todos('.aviso');
if (comGsap) {
  await document.fonts.ready;
  const ent = gsap.timeline({ defaults: { ease: 'power3.out' } });
  ent.from('.abertura h1', { y: 30, opacity: 0, duration: 0.9 })
    .from('.abertura-sub, .acoes, .garantias', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.55')
    .from('.vitrine > .navegador', { y: 60, opacity: 0, rotateY: -18, duration: 1.1 }, 0.15)
    .from('.aparelho-mini', { y: 80, opacity: 0, duration: 1 }, 0.45);
  // avisos de pedido chegando em sequência, sem parar
  gsap.set(avisos, { autoAlpha: 0, x: 40 });
  const ciclo = gsap.timeline({ repeat: -1, delay: 1.2, repeatDelay: 0.6 });
  avisos.forEach((a, i) => ciclo.to(a, { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }, i * 1.1));
  ciclo.to(avisos, { autoAlpha: 0, y: -10, duration: 0.45, stagger: 0.08, ease: 'power2.in' }, '+=2.4');
  ciclo.set(avisos, { y: 0, x: 40 });
  // a vitrine acompanha o mouse de leve
  const vit = um('.vitrine > .navegador');
  window.addEventListener('pointermove', (e) => {
    const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
    gsap.to(vit, { rotateY: -9 + x * 5, rotateX: 3 - y * 4, duration: 0.8, ease: 'power2.out' });
  }, { passive: true });
}

// ------------------------------------------------------------------ serviços: a tela troca conforme a rolagem
const srvs = todos('.srv');
const visuais = todos('.sv');
function ativaServico(li) {
  srvs.forEach((x) => x.classList.toggle('ativo', x === li));
  for (const v of visuais) {
    const on = v.dataset.v === li.dataset.visual;
    v.classList.toggle('ativo', on);
    const vid = v.querySelector('video');
    if (vid) {
      if (on) { if (!vid.src) vid.src = vid.dataset.src; if (!reduzido) vid.play().catch(() => {}); }
      else vid.pause();
    }
  }
}
const obsSrv = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) ativaServico(e.target); }, { rootMargin: '-48% 0px -48% 0px' });
srvs.forEach((li) => obsSrv.observe(li));
if (srvs[0]) ativaServico(srvs[0]);

// ------------------------------------------------------------------ demonstração
const ligar = um('.ligar');
ligar?.addEventListener('click', () => {
  const f = um('#quadro-demo');
  f.src = 'demo/';
  f.hidden = false;
  ligar.remove();
  f.focus();
});

// ------------------------------------------------------------------ calculadora
const brl = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const ent = { pedidos: um('#c-pedidos'), ticket: um('#c-ticket'), taxa: um('#c-taxa') };
const atual = { fat: 0, com: 0, ano: 0 };
function conta(animar) {
  const pedidos = +ent.pedidos.value, ticket = +ent.ticket.value, taxa = +ent.taxa.value;
  um('#o-pedidos').textContent = pedidos.toLocaleString('pt-BR');
  um('#o-ticket').textContent = 'R$ ' + ticket;
  um('#o-taxa').textContent = String(taxa).replace('.', ',') + '%';
  for (const i of Object.values(ent)) i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%');
  const alvo = { fat: pedidos * ticket, com: (pedidos * ticket * taxa) / 100 };
  alvo.ano = alvo.com * 12;
  const escreve = () => { um('#r-fat').textContent = brl(atual.fat); um('#r-com').textContent = brl(atual.com); um('#r-ano').textContent = brl(atual.ano); };
  if (animar && comGsap) gsap.to(atual, { ...alvo, duration: 0.5, ease: 'power2.out', onUpdate: escreve, overwrite: true });
  else { Object.assign(atual, alvo); escreve(); }
}
Object.values(ent).forEach((i) => i.addEventListener('input', () => conta(true)));
conta(false);

// ------------------------------------------------------------------ anúncios
const obsVid = new IntersectionObserver((es) => {
  for (const e of es) {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduzido) v.play().catch(() => {}); }
    else v.pause();
  }
}, { threshold: 0.4 });
todos('.anuncio video').forEach((v) => obsVid.observe(v));

if (comGsap) {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1081px)', () => {
    const faixa = um('.trilho-faixa');
    const dist = () => Math.max(0, faixa.scrollWidth - window.innerWidth);
    gsap.to(faixa, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.trilho', start: 'center 55%', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  });
  // títulos de seção entram uma vez, com discrição
  todos('.cab h2').forEach((h) => gsap.from(h, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } }));
  window.addEventListener('load', () => window.ScrollTrigger.refresh());
}
