/* =====================================================================
   GRAFIKEN – Glasflaschen und Symbole werden hier als SVG gezeichnet.
   Farben und Beschriftung kommen aus js/daten.js.
   0,5-l-Flaschen sind groß, 0,33-l-Flaschen etwas kleiner und bauchiger.
   ===================================================================== */

(function () {
  let zaehler = 0;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (z) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z];
    });
  }

  /* Große 0,5-l-Flasche (Longneck) */
  function flasche05(p, id) {
    const glas = p.glas;
    let s = "";
    s += '<ellipse cx="50" cy="294" rx="34" ry="4" fill="#000" fill-opacity=".08"/>';
    s += '<path d="M40 18 L60 18 L60 70 C60 92 82 100 82 126 L82 282 Q82 291 73 291 L27 291 Q18 291 18 282 L18 126 C18 100 40 92 40 70 Z" fill="url(#' + id + ')"/>';
    s += '<rect x="25" y="128" width="5" height="150" rx="2.5" fill="#fff" fill-opacity=".22"/>';
    s += '<rect x="43" y="26" width="3" height="42" rx="1.5" fill="#fff" fill-opacity=".22"/>';
    s += '<rect x="37" y="6" width="26" height="14" rx="3" fill="' + p.farbe + '"/>';
    s += '<rect x="37" y="16" width="26" height="4" fill="#000" fill-opacity=".18"/>';
    s += '<path d="M40 30 L60 30 L60 54 L40 54 Z" fill="' + p.farbe + '"/>';
    s += etikett(p, 158, glas);
    return s;
  }

  /* Kleinere 0,33-l-Flasche (Steinie-Form) */
  function flasche033(p, id) {
    let s = "";
    s += '<ellipse cx="50" cy="294" rx="36" ry="4" fill="#000" fill-opacity=".08"/>';
    s += '<path d="M41 96 L59 96 L59 120 C59 136 84 140 84 162 L84 282 Q84 291 75 291 L25 291 Q16 291 16 282 L16 162 C16 140 41 136 41 120 Z" fill="url(#' + id + ')"/>';
    s += '<rect x="23" y="166" width="5" height="112" rx="2.5" fill="#fff" fill-opacity=".22"/>';
    s += '<rect x="38" y="84" width="24" height="14" rx="3" fill="' + p.farbe + '"/>';
    s += '<rect x="38" y="94" width="24" height="4" fill="#000" fill-opacity=".18"/>';
    s += '<path d="M41 104 L59 104 L59 120 L41 120 Z" fill="' + p.farbe + '"/>';
    s += etikett(p, 174, p.glas, 16, 68);
    return s;
  }

  /* Hauptetikett – y = Oberkante */
  function etikett(p, y, glas, x, breite) {
    x = x || 18; breite = breite || 64;
    const mitte = x + breite / 2;
    const hoehe = 94;
    let s = '<rect x="' + x + '" y="' + y + '" width="' + breite + '" height="' + hoehe + '" fill="#FBF7EE"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + breite + '" height="16" fill="' + p.farbe + '"/>';
    s += '<text x="' + mitte + '" y="' + (y + 11.5) + '" text-anchor="middle" font-size="6.4" font-weight="800" letter-spacing=".8" fill="#fff">MASCHBRAU</text>';
    const name = p.etikett[0];
    const groesse = name.length > 8 ? 7.5 : 10;
    s += '<text x="' + mitte + '" y="' + (y + 36) + '" text-anchor="middle" font-size="' + groesse + '" font-weight="800" fill="#1C1C1E">' + esc(name) + "</text>";
    if (p.linie === "limo" || p.linie === "radler") {
      s += zitrus(mitte, y + 59, 11, p.linie === "radler" ? "#F2C318" : p.farbe);
    } else {
      s += '<g fill="none" stroke="' + p.farbe + '" stroke-width="1.4" stroke-linecap="round">' +
        '<path d="M' + mitte + " " + (y + 72) + " L" + mitte + " " + (y + 50) + '"/>' +
        '<path d="M' + mitte + " " + (y + 56) + " q-5 -3 -6 -8 M" + mitte + " " + (y + 56) + " q5 -3 6 -8 M" + mitte + " " + (y + 64) + " q-5 -3 -6 -8 M" + mitte + " " + (y + 64) + ' q5 -3 6 -8"/></g>';
    }
    s += '<text x="' + mitte + '" y="' + (y + 86) + '" text-anchor="middle" font-size="6.5" font-weight="700" fill="#444">' + esc(p.etikett[1]) + "</text>";
    s += '<rect x="' + x + '" y="' + (y + hoehe - 3) + '" width="' + breite + '" height="3" fill="' + p.farbe + '"/>';
    return s;
  }

  function zitrus(cx, cy, r, farbe) {
    let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + farbe + '"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 2.2) + '" fill="#fff" fill-opacity=".55"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3.2) + '" fill="' + farbe + '" fill-opacity=".85"/>';
    for (let i = 0; i < 8; i++) {
      const w = (i * Math.PI) / 4;
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(w) * (r - 3.2)).toFixed(1) + '" y2="' + (cy + Math.sin(w) * (r - 3.2)).toFixed(1) + '" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>';
    }
    return s;
  }

  /* produktSVG(produkt, groesse "05"|"033", beschreibung?) */
  window.produktSVG = function (p, groesse, beschreibung) {
    const id = "gl" + ++zaehler;
    const glas = p.glas || "#5A3410";
    const defs = "<defs>" +
      '<linearGradient id="' + id + '" x1="0" x2="1">' +
      '<stop offset="0" stop-color="' + glas + '" stop-opacity=".85"/>' +
      '<stop offset=".35" stop-color="' + glas + '"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".55"/>' +
      "</linearGradient></defs>";
    const inhalt = groesse === "033" ? flasche033(p, id) : flasche05(p, id);
    const a11y = beschreibung
      ? 'role="img" aria-label="' + esc(beschreibung) + '"'
      : 'aria-hidden="true" focusable="false"';
    return '<svg class="flasche" viewBox="0 0 100 300" ' + a11y + ">" + defs + inhalt + "</svg>";
  };

  /* ---------------------------------------------------------------
     SYMBOLE (Linien-Icons, 24×24, Farbe = currentColor)
     --------------------------------------------------------------- */
  const pfade = {
    start: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
    sortiment: '<path d="M9 2.5h6"/><path d="M10 2.5v4.2c0 1.4-3.5 2.6-3.5 5.8V21h11v-8.5c0-3.2-3.5-4.4-3.5-5.8V2.5"/><path d="M6.5 13h11"/><path d="M6.5 18h11"/>',
    abo: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>',
    karte: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><path d="M13.5 13.5h3v3h-3zM17.5 17.5h3v3h-3zM20.5 13.5v1M13.5 20.5h1"/>',
    profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    korb: '<path d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    zurueck: '<path d="M15 5l-7 7 7 7"/>',
    weiter: '<path d="M9 5l7 7-7 7"/>',
    schliessen: '<path d="M6 6l12 12M18 6 6 18"/>',
    lkw: '<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3.5h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    stern: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    coupon: '<path d="M3.5 7.5a2 2 0 0 0 2-2h13a2 2 0 0 0 2 2v2.5a2 2 0 0 0 0 4v2.5a2 2 0 0 0-2 2h-13a2 2 0 0 0-2-2V14a2 2 0 0 0 0-4z"/><path d="M9.5 9.5l5 5M9.6 14.4h0M14.4 9.6h0"/>',
    scan: '<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M7 12h10"/>',
    kasse: '<rect x="3.5" y="10" width="17" height="10.5" rx="2"/><path d="M6.5 10V4.5h11V10"/><path d="M9 7h6M8 14h2M14 14h2M8 17h8"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    stift: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>',
    mond: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    geschenk: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8M12 8.5v12"/><path d="M12 8.5C10 4 6.5 4.5 7 7s5 1.5 5 1.5 4.5 1 5-1.5-5-3-5 1.5z"/>',
    muell: '<path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14"/>'
  };

  window.icon = function (name, klasse) {
    return '<svg class="icon' + (klasse ? " " + klasse : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (pfade[name] || "") + "</svg>";
  };

  /* Logo (Ähre im Kreis) */
  window.logoSVG = function () {
    return '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="23" fill="#1C1C1E"/><g fill="#F0B860"><ellipse cx="24" cy="12" rx="3" ry="4.6"/><ellipse cx="19.2" cy="18" rx="3" ry="4.4" transform="rotate(-28 19.2 18)"/><ellipse cx="28.8" cy="18" rx="3" ry="4.4" transform="rotate(28 28.8 18)"/><ellipse cx="19.2" cy="25.5" rx="3" ry="4.4" transform="rotate(-28 19.2 25.5)"/><ellipse cx="28.8" cy="25.5" rx="3" ry="4.4" transform="rotate(28 28.8 25.5)"/></g><path d="M24 17v22" stroke="#F0B860" stroke-width="2.2" stroke-linecap="round"/></svg>';
  };

  window.esc = esc;
})();
