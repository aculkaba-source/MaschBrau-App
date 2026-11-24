/* =====================================================================
   APP-KERN – Navigation, Seitenwechsel, Klick-Aktionen, Dialoge
   ---------------------------------------------------------------------
   Jede Seite liegt in einer eigenen Datei (js/seite-*.js) und meldet
   sich hier an:  MB.seiten.name = { tab, render(param) }
   Klicks auf Elemente mit data-aktion="xyz" rufen MB.aktionen.xyz auf.
   ===================================================================== */

(function () {
  MB.seiten = {};
  MB.aktionen = {};
  const S = MB.speicher;

  /* ---------------------------------------------------------------
     NAVIGATION (Tab-Leiste unten bzw. Seitenleiste auf dem iPad quer)
     --------------------------------------------------------------- */
  const tabs = [
    { id: "start",     name: "Start",     ziel: "#/start" },
    { id: "sortiment", name: "Sortiment", ziel: "#/sortiment" },
    { id: "abo",       name: "Abo",       ziel: "#/abo" },
    { id: "karte",     name: "Karte",     ziel: "#/karte" },
    { id: "profil",    name: "Profil",    ziel: "#/profil" }
  ];

  function naviZeichnen(aktiv) {
    const n = document.getElementById("navi");
    const korb = Object.keys(S.z.warenkorb).reduce((s, a) => s + S.z.warenkorb[a], 0);
    n.innerHTML =
      '<a class="navi-marke" href="#/start">' + logoSVG() + "<span>MaschBrau</span></a>" +
      tabs.map((t) =>
        '<a class="navi-tab' + (t.id === aktiv ? " aktiv" : "") + '" href="' + t.ziel + '"' +
        (t.id === aktiv ? ' aria-current="page"' : "") + ">" + icon(t.id) + "<span>" + t.name + "</span></a>"
      ).join("") +
      '<a class="navi-korb' + (aktiv === "warenkorb" ? " aktiv" : "") + '" href="#/warenkorb">' + icon("korb") +
      "<span>Warenkorb</span>" + (korb ? '<b class="zahl-badge">' + korb + "</b>" : "") + "</a>" +
      '<p class="navi-fiktiv">Fiktives Studienprojekt</p>';
  }

  /* ---------------------------------------------------------------
     SEITENWECHSEL (Adresse nach dem #, z. B. #/produkt/pils)
     --------------------------------------------------------------- */
  let aktuelleRoute = "";

  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const teile = h.split("/").filter(Boolean).map(decodeURIComponent);
    return { name: teile[0] || "start", param: teile.slice(1) };
  }

  function zeichnen(scrollNachOben) {
    const r = route();
    let name = r.name;
    // Ohne Demo-Konto geht es zur Begrüßung (Ausnahme: Kassen-Ansicht)
    if (!S.z.konto && name !== "kasse") name = "willkommen";
    if (S.z.konto && name === "willkommen") name = "start";
    const seite = MB.seiten[name] || MB.seiten.start;

    document.body.classList.toggle("ohne-navi", !!seite.ohneNavi);
    if (!seite.ohneNavi) naviZeichnen(seite.tab || name);

    const main = document.getElementById("inhalt");
    main.innerHTML = seite.render(r.param);
    if (seite.nachher) seite.nachher(main, r.param);

    const routeText = name + "/" + r.param.join("/");
    if (scrollNachOben || routeText !== aktuelleRoute) {
      window.scrollTo(0, 0);
      const ueberschrift = main.querySelector("h1");
      if (ueberschrift && aktuelleRoute) { ueberschrift.setAttribute("tabindex", "-1"); ueberschrift.focus({ preventScroll: true }); }
    }
    aktuelleRoute = routeText;
    document.title = (seite.titel ? seite.titel + " · " : "") + "MaschBrau";
  }

  function gehe(ziel) {
    if (location.hash === ziel) zeichnen(true);
    else location.hash = ziel;
  }

  window.addEventListener("hashchange", () => { MB.qr.stoppen(); zeichnen(true); });

  /* ---------------------------------------------------------------
     KLICKS & EINGABEN (Ereignis-Delegation)
     --------------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-aktion]");
    if (!el || el.disabled) return;
    const fn = MB.aktionen[el.dataset.aktion];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-eingabe]");
    if (!el) return;
    const fn = MB.aktionen[el.dataset.eingabe];
    if (fn) fn(el, e);
  });

  /* ---------------------------------------------------------------
     BAUSTEINE für die Seiten
     --------------------------------------------------------------- */
  const ui = {};

  /* Kopfzeile einer Seite */
  ui.kopf = function (titel, opt) {
    opt = opt || {};
    return '<header class="kopf">' +
      (opt.zurueck ? '<a class="knopf-rund" href="' + opt.zurueck + '" aria-label="Zurück">' + icon("zurueck") + "</a>" : "") +
      '<div class="kopf-titel">' + (opt.ueber ? '<p class="ueber">' + esc(opt.ueber) + "</p>" : "") + "<h1>" + esc(titel) + "</h1></div>" +
      (opt.rechts || "") + "</header>";
  };

  /* Warenkorb-Knopf für die Kopfzeile (nur schmale Bildschirme) */
  ui.korbKnopf = function () {
    const n = Object.keys(S.z.warenkorb).reduce((s, a) => s + S.z.warenkorb[a], 0);
    return '<a class="knopf-rund korb-knopf" href="#/warenkorb" aria-label="Warenkorb, ' + n + ' Flaschen">' + icon("korb") +
      (n ? '<b class="zahl-badge">' + n + "</b>" : "") + "</a>";
  };

  /* Mengen-Stepper */
  ui.stepper = function (aktionMinus, aktionPlus, wert, daten, opt) {
    opt = opt || {};
    const d = Object.keys(daten).map((k) => " data-" + k + '="' + esc(daten[k]) + '"').join("");
    return '<div class="stepper' + (opt.klein ? " klein" : "") + '">' +
      '<button type="button" class="stepper-knopf" data-aktion="' + aktionMinus + '"' + d + (wert <= 0 ? " disabled" : "") + ' aria-label="Eins weniger">' + icon("minus") + "</button>" +
      '<output aria-live="polite">' + wert + "</output>" +
      '<button type="button" class="stepper-knopf" data-aktion="' + aktionPlus + '"' + d + (opt.plusAus ? " disabled" : "") + ' aria-label="Eins mehr">' + icon("plus") + "</button></div>";
  };

  /* Auswahl-Chips: liste = [{wert, text, klein?}] */
  ui.chips = function (aktion, liste, gewaehlt, opt) {
    opt = opt || {};
    return '<div class="chips' + (opt.klasse ? " " + opt.klasse : "") + '" role="group"' + (opt.label ? ' aria-label="' + esc(opt.label) + '"' : "") + ">" +
      liste.map((c) =>
        '<button type="button" class="chip' + (String(c.wert) === String(gewaehlt) ? " an" : "") + '" data-aktion="' + aktion + '" data-wert="' + esc(c.wert) + '" aria-pressed="' + (String(c.wert) === String(gewaehlt)) + '">' +
        esc(c.text) + (c.klein ? "<small>" + esc(c.klein) + "</small>" : "") + "</button>"
      ).join("") + "</div>";
  };

  ui.simulation = function (text) {
    return '<p class="simulation">' + icon("info") + "<span>" + esc(text || "Simulation: Es wird nichts bezahlt und nichts geliefert.") + "</span></p>";
  };

  /* Kurze Meldung unten am Bildschirm */
  let toastTimer = null;
  ui.toast = function (text) {
    const t = document.getElementById("toast");
    t.textContent = text;
    t.classList.add("sichtbar");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("sichtbar"), 2600);
  };

  /* Blatt (Dialog von unten / mittig auf dem iPad) */
  ui.blatt = function (html, opt) {
    opt = opt || {};
    ui.blattZu();
    const dlg = document.createElement("dialog");
    dlg.className = "blatt" + (opt.klasse ? " " + opt.klasse : "");
    dlg.innerHTML = '<div class="blatt-inhalt">' + html + "</div>";
    document.body.appendChild(dlg);
    dlg.showModal();
    dlg.addEventListener("click", (e) => { if (e.target === dlg) ui.blattZu(); });
    dlg.addEventListener("close", () => { dlg.remove(); if (opt.beimSchliessen) opt.beimSchliessen(); });
    return dlg;
  };
  ui.blattZu = function () {
    document.querySelectorAll("dialog.blatt").forEach((d) => d.close());
  };
  MB.aktionen.blattZu = ui.blattZu;

  /* Ja/Nein-Frage */
  ui.frage = function (titel, text, jaText, gefaehrlich) {
    return new Promise((fertig) => {
      let antwort = false;
      const dlg = ui.blatt(
        "<h2>" + esc(titel) + "</h2><p>" + esc(text) + "</p>" +
        '<div class="knopf-reihe"><button class="knopf zweit" data-frage="nein">Abbrechen</button>' +
        '<button class="knopf' + (gefaehrlich ? " gefahr" : "") + '" data-frage="ja">' + esc(jaText || "OK") + "</button></div>",
        { klasse: "klein", beimSchliessen: () => fertig(antwort) }
      );
      dlg.addEventListener("click", (e) => {
        const k = e.target.closest("[data-frage]");
        if (!k) return;
        antwort = k.dataset.frage === "ja";
        dlg.close();
      });
    });
  };

  /* ---------------------------------------------------------------
     THEMA (Hell / Dunkel / System)
     --------------------------------------------------------------- */
  function themaSetzen() {
    const t = S.z.thema;
    if (t === "hell") document.documentElement.dataset.theme = "light";
    else if (t === "dunkel") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  }

  /* ---------------------------------------------------------------
     ABO-LIEFERUNGEN nachbuchen
     Vergangene Liefertermine werden beim Öffnen der App als „geliefert“
     eingetragen und bringen Punkte.
     --------------------------------------------------------------- */
  function aboNachbuchen() {
    const abo = S.z.abo;
    if (!abo) return;
    const gestern = MB.datum.plusTage(MB.datum.heute(), -1);
    const termine = MB.rechnen.aboTermine(abo, gestern).filter((t) => !abo.gebuchtBis || t > abo.gebuchtBis);
    termine.forEach((t) => {
      if (MB.rechnen.istPausiert(abo, t)) return;
      const preis = MB.rechnen.aboPreis(abo.stufe, abo.rhythmus, abo.kaesten);
      S.z.bestellungen.unshift({
        id: "A" + MB.id.zufall(6), typ: "abo", datum: t, lieferdatum: t, zeitfenster: abo.zeitfenster,
        adresse: abo.adresse, positionen: MB.rechnen.aboPositionen(abo.kaesten),
        gesamt: preis.proLieferung, punkte: preis.punkte, zahlung: abo.zahlung
      });
      S.punkteBuchen(preis.punkte, "Abo-Lieferung vom " + MB.fmt.datumVoll(t), t);
    });
    if (termine.length) abo.gebuchtBis = termine[termine.length - 1];
    S.speichern();
  }

  /* ---------------------------------------------------------------
     START
     --------------------------------------------------------------- */
  function starten() {
    themaSetzen();
    aboNachbuchen();
    zeichnen(true);
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  MB.app = { zeichnen: zeichnen, gehe: gehe, themaSetzen: themaSetzen, starten: starten };
  MB.ui = ui;
})();
