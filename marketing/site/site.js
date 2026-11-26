// Site da Sua Hamburgueria: montagem do lanche 3D na rolagem, demonstração do sistema, tour do painel,
// calculadora de comissão e faixa de anúncios.
import { criarHamburguer } from './burger3d.js';

// ------------------------------------------------------------------ CONFIGURAÇÃO
// Coloque aqui o WhatsApp da empresa com DDI e DDD, só números (ex.: '5511912345678').
// Vazio: o botão abre o WhatsApp com a mensagem pronta para a pessoa escolher o contato.
const WHATSAPP = '';
// ------------------------------------------------------------------

const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const largo = () => window.matchMedia('(min-width: 981px)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// WhatsApp em todos os botões
for (const a of $$('a.whats')) {
  const txt = encodeURIComponent(a.dataset.whats || 'Oi! Vi o site e quero saber mais.');
  a.href = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${txt}` : `https://wa.me/?text=${txt}`;
  a.target = '_blank';
  a.rel = 'noopener';
}

// topo ganha fundo depois que a página rola
const topo = $('#topo');
const marcaTopo = () => topo.classList.toggle('rolou', window.scrollY > 30);
window.addEventListener('scroll', marcaTopo, { passive: true });
marcaTopo();

// ------------------------------------------------------------------ espera o GSAP (scripts com defer)
await new Promise((ok) => (window.gsap && window.ScrollTrigger ? ok() : window.addEventListener('DOMContentLoaded', ok, { once: true })));
const gsap = window.gsap;
const semGsap = !gsap || !window.ScrollTrigger;
if (!semGsap) gsap.registerPlugin(window.ScrollTrigger);
if (reduzido || semGsap) document.body.classList.add('estatico');

// ------------------------------------------------------------------ hambúrguer 3D
let lanche = null;
try {
  lanche = await criarHamburguer($('.lanche3d'), { reduzido: reduzido || semGsap });
} catch (e) {
  console.warn('3D indisponível', e);
  $('.lanche3d').remove();
}

// ------------------------------------------------------------------ abertura + montagem na rolagem
if (!reduzido && !semGsap) {
  await document.fonts.ready;
  // um único momento de entrada: as linhas do título sobem
  gsap.from('.titulo-gigante .linha > span', { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.08, delay: 0.15 });
  gsap.from('.abre-sub, .abre-acoes, .role', { opacity: 0, y: 18, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.6 });

  const comandas = $$('.comanda');
  gsap.set('.camadas', { autoAlpha: 0 });
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to('.camadas', { autoAlpha: 1, duration: 0.02 }, 0.15);
  tl.to('.abertura', { autoAlpha: 0, y: -80, duration: 0.1 }, 0.02);
  // cada comanda desce no espeto quando a sua camada encaixa no lanche
  const quando = [0.17, 0.34, 0.5, 0.66];
  comandas.forEach((c, i) => {
    const giro = [-2.5, 1.8, -1.2, 2.2][i];
    tl.fromTo(c, { autoAlpha: 0, yPercent: -60, rotation: giro * 3 }, { autoAlpha: 1, yPercent: 0, rotation: giro, duration: 0.07, ease: 'back.out(1.6)' }, quando[i]);
    c.style.zIndex = 10 + i;
    // as anteriores ficam embaixo, empilhadas
    if (i > 0) tl.to(comandas.slice(0, i), { y: (k) => (i - k) * 14, scale: (k) => 1 - (i - k) * 0.03, filter: 'brightness(.93)', duration: 0.05 }, quando[i]);
    tl.call(() => lanche?.destaque(i), null, quando[i] + 0.02);
  });
  tl.to('.camadas', { autoAlpha: 0, x: -40, duration: 0.06 }, 0.84);
  tl.fromTo('.pronto', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.86);
  tl.to({}, { duration: 0.08 }, 0.92);

  window.ScrollTrigger.create({
    trigger: '.palco',
    start: 'top top',
    end: () => '+=' + Math.round(window.innerHeight * 4.2),
    pin: true,
    scrub: 0.5,
    animation: tl,
    onUpdate: (st) => {
      lanche?.montagem((st.progress - 0.1) / 0.72);
      if (st.progress < 0.15) lanche?.destaque(-1);
    },
  });
} else {
  lanche?.montagem(1);
}

// ------------------------------------------------------------------ demonstração do sistema
const ligar = $('.ligar');
ligar?.addEventListener('click', () => {
  const f = $('#quadro-demo');
  f.src = 'demo/';
  f.hidden = false;
  ligar.remove();
  f.focus();
});

// ------------------------------------------------------------------ tour do painel
const itens = $$('.tour-itens li');
const telas = $$('.monitor-tela img');
function ativa(li) {
  itens.forEach((x) => x.classList.toggle('ativo', x === li));
  telas.forEach((im) => im.classList.toggle('ativa', im.dataset.n === li.dataset.tela));
}
const obsTour = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) ativa(e.target);
}, { rootMargin: '-45% 0px -45% 0px' });
itens.forEach((li) => obsTour.observe(li));
if (itens[0]) ativa(itens[0]);

// ------------------------------------------------------------------ calculadora de comissão
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const num = new Intl.NumberFormat('pt-BR');
const ent = { pedidos: $('#c-pedidos'), ticket: $('#c-ticket'), taxa: $('#c-taxa') };
const atual = { fat: 0, com: 0, ano: 0 };
function preenche(input) {
  const p = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--p', p + '%');
}
function conta(animar = true) {
  const pedidos = +ent.pedidos.value, ticket = +ent.ticket.value, taxa = +ent.taxa.value;
  $('#o-pedidos').textContent = num.format(pedidos);
  $('#o-ticket').textContent = brl.format(ticket).replace(',00', '');
  $('#o-taxa').textContent = String(taxa).replace('.', ',') + '%';
  $('#r-pedidos').textContent = num.format(pedidos);
  $('#r-taxa').textContent = String(taxa).replace('.', ',');
  Object.values(ent).forEach(preenche);
  const alvo = { fat: pedidos * ticket, com: pedidos * ticket * taxa / 100 };
  alvo.ano = alvo.com * 12;
  const escreve = () => {
    $('#r-fat').textContent = brl.format(atual.fat);
    $('#r-com').textContent = brl.format(atual.com);
    $('#r-ano').textContent = brl.format(atual.ano);
  };
  if (animar && !reduzido && !semGsap) {
    gsap.to(atual, { ...alvo, duration: 0.45, ease: 'power2.out', onUpdate: escreve, overwrite: true });
    // a comanda "sai da impressora" um pouco a cada mudança
    gsap.fromTo('.cupom-papel', { y: -8 }, { y: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
  } else { Object.assign(atual, alvo); escreve(); }
}
Object.values(ent).forEach((i) => i.addEventListener('input', () => conta(true)));
conta(false);

// ------------------------------------------------------------------ faixa de anúncios
const videos = $$('.celular-video video');
const obsVideo = new IntersectionObserver((es) => {
  for (const e of es) {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      if (!reduzido) v.play().catch(() => {});
    } else v.pause();
  }
}, { threshold: 0.35 });
videos.forEach((v) => obsVideo.observe(v));

if (!reduzido && !semGsap) {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', () => {
    const faixa = $('.trilho-faixa');
    const dist = () => Math.max(0, faixa.scrollWidth - window.innerWidth);
    gsap.to(faixa, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: '.trilho', start: 'center 55%', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
    });
  });
  window.addEventListener('load', () => window.ScrollTrigger.refresh());
}
