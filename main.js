(function () {
  // Edite aqui. WhatsApp só com dígitos, com DDI e DDD (o mesmo do Linktree da Bea).
  // Se o WhatsApp ficar vazio, os botões de contato abrem o direct do Instagram.
  const CONFIG = {
    whatsapp: "5511945364807",
    instagram: "beapaes_",

    // Depoimentos reais e autorizados por escrito. Enquanto a lista estiver vazia, a seção fica escondida.
    // Formato de cada item:
    // { texto: "O que ela disse", nome: "Primeiro nome", fase: "Acompanhada na gestação", foto: "img/arquivo.jpg" }
    // A foto é opcional. Pela Resolução CFN 856/2026, não use fotos de corpo, antes e depois ou resultados de exames.
    depoimentos: [],
  };

  const MENSAGEM_PADRAO = "Oi, Bea! Vim pelo site e quero saber mais sobre o acompanhamento na gestação e no pós-parto.";
  const whatsapp = CONFIG.whatsapp.replace(/\D/g, "");
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function linkContato(mensagem) {
    if (whatsapp) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;
    return `https://ig.me/m/${CONFIG.instagram}`;
  }

  function atualizarContatos(mensagem) {
    document.querySelectorAll(".js-contato").forEach((a) => {
      a.href = linkContato(a.dataset.mensagem || mensagem);
    });
  }

  function listar(itens) {
    if (itens.length < 2) return itens.join("");
    return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
  }

  function numero(valor) {
    const n = parseFloat(String(valor).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function formatar(n) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  /* Menu no celular */

  function iniciarMenu() {
    const botao = document.querySelector(".menu-botao");
    const menu = document.getElementById("menu");
    if (!botao || !menu) return;

    function alternar(abrir) {
      botao.setAttribute("aria-expanded", String(abrir));
      botao.querySelector(".visualmente-oculto").textContent = abrir ? "Fechar menu" : "Menu";
      menu.classList.toggle("aberto", abrir);
    }

    botao.addEventListener("click", () => alternar(botao.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) alternar(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("aberto")) {
        alternar(false);
        botao.focus();
      }
    });
  }

  /* Entrada suave das seções */

  function iniciarRevelar() {
    const itens = document.querySelectorAll("[data-revelar]");
    if (!itens.length || reduzirMovimento || !("IntersectionObserver" in window)) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    // O que já está na tela aparece sem animação; o resto entra ao rolar.
    itens.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("visivel");
      else observador.observe(el);
    });
    document.documentElement.classList.add("js");
  }

  /* Depoimentos (só com relatos reais em CONFIG.depoimentos) */

  function iniciarDepoimentos() {
    const secao = document.getElementById("depoimentos");
    const lista = document.getElementById("depoimentos-lista");
    const relatos = CONFIG.depoimentos.filter((d) => d && d.texto && d.nome);
    if (!secao || !lista || !relatos.length) return;

    relatos.forEach((d) => {
      const fig = document.createElement("figure");
      fig.className = "depoimento";
      const citacao = document.createElement("blockquote");
      citacao.textContent = `“${d.texto}”`;
      const legenda = document.createElement("figcaption");
      if (d.foto) {
        const img = document.createElement("img");
        img.className = "depoimento-foto";
        img.src = d.foto;
        img.alt = "";
        img.width = 96;
        img.height = 96;
        img.loading = "lazy";
        legenda.appendChild(img);
      }
      const quem = document.createElement("span");
      const nome = document.createElement("span");
      nome.className = "depoimento-nome";
      nome.textContent = d.nome;
      quem.appendChild(nome);
      if (d.fase) {
        const fase = document.createElement("span");
        fase.className = "depoimento-fase";
        fase.textContent = d.fase;
        quem.appendChild(fase);
      }
      legenda.appendChild(quem);
      fig.append(citacao, legenda);
      lista.appendChild(fig);
    });
    secao.hidden = false;
  }

  /* Formulário curto: monta a mensagem e abre o WhatsApp */

  function iniciarFormulario() {
    const form = document.getElementById("form-entrar");
    if (!form) return null;
    const el = form.elements;
    const erro = document.getElementById("form-erro");
    const pronto = document.getElementById("form-pronto");
    const enviar = pronto ? pronto.querySelector(".js-enviar") : null;

    const valorMarcado = (nome) => {
      const marcado = form.querySelector(`[name="${nome}"]:checked`);
      return marcado ? marcado.value : "";
    };
    const marcar = (nome, valor) => {
      const opcao = form.querySelector(`[name="${nome}"][value="${valor}"]`);
      if (opcao) opcao.checked = true;
    };

    function mostrarCondicionais() {
      const fase = valorMarcado("fase");
      form.querySelectorAll("[data-se]").forEach((c) => {
        c.hidden = c.dataset.se !== fase;
      });
    }

    // Formata o número enquanto a pessoa digita: (11) 91234-5678.
    function mascaraTelefone(valor) {
      let d = valor.replace(/\D/g, "");
      if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
      d = d.slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : "";
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }

    const telefone = el.namedItem("whatsapp");
    telefone.addEventListener("input", () => {
      const antes = telefone.value;
      const depois = mascaraTelefone(antes);
      if (antes !== depois) telefone.value = depois;
    });

    // Pré-preenche a fase pelo endereço (ex.: quero-entrar.html#semana-20) ou pelo disco da página inicial.
    function preencher(ancora) {
      const semanaAncora = /^semana-(\d{1,2})$/.exec(ancora || "");
      if (semanaAncora) {
        marcar("fase", "gestacao");
        el.namedItem("semana").value = semanaAncora[1];
      } else if (ancora === "puerperio") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Menos de 6 semanas";
      } else if (ancora === "retorno") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Entre 6 semanas e 3 meses";
        if (!el.namedItem("interesse").value) el.namedItem("interesse").value = "Recuperação no pós-parto";
      } else if (ancora === "hipertrofia") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Mais de 6 meses";
        el.namedItem("interesse").value = "Ganho de massa muscular depois do parto";
      } else {
        return;
      }
      mostrarCondicionais();
    }

    preencher(location.hash.slice(1));
    window.addEventListener("hashchange", () => preencher(location.hash.slice(1)));
    form.addEventListener("change", mostrarCondicionais);
    mostrarCondicionais();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = el.namedItem("nome").value.trim();
      const digitos = telefone.value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
      const fase = valorMarcado("fase");
      const semanaTexto = el.namedItem("semana").value.trim();
      const semana = /^\d{1,2}$/.test(semanaTexto) ? Number(semanaTexto) : NaN;
      const tempo = el.namedItem("tempo").value;
      const interesse = el.namedItem("interesse").value;

      const faltando = [];
      if (!nome) faltando.push(["nome", "o seu nome"]);
      if (digitos.length < 10 || digitos.length > 11) faltando.push(["whatsapp", "um WhatsApp com DDD"]);
      if (!fase) faltando.push(["fase", "a sua fase"]);
      if (fase === "gestacao" && !(semana >= 1 && semana <= 42)) faltando.push(["semana", "a semana gestacional, de 1 a 42"]);
      if (fase === "pos" && !tempo) faltando.push(["tempo", "há quanto tempo foi o parto"]);
      if (!interesse) faltando.push(["interesse", "o seu principal interesse"]);

      form.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
      if (faltando.length) {
        faltando.forEach(([campo]) => {
          const alvo = form.querySelector(`[name="${campo}"]`);
          if (alvo && alvo.type !== "radio") alvo.setAttribute("aria-invalid", "true");
        });
        erro.textContent = `Falta informar ${listar(faltando.map((f) => f[1]))}.`;
        erro.hidden = false;
        form.querySelector(`[name="${faltando[0][0]}"]`).focus();
        return;
      }
      erro.hidden = true;

      const linhas = [
        "Oi, Bea! Vim pelo site e quero conversar sobre o acompanhamento.",
        "",
        `Nome: ${nome}`,
        `WhatsApp: ${mascaraTelefone(digitos)}`,
        fase === "gestacao" ? `Fase: gestação, semana ${semana}` : `Fase: pós-parto, ${tempo.toLowerCase()}`,
        `Principal interesse: ${interesse}`,
      ];
      const link = linkContato(linhas.join("\n"));

      if (enviar) {
        enviar.href = link;
        enviar.textContent = whatsapp ? "toque aqui para abrir a conversa" : "toque aqui para abrir o direct do Instagram";
      }
      window.open(link, "_blank", "noopener");
      if (pronto) {
        pronto.hidden = false;
        pronto.focus({ preventScroll: true });
        pronto.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "nearest" });
      }
    });

    return preencher;
  }

  /* Disco gestacional da página inicial */

  function iniciarDisco(preencherFormulario) {
    const svg = document.querySelector(".disco-svg");
    if (!svg) return;

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
        texto: "Enjoo, aversões e cansaço. O foco é comer bem mesmo nos dias difíceis, com o ácido fólico e os nutrientes que o bebê mais precisa agora.",
      },
      {
        inicio: 13 * GRAUS_POR_SEMANA,
        fim: 27 * GRAUS_POR_SEMANA,
        nome: "2º trimestre",
        texto: "A fome aumenta e o bebê cresce rápido. O ganho de peso é acompanhado na curva da Caderneta da Gestante, com ferro, cálcio e proteína no prato.",
      },
      {
        inicio: 27 * GRAUS_POR_SEMANA,
        fim: 270,
        nome: "3º trimestre",
        texto: "Reta final: azia, intestino preso e estômago apertado. Refeições menores e mais frequentes, e a alimentação dos primeiros dias com o bebê já pensada.",
      },
      {
        inicio: 270,
        fim: 300,
        nome: "primeiras 6 semanas",
        texto: "Primeiras semanas com o bebê. Comida prática e nutritiva para recuperar a energia e sustentar a amamentação, sem dieta restritiva.",
        mensagem: "Oi, Bea! Tive meu bebê há poucas semanas e quero saber mais sobre o acompanhamento.",
        ancora: "puerperio",
      },
      {
        inicio: 300,
        fim: 330,
        nome: "recuperação",
        texto: "Perda de peso gradual, no ritmo do sono e da amamentação, com energia para o dia a dia e sem dieta restritiva.",
        mensagem: "Oi, Bea! Tive meu bebê e quero cuidar da alimentação na recuperação do pós-parto.",
        ancora: "retorno",
      },
      {
        inicio: 330,
        fim: 360,
        nome: "ganho de massa muscular",
        texto: "Com o treino liberado pelo seu médico, proteína e energia ajustadas para apoiar o ganho de massa muscular.",
        mensagem: "Oi, Bea! Quero saber mais sobre a nutrição para ganho de massa muscular depois do parto.",
        ancora: "hipertrofia",
      },
    ];

    const range = document.getElementById("fase-range");
    const marcador = svg.querySelector(".disco-marcador");
    const faseSemana = document.querySelector(".fase-semana");
    const faseNome = document.querySelector(".fase-nome");
    const faseTexto = document.querySelector(".fase-texto");
    const barriga = svg.querySelector(".barriga");
    const braco = svg.querySelector(".braco");
    const bebe = svg.querySelector(".fig-bebe");
    const kettlebell = svg.querySelector(".fig-kettlebell");
    const halter = svg.querySelector(".fig-halter");
    const entrar = document.querySelectorAll(".js-entrar");
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

    function desenhar() {
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
      if (!reduzirMovimento) svg.classList.add("desenhar");
    }

    function lerValor(v) {
      if (v <= 40) {
        const indice = v <= 13 ? 0 : v <= 27 ? 1 : 2;
        return {
          indice,
          graus: (v - 0.5) * GRAUS_POR_SEMANA,
          linha1: `Semana ${v}`,
          linha2: FASES[indice].nome,
          mensagem: `Oi, Bea! Estou na semana ${v} da gestação e quero saber mais sobre o acompanhamento.`,
          ancora: `semana-${v}`,
        };
      }
      const indice = v - 38;
      return {
        indice,
        graus: FASES[indice].inicio + 15,
        linha1: "Pós-parto",
        linha2: FASES[indice].nome,
        mensagem: FASES[indice].mensagem,
        ancora: FASES[indice].ancora,
      };
    }

    // A figura no centro do disco: a barriga sai de baixo do peito e afunila até a pelve,
    // crescendo com a semana; no pós-parto ela segura o bebê, depois um kettlebell e,
    // no ganho de massa muscular, um halter.
    function bezier(a, b, c, d, t) {
      const u = 1 - t;
      return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]);
    }

    function contornoBarriga(p) {
      const f = p / 40;
      const topo = [98, 134 - 44 * f];
      const base = [104, 188];
      const frente = [100 + p, topo[1] + 0.56 * (base[1] - topo[1])];
      const c1 = [topo[0] + 0.25 * p, topo[1] + 0.2 * (frente[1] - topo[1])];
      const c2 = [frente[0], frente[1] - 0.55 * (frente[1] - topo[1])];
      const c3 = [frente[0], frente[1] + 0.5 * (base[1] - frente[1])];
      const c4 = [base[0] + 0.4 * p, base[1] - 0.2 * (base[1] - frente[1])];
      const pt = (n) => n.map((v) => v.toFixed(1)).join(" ");
      const mao = bezier(frente, c3, c4, base, 0.3);
      return {
        d: `M86 ${topo[1].toFixed(1)} L${pt(topo)} C${pt(c1)} ${pt(c2)} ${pt(frente)} C${pt(c3)} ${pt(c4)} ${pt(base)} L86 ${base[1]} Z`,
        braco: `M80 82 Q 68 122 ${(mao[0] - 5).toFixed(1)} ${(mao[1] - 1).toFixed(1)}`,
      };
    }

    function trocarCaminho(el, d) {
      el.setAttribute("d", d);
      el.style.d = `path("${d}")`;
    }

    function desenharFigura(v) {
      let p;
      let d;
      if (v <= 40) {
        p = v <= 12 ? v * 0.3 : 3.6 + ((v - 12) / 28) * 32.4;
      } else if (v === 41) {
        p = 7;
        d = "M80 82 Q 74 128 118 120";
      } else if (v === 42) {
        p = 3;
        d = "M80 82 Q 76 122 82 160";
      } else {
        p = 0;
        d = "M80 82 L 76 120 L 100 98";
      }
      const contorno = contornoBarriga(p);
      trocarCaminho(barriga, contorno.d);
      trocarCaminho(braco, d || contorno.braco);
      bebe.classList.toggle("oculto", v !== 41);
      kettlebell.classList.toggle("oculto", v !== 42);
      halter.classList.toggle("oculto", v !== 43);
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

      if (escolheu) {
        atualizarContatos(estado.mensagem);
        entrar.forEach((a) => {
          a.href = `quero-entrar.html#${estado.ancora}`;
        });
        if (preencherFormulario) preencherFormulario(estado.ancora);
      }
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

    desenhar();
    atualizar();
  }

  /* Calculadora de ganho de peso (Caderneta da Gestante, Ministério da Saúde, 2022) */

  const FAIXAS_GANHO = [
    { ate: 18.5, nome: "baixo peso", min: 9.7, max: 12.2 },
    { ate: 25, nome: "eutrofia", min: 8.0, max: 12.0 },
    { ate: 30, nome: "sobrepeso", min: 7.0, max: 9.0 },
    { ate: Infinity, nome: "obesidade", min: 5.0, max: 7.2 },
  ];

  function iniciarCalculadora() {
    const form = document.getElementById("calc");
    if (!form) return;
    const saida = document.getElementById("calc-resultado");
    const vazio = saida.innerHTML;
    const campo = (nome) => numero(form.elements.namedItem(nome).value);

    function calcular() {
      const altura = campo("altura");
      const antes = campo("antes");
      const hoje = campo("hoje");
      const semana = campo("semana");

      if (altura === null || antes === null) {
        saida.innerHTML = vazio;
        return;
      }

      // Aceita altura em metros (1,65) ou em centímetros (165).
      const metros = altura < 3 ? altura : altura / 100;
      if (metros < 1.2 || metros > 2.2 || antes < 30 || antes > 250) {
        saida.innerHTML = '<p class="calc-vazio">Confira os valores: altura em centímetros (ex.: 165) e peso em quilos (ex.: 62).</p>';
        return;
      }

      const imc = antes / (metros * metros);
      const faixa = FAIXAS_GANHO.find((f) => imc < f.ate);
      let html = `<p>IMC antes da gestação: <strong>${formatar(imc)}</strong>, ${faixa.nome}.</p>
        <p class="calc-faixa">${formatar(faixa.min)} a ${formatar(faixa.max)} kg</p>
        <p>é a faixa de ganho total recomendada até o fim da gestação.</p>`;

      if (hoje !== null && hoje >= 30 && hoje <= 250) {
        const ganho = hoje - antes;
        const quando = semana !== null && semana >= 1 && semana <= 42 ? ` até a semana ${Math.round(semana)}` : " até agora";
        if (ganho < 0) {
          html += `<p class="calc-agora">Você está ${formatar(-ganho)} kg abaixo do peso de antes da gestação. Vale conversar com a nutricionista e o obstetra.</p>`;
        } else if (ganho > faixa.max) {
          html += `<p class="calc-agora">Ganho de ${formatar(ganho)} kg${quando}. Isso já passa do total recomendado para a gestação inteira. Vale conversar com a nutricionista.</p>`;
        } else {
          html += `<p class="calc-agora">Ganho de ${formatar(ganho)} kg${quando}. Para saber se o ritmo está certo para a sua semana, a nutricionista confere na curva da Caderneta da Gestante.</p>`;
        }
      }
      saida.innerHTML = html;
    }

    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("input", calcular);
    calcular();
  }

  atualizarContatos(MENSAGEM_PADRAO);
  iniciarMenu();
  iniciarDepoimentos();
  const preencherFormulario = iniciarFormulario();
  iniciarDisco(preencherFormulario);
  iniciarCalculadora();
  iniciarRevelar();
})();
