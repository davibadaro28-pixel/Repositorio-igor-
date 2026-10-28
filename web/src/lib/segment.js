// Textos e exemplos que mudam conforme o tipo de negócio (Configurações → Aparência → Tipo de loja)
const COPY = {
  doceria: {
    label: 'Doceria / confeitaria',
    search: 'Buscar bolo, brownie, pudim…',
    itemNote: 'Ex.: escrever “Parabéns Ana” no bolo',
    pdvNote: 'Ex.: escrever “Feliz aniversário”',
    share: (loja) => `🎀 Peça seus bolos e doces da ${loja} pelo nosso cardápio digital:`,
    welcomeBack: 'Que tal provar nossos bolos premium?',
    couponEx: 'EX: DOCE10',
    cmv: 'CMV ideal em confeitaria: até ~35% do preço.',
    sectionHint: 'Agrupa categorias no cardápio digital. Ex.: Bolos, Docinhos, Bebidas e extras',
    groupsHint: 'Ex.: “Sabor do bolo gelado” (obrigatório, escolher 1) ou “Cobertura extra” (opcional, com preço).',
    leadHint: '0 = pode pedir para agora. Ex.: 24 para bolos que precisam ser feitos no dia anterior.',
    fiscal: 'Os NCM e perfis abaixo foram sugeridos para confeitaria no Simples Nacional (bolos e doces: produção própria, CFOP 5101; bebidas: revenda com substituição tributária, CFOP 5405).',
    confirmEmoji: '🎂',
    emoji: '🎀',
    missYou: 'Tá com saudade de um docinho?',
  },
  hamburgueria: {
    label: 'Hamburgueria / lanchonete',
    search: 'Buscar burger, combo, batata…',
    itemNote: 'Ex.: sem cebola, capricha no molho',
    pdvNote: 'Ex.: sem cebola',
    share: (loja) => `🍔 Peça na ${loja} pelo nosso cardápio digital:`,
    welcomeBack: 'Que tal provar nossos combos?',
    couponEx: 'EX: BURGER10',
    cmv: 'CMV ideal em hamburgueria: entre 28% e 35% do preço.',
    sectionHint: 'Agrupa categorias no cardápio digital. Ex.: Burgers, Para acompanhar, Bebidas',
    groupsHint: 'Ex.: “Ponto da carne” (obrigatório, escolher 1) ou “Adicionais” (opcional, com preço). Marque “pode repetir” para aceitar 2x bacon ou 4 lanches no combo.',
    leadHint: '0 = pode pedir para agora. Ex.: 24 para kits de festa que precisam ser preparados antes.',
    fiscal: 'Os NCM e perfis abaixo foram sugeridos para lanchonete no Simples Nacional (lanches e porções: produção própria, CFOP 5101; bebidas: revenda com substituição tributária, CFOP 5405).',
    confirmEmoji: '🍔',
    emoji: '🍔',
    missYou: 'Bateu aquela vontade de um burger?',
  },
  outro: {
    label: 'Outro tipo de loja',
    search: 'Buscar no cardápio…',
    itemNote: 'Ex.: alguma preferência no preparo',
    pdvNote: 'Ex.: observação do cliente',
    share: (loja) => `Peça na ${loja} pelo nosso cardápio digital:`,
    welcomeBack: 'Que tal conhecer as novidades do cardápio?',
    couponEx: 'EX: PROMO10',
    cmv: 'CMV ideal em alimentação: em geral entre 28% e 35% do preço.',
    sectionHint: 'Agrupa categorias no cardápio digital. Ex.: Pratos, Bebidas, Sobremesas',
    groupsHint: 'Ex.: “Tamanho” (obrigatório, escolher 1) ou “Adicionais” (opcional, com preço).',
    leadHint: '0 = pode pedir para agora. Ex.: 24 para itens feitos sob encomenda.',
    fiscal: 'Os NCM e perfis abaixo são sugestões para alimentação no Simples Nacional (produção própria, CFOP 5101; bebidas: revenda com substituição tributária, CFOP 5405).',
    confirmEmoji: '✅',
    emoji: '😊',
    missYou: 'Tá com saudade da gente?',
  },
};

export const SEGMENTS = Object.fromEntries(Object.entries(COPY).map(([k, v]) => [k, v.label]));

/** Textos da loja conforme o tipo de negócio */
export const segmentCopy = (store) => COPY[store?.segment] || COPY.doceria;
