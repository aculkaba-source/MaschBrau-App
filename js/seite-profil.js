/* =====================================================================
   SEITE: Profil – Demo-Konto, Einstellungen, Hinweise
   ===================================================================== */

(function () {
  const S = MB.speicher, F = MB.fmt, ui = MB.ui, A = MB.aktionen;

  function istInstalliert() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  MB.seiten.profil = {
    titel: "Profil",
    tab: "profil",
    render: function () {
      const z = S.z;
      let html = ui.kopf("Profil", { rechts: ui.korbKnopf() });
      html += '<div class="profil-raster">';

      html += '<section class="karte-box profil-kopf"><div class="avatar">' + esc(z.konto.name.charAt(0).toUpperCase()) + "</div>" +
        "<div><h2>" + esc(z.konto.name) + "</h2><p class=\"leise\">Kundennummer " + esc(z.konto.kundennr) + "<br>Dabei seit " + F.datumVoll(z.konto.seit) + "</p></div>" +
        '<button class="knopf-rund" data-aktion="nameAendern" aria-label="Namen ändern">' + icon("stift") + "</button></section>";

      html += '<nav class="karte-box menue" aria-label="Mein Konto">' +
        '<a href="#/bestellungen">' + icon("lkw") + "<span>Meine Bestellungen</span><small>" + z.bestellungen.length + "</small>" + icon("weiter") + "</a>" +
        '<a href="#/abo">' + icon("abo") + "<span>Mein Abo</span><small>" + (z.abo ? "aktiv" : "keins") + "</small>" + icon("weiter") + "</a>" +
        '<a href="#/karte">' + icon("stern") + "<span>Punkte &amp; Prämien</span><small>" + F.zahl(z.punkte) + "</small>" + icon("weiter") + "</a>" +
        '<a href="#/warenkorb">' + icon("korb") + "<span>Warenkorb</span>" + icon("weiter") + "</a>" +
        '<a href="https://aculkaba-source.github.io/Brauerei-Website/">' + icon("info") + "<span>Website von MaschBrau</span>" + icon("weiter") + "</a>" +
        "</nav>";

      html += '<section class="karte-box"><h2>Darstellung</h2>' +
        ui.chips("themaWaehlen", [{ wert: "system", text: "Automatisch" }, { wert: "hell", text: "Hell" }, { wert: "dunkel", text: "Dunkel" }], z.thema, { klasse: "segment", label: "Darstellung" }) +
        "</section>";

      html += '<section class="karte-box"><h2>Kassen-Ansicht</h2>' +
        "<p>Zum Vorführen: Öffne die App auf einem zweiten Gerät (z. B. Handy) und wähle dort die Kassen-Ansicht. Damit lässt sich die Kundenkarte scannen und ein Bon mit Punkten erzeugen.</p>" +
        '<a class="knopf zweit" href="#/kasse">' + icon("kasse") + " Kassen-Ansicht öffnen</a></section>";

      if (!istInstalliert()) {
        html += '<section class="karte-box"><h2>Als App installieren</h2>' +
          "<p>Auf dem iPad oder iPhone in Safari auf <b>Teilen</b> tippen und <b>„Zum Home-Bildschirm“</b> wählen. Dann startet MaschBrau im Vollbild wie eine richtige App und funktioniert auch offline.</p></section>";
      }

      html += '<section class="karte-box"><h2>Demo zurücksetzen</h2>' +
        "<p>Löscht Demo-Konto, Abo, Bestellungen, Coupons und Punkte auf diesem Gerät.</p>" +
        '<button class="knopf zweit gefahr-text" data-aktion="allesLoeschen">' + icon("muell") + " Alle Daten löschen</button></section>";

      html += "</div>";
      html += '<div class="hinweis-box">' + icon("info") + "<p><b>Fiktives Studienprojekt.</b> MaschBrau ist keine echte Brauerei, die Produkte gibt es nicht. " +
        "Bestellungen, Zahlung und Lieferung werden nur simuliert. Es gibt keinen Server: alle Daten bleiben auf diesem Gerät.</p></div>";
      html += '<p class="kleingedruckt">QR-Codes: qrcode-generator (MIT, Kazuhiko Arase) und jsQR (Apache 2.0, Cosmo Wolfe). „QR Code“ ist eine Marke der DENSO WAVE INCORPORATED.</p>';
      return html;
    }
  };

  A.themaWaehlen = (el) => { S.z.thema = el.dataset.wert; S.speichern(); MB.app.themaSetzen(); MB.app.zeichnen(); };

  A.nameAendern = () => {
    const dlg = ui.blatt('<form data-form="name"><h2>Namen ändern</h2><label for="neuer-name" class="sr">Name</label>' +
      '<input id="neuer-name" name="name" maxlength="40" value="' + esc(S.z.konto.name) + '" required>' +
      '<div class="knopf-reihe"><button type="button" class="knopf zweit" data-aktion="blattZu">Abbrechen</button><button class="knopf" type="submit">Speichern</button></div></form>', { klasse: "klein" });
    const form = dlg.querySelector("form");
    form.name.select();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = form.name.value.trim().replace(/\s+/g, " ");
      if (!n) return;
      S.z.konto.name = n;
      S.speichern();
      dlg.close();
      MB.app.zeichnen();
    });
  };

  A.allesLoeschen = () => {
    ui.frage("Alle Daten löschen?", "Demo-Konto, Abo, Bestellungen, Coupons und Punkte werden auf diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.", "Alles löschen", true)
      .then((ja) => {
        if (!ja) return;
        S.zuruecksetzen();
        MB.app.themaSetzen();
        MB.app.gehe("#/willkommen");
      });
  };
})();
