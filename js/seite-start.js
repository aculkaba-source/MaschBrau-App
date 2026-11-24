/* =====================================================================
   SEITEN: Willkommen (Demo-Konto anlegen) und Start
   ===================================================================== */

(function () {
  const S = MB.speicher, R = MB.rechnen, F = MB.fmt, D = MB.daten, ui = MB.ui;

  /* ---------------------------------------------------------------
     WILLKOMMEN – erster Start
     --------------------------------------------------------------- */
  MB.seiten.willkommen = {
    titel: "Willkommen",
    ohneNavi: true,
    render: function () {
      return '<section class="willkommen">' +
        '<div class="willkommen-logo">' + logoSVG() + "</div>" +
        "<h1>Willkommen bei MaschBrau</h1>" +
        '<p class="einleitung">Bier, Radler und Limonade aus Salzgitter – direkt an deine Haustür.</p>' +
        '<ul class="vorteile">' +
        "<li>" + icon("abo") + "<span><b>Abo nach Wahl</b>1 bis 8 Kästen, frei gemischt, im Rhythmus deiner Wahl – bis zu 17 % günstiger.</span></li>" +
        "<li>" + icon("sortiment") + "<span><b>Einfach mal bestellen</b>Das ganze Sortiment auch ohne Abo, in 0,5 l und 0,33 l.</span></li>" +
        "<li>" + icon("karte") + "<span><b>Kundenkarte &amp; Coupons</b>Coupons aktivieren, QR-Code im Getränkeladen zeigen, sparen und Punkte sammeln.</span></li>" +
        "</ul>" +
        '<div class="hinweis-box">' + icon("info") + "<p><b>Fiktives Studienprojekt.</b> MaschBrau ist keine echte Brauerei. Bestellungen, Zahlung und Lieferung werden nur simuliert, alle Daten bleiben auf diesem Gerät.</p></div>" +
        '<form class="karte-form" data-form="konto">' +
        '<label for="name-eingabe">Wie heißt du?</label>' +
        '<input id="name-eingabe" name="name" autocomplete="given-name" maxlength="40" placeholder="Dein Name" required>' +
        '<button class="knopf gross" type="submit">Demo-Konto anlegen</button>' +
        "</form>" +
        '<a class="link-leise" href="#/kasse">' + icon("kasse") + " Nur die Kassen-Ansicht öffnen (Gerät im Getränkeladen)</a>" +
        "</section>";
    },
    nachher: function (main) {
      const form = main.querySelector('[data-form="konto"]');
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = form.name.value.trim().replace(/\s+/g, " ");
        if (!name) return;
        S.z.konto = { name: name, kundennr: MB.id.kundennr(), seit: MB.datum.heute() };
        S.punkteBuchen(50, "Willkommensbonus");
        S.speichern();
        MB.ui.toast("Hallo " + name + "! 50 Willkommenspunkte gutgeschrieben.");
        MB.app.gehe("#/start");
      });
    }
  };

  /* ---------------------------------------------------------------
     START
     --------------------------------------------------------------- */
  function begruessung() {
    const h = new Date().getHours();
    if (h < 11) return "Guten Morgen";
    if (h < 18) return "Hallo";
    return "Guten Abend";
  }

  MB.seiten.start = {
    titel: "Start",
    tab: "start",
    render: function () {
      const z = S.z;
      const aktiveCoupons = MB.karte.aktiveCouponIds().length;
      let html = ui.kopf(begruessung() + ", " + z.konto.name, { ueber: F.datumLang(MB.datum.heute()), rechts: ui.korbKnopf() });

      html += '<div class="start-raster">';

      // Kundenkarte
      html += '<button class="kundenkarte-teaser" data-aktion="karteZeigen">' +
        '<span class="kt-kopf">' + logoSVG() + "<span>MaschBrau<br><small>Kundenkarte</small></span></span>" +
        '<span class="kt-qr">' + icon("karte") + "</span>" +
        '<span class="kt-fuss"><span><b>' + F.zahl(z.punkte) + "</b> Punkte</span><span><b>" + aktiveCoupons + "</b> Coupon" + (aktiveCoupons === 1 ? "" : "s") + " aktiv</span></span>" +
        '<span class="kt-aktion">Im Laden vorzeigen ' + icon("weiter") + "</span>" +
        "</button>";

      // Abo
      if (z.abo) {
        const naechste = R.naechsteLieferung(z.abo);
        const st = R.stufe(z.abo.stufe), rh = R.rhythmus(z.abo.rhythmus);
        const preis = R.aboPreis(z.abo.stufe, z.abo.rhythmus, z.abo.kaesten);
        const pausiert = z.abo.pausiertBis && z.abo.pausiertBis >= MB.datum.heute();
        html += '<a class="kachel abo-kachel" href="#/abo">' +
          '<p class="ueber">' + icon("lkw") + " Nächste Abo-Lieferung</p>" +
          "<h2>" + F.datumLang(naechste) + "</h2>" +
          "<p>" + esc(z.abo.zeitfenster) + " · " + esc(st.name) + " (" + st.kaesten + " " + (st.kaesten === 1 ? "Kasten" : "Kästen") + ") · " + esc(rh.kurz) + "</p>" +
          (pausiert ? '<p class="etikett warn">Pausiert bis ' + F.datumVoll(z.abo.pausiertBis) + "</p>" : "") +
          '<p class="preis-zeile"><b>' + F.euro(preis.proLieferung) + "</b> pro Lieferung</p>" +
          "</a>";
      } else {
        html += '<a class="kachel abo-werbung" href="#/abo">' +
          '<p class="ueber">' + icon("abo") + " MaschBrau-Abo</p>" +
          "<h2>Bis zu 17 % sparen</h2>" +
          "<p>Kästen frei mischen, Liefertag wählen, jederzeit pausieren oder kündigen.</p>" +
          '<span class="knopf">Abo zusammenstellen</span></a>';
      }
      html += "</div>";

      // Coupons
      html += '<section class="abschnitt"><div class="abschnitt-kopf"><h2>Coupons dieser Woche</h2><a href="#/karte">Alle ansehen</a></div>' +
        '<div class="coupon-leiste">' + MB.karte.couponListe({ max: 4 }) + "</div></section>";

      // Sortiment
      html += '<section class="abschnitt"><div class="abschnitt-kopf"><h2>Unser Sortiment</h2><a href="#/sortiment">Alles zeigen</a></div><div class="linien-raster">';
      Object.keys(D.linien).forEach((lid) => {
        const p = D.produkte.find((x) => x.linie === lid);
        const ab = Math.min.apply(null, D.produkte.filter((x) => x.linie === lid).map((x) => x.preis["033"]));
        html += '<a class="linie-kachel" href="#/sortiment/' + lid + '" style="--linie-farbe:' + D.linien[lid].farbe + '">' +
          '<span class="linie-bild">' + produktSVG(p, "05") + "</span>" +
          "<span><b>" + esc(D.linien[lid].name) + "</b><small>ab " + F.euro(ab) + "</small></span></a>";
      });
      html += "</div></section>";

      // Letzte Bestellung
      const letzte = z.bestellungen[0];
      if (letzte) {
        html += '<section class="abschnitt"><div class="abschnitt-kopf"><h2>Zuletzt</h2><a href="#/bestellungen">Alle Bestellungen</a></div>' +
          MB.shop.bestellZeile(letzte) + "</section>";
      }

      html += '<p class="fiktiv-fuss">MaschBrau ist ein fiktives Studienprojekt.</p>';
      return html;
    }
  };
})();
