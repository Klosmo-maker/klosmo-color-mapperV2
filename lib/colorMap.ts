export const MASTER_COLORS = [
  'Black',
  'White',
  'Blue',
  'Red/Bordeaux',
  'Green',
  'Brown',
  'Beige',
  'Grey',
  'Gold',
  'Silver',
  'Pink',
  'Purple',
  'Orange',
  'Yellow',
  'Multicolor',
  'Camo',
  'Crinkle',
  'Animalier',
] as const

export type MasterColor = (typeof MASTER_COLORS)[number]

interface ColorRule {
  pattern: RegExp
  color: MasterColor
}

const COLOR_RULES: ColorRule[] = [
  {
    pattern:
      /\b(black|nero|nera|noir|schwarz|negro|preto|onyx|ebony|jet|carbon|dark|blackout)\b/i,
    color: 'Black',
  },
  {
    pattern:
      /\b(white|bianco|bianca|blanc|weis|weiss|blanco|branco|ivory|ecru|cream|panna|off.white|milk|snow|optical|avorio|latte|transparent|trasparente)\b/i,
    color: 'White',
  },
  {
    pattern:
      /\b(blue|blu|bleu|blau|azul|navy|cobalt|maritime|teal|denim|ocean|indigo|royal|electric|sky|cerulean|celeste|aqua|marine|azzurro|cobalto|petrolio|pavone|bluette|azure)\b/i,
    color: 'Blue',
  },
  {
    pattern:
      /\b(red|rosso|rossa|rouge|rot|rojo|bordeaux|burgundy|wine|borgogna|cherry|marsala|rubino|corallo|coral|scarlet|crimson|brick|amaranto|vinaccia|granata|ciliegia)\b/i,
    color: 'Red/Bordeaux',
  },
  {
    pattern:
      /\b(green|verde|vert|grun|grün|forest|olive|khaki|sage|emerald|military|mint|bottle|jungle|moss|hunter|militare|cachi|kaki|salvia|smeraldo|pistacchio|menta|oliva)\b/i,
    color: 'Green',
  },
  {
    pattern:
      /\b(brown|marrone|brun|braun|camel|cognac|tan|tabac|tobacco|cacao|chocolate|hazel|cuoio|terra|rust|ginger|sienna|toffee|walnut|chestnut|bark|brunello|miele|castagna|nocciola|fango|argilla|mattone)\b/i,
    color: 'Brown',
  },
  {
    pattern:
      /\b(beige|sand|sabbia|sable|nude|taupe|stone|mushroom|cappuccino|greige|oat|oatmeal|linen|wheat|natural|bisque|parchment|buff|vanilla|burro|corda|cammello|biscotto|dune|desert)\b/i,
    color: 'Beige',
  },
  {
    pattern:
      /\b(grey|gray|grigio|grau|gris|anthracite|charcoal|slate|perla|marl|ash|pewter|smoke|pebble|fog|steel|dove|heather|cement|melange|antracite|piombo|grafite|tortora|fumo)\b/i,
    color: 'Grey',
  },
  {
    pattern:
      /\b(gold|oro|dorado|dore|doré|golden|champagne|bronze|copper|brass|bronzo|rame|ottone|lame|lamé)\b/i,
    color: 'Gold',
  },
  {
    pattern:
      /\b(silver|argento|argent|silber|plata|chrome|platinum|metallic|platino|cromato)\b/i,
    color: 'Silver',
  },
  {
    pattern:
      /\b(pink|rosa|rose|fucsia|fuchsia|blush|cipria|flamingo|salmon|peach|powder|magenta|peonia|salmone)\b/i,
    color: 'Pink',
  },
  {
    pattern:
      /\b(purple|viola|violet|lila|lilla|lilac|lavender|lavanda|mauve|plum|prugna|orchid|amethyst|grape|eggplant|ametista|melanzana|ciclamino|glicine)\b/i,
    color: 'Purple',
  },
  {
    pattern:
      /\b(orange|arancio|arancione|amber|terracotta|apricot|tangerine|papaya|pumpkin|saffron|ambra|albicocca|zafferano|ruggine)\b/i,
    color: 'Orange',
  },
  {
    pattern:
      /\b(yellow|giallo|jaune|gelb|amarillo|mustard|senape|lemon|lime|butter|sunshine|canary|limone)\b/i,
    color: 'Yellow',
  },
  {
    pattern:
      /\b(multicolor|multicolore|multicolour|multi|striped|paisley|houndstooth|leopard|floral|patchwork|printed|print|pattern|check|plaid|tartan|ikat|fantasia|righe|quadri|stampa|fiori|floreale)\b/i,
    color: 'Multicolor',
  },
  {
    pattern: /\b(camo|camouflage|mimetico)\b/i,
    color: 'Camo',
  },
  {
    pattern: /\b(crinkle|crinkled|crepe|crêpe)\b/i,
    color: 'Crinkle',
  },
  {
    pattern:
      /\b(animalier|animal|snake|python|crocodile|zebra|tiger|serpente|pitone|coccodrillo|zebratura|tigre|leopardato)\b/i,
    color: 'Animalier',
  },
]

export function mapColor(rawColor: string): MasterColor | null {
  if (!rawColor || rawColor.trim() === '') return null
  const normalized = rawColor.trim()
  for (const rule of COLOR_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.color
    }
  }
  return null
}
