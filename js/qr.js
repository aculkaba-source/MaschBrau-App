/* =====================================================================
   QR-CODES – erzeugen (qrcode-generator) und scannen (jsQR + Kamera)
   Beide Bibliotheken liegen lokal in js/vendor/, die App braucht also
   keine externen Dienste.
   ===================================================================== */

(function () {
  /* QR-Code als SVG (schwarz auf weiß, gut scanbar) */
  function qrSVG(text, beschriftung) {
    const qr = qrcode(0, "M");
    qr.addData(text, "Byte");
    qr.make();
    const n = qr.getModuleCount();
    const rand = 4;
    const groesse = n + rand * 2;
    let pfad = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) pfad += "M" + (c + rand) + " " + (r + rand) + "h1v1h-1z";
      }
    }
    return '<svg class="qr" viewBox="0 0 ' + groesse + " " + groesse + '" role="img" aria-label="' + esc(beschriftung || "QR-Code") + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + pfad + '" fill="#000"/></svg>';
  }

  /* ---------------------------------------------------------------
     SCANNER
     scannen({ titel, hinweis, pruefen(text) -> Fehlermeldung|"" , fertig(text) })
     Öffnet ein Vollbild-Fenster mit Kamerabild. Ohne Kamera kann der
     Code-Text auch eingetippt / eingefügt werden.
     --------------------------------------------------------------- */
  let laufend = null;

  function scannen(opt) {
    stoppen();
    const dlg = document.createElement("dialog");
    dlg.className = "scanner";
    dlg.innerHTML =
      '<div class="scanner-kopf"><h2>' + esc(opt.titel || "Code scannen") + '</h2>' +
      '<button class="knopf-rund" data-scan="zu" aria-label="Schließen">' + icon("schliessen") + "</button></div>" +
      '<div class="scanner-bild"><video playsinline muted></video><div class="scanner-rahmen"></div>' +
      '<p class="scanner-status" role="status">Kamera wird gestartet …</p></div>' +
      '<p class="scanner-hinweis">' + esc(opt.hinweis || "") + "</p>" +
      '<details class="scanner-manuell"><summary>Keine Kamera? Code als Text eingeben</summary>' +
      '<textarea rows="3" placeholder="MASCHBRAU-DEMO|…" aria-label="Code als Text"></textarea>' +
      '<button class="knopf" data-scan="text">Übernehmen</button></details>';
    document.body.appendChild(dlg);
    dlg.showModal();

    const video = dlg.querySelector("video");
    const status = dlg.querySelector(".scanner-status");
    const leinwand = document.createElement("canvas");
    const ctx = leinwand.getContext("2d", { willReadFrequently: true });
    let strom = null, aktiv = true, letzter = 0;

    function schliessen() {
      aktiv = false;
      if (strom) strom.getTracks().forEach((t) => t.stop());
      if (dlg.open) dlg.close();
      dlg.remove();
      laufend = null;
    }
    laufend = schliessen;

    function treffer(text) {
      const fehler = opt.pruefen ? opt.pruefen(text) : "";
      if (fehler) {
        status.textContent = fehler;
        status.classList.add("fehler");
        return false;
      }
      schliessen();
      if (navigator.vibrate) navigator.vibrate(60);
      opt.fertig(text);
      return true;
    }

    dlg.addEventListener("click", (e) => {
      const k = e.target.closest("[data-scan]");
      if (!k) return;
      if (k.dataset.scan === "zu") schliessen();
      if (k.dataset.scan === "text") treffer(dlg.querySelector("textarea").value);
    });
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); schliessen(); });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = "Kamera nicht verfügbar – bitte den Code als Text eingeben.";
      dlg.querySelector("details").open = true;
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (!aktiv) { s.getTracks().forEach((t) => t.stop()); return; }
        strom = s;
        video.srcObject = s;
        return video.play().then(() => {
          status.textContent = "Code in den Rahmen halten";
          requestAnimationFrame(schleife);
        });
      })
      .catch(() => {
        status.textContent = "Kein Kamerazugriff – bitte erlauben oder den Code als Text eingeben.";
        status.classList.add("fehler");
        dlg.querySelector("details").open = true;
      });

    function schleife(zeit) {
      if (!aktiv) return;
      if (zeit - letzter > 120 && video.readyState >= 2) {
        letzter = zeit;
        const b = video.videoWidth, h = video.videoHeight;
        const faktor = Math.min(1, 640 / Math.max(b, h));
        leinwand.width = Math.round(b * faktor);
        leinwand.height = Math.round(h * faktor);
        ctx.drawImage(video, 0, 0, leinwand.width, leinwand.height);
        const bild = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
        const code = jsQR(bild.data, bild.width, bild.height, { inversionAttempts: "dontInvert" });
        if (code && code.data && treffer(code.data)) return;
      }
      requestAnimationFrame(schleife);
    }
  }

  function stoppen() { if (laufend) laufend(); }

  /* Bildschirm wach halten, solange ein Code angezeigt wird (wo unterstützt) */
  let sperre = null;
  function wachHalten(an) {
    try {
      if (an && "wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then((s) => { sperre = s; }).catch(() => {});
      } else if (!an && sperre) {
        sperre.release().catch(() => {});
        sperre = null;
      }
    } catch (e) { /* nicht unterstützt */ }
  }

  MB.qr = { svg: qrSVG, scannen: scannen, stoppen: stoppen, wachHalten: wachHalten };
})();
