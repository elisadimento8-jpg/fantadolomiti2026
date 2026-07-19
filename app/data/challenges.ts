export type Challenge = {
  id: string;
  title: string;
  description: string;
  points: number;
  frequency: "once" | "daily";
  media: "photo" | "video" | "both";
  order: number;
};

export const challenges: Challenge[] = [
  {
    id: "marmotta",
    title: "Marmotta",
    description: "Fotografare una marmotta",
    points: 50,
    frequency: "once",
    media: "photo",
    order: 1,
  },

  {
    id: "primo-al-rifugio",
    title: "Primo al rifugio",
    description: "Arrivare per primo al rifugio più alto di giornata",
    points: 80,
    frequency: "daily",
    media: "both",
    order: 2,
  },

  {
    id: "rifugio",
    title: "Rifugio",
    description: "Arrivare al rifugio più alto di giornata",
    points: 50,
    frequency: "daily",
    media: "both",
    order: 3,
  },

  {
    id: "arcobaleno",
    title: "Arcobaleno",
    description: "Fotografare un arcobaleno",
    points: 20,
    frequency: "daily",
    media: "photo",
    order: 4,
  },

  {
    id: "stella-alpina",
    title: "Stella alpina",
    description: "Fotografare una stella alpina",
    points: 90,
    frequency: "once",
    media: "photo",
    order: 5,
  },

  {
    id: "san-bernardo",
    title: "San Bernardo",
    description: "Fotografare un San Bernardo",
    points: 40,
    frequency: "once",
    media: "photo",
    order: 6,
  },

  {
    id: "stambecco",
    title: "Stambecco",
    description: "Fotografare uno stambecco",
    points: 150,
    frequency: "once",
    media: "photo",
    order: 7,
  },

  {
    id: "maglietta-al-contrario",
    title: "Maglietta al contrario",
    description:
      "Fare la camminata giornaliera con la maglietta al contrario",
    points: 10,
    frequency: "once",
    media: "both",
    order: 8,
  },

  {
    id: "foto-buffa-con-sconosciuto",
    title: "Foto buffa con sconosciuto",
    description:
      "Convincere uno sconosciuto a fare una foto buffa con voi (dito nel naso/ dito nell’orecchio)",
    points: 50,
    frequency: "once",
    media: "photo",
    order: 9,
  },

  {
    id: "giro-in-bici",
    title: "Giro in bici",
    description: "Chiedere ad un ciclista di fare un giro sulla sua bici",
    points: 120,
    frequency: "once",
    media: "video",
    order: 10,
  },

  {
    id: "lago-alpino",
    title: "Lago alpino",
    description: "Fare il bagno in un lago alpino",
    points: 50,
    frequency: "once",
    media: "both",
    order: 11,
  },

  {
    id: "cartolina",
    title: "Cartolina",
    description: "Spedire ad un parente una cartolina",
    points: 80,
    frequency: "once",
    media: "both",
    order: 12,
  },

  {
    id: "timbro-in-fronte",
    title: "Timbro in fronte",
    description: "Convincere un rifugista a timbrare la tua fronte",
    points: 30,
    frequency: "once",
    media: "photo",
    order: 13,
  },

  {
    id: "pila-di-pietre",
    title: "Pila di pietre",
    description: "Costruire una pila di 10 pietre in ordine decrescente",
    points: 10,
    frequency: "once",
    media: "photo",
    order: 14,
  },

  {
    id: "15-mucche",
    title: "15 mucche",
    description: "Foto con almeno 15 mucche nello stesso scatto",
    points: 30,
    frequency: "once",
    media: "photo",
    order: 15,
  },

  {
    id: "3-cani",
    title: "3 cani",
    description: "Foto con almeno 3 cani nello stesso giorno",
    points: 30,
    frequency: "once",
    media: "photo",
    order: 16,
  },

  {
    id: "su-un-albero",
    title: "Su un albero",
    description: "Arrampicarsi su un ramo di un albero",
    points: 40,
    frequency: "once",
    media: "both",
    order: 17,
  },

  {
    id: "sasso-esagonale",
    title: "Sasso esagonale",
    description: "Fotografare un sasso esagonale",
    points: 40,
    frequency: "once",
    media: "photo",
    order: 18,
  },

  {
    id: "birra-media",
    title: "Birra media",
    description: "Bere una birra piccola tutta d’un fiato",
    points: 50,
    frequency: "once",
    media: "video",
    order: 19,
  },

  {
    id: "pecora",
    title: "Pecora",
    description: "Accarezzare una pecora",
    points: 20,
    frequency: "once",
    media: "video",
    order: 20,
  },

  {
    id: "mangiare-senza-mani",
    title: "Mangiare senza mani",
    description:
      "Mangiare al rifugio senza usare le mani (minimo metà piatto)",
    points: 50,
    frequency: "once",
    media: "video",
    order: 21,
  },

  {
    id: "barzelletta-in-rifugio",
    title: "Barzelletta in rifugio",
    description: "Raccontare una barzelletta all’intero rifugio",
    points: 80,
    frequency: "once",
    media: "video",
    order: 22,
  },

  {
    id: "balletto-di-coppia-sotto-la-pioggia",
    title: "Balletto di coppia sotto la pioggia",
    description:
      "Se piove, fare un balletto di coppia sotto la pioggia (senza ombrello né k-way - almeno 30 secondi)",
    points: 50,
    frequency: "once",
    media: "video",
    order: 23,
  },

  {
    id: "sosia",
    title: "Sosia",
    description: "Trovare un sosia di un personaggio famoso",
    points: 50,
    frequency: "daily",
    media: "photo",
    order: 24,
  },

  {
    id: "pareidolia",
    title: "Pareidolia",
    description: "Fotografare una pareidolia",
    points: 30,
    frequency: "once",
    media: "photo",
    order: 25,
  },

  {
    id: "10-oggetti-dello-stesso-colore",
    title: "10 oggetti dello stesso colore",
    description:
      "Fotografare 10 oggetti diversi dello stesso colore, tutti presenti in una singola foto",
    points: 40,
    frequency: "once",
    media: "photo",
    order: 26,
  },

  {
    id: "vastita",
    title: "Vastità",
    description: "Scattare una foto vastità con Leo",
    points: 10,
    frequency: "once",
    media: "photo",
    order: 27,
  },

  {
    id: "karaoke",
    title: "Karaoke",
    description: "Cantare al karaoke serale",
    points: 20,
    frequency: "once",
    media: "both",
    order: 28,
  },

  {
    id: "barba-o-rossetto",
    title: "Donne: barba / uomini: rossetto",
    description:
      "PER LE DONNE: venire a cena con la barba disegnata / PER GLI UOMINI: venire a cena con il rossetto rosso",
    points: 50,
    frequency: "once",
    media: "both",
    order: 29,
  },

  {
    id: "a-piedi-nudi",
    title: "A piedi nudi",
    description: "Mettere i piedi nudi in un ruscello",
    points: 20,
    frequency: "once",
    media: "both",
    order: 30,
  },

  {
    id: "pigiami-invertiti",
    title: "Pigiami invertiti",
    description:
      "Venire a colazione con il pigiama di un amico/a (che non sia della stessa famiglia).",
    points: 30,
    frequency: "once",
    media: "both",
    order: 31,
  },

  {
    id: "scritta-figura-riconoscibile-umana",
    title: "Scritta/figura riconoscibile umana",
    description:
      "Ricreare una scritta, una figura o situazione riconoscibile con almeno 6 componenti della squadra",
    points: 10,
    frequency: "once",
    media: "both",
    order: 32,
  },

  {
    id: "lacci-spaiati",
    title: "Lacci spaiati",
    description:
      "Indossare le scarpe da trekking con lacci differenti l’uno dall’altro",
    points: 40,
    frequency: "once",
    media: "photo",
    order: 33,
  },
  {
  id: "quadrifoglio",
  title: "Quadrifoglio",
  description: "Trovare e fotografare un quadrifoglio.",
  points: 40,
  frequency: "once",
  media: "photo",
  order: 34,
},
{
  id: "animale-che-mangia",
  title: "Animale che mangia",
  description:
    "Fotografare o fare un video di un animale mentre mangia. Può essere completata più volte, ma ogni volta con un animale diverso.",
  points: 15,
  frequency: "daily",
  media: "both",
  order: 35,
},
{
  id: "mutanda",
  title: "Mutanda",
  description:
    "Ordinare qualcosa in un bar o in un negozio con una mutanda in testa.",
  points: 60,
  frequency: "once",
  media: "video",
  order: 36,
},
{
  id: "targa-26",
  title: "Targa",
  description: "Trovare una targa che contenga il numero 26.",
  points: 40,
  frequency: "once",
  media: "photo",
  order: 37,
},
{
  id: "doccia-cascata",
  title: "Doccia",
  description: "Farsi una doccia sotto una cascata.",
  points: 90,
  frequency: "once",
  media: "both",
  order: 38,
},
{
  id: "luigi",
  title: "Luigi",
  description:
    "Comporre una scritta fatta di sassi dedicata a Luigi Zucaro (deve essere presente il nome).",
  points: 20,
  frequency: "once",
  media: "photo",
  order: 39,
},
{
  id: "irene",
  title: "Irene",
  description:
    "Video saluto ad Irene Sassi con un fiore giallo in mano.",
  points: 20,
  frequency: "once",
  media: "video",
  order: 40,
},
{
  id: "lele",
  title: "Lele",
  description:
    "Video saluto ad Emanuele Pieri con in mano un sasso a forma di cuore.",
  points: 20,
  frequency: "once",
  media: "video",
  order: 41,
},
];