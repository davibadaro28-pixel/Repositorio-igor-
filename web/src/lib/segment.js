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
  festas: {
    label: 'Doces para festas e eventos',
    search: 'Buscar brigadeiro, camafeu, cestinha…',
    itemNote: 'Ex.: forminha dourada, embalar separado',
    pdvNote: 'Ex.: forminha dourada',
    share: (loja) => `🎉 Monte os doces da sua festa com a ${loja}. Escolha os sabores, a quantidade e a data do evento:`,
    welcomeBack: 'Tem festa chegando? Monte os doces da sua mesa.',
    couponEx: 'EX: FESTA10',
    cmv: 'CMV ideal em doces finos: até ~35% do preço.',
    sectionHint: 'Agrupa categorias no cardápio digital. Ex.: Linha Bronze, Linha Prata, Linha Ouro',
    groupsHint: 'Ex.: “Sabor” (obrigatório, escolher 1) ou “Cor da forminha” (opcional).',
    leadHint: 'Doces de festa são sempre por encomenda. Ex.: 72 para pedir com 3 dias de antecedência.',
    fiscal: 'Os NCM e perfis abaixo foram sugeridos para doces e confeitaria no Simples Nacional (produção própria, CFOP 5101).',
    confirmEmoji: '🎉',
    emoji: '🎉',
    missYou: 'Tem festa chegando?',
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

/** Loja só de festas e eventos: doces em pacotes, sempre por encomenda, com data do evento e nº de convidados */
export const isParty = (store) => store?.segment === 'festas';

/** Unidades de um pacote pelo nome da opção ("25 unidades", "Cento" = 100); 0 = não é pacote */
export function unitsOf(variantName) {
  const t = String(variantName || '').toLowerCase();
  const m = /(\d+)\s*(un|unid|doces|pe[cç]as)/.exec(t);
  if (m) return Number(m[1]);
  if (/\bcento\b/.test(t)) return 100;
  return 0;
}
