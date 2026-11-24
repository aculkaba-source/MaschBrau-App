/* =====================================================================
   SPEICHER & HILFSFUNKTIONEN
   ---------------------------------------------------------------------
   Es gibt keinen Server: alle Daten (Demo-Konto, Warenkorb, Abo,
   Bestellungen, Coupons, Punkte) liegen nur auf diesem Gerät im
   Browser-Speicher (localStorage).
   ===================================================================== */

(function () {
  const SCHLUESSEL = "maschbrau-app-v1";

  function leererZustand() {
    return {
      version: 1,
      konto: null,              // { name, kundennr, seit }
      thema: "system",          // "system" | "hell" | "dunkel"
      warenkorb: {},            // { artikelId: menge }
      bestellungen: [],         // Einzelbestellungen, Abo-Lieferungen, Ladeneinkäufe
      abo: null,
      coupons: { aktiv: {}, benutzt: {} },
      praemien: [],             // eingetauschte Prämien-Coupons
      punkte: 0,
      punkteVerlauf: [],
      bons: {},                 // bereits gescannte Kassenbons
      letzteAdresse: ""
    };
  }

  let zustand = leererZustand();
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (roh) zustand = Object.assign(leererZustand(), JSON.parse(roh));
  } catch (e) { /* privater Modus o. Ä. – dann eben ohne Speichern */ }

  function speichern() {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand)); } catch (e) { /* ignorieren */ }
  }

  function zuruecksetzen() {
    zustand = leererZustand();
    try { localStorage.removeItem(SCHLUESSEL); } catch (e) { /* ignorieren */ }
  }

  /* ---------------------------------------------------------------
     Formatierung
     --------------------------------------------------------------- */
  const euroFmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  function euro(betrag) { return euroFmt.format(Math.round(betrag * 100) / 100); }
  function zahl(z) { return new Intl.NumberFormat("de-DE").format(z); }
  function prozent(z) { return String(z).replace(".", ",") + " %"; }

  /* ---------------------------------------------------------------
     Datum – intern immer "JJJJ-MM-TT" (ohne Uhrzeit)
     --------------------------------------------------------------- */
  function isoDatum(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function ausIso(s) { const t = s.split("-"); return new Date(+t[0], +t[1] - 1, +t[2]); }
  function heute() { return isoDatum(new Date()); }
  function plusTage(iso, n) { const d = ausIso(iso); d.setDate(d.getDate() + n); return isoDatum(d); }
  function tageZwischen(a, b) { return Math.round((ausIso(b) - ausIso(a)) / 86400000); }

  function datumLang(iso) {
    return ausIso(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }
  function datumKurz(iso) {
    return ausIso(iso).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  }
  function datumVoll(iso) {
    return ausIso(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  /* Montag der Woche, in der das Datum liegt */
  function wochenStart(iso) {
    const d = ausIso(iso);
    const tag = (d.getDay() + 6) % 7; // Montag = 0
    d.setDate(d.getDate() - tag);
    return isoDatum(d);
  }
  /* Kennung der aktuellen Coupon-Woche, z. B. "2026-11-23" (= Montag) */
  function wocheKey() { return wochenStart(heute()); }
  function wochenEnde() { return plusTage(wochenStart(heute()), 6); }

  /* Nächster Termin an Wochentag wt (0 = So), frühestens "abTagen" ab heute */
  function naechsterWochentag(wt, abTagen) {
    let iso = plusTage(heute(), abTagen || 0);
    while (ausIso(iso).getDay() !== wt) iso = plusTage(iso, 1);
    return iso;
  }

  /* Zufällige Kennungen */
  function zufallsId(laenge) {
    const z = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < (laenge || 6); i++) s += z[Math.floor(Math.random() * z.length)];
    return s;
  }
  function neueKundennr() {
    let s = "";
    for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10);
    return s.slice(0, 4) + " " + s.slice(4, 8) + " " + s.slice(8);
  }

  /* Punkte gutschreiben (mit Verlaufseintrag) */
  function punkteBuchen(punkte, text, datum) {
    if (!punkte) return;
    zustand.punkte = Math.max(0, zustand.punkte + punkte);
    zustand.punkteVerlauf.unshift({ datum: datum || heute(), text: text, punkte: punkte });
    if (zustand.punkteVerlauf.length > 80) zustand.punkteVerlauf.length = 80;
  }

  window.MB = window.MB || {};
  MB.speicher = {
    get z() { return zustand; },
    speichern: speichern,
    zuruecksetzen: zuruecksetzen,
    punkteBuchen: punkteBuchen
  };
  MB.fmt = { euro: euro, zahl: zahl, prozent: prozent, datumLang: datumLang, datumKurz: datumKurz, datumVoll: datumVoll };
  MB.datum = {
    iso: isoDatum, ausIso: ausIso, heute: heute, plusTage: plusTage, tageZwischen: tageZwischen,
    wochenStart: wochenStart, wocheKey: wocheKey, wochenEnde: wochenEnde, naechsterWochentag: naechsterWochentag
  };
  MB.id = { zufall: zufallsId, kundennr: neueKundennr };
})();
