/* =====================================================================
   SEITE: Karte – Kundenkarte (QR), Coupons, Punkte & Prämien,
   Kassenbon scannen
   ===================================================================== */

(function () {
  const S = MB.speicher, R = MB.rechnen, F = MB.fmt, D = MB.daten, ui = MB.ui, A = MB.aktionen;

  function hatAbo() { return !!S.z.abo; }
  function benutztKey(cid, iso) { return cid + "@" + MB.datum.wochenStart(iso || MB.datum.heute()); }
  function wocheBenutzt(cid) { return !!S.z.coupons.benutzt[benutztKey(cid)]; }

  /* Alle Coupons, die gerade im QR-Code stecken */
  function aktiveCouponIds() {
    const aktiv = S.z.coupons.aktiv;
    const ids = [];
    D.coupons.forEach((c) => {
      if (aktiv[c.id] && !wocheBenutzt(c.id) && (!c.nurAbo || hatAbo())) ids.push(c.id);
    });
    S.z.praemien.forEach((p) => { if (!p.benutzt && aktiv[p.id]) ids.push(p.id); });
    return ids;
  }

  /* Eine Coupon-Karte */
  function couponKarte(c, zustand) {
    // zustand: "aktiv" | "inaktiv" | "benutzt" | "gesperrt"
    const wert = c.typ === "prozent" ? "−" + c.wert + " %" : c.typ === "betrag" ? "−" + F.euro(c.wert).replace(",00", "") :
      c.typ === "nfuerm" ? c.n + " für " + c.m : c.typ === "gratis" ? "Gratis" : "×" + c.wert;
    let knopf;
    if (zustand === "benutzt") knopf = '<span class="coupon-status">Eingelöst</span>';
    else if (zustand === "gesperrt") knopf = '<a class="knopf zweit klein" href="#/abo">Nur mit Abo</a>';
    else knopf = '<button class="knopf klein' + (zustand === "aktiv" ? " aktiviert" : "") + '" data-aktion="couponUmschalten" data-wert="' + c.id + '" aria-pressed="' + (zustand === "aktiv") + '">' +
      (zustand === "aktiv" ? icon("check") + " Aktiviert" : "Aktivieren") + "</button>";
    return '<article class="coupon ' + zustand + '" style="--akzent:' + c.farbe + '">' +
      '<div class="coupon-wert">' + esc(wert) + "</div>" +
      '<div class="coupon-text">' + (c.nurAbo ? '<p class="ueber">Abo-exklusiv</p>' : c.art === "praemie" || c.praemieId ? '<p class="ueber">Prämie</p>' : "") +
      "<h3>" + esc(c.titel) + "</h3><p>" + esc(c.text) + "</p>" +
      '<p class="leise">' + (c.praemieId ? "Gültig bis zur Einlösung" : zustand === "benutzt" ? "Ab Montag wieder verfügbar" : "Gültig bis " + F.datumKurz(MB.datum.wochenEnde())) + "</p></div>" +
      '<div class="coupon-knopf">' + knopf + "</div></article>";
  }

  function couponListe(opt) {
    opt = opt || {};
    const aktiv = S.z.coupons.aktiv;
    let liste = D.coupons.map((c) => {
      let z = aktiv[c.id] ? "aktiv" : "inaktiv";
      if (wocheBenutzt(c.id)) z = "benutzt";
      else if (c.nurAbo && !hatAbo()) z = "gesperrt";
      return { c: c, z: z };
    });
    if (opt.max) liste = liste.filter((x) => x.z !== "benutzt").slice(0, opt.max);
    return liste.map((x) => couponKarte(x.c, x.z)).join("");
  }

  /* ---------------------------------------------------------------
     SEITE
     --------------------------------------------------------------- */
  MB.seiten.karte = {
    titel: "Karte & Coupons",
    tab: "karte",
    render: function () {
      const z = S.z;
      const aktiv = aktiveCouponIds();
      let html = ui.kopf("Karte & Coupons", { ueber: "Im Getränkeladen vorzeigen", rechts: ui.korbKnopf() });

      html += '<div class="karte-oben">';
      html += '<button class="kundenkarte-gross" data-aktion="karteZeigen">' +
        '<span class="kg-kopf">' + logoSVG() + "<span><b>MaschBrau</b><small>Kundenkarte</small></span></span>" +
        '<span class="kg-qr">' + MB.qr.svg(R.kartenCode(z.konto, aktiv), "Kundenkarte") + "</span>" +
        '<span class="kg-fuss"><span>' + esc(z.konto.name) + "<small>" + esc(z.konto.kundennr) + "</small></span>" +
        "<span>" + aktiv.length + " Coupon" + (aktiv.length === 1 ? "" : "s") + " aktiv</span></span>" +
        '<span class="kg-tipp">Antippen zum Vergrößern</span></button>';

      html += '<div class="punkte-box karte-box">' +
        '<p class="ueber">' + icon("stern") + " Deine Punkte</p>" +
        '<p class="punkte-zahl">' + F.zahl(z.punkte) + "</p>" +
        '<p class="leise">1 Punkt pro Euro – bei Bestellungen, Abo-Lieferungen und im Getränkeladen.</p>' +
        '<button class="knopf" data-aktion="bonScannen">' + icon("scan") + " Kassenbon scannen</button>" +
        '<p class="leise klein">Nach dem Bezahlen im Laden den Bon-QR-Code scannen: Punkte werden gutgeschrieben, eingelöste Coupons abgehakt.</p>' +
        "</div></div>";

      // Coupons
      const nochZuAktivieren = D.coupons.some((c) => !z.coupons.aktiv[c.id] && !wocheBenutzt(c.id) && (!c.nurAbo || hatAbo()));
      html += '<section class="abschnitt"><div class="abschnitt-kopf"><h2>Coupons dieser Woche</h2>' +
        (nochZuAktivieren ? '<button class="link" data-aktion="alleAktivieren">Alle aktivieren</button>' : "") + "</div>" +
        '<p class="leise">Aktivierte Coupons stecken automatisch in deiner Kundenkarte. Gültig bis ' + F.datumLang(MB.datum.wochenEnde()) + ", einmal pro Einkauf.</p>" +
        '<div class="coupon-raster">' + couponListe() + "</div></section>";

      // Prämien-Coupons
      const meine = z.praemien.filter((p) => !p.benutzt);
      if (meine.length) {
        html += '<section class="abschnitt"><h2>Meine Prämien</h2><div class="coupon-raster">' +
          meine.map((p) => couponKarte(R.couponDef(p.id), z.coupons.aktiv[p.id] ? "aktiv" : "inaktiv")).join("") + "</div></section>";
      }

      // Prämien eintauschen
      html += '<section class="abschnitt"><h2>Punkte eintauschen</h2><div class="praemien-raster">' +
        D.praemien.map((p) => {
          const reicht = z.punkte >= p.punkte;
          return '<div class="praemie karte-box">' + icon("geschenk") +
            "<h3>" + esc(p.titel) + "</h3><p>" + esc(p.text) + "</p>" +
            '<p class="praemie-preis"><b>' + F.zahl(p.punkte) + "</b> Punkte</p>" +
            '<button class="knopf' + (reicht ? "" : " zweit") + ' klein" data-aktion="praemieEintauschen" data-wert="' + p.id + '"' + (reicht ? "" : " disabled") + ">" +
            (reicht ? "Eintauschen" : "Noch " + F.zahl(p.punkte - z.punkte) + " Punkte") + "</button></div>";
        }).join("") + "</div></section>";

      // Verlauf
      if (z.punkteVerlauf.length) {
        html += '<section class="abschnitt"><h2>Punkte-Verlauf</h2><ul class="verlauf">' +
          z.punkteVerlauf.slice(0, 12).map((v) => "<li><span>" + esc(v.text) + "<small>" + F.datumVoll(v.datum) + "</small></span>" +
            '<b class="' + (v.punkte < 0 ? "minus" : "plus") + '">' + (v.punkte > 0 ? "+" : "") + F.zahl(v.punkte) + "</b></li>").join("") +
          "</ul></section>";
      }
      html += '<p class="kleingedruckt">Coupons gelten in teilnehmenden Getränkeläden beim Vorzeigen der Kundenkarte. Fiktives Studienprojekt – keine echten Rabatte.</p>';
      return html;
    }
  };

  /* ---------------------------------------------------------------
     KUNDENKARTE im Vollbild
     --------------------------------------------------------------- */
  A.karteZeigen = () => {
    const z = S.z;
    const aktiv = aktiveCouponIds();
    const namen = aktiv.map((cid) => R.couponDef(cid).titel);
    ui.blatt(
      '<div class="kundenkarte-voll">' +
      '<div class="kv-kopf">' + logoSVG() + "<div><b>MaschBrau</b><small>Kundenkarte</small></div>" +
      '<button class="knopf-rund" data-aktion="blattZu" aria-label="Schließen">' + icon("schliessen") + "</button></div>" +
      '<div class="kv-qr">' + MB.qr.svg(R.kartenCode(z.konto, aktiv), "QR-Code der Kundenkarte") + '<span class="demo-marke">DEMO</span></div>' +
      '<p class="kv-name">' + esc(z.konto.name) + "</p>" +
      '<p class="kv-nr">' + esc(z.konto.kundennr) + "</p>" +
      '<p class="kv-coupons">' + (aktiv.length
        ? "<b>" + aktiv.length + " Coupon" + (aktiv.length === 1 ? "" : "s") + " aktiv:</b> " + esc(namen.join(" · "))
        : 'Keine Coupons aktiv. <a href="#/karte" data-aktion="blattZu">Coupons aktivieren</a>') + "</p>" +
      '<p class="leise">Tipp: Bildschirmhelligkeit hochdrehen, damit die Kasse gut scannen kann.</p></div>',
      { klasse: "voll", beimSchliessen: () => MB.qr.wachHalten(false) }
    );
    MB.qr.wachHalten(true);
  };

  /* ---------------------------------------------------------------
     COUPONS & PRÄMIEN
     --------------------------------------------------------------- */
  A.couponUmschalten = (el) => {
    const cid = el.dataset.wert;
    const aktiv = S.z.coupons.aktiv;
    if (aktiv[cid]) delete aktiv[cid];
    else { aktiv[cid] = true; ui.toast("Coupon aktiviert – steckt jetzt in deiner Kundenkarte"); }
    S.speichern();
    MB.app.zeichnen();
  };
  A.alleAktivieren = () => {
    let n = 0;
    D.coupons.forEach((c) => {
      if (!S.z.coupons.aktiv[c.id] && !wocheBenutzt(c.id) && (!c.nurAbo || hatAbo())) { S.z.coupons.aktiv[c.id] = true; n++; }
    });
    S.speichern();
    ui.toast(n + " Coupon" + (n === 1 ? "" : "s") + " aktiviert");
    MB.app.zeichnen();
  };
  A.praemieEintauschen = (el) => {
    const p = D.praemien.find((x) => x.id === el.dataset.wert);
    if (!p || S.z.punkte < p.punkte) return;
    ui.frage(p.titel + " eintauschen?", "Dafür werden " + F.zahl(p.punkte) + " Punkte abgezogen. Der Coupon wird sofort aktiviert und gilt bis zur Einlösung im Getränkeladen.", "Eintauschen")
      .then((ja) => {
        if (!ja) return;
        const id = p.id + "." + MB.id.zufall(5);
        S.z.praemien.push({ id: id, erstellt: MB.datum.heute(), benutzt: false });
        S.z.coupons.aktiv[id] = true;
        S.punkteBuchen(-p.punkte, "Prämie: " + p.titel);
        S.speichern();
        ui.toast("Prämie eingetauscht und aktiviert");
        MB.app.zeichnen();
      });
  };

  /* ---------------------------------------------------------------
     KASSENBON SCANNEN – Punkte gutschreiben, Coupons abhaken
     --------------------------------------------------------------- */
  A.bonScannen = () => {
    MB.qr.scannen({
      titel: "Kassenbon scannen",
      hinweis: "Den QR-Code auf dem Bildschirm der Kasse scannen.",
      pruefen: (text) => {
        const c = R.codeLesen(text);
        if (!c) return "Das ist kein MaschBrau-Code.";
        if (c.art === "karte") return "Das ist eine Kundenkarte – bitte den Kassenbon scannen.";
        if (c.kundennr.replace(/\D/g, "") !== S.z.konto.kundennr.replace(/\D/g, "")) return "Dieser Bon gehört zu einer anderen Kundenkarte.";
        if (S.z.bons[c.id]) return "Dieser Bon wurde schon gescannt.";
        return "";
      },
      fertig: (text) => bonBuchen(R.codeLesen(text))
    });
  };

  function bonBuchen(bon) {
    const z = S.z;
    z.bons[bon.id] = true;
    const titel = [];
    bon.coupons.forEach((cid) => {
      const def = R.couponDef(cid);
      if (!def) return;
      titel.push(def.titel);
      delete z.coupons.aktiv[cid];
      if (def.praemieId) {
        const p = z.praemien.find((x) => x.id === cid);
        if (p) p.benutzt = true;
      } else {
        z.coupons.benutzt[benutztKey(cid, bon.datum)] = true;
      }
    });
    z.bestellungen.unshift({ id: "L" + bon.id, typ: "laden", datum: bon.datum, lieferdatum: bon.datum, gesamt: bon.gesamt, punkte: bon.punkte, coupons: bon.coupons });
    S.punkteBuchen(bon.punkte, "Einkauf im Getränkeladen", bon.datum);
    S.speichern();
    MB.app.zeichnen();
    ui.blatt('<div class="erfolg"><div class="erfolg-haken">' + icon("stern") + "</div>" +
      "<h2>+ " + F.zahl(bon.punkte) + " Punkte</h2>" +
      "<p>Einkauf über <b>" + F.euro(bon.gesamt) + "</b> gutgeschrieben.</p>" +
      (titel.length ? '<p class="leise">Eingelöst: ' + esc(titel.join(" · ")) + "</p>" : "") +
      '<p>Neuer Punktestand: <b>' + F.zahl(z.punkte) + "</b></p>" +
      '<div class="knopf-reihe"><button class="knopf" data-aktion="blattZu">Fertig</button></div></div>', { klasse: "klein" });
  }

  MB.karte = { aktiveCouponIds: aktiveCouponIds, couponListe: couponListe, couponKarte: couponKarte };
})();
