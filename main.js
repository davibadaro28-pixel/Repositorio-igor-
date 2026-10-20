(function () {
  // PREENCHER: número de WhatsApp da Bea só com dígitos, com DDI e DDD (ex.: 5511999999999).
  // Enquanto estiver vazio, os botões de contato abrem o direct do Instagram.
  const CONFIG = {
    whatsapp: "",
    instagram: "beapaes_",
  };

  const MENSAGEM_PADRAO = "Oi, Bea! Quero saber mais sobre o programa para gestação e pós-parto.";
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
      menu.classList.toggle("aberto", abrir);
    }

    botao.addEventListener("click", () => alternar(botao.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("aberto")) {
        alternar(false);
        botao.focus();
      }
    });
  }

  /* Disco gestacional da página inicial */

  function iniciarDisco() {
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
        ancora: "puerperio",
      },
      {
        inicio: 300,
        fim: 330,
        nome: "volta ao treino",
        texto: "Com a liberação do obstetra, você reconecta abdômen e assoalho pélvico e volta a ganhar força, no ritmo do sono e da amamentação.",
        mensagem: "Oi, Bea! Tive meu bebê e quero voltar a treinar com você.",
        ancora: "retorno",
      },
      {
        inicio: 330,
        fim: 360,
        nome: "hipertrofia",
        texto: "Corpo recuperado, hora de construir músculo. No programa de hipertrofia, o objetivo é ficar mais forte.",
        mensagem: "Oi, Bea! Quero saber mais sobre o programa de hipertrofia.",
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
    // na hipertrofia, um halter.
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

  /* Formulário "Quero entrar" */

  function iniciarFormulario() {
    const form = document.getElementById("form-entrar");
    if (!form) return;
    const el = form.elements;
    const erro = document.getElementById("form-erro");
    const pronta = document.getElementById("mensagem-pronta");
    const titulo = pronta.querySelector("h2");
    const instrucao = pronta.querySelector(".mensagem-instrucao");
    const texto = document.getElementById("mensagem-texto");
    const enviar = pronta.querySelector(".js-enviar");
    const copiar = pronta.querySelector(".js-copiar");
    const copiado = pronta.querySelector(".copiado");
    const avisoLiberacao = form.querySelector(".js-aviso-liberacao");

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
      avisoLiberacao.hidden = valorMarcado("liberacao") !== "Não liberou";
    }

    // Pré-preenche a fase escolhida no disco da página inicial (ex.: #semana-20, #retorno).
    function aplicarAncora() {
      const ancora = location.hash.slice(1);
      const semanaAncora = /^semana-(\d{1,2})$/.exec(ancora);
      if (semanaAncora) {
        marcar("fase", "gravida");
        el.namedItem("semana").value = semanaAncora[1];
      } else if (ancora === "puerperio") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Menos de 6 semanas";
      } else if (ancora === "retorno") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Entre 6 semanas e 3 meses";
      } else if (ancora === "hipertrofia") {
        marcar("fase", "pos");
        el.namedItem("tempo").value = "Mais de 6 meses";
        marcar("preocupacoes", "Voltar a treinar pesado");
      }
      mostrarCondicionais();
    }
    aplicarAncora();
    window.addEventListener("hashchange", aplicarAncora);
    form.addEventListener("change", mostrarCondicionais);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = el.namedItem("nome").value.trim();
      const fase = valorMarcado("fase");
      const semana = parseInt(el.namedItem("semana").value, 10);
      const tempo = el.namedItem("tempo").value;
      const parto = el.namedItem("parto").value;

      const faltando = [];
      if (!nome) faltando.push(["nome", "o seu nome"]);
      if (!fase) faltando.push(["fase", "a sua fase"]);
      if (fase === "gravida" && !(semana >= 1 && semana <= 42)) faltando.push(["semana", "a semana de gestação, de 1 a 42"]);
      if (fase === "pos" && !tempo) faltando.push(["tempo", "há quanto tempo foi o parto"]);

      if (faltando.length) {
        erro.textContent = `Falta preencher ${listar(faltando.map((f) => f[1]))}.`;
        erro.hidden = false;
        form.querySelector(`[name="${faltando[0][0]}"]`).focus();
        return;
      }
      erro.hidden = true;

      const linhas = ["Oi, Bea! Quero entrar no programa.", "", `Nome: ${nome}`];
      if (fase === "gravida") {
        linhas.push(`Fase: grávida, semana ${semana}`);
      } else {
        linhas.push(`Fase: pós-parto, ${tempo.toLowerCase()}${parto ? `, parto ${parto.toLowerCase()}` : ""}`);
      }
      const treino = valorMarcado("treino");
      if (treino) linhas.push(`Já treinava: ${treino.toLowerCase()}`);
      const liberacao = valorMarcado("liberacao");
      if (liberacao) linhas.push(`Liberação do obstetra: ${liberacao.toLowerCase()}`);
      const preocupacoes = [...form.querySelectorAll('[name="preocupacoes"]:checked')].map((i) => i.value.toLowerCase());
      if (preocupacoes.length) linhas.push(`O que mais me preocupa: ${listar(preocupacoes)}`);
      const cidade = el.namedItem("cidade").value.trim();
      if (cidade) linhas.push(`Cidade: ${cidade}`);
      const recado = el.namedItem("recado").value.trim();
      if (recado) linhas.push("", recado);
      const mensagem = linhas.join("\n");

      texto.value = mensagem;
      enviar.href = linkContato(mensagem);
      if (whatsapp) {
        enviar.textContent = "Enviar pelo WhatsApp";
        instrucao.textContent = "Confira o texto e toque em enviar. O WhatsApp abre com a mensagem pronta.";
      } else {
        enviar.textContent = "Abrir o direct do Instagram";
        instrucao.textContent = "Copie a mensagem e cole no direct da Bea no Instagram.";
      }
      copiado.textContent = "";
      pronta.hidden = false;
      titulo.focus({ preventScroll: true });
      pronta.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });
    });

    copiar.addEventListener("click", () => {
      const selecionar = () => {
        texto.focus();
        texto.select();
        copiado.textContent = "Texto selecionado. Use a opção copiar do seu aparelho.";
      };
      if (!navigator.clipboard) {
        selecionar();
        return;
      }
      navigator.clipboard.writeText(texto.value).then(() => {
        copiado.textContent = "Mensagem copiada.";
      }, selecionar);
    });
  }

  atualizarContatos(MENSAGEM_PADRAO);
  iniciarMenu();
  iniciarDisco();
  iniciarCalculadora();
  iniciarFormulario();
})();
