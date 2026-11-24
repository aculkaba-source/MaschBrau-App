/* =====================================================================
   RECHNEN – Preise, Abo, Coupons, QR-Inhalte
   ---------------------------------------------------------------------
   Diese Datei wird von der Kunden-App UND der Kassen-Ansicht benutzt,
   damit beide immer gleich rechnen.
   ===================================================================== */

(function () {
  const D = MB.daten;
  const runden = (b) => Math.round(b * 100) / 100;

  /* ---------------------------------------------------------------
     ARTIKEL = Produkt + Größe, z. B. "pils-05" oder "limo-orange-zero-033"
     --------------------------------------------------------------- */
  const produktNachId = {};
  D.produkte.forEach((p) => { produktNachId[p.id] = p; });

  function artikel(aid) {
    const i = aid.lastIndexOf("-");
    const p = produktNachId[aid.slice(0, i)];
    const g = aid.slice(i + 1);
    if (!p || !D.groessen[g]) return null;
    return { id: aid, produkt: p, groesse: g, preis: p.preis[g], name: p.name + " " + D.groessen[g].name };
  }
  function alleArtikel() {
    const liste = [];
    D.produkte.forEach((p) => { Object.keys(D.groessen).forEach((g) => liste.push(artikel(p.id + "-" + g))); });
    return liste;
  }

  /* Summe einer Positionsliste { artikelId: menge } */
  function warenwert(positionen) {
    let summe = 0, flaschen = 0;
    Object.keys(positionen).forEach((aid) => {
      const a = artikel(aid);
      if (a) { summe += a.preis * positionen[aid]; flaschen += positionen[aid]; }
    });
    return { summe: runden(summe), flaschen: flaschen };
  }

  /* ---------------------------------------------------------------
     EINZELBESTELLUNG
     --------------------------------------------------------------- */
  function einzelBestellung(positionen) {
    const w = warenwert(positionen);
    const lieferung = w.summe >= D.einzel.gratisAb || w.summe === 0 ? 0 : D.einzel.lieferung;
    const gesamt = runden(w.summe + lieferung);
    return { warenwert: w.summe, flaschen: w.flaschen, lieferung: lieferung, gesamt: gesamt,
      fehltBisGratis: lieferung ? runden(D.einzel.gratisAb - w.summe) : 0,
      punkte: Math.floor(gesamt * D.punkteProEuro) };
  }

  /* ---------------------------------------------------------------
     ABO
     --------------------------------------------------------------- */
  function stufe(id) { return D.abo.stufen.find((s) => s.id === id); }
  function rhythmus(id) { return D.abo.rhythmen.find((r) => r.id === id); }

  /* Inhalt aller Kästen zu einer Positionsliste zusammenfassen */
  function aboPositionen(kaesten) {
    const pos = {};
    kaesten.forEach((k) => {
      Object.keys(k.inhalt).forEach((aid) => { pos[aid] = (pos[aid] || 0) + k.inhalt[aid]; });
    });
    return pos;
  }

  function kastenAnzahl(k) { return Object.keys(k.inhalt).reduce((s, a) => s + k.inhalt[a], 0); }
  function kastenVoll(k) { return kastenAnzahl(k) === D.groessen[k.groesse].proKasten; }

  /* Preis pro Lieferung und pro Monat.
     kaesten optional: ohne Inhalt wird mit einem Beispiel-Durchschnittspreis gerechnet */
  function aboPreis(stufeId, rhythmusId, kaesten) {
    const s = stufe(stufeId), r = rhythmus(rhythmusId);
    const rabatt = s.rabatt + r.bonus;
    let normal;
    if (kaesten && kaesten.some((k) => kastenAnzahl(k) > 0)) {
      normal = warenwert(aboPositionen(kaesten)).summe;
    } else {
      normal = s.kaesten * 20 * 1.49; // Beispiel: Kästen Helles 0,5 l
    }
    const ware = runden(normal * (1 - rabatt / 100));
    const lieferung = s.kaesten >= D.abo.gratisAbKaesten ? 0 : D.abo.lieferung;
    const proLieferung = runden(ware + lieferung);
    return {
      rabatt: rabatt, normal: runden(normal), ware: ware, lieferung: lieferung,
      proLieferung: proLieferung,
      ersparnis: runden(normal - ware),
      proMonat: runden(proLieferung * r.proMonat),
      ersparnisMonat: runden((normal - ware) * r.proMonat),
      punkte: Math.floor(proLieferung * D.punkteProEuro)
    };
  }

  /* Alle Liefertermine des Abos (ab Start, im Abstand des Rhythmus) */
  function aboTermine(abo, bis) {
    const r = rhythmus(abo.rhythmus);
    const termine = [];
    let t = abo.start;
    while (t <= bis && termine.length < 500) {
      termine.push(t);
      t = MB.datum.plusTage(t, r.tage);
    }
    return termine;
  }

  function istPausiert(abo, iso) {
    return abo.pausiertBis && iso <= abo.pausiertBis && (!abo.pausiertAb || iso >= abo.pausiertAb);
  }

  /* Nächster Liefertermin (heute oder später, nicht pausiert) */
  function naechsteLieferung(abo) {
    if (!abo) return null;
    const r = rhythmus(abo.rhythmus);
    let t = abo.start;
    const h = MB.datum.heute();
    let sicherheit = 0;
    while ((t < h || istPausiert(abo, t)) && sicherheit++ < 1000) t = MB.datum.plusTage(t, r.tage);
    return t;
  }

  /* ---------------------------------------------------------------
     COUPONS
     --------------------------------------------------------------- */
  function passt(filter, a) {
    if (!filter) return true;
    if (filter.linie && a.produkt.linie !== filter.linie) return false;
    if (filter.produkte && filter.produkte.indexOf(a.produkt.id) < 0) return false;
    if (filter.groesse && a.groesse !== filter.groesse) return false;
    if (filter.protein !== undefined && a.produkt.protein !== filter.protein) return false;
    return true;
  }

  /* Coupon-Definition zu einer Kennung finden.
     Wochen-Coupons: "radler20" – Prämien: "p400.AB12CD" */
  function couponDef(cid) {
    const wochen = D.coupons.find((c) => c.id === cid);
    if (wochen) return Object.assign({ art: "woche" }, wochen);
    const teil = cid.split(".");
    const praemie = D.praemien.find((p) => p.id === teil[0]);
    if (praemie && teil[1]) return Object.assign({ art: "praemie" }, praemie, { id: cid, praemieId: praemie.id });
    return null;
  }

  /* Einkauf an der Kasse mit Coupons verrechnen.
     positionen: { artikelId: menge }, couponIds: [...]
     Ergebnis: Zeilen je Coupon (Ersparnis oder Grund, warum er nicht greift) */
  function kassenRechnung(positionen, couponIds) {
    const w = warenwert(positionen);
    // Einzelne Flaschen als Liste (für "n für m" und "gratis")
    const flaschen = [];
    Object.keys(positionen).forEach((aid) => {
      const a = artikel(aid);
      for (let i = 0; i < positionen[aid]; i++) flaschen.push(a);
    });

    const zeilen = [];
    let rabattArtikel = 0;
    let multiplikator = 1;
    const defs = couponIds.map(couponDef).filter(Boolean);

    // 1) Coupons auf bestimmte Flaschen
    defs.forEach((c) => {
      const passende = flaschen.filter((a) => passt(c.filter, a));
      let ersparnis = 0, grund = "";
      if (c.typ === "prozent" && c.filter) {
        ersparnis = passende.reduce((s, a) => s + a.preis, 0) * c.wert / 100;
        if (!passende.length) grund = "keine passenden Flaschen";
      } else if (c.typ === "nfuerm") {
        const sortiert = passende.map((a) => a.preis).sort((x, y) => y - x);
        const gruppen = Math.floor(sortiert.length / c.n);
        // pro Gruppe die günstigsten (n - m) gratis: einfach die günstigsten der Liste
        const gratis = gruppen * (c.n - c.m);
        ersparnis = sortiert.slice(sortiert.length - gratis).reduce((s, p) => s + p, 0);
        if (!gruppen) grund = "erst ab " + c.n + " passenden Flaschen";
      } else if (c.typ === "gratis") {
        if (passende.length) ersparnis = Math.max.apply(null, passende.map((a) => a.preis));
        else grund = "keine passende Flasche";
      } else if (c.typ === "betrag" && c.abMenge) {
        if (passende.length >= c.abMenge) ersparnis = c.wert;
        else grund = "erst ab " + c.abMenge + " passenden Flaschen";
      } else {
        return; // wird unten behandelt
      }
      ersparnis = runden(ersparnis);
      rabattArtikel += ersparnis;
      zeilen.push({ coupon: c, ersparnis: ersparnis, grund: ersparnis ? "" : grund });
    });

    let zwischen = runden(Math.max(0, w.summe - rabattArtikel));

    // 2) Prozent auf den ganzen Einkauf
    defs.filter((c) => c.typ === "prozent" && !c.filter).forEach((c) => {
      const e = runden(zwischen * c.wert / 100);
      zwischen = runden(zwischen - e);
      zeilen.push({ coupon: c, ersparnis: e, grund: e ? "" : "leerer Einkauf" });
    });

    // 3) Euro-Beträge ab Mindestwert (Mindestwert = Warenwert vor Rabatten)
    defs.filter((c) => c.typ === "betrag" && !c.abMenge).forEach((c) => {
      let e = 0, grund = "";
      if (w.summe >= c.ab) e = Math.min(c.wert, zwischen);
      else grund = "erst ab " + MB.fmt.euro(c.ab) + " Einkaufswert";
      e = runden(e);
      zwischen = runden(zwischen - e);
      zeilen.push({ coupon: c, ersparnis: e, grund: grund });
    });

    // 4) Punkte-Multiplikator
    defs.filter((c) => c.typ === "punkte").forEach((c) => {
      multiplikator *= c.wert;
      zeilen.push({ coupon: c, ersparnis: 0, punkte: true, grund: "" });
    });

    const gesamt = runden(Math.max(0, zwischen));
    return {
      warenwert: w.summe,
      flaschen: w.flaschen,
      zeilen: zeilen,
      rabatt: runden(w.summe - gesamt),
      gesamt: gesamt,
      punkte: Math.floor(gesamt * D.punkteProEuro) * multiplikator,
      eingeloest: zeilen.filter((z) => z.ersparnis > 0 || (z.punkte && gesamt > 0)).map((z) => z.coupon.id)
    };
  }

  /* ---------------------------------------------------------------
     QR-INHALTE
     Kundenkarte:  MASCHBRAU-DEMO|K|<kundennr>|<name>|<coupons>
     Kassenbon:    MASCHBRAU-DEMO|B|<bonId>|<kundennr>|<cent>|<punkte>|<coupons>
     Der Name wird URL-kodiert, damit der Code nur einfache Zeichen enthält.
     --------------------------------------------------------------- */
  const KENNUNG = "MASCHBRAU-DEMO";

  function kartenCode(konto, couponIds) {
    return [KENNUNG, "K", konto.kundennr.replace(/\s/g, ""), encodeURIComponent(konto.name), couponIds.join(",")].join("|");
  }
  function bonCode(bon) {
    return [KENNUNG, "B", bon.id, bon.kundennr, Math.round(bon.gesamt * 100), bon.punkte, bon.coupons.join(","), bon.datum].join("|");
  }

  function codeLesen(text) {
    const t = String(text || "").trim().split("|");
    if (t[0] !== KENNUNG) return null;
    if (t[1] === "K" && t.length >= 5) {
      let name = t[3];
      try { name = decodeURIComponent(t[3]); } catch (e) { /* so lassen */ }
      return { art: "karte", kundennr: formatKundennr(t[2]), name: name, coupons: t[4] ? t[4].split(",") : [] };
    }
    if (t[1] === "B" && t.length >= 7) {
      return { art: "bon", id: t[2], kundennr: t[3], gesamt: (+t[4]) / 100, punkte: +t[5],
        coupons: t[6] ? t[6].split(",") : [], datum: t[7] || MB.datum.heute() };
    }
    return null;
  }

  function formatKundennr(s) {
    s = String(s).replace(/\D/g, "");
    return s.slice(0, 4) + " " + s.slice(4, 8) + " " + s.slice(8);
  }

  MB.rechnen = {
    artikel: artikel, alleArtikel: alleArtikel, produkt: (id) => produktNachId[id],
    warenwert: warenwert, einzelBestellung: einzelBestellung,
    stufe: stufe, rhythmus: rhythmus, aboPreis: aboPreis, aboPositionen: aboPositionen,
    kastenAnzahl: kastenAnzahl, kastenVoll: kastenVoll,
    aboTermine: aboTermine, naechsteLieferung: naechsteLieferung, istPausiert: istPausiert,
    couponDef: couponDef, passt: passt, kassenRechnung: kassenRechnung,
    kartenCode: kartenCode, bonCode: bonCode, codeLesen: codeLesen, formatKundennr: formatKundennr,
    runden: runden
  };
})();
