(function () {
  const CX = 200;
  const CY = 200;
  const RAIO = 160;
  const GRAUS_POR_SEMANA = 270 / 40;

  // Gestação ocupa 270° do disco (40 semanas); o pós-parto ocupa os 90° restantes.
  const FASES = [
    {
      inicio: 0,
      fim: 13 * GRAUS_POR_SEMANA,
      nome: "1º trimestre",
      texto: "Fase de enjoo e cansaço para muitas mulheres. O treino se adapta aos seus dias para você continuar se movimentando, e a nutricionista ajuda na alimentação quando comer é difícil.",
    },
    {
      inicio: 13 * GRAUS_POR_SEMANA,
      fim: 27 * GRAUS_POR_SEMANA,
      nome: "2º trimestre",
      texto: "A fase com mais energia. Você ganha força nas costas, no quadril e nas pernas, que vão sustentar a barriga, e acompanha o ganho de peso mês a mês com a nutricionista.",
    },
    {
      inicio: 27 * GRAUS_POR_SEMANA,
      fim: 270,
      nome: "3º trimestre",
      texto: "Reta final. Mobilidade, respiração e assoalho pélvico para o parto, junto com a preparação da doula. A carga diminui e o cuidado aumenta.",
    },
    {
      inicio: 270,
      fim: 300,
      nome: "primeiras 6 semanas",
      texto: "Primeiras semanas com o bebê. Nada de treino pesado: o foco é descanso e respiração enquanto você espera a liberação do obstetra.",
      mensagem: "Oi, Bea! Tive meu bebê há poucas semanas e quero saber mais sobre o programa.",
    },
    {
      inicio: 300,
      fim: 330,
      nome: "volta ao treino",
      texto: "Com a liberação do obstetra, você reconecta abdômen e assoalho pélvico e volta a ganhar força, no ritmo do sono e da amamentação.",
      mensagem: "Oi, Bea! Tive meu bebê e quero voltar a treinar com você.",
    },
    {
      inicio: 330,
      fim: 360,
      nome: "hipertrofia",
      texto: "Corpo recuperado, hora de construir músculo. No programa de hipertrofia, o objetivo é ficar mais forte.",
      mensagem: "Oi, Bea! Quero saber mais sobre o programa de hipertrofia.",
    },
  ];

  const MENSAGEM_PADRAO = "Oi, Bea! Quero saber mais sobre o programa para gestação e pós-parto.";

  const svg = document.querySelector(".disco-svg");
  const range = document.getElementById("fase-range");
  const marcador = document.querySelector(".disco-marcador");
  const faseSemana = document.querySelector(".fase-semana");
  const faseNome = document.querySelector(".fase-nome");
  const faseTexto = document.querySelector(".fase-texto");
  const barriga = document.querySelector(".barriga");
  const braco = document.querySelector(".braco");
  const bebe = document.querySelector(".fig-bebe");
  const kettlebell = document.querySelector(".fig-kettlebell");
  const halter = document.querySelector(".fig-halter");
  const contatos = document.querySelectorAll(".js-contato");

  const whatsapp = (document.body.dataset.whatsapp || "").replace(/\D/g, "");
  const instagram = document.body.dataset.instagram;
  let escolheu = false;

  function ponto(graus, raio) {
    const rad = (graus * Math.PI) / 180;
    return [CX + raio * Math.sin(rad), CY - raio * Math.cos(rad)];
  }

  function arco(inicio, fim, raio) {
    const [x1, y1] = ponto(inicio, raio);
    const [x2, y2] = ponto(fim, raio);
    const grande = fim - inicio > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${raio} ${raio} 0 ${grande} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  function criar(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function desenharDisco() {
    const ticks = svg.querySelector(".disco-ticks");
    for (let semana = 1; semana <= 40; semana++) {
      const marco = semana === 13 || semana === 27 || semana === 40;
      const g = semana * GRAUS_POR_SEMANA;
      const [x1, y1] = ponto(g, 182);
      const [x2, y2] = ponto(g, marco ? 198 : 190);
      ticks.appendChild(criar("line", { x1, y1, x2, y2, class: marco ? "marco" : "" }));
    }
    [300, 330, 360].forEach((g) => {
      const [x1, y1] = ponto(g, 182);
      const [x2, y2] = ponto(g, 198);
      ticks.appendChild(criar("line", { x1, y1, x2, y2, class: "marco" }));
    });

    const segmentos = svg.querySelector(".disco-segmentos");
    FASES.forEach((fase, i) => {
      const path = criar("path", { d: arco(fase.inicio + 0.9, fase.fim - 0.9, RAIO) });
      segmentos.appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.setProperty("--len", len);
      path.style.setProperty("--i", i);
      fase.path = path;
    });
    svg.classList.add("desenhar");
  }

  function lerValor(v) {
    if (v <= 40) {
      const indice = v <= 13 ? 0 : v <= 27 ? 1 : 2;
      return {
        indice,
        graus: (v - 0.5) * GRAUS_POR_SEMANA,
        linha1: `Semana ${v}`,
        linha2: FASES[indice].nome,
        mensagem: `Oi, Bea! Estou na semana ${v} da gestação e quero saber mais sobre o programa.`,
      };
    }
    const indice = v - 38;
    return {
      indice,
      graus: FASES[indice].inicio + 15,
      linha1: "Pós-parto",
      linha2: FASES[indice].nome,
      mensagem: FASES[indice].mensagem,
    };
  }

  // A figura no centro do disco: a barriga cresce com a semana; no pós-parto ela segura o bebê,
  // depois um kettlebell e, na hipertrofia, um halter.
  function desenharFigura(v) {
    let escala;
    let d;
    if (v <= 40) {
      escala = v <= 12 ? 0.1 + v * 0.012 : 0.25 + ((v - 12) / 28) * 0.75;
      const mx = 86 + 68 * escala * 0.7;
      const my = 142 + 34 * escala * 0.45;
      d = `M80 82 Q 68 126 ${mx.toFixed(1)} ${my.toFixed(1)}`;
    } else if (v === 41) {
      escala = 0.2;
      d = "M80 82 Q 74 128 118 120";
    } else if (v === 42) {
      escala = 0.12;
      d = "M80 82 Q 76 122 82 160";
    } else {
      escala = 0.1;
      d = "M80 82 L 76 120 L 100 98";
    }
    barriga.style.transform = `scale(${escala})`;
    braco.setAttribute("d", d);
    bebe.classList.toggle("oculto", v !== 41);
    kettlebell.classList.toggle("oculto", v !== 42);
    halter.classList.toggle("oculto", v !== 43);
  }

  function linkContato(mensagem) {
    if (whatsapp) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;
    return `https://ig.me/m/${instagram}`;
  }

  function atualizarContatos(mensagemFase) {
    contatos.forEach((a) => {
      a.href = linkContato(a.dataset.mensagem || (escolheu ? mensagemFase : MENSAGEM_PADRAO));
    });
  }

  function atualizar() {
    const valor = Number(range.value);
    const estado = lerValor(valor);
    const fase = FASES[estado.indice];

    marcador.style.transform = `rotate(${estado.graus}deg)`;
    desenharFigura(valor);
    faseSemana.textContent = estado.linha1;
    faseNome.textContent = estado.linha2;
    faseTexto.textContent = fase.texto;
    range.setAttribute("aria-valuetext", `${estado.linha1}, ${estado.linha2}`);

    FASES.forEach((f, i) => {
      f.path.classList.toggle("ativo", i === estado.indice);
      f.path.classList.toggle("passado", i < estado.indice);
    });

    atualizarContatos(estado.mensagem);
  }

  // Clique (ou arraste com o mouse) no disco escolhe a fase pelo ângulo.
  function valorPeloPonteiro(evento) {
    const p = svg.createSVGPoint();
    p.x = evento.clientX;
    p.y = evento.clientY;
    const local = p.matrixTransform(svg.getScreenCTM().inverse());
    let graus = (Math.atan2(local.x - CX, CY - local.y) * 180) / Math.PI;
    if (graus < 0) graus += 360;
    if (graus < 270) return Math.min(40, Math.floor(graus / GRAUS_POR_SEMANA) + 1);
    return 41 + Math.min(2, Math.floor((graus - 270) / 30));
  }

  function escolher(evento) {
    range.value = valorPeloPonteiro(evento);
    escolheu = true;
    atualizar();
  }

  let arrastando = false;
  svg.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") arrastando = true;
  });
  window.addEventListener("pointerup", () => {
    arrastando = false;
  });
  svg.addEventListener("pointermove", (e) => {
    if (arrastando) escolher(e);
  });
  svg.addEventListener("click", escolher);

  range.addEventListener("input", () => {
    escolheu = true;
    atualizar();
  });

  desenharDisco();
  atualizar();
})();
