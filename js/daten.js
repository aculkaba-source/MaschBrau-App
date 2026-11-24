/* =====================================================================
   ZENTRALE DATEN – MaschBrau App
   ---------------------------------------------------------------------
   Hier stehen ALLE festen Angaben: Produkte, Preise, Abo-Stufen,
   Lieferrhythmen, Coupons und Prämien. Wenn du einen Preis oder Rabatt
   ändern willst, änderst du ihn nur hier – die ganze App (auch die
   Kassen-Ansicht) rechnet automatisch mit den neuen Werten.

   Hinweise:
   - Zahlen mit Punkt schreiben (1.49), die App zeigt sie mit Komma an.
   - Jedes Produkt gibt es in zwei Größen: "05" = 0,5 l, "033" = 0,33 l.
   - Rabatte stehen in Prozent (10 = 10 %).
   - Alles ist fiktiv (Studienprojekt).
   ===================================================================== */

window.MB = window.MB || {};

MB.daten = {
  name: "MaschBrau",

  /* Flaschengrößen: alle Produkte gibt es in beiden Größen (nur Glas, Mehrweg) */
  groessen: {
    "05":  { name: "0,5 l",  lang: "0,5 l Glasflasche",  proKasten: 20 },
    "033": { name: "0,33 l", lang: "0,33 l Glasflasche", proKasten: 24 }
  },

  linien: {
    bier:   { name: "Bier",     farbe: "#C98A12" },
    radler: { name: "Radler",   farbe: "#4E9A3F" },
    limo:   { name: "Limonade", farbe: "#E8731A" }
  },

  /* ---------------------------------------------------------------
     EINZELBESTELLUNG (ohne Abo)
     --------------------------------------------------------------- */
  einzel: {
    lieferung: 4.90,       // Lieferkosten pro Bestellung
    gratisAb: 50           // ab diesem Warenwert ist die Lieferung gratis
  },

  /* ---------------------------------------------------------------
     ABO
     Größe in Kästen. Jeder Kasten ist frei mischbar
     (0,5-l-Kasten = 20 Flaschen, 0,33-l-Kasten = 24 Flaschen).
     --------------------------------------------------------------- */
  abo: {
    stufen: [
      { id: "feierabend",    name: "Feierabend",    kaesten: 1, rabatt: 5 },
      { id: "stammtisch",    name: "Stammtisch",    kaesten: 2, rabatt: 10 },
      { id: "grillabend",    name: "Grillabend",    kaesten: 3, rabatt: 11 },
      { id: "nachbarschaft", name: "Nachbarschaft", kaesten: 4, rabatt: 12 },
      { id: "vereinsheim",   name: "Vereinsheim",   kaesten: 6, rabatt: 13 },
      { id: "festzelt",      name: "Festzelt",      kaesten: 8, rabatt: 15 }
    ],
    /* Je öfter geliefert wird, desto mehr Extra-Rabatt (zusätzlich zur Stufe) */
    rhythmen: [
      { id: "woechentlich", name: "Wöchentlich",    kurz: "jede Woche",     tage: 7,  bonus: 2, proMonat: 52 / 12 },
      { id: "zweiwoechig",  name: "Alle 2 Wochen",  kurz: "alle 2 Wochen",  tage: 14, bonus: 1, proMonat: 26 / 12 },
      { id: "monatlich",    name: "Monatlich",      kurz: "alle 4 Wochen",  tage: 28, bonus: 0, proMonat: 13 / 12 }
    ],
    lieferung: 2.90,       // Lieferkosten pro Abo-Lieferung …
    gratisAbKaesten: 4     // … ab so vielen Kästen ist die Lieferung gratis
  },

  /* Lieferzeiten (für Abo und Einzelbestellung) */
  wochentage: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  liefertage: [1, 2, 3, 4, 5, 6],   // Montag bis Samstag (0 = Sonntag)
  zeitfenster: ["8–12 Uhr", "12–16 Uhr", "16–20 Uhr"],
  zahlarten: ["PayPal", "Kreditkarte", "Lastschrift", "Rechnung"],

  /* ---------------------------------------------------------------
     PUNKTE
     --------------------------------------------------------------- */
  punkteProEuro: 1,   // 1 Punkt je voll ausgegebenem Euro

  /* ---------------------------------------------------------------
     COUPONS – gelten im Getränkeladen beim Vorzeigen der Kundenkarte.
     Sie gelten jeweils eine Woche (Montag bis Sonntag) und einmal pro
     Einkauf. Nach dem Einlösen sind sie ab nächster Woche wieder da.

     typ:
       "prozent" – wert % Rabatt auf passende Flaschen
       "nfuerm"  – n für m: von je n passenden Flaschen sind (n - m) gratis
       "betrag"  – wert € Rabatt (ab "ab" € Einkaufswert bzw. ab "abMenge"
                   passenden Flaschen)
       "gratis"  – die teuerste passende Flasche ist gratis
       "punkte"  – Punkte werden mit wert multipliziert
     filter: welche Flaschen zählen (linie, produkte, groesse, protein …)
     nurAbo: nur für Kundinnen und Kunden mit aktivem Abo
     --------------------------------------------------------------- */
  coupons: [
    { id: "radler20",   titel: "20 % auf alle Radler",          text: "Gilt für alle Radler in 0,5 l und 0,33 l.",
      typ: "prozent", wert: 20, filter: { linie: "radler" }, farbe: "#4E9A3F" },
    { id: "limo3fuer2", titel: "Limo: 3 für 2",                 text: "Von je drei Limonaden ist die günstigste gratis.",
      typ: "nfuerm", n: 3, m: 2, filter: { linie: "limo" }, farbe: "#E8731A" },
    { id: "pils15",     titel: "15 % auf Pils 0,33 l",          text: "Pils und Pils alkoholfrei in der 0,33-l-Flasche.",
      typ: "prozent", wert: 15, filter: { produkte: ["pils", "pils-alkoholfrei"], groesse: "033" }, farbe: "#2E8B57" },
    { id: "kastenhell", titel: "3 € auf einen Kasten Helles",   text: "Ab 20 Flaschen Helles (beliebige Größe).",
      typ: "betrag", wert: 3, abMenge: 20, filter: { produkte: ["helles", "helles-alkoholfrei"] }, farbe: "#C98A12" },
    { id: "ab15",       titel: "2 € Rabatt ab 15 €",            text: "Auf den gesamten Einkauf ab 15 € Einkaufswert.",
      typ: "betrag", wert: 2, ab: 15, farbe: "#B8741A" },
    { id: "doppelt",    titel: "Doppelte Punkte",               text: "Für diesen Einkauf gibt es die doppelte Punktzahl.",
      typ: "punkte", wert: 2, farbe: "#6B5BD2" },
    { id: "abo10",      titel: "Abo-Vorteil: 10 % auf alles",   text: "Exklusiv für Abo-Kundinnen und -Kunden.",
      typ: "prozent", wert: 10, nurAbo: true, farbe: "#8A5410" },
    { id: "abolimo",    titel: "Abo-Vorteil: Protein-Limo gratis", text: "Eine Protein-Limo deiner Wahl geht aufs Haus.",
      typ: "gratis", filter: { linie: "limo", protein: true }, nurAbo: true, farbe: "#8A5410" }
  ],

  /* ---------------------------------------------------------------
     PRÄMIEN – gegen Punkte eintauschen. Daraus wird ein Coupon, der
     nicht abläuft und einmal eingelöst werden kann.
     --------------------------------------------------------------- */
  praemien: [
    { id: "p150",  punkte: 150,  titel: "1 Flasche gratis",    text: "Die teuerste Flasche im Einkauf ist gratis.",
      typ: "gratis", farbe: "#B8741A" },
    { id: "p400",  punkte: 400,  titel: "5 € Rabatt",          text: "Ab 15 € Einkaufswert.",
      typ: "betrag", wert: 5, ab: 15, farbe: "#B8741A" },
    { id: "p1000", punkte: 1000, titel: "15 € Rabatt",         text: "Ab 30 € Einkaufswert.",
      typ: "betrag", wert: 15, ab: 30, farbe: "#B8741A" }
  ],

  /* ---------------------------------------------------------------
     PRODUKTE (aus der Website übernommen, jetzt nur Glasflaschen)
     preis: Einzelpreis pro Flasche in Euro, ohne Pfand
     --------------------------------------------------------------- */
  produkte: [

    /* ---------- BIER ---------- */
    {
      id: "helles", name: "Helles", linie: "bier",
      etikett: ["HELLES","5,0 % vol."], farbe: "#D99A1A", glas: "#5A3410",
      preis: { "05": 1.49, "033": 1.19 },
      alkohol: 5, alkoholfrei: false, zero: false, protein: false,
      kurz: "Unser Klassiker: weich, malzig und herrlich süffig.",
      geschmack: "Goldgelb im Glas mit feinporiger, weißer Schaumkrone. In der Nase frisches Brot und ein Hauch Honig. Am Gaumen weich und vollmundig, mit zurückhaltender Hopfenbittere und einem runden, sauberen Abgang – ein Bier für jeden Tag.",
      zutaten: "Wasser, Gerstenmalz, Hopfen, Hefe",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 43, kh: 3.2, zucker: 0.2, eiweiss: 0.4 }
    },
    {
      id: "helles-alkoholfrei", name: "Helles alkoholfrei", linie: "bier",
      etikett: ["HELLES","alkoholfrei"], farbe: "#3D8BC0", glas: "#5A3410",
      preis: { "05": 1.39, "033": 1.09 },
      alkohol: 0.4, alkoholfrei: true, zero: false, protein: false,
      kurz: "Voller Hell-Geschmack – ganz ohne Promille-Sorgen.",
      geschmack: "Hellgolden mit cremigem Schaum. Malzige Süße und Noten von Getreide und Brotkruste treffen auf eine milde Hopfenwürze. Der Alkohol wird nach der Gärung schonend entzogen, so bleibt der typische Charakter eines Hellen erhalten.",
      zutaten: "Wasser, Gerstenmalz, Hopfen, Hefe",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 24, kh: 5.3, zucker: 3, eiweiss: 0.3 }
    },
    {
      id: "pils", name: "Pils", linie: "bier",
      etikett: ["PILS","5,0 % vol."], farbe: "#2E8B57", glas: "#2E5530",
      preis: { "05": 1.49, "033": 1.19 },
      alkohol: 5, alkoholfrei: false, zero: false, protein: false,
      kurz: "Herb, klar und spritzig – norddeutsch gebraut.",
      geschmack: "Strahlend hell mit stabiler Schaumkrone. Blumig-kräuterige Hopfenaromen mit einer Spur Zitrus. Schlank im Körper, kräftig in der Bittere und mit einem knackig-trockenen Abgang, der Lust auf den nächsten Schluck macht.",
      zutaten: "Wasser, Gerstenmalz, Hopfen, Hefe",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 42, kh: 3, zucker: 0.1, eiweiss: 0.4 }
    },
    {
      id: "pils-alkoholfrei", name: "Pils alkoholfrei", linie: "bier",
      etikett: ["PILS","alkoholfrei"], farbe: "#2A8FA6", glas: "#2E5530",
      preis: { "05": 1.39, "033": 1.09 },
      alkohol: 0.4, alkoholfrei: true, zero: false, protein: false,
      kurz: "Herbe Frische nach dem Sport oder in der Mittagspause.",
      geschmack: "Hell und klar, mit feinem Schaum. Frische Hopfennoten von Gras und Zitrusschale, dazu eine dezente Malzsüße. Isotonisch, angenehm herb und erfrischend trocken im Finish.",
      zutaten: "Wasser, Gerstenmalz, Hopfen, Hefe",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 22, kh: 4.9, zucker: 2.6, eiweiss: 0.3 }
    },

    /* ---------- RADLER ---------- */
    {
      id: "radler", name: "Radler", linie: "radler",
      etikett: ["RADLER","2,5 % vol."], farbe: "#8CC63F", glas: "#4D7A3A",
      preis: { "05": 1.39, "033": 1.09 },
      alkohol: 2.5, alkoholfrei: false, zero: false, protein: false,
      kurz: "Halb Helles, halb Zitronenlimo – der Sommer in der Flasche.",
      geschmack: "Naturtrüb und sonnengelb. Spritzige Zitrone trifft auf die weiche Malzigkeit unseres Hellen. Süß-säuerlich ausbalanciert, leicht und unglaublich erfrischend.",
      zutaten: "Helles Bier (50 %) (Wasser, Gerstenmalz, Hopfen, Hefe), Zitronenlimonade (50 %) (Wasser, Zucker, Zitronensaft aus Zitronensaftkonzentrat (3 %), Kohlensäure, Säuerungsmittel Citronensäure, natürliches Zitronenaroma)",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 42, kh: 6, zucker: 5.6, eiweiss: 0.2 }
    },
    {
      id: "radler-alkoholfrei", name: "Radler alkoholfrei", linie: "radler",
      etikett: ["RADLER","alkoholfrei"], farbe: "#3FA796", glas: "#4D7A3A",
      preis: { "05": 1.29, "033": 0.99 },
      alkohol: 0.4, alkoholfrei: true, zero: false, protein: false,
      kurz: "Zitronig-frisch, ganz ohne Promille.",
      geschmack: "Hellgelb und leicht trüb. Saftige Zitrone und eine sanfte Malznote verbinden sich zu einem fruchtigen, spritzigen Durstlöscher – ideal für lange Tage draußen.",
      zutaten: "Alkoholfreies Bier (50 %) (Wasser, Gerstenmalz, Hopfen, Hefe), Zitronenlimonade (50 %) (Wasser, Zucker, Zitronensaft aus Zitronensaftkonzentrat (3 %), Kohlensäure, Säuerungsmittel Citronensäure, natürliches Zitronenaroma)",
      allergene: "Enthält Gerste (glutenhaltig).",
      naehrwerte: { kcal: 27, kh: 6.4, zucker: 5.8, eiweiss: 0.2 }
    },
    {
      id: "protein-radler", name: "Protein-Radler", linie: "radler",
      etikett: ["RADLER","PROTEIN"], farbe: "#9BD14B", glas: "#2F3A2A",
      preis: { "05": 1.99, "033": 1.69 },
      alkohol: 0.2, alkoholfrei: true, zero: false, protein: true,
      kurz: "Alkoholfreies Radler mit 3,5 g Protein pro 100 ml – für nach dem Training.",
      geschmack: "Frische Zitrone, eine feine Malznote und eine angenehm runde, leicht cremige Textur durch das zugesetzte Molkenprotein. Weniger süß als ein klassisches Radler und trotzdem spritzig.",
      zutaten: "Wasser, alkoholfreies Bier (35 %) (Wasser, Gerstenmalz, Hopfen, Hefe), Molkenproteinisolat (aus Milch) (3,8 %), Zitronensaft aus Zitronensaftkonzentrat (3 %), Zucker, Kohlensäure, Säuerungsmittel Citronensäure, natürliches Zitronenaroma, Süßungsmittel Sucralose",
      allergene: "Enthält Gerste (glutenhaltig) und Milch.",
      naehrwerte: { kcal: 32, kh: 4.1, zucker: 3.6, eiweiss: 3.5 }
    },

    /* ---------- LIMONADE ---------- */
    {
      id: "limo-zitrone-zero", name: "Limo Zitrone Zero", linie: "limo",
      etikett: ["ZITRONE","ZERO"], farbe: "#F2C318", glas: "#A8901C",
      preis: { "05": 1.49, "033": 1.19 },
      alkohol: 0, alkoholfrei: true, zero: true, protein: false,
      kurz: "Spritzige Zitrone ohne Zucker – nur 1 kcal pro 100 ml.",
      geschmack: "Klar und hellgelb. Die Zitrone schmeckt nach frisch abgeriebener Schale: knackig-sauer, sehr erfrischend und nur dezent süß. Feinperlige Kohlensäure für den perfekten Prickel.",
      zutaten: "Wasser, Kohlensäure, Zitronensaft aus Zitronensaftkonzentrat (5 %), Säuerungsmittel Citronensäure, natürliches Zitronenaroma, Süßungsmittel (Sucralose, Acesulfam-K)",
      allergene: "Keine kennzeichnungspflichtigen Allergene.",
      naehrwerte: { kcal: 1, kh: 0.3, zucker: 0, eiweiss: 0 }
    },
    {
      id: "limo-orange-zero", name: "Limo Orange Zero", linie: "limo",
      etikett: ["ORANGE","ZERO"], farbe: "#F08A24", glas: "#B0651E",
      preis: { "05": 1.49, "033": 1.19 },
      alkohol: 0, alkoholfrei: true, zero: true, protein: false,
      kurz: "Sonnig-fruchtige Orange ganz ohne Zucker.",
      geschmack: "Leuchtend orange und saftig. Reife Orange mit einem Hauch Mandarine, angenehm süß und mild in der Säure. Ein fruchtiger Klassiker – nur eben ohne Zucker.",
      zutaten: "Wasser, Kohlensäure, Orangensaft aus Orangensaftkonzentrat (6 %), Säuerungsmittel Citronensäure, natürliches Orangenaroma, färbendes Lebensmittel (Karottenkonzentrat), Süßungsmittel (Sucralose, Acesulfam-K)",
      allergene: "Keine kennzeichnungspflichtigen Allergene.",
      naehrwerte: { kcal: 2, kh: 0.4, zucker: 0, eiweiss: 0 }
    },
    {
      id: "limo-blutorange-zero", name: "Limo Blutorange Zero", linie: "limo",
      etikett: ["BLUTORANGE","ZERO"], farbe: "#C42E4A", glas: "#8A2235",
      preis: { "05": 1.49, "033": 1.19 },
      alkohol: 0, alkoholfrei: true, zero: true, protein: false,
      kurz: "Herb-fruchtige Blutorange – zuckerfrei und tiefrot.",
      geschmack: "Rubinrot im Glas. Aromen von Blutorange, roten Beeren und einer leicht herben Zitrusnote. Weniger süß als klassische Orangenlimo und dadurch besonders erfrischend.",
      zutaten: "Wasser, Kohlensäure, Blutorangensaft aus Blutorangensaftkonzentrat (6 %), Säuerungsmittel Citronensäure, natürliches Blutorangenaroma, färbendes Lebensmittel (Konzentrat aus Schwarzer Karotte), Süßungsmittel (Sucralose, Acesulfam-K)",
      allergene: "Keine kennzeichnungspflichtigen Allergene.",
      naehrwerte: { kcal: 2, kh: 0.4, zucker: 0, eiweiss: 0 }
    },
    {
      id: "limo-zitrone-protein", name: "Limo Zitrone Protein", linie: "limo",
      etikett: ["ZITRONE","PROTEIN"], farbe: "#F2C318", glas: "#3A3F47",
      preis: { "05": 1.89, "033": 1.59 },
      alkohol: 0, alkoholfrei: true, zero: false, protein: true,
      kurz: "Zitronenlimo mit 4 g Protein pro 100 ml – leicht und klar.",
      geschmack: "Hellgelb und fast klar dank Molkenproteinisolat. Frische, saftige Zitrone mit leichter Süße und einem weichen, runden Mundgefühl. Ohne milchigen Beigeschmack.",
      zutaten: "Wasser, Molkenproteinisolat (aus Milch) (4,4 %), Zitronensaft aus Zitronensaftkonzentrat (4 %), Kohlensäure, Säuerungsmittel Citronensäure, Stabilisator Pektin, natürliches Zitronenaroma, Süßungsmittel Sucralose",
      allergene: "Enthält Milch.",
      naehrwerte: { kcal: 20, kh: 0.9, zucker: 0.8, eiweiss: 4 }
    },
    {
      id: "limo-orange-protein", name: "Limo Orange Protein", linie: "limo",
      etikett: ["ORANGE","PROTEIN"], farbe: "#F08A24", glas: "#3A3F47",
      preis: { "05": 1.89, "033": 1.59 },
      alkohol: 0, alkoholfrei: true, zero: false, protein: true,
      kurz: "Saftige Orange mit 4 g Protein pro 100 ml.",
      geschmack: "Fruchtig-süße Orange mit einem Hauch Vanille im Abgang. Das Protein sorgt für ein volles, weiches Mundgefühl, die feine Kohlensäure hält das Ganze leicht.",
      zutaten: "Wasser, Molkenproteinisolat (aus Milch) (4,4 %), Orangensaft aus Orangensaftkonzentrat (5 %), Kohlensäure, Säuerungsmittel Citronensäure, Stabilisator Pektin, natürliches Orangenaroma, färbendes Lebensmittel (Karottenkonzentrat), Süßungsmittel Sucralose",
      allergene: "Enthält Milch.",
      naehrwerte: { kcal: 21, kh: 1.1, zucker: 1, eiweiss: 4 }
    },
    {
      id: "limo-blutorange-protein", name: "Limo Blutorange Protein", linie: "limo",
      etikett: ["BLUTORANGE","PROTEIN"], farbe: "#C42E4A", glas: "#3A3F47",
      preis: { "05": 1.89, "033": 1.59 },
      alkohol: 0, alkoholfrei: true, zero: false, protein: true,
      kurz: "Herb-fruchtige Blutorange mit 4 g Protein pro 100 ml.",
      geschmack: "Tiefrot und intensiv: Blutorange, ein Hauch Grapefruit und rote Beeren. Angenehm herb, kaum süß und mit einem weichen, vollen Mundgefühl.",
      zutaten: "Wasser, Molkenproteinisolat (aus Milch) (4,4 %), Blutorangensaft aus Blutorangensaftkonzentrat (5 %), Kohlensäure, Säuerungsmittel Citronensäure, Stabilisator Pektin, natürliches Blutorangenaroma, färbendes Lebensmittel (Konzentrat aus Schwarzer Karotte), Süßungsmittel Sucralose",
      allergene: "Enthält Milch.",
      naehrwerte: { kcal: 21, kh: 1, zucker: 0.9, eiweiss: 4 }
    }
  ]
};
