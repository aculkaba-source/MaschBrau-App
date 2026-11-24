# MaschBrau – App (fiktives Studienprojekt)

Web-App der **fiktiven** Brauerei MaschBrau: Getränke-Abo, Einzelbestellung, Kundenkarte mit QR-Code, Coupons und Punkte.
Läuft im Browser auf iPad, iPhone und Computer und lässt sich auf dem Home-Bildschirm wie eine echte App installieren (auch offline).

Reines HTML, CSS und JavaScript: kein Framework, kein Build-Schritt, **kein Server**. Alle Daten bleiben im Browser des jeweiligen Geräts.
Zahlung und Lieferung werden nur simuliert.

## Funktionen

| Bereich | Was geht |
|---|---|
| **Start** | Begrüßung, Kundenkarte, nächste Abo-Lieferung, Coupons der Woche, Sortiment |
| **Sortiment** | 13 Produkte, jeweils als 0,5-l- und 0,33-l-Glasflasche, Filter, Detailseiten, Warenkorb, Bestellung (simuliert) |
| **Abo** | 6 Größen (1–8 Kästen, 5–15 % Rabatt), Rhythmus wöchentlich / alle 2 Wochen / monatlich (+2 / +1 / 0 % Extra), Liefertag und Zeitfenster, jeden Kasten frei mischen, pausieren, ändern, kündigen |
| **Karte** | Kundenkarte als QR-Code, Wochen-Coupons aktivieren (2 davon nur mit Abo), Punkte gegen Prämien tauschen, Kassenbon scannen |
| **Kasse** | Kassen-Ansicht für ein zweites Gerät: Kundenkarte scannen, Einkauf erfassen, Coupons werden verrechnet, Bon-QR für die Punkte |
| **Profil** | Demo-Konto (nur Name), Bestellungen, Hell/Dunkel, Daten löschen |

### Vorführung mit zwei Geräten
1. **iPad (Kundin / Kunde):** Demo-Konto anlegen → *Karte* → Coupons aktivieren → Kundenkarte antippen.
2. **Handy (Getränkeladen):** App öffnen → *Profil → Kassen-Ansicht* (oder auf der Begrüßungsseite „Nur die Kassen-Ansicht öffnen“) → *Kundenkarte scannen*.
3. Artikel antippen, *Bezahlt (Simulation)* → es erscheint ein Bon-QR-Code.
4. **iPad:** *Karte → Kassenbon scannen* → Punkte werden gutgeschrieben, eingelöste Coupons abgehakt.

Ohne Kamera kann man den Code-Text im Scanner unter „Keine Kamera?“ einfügen.

## Veröffentlichen (GitHub Pages)

1. Auf github.com im Repository **Settings → Pages** öffnen.
2. Bei *Source* „Deploy from a branch“ wählen, den Branch auswählen und Ordner `/ (root)`, dann **Save**.
3. Nach ein bis zwei Minuten läuft die App unter `https://<benutzername>.github.io/MaschBrau-App/`.

Die Kamera funktioniert nur über `https://` – bei GitHub Pages ist das automatisch so.

### Auf dem iPad installieren
Adresse in **Safari** öffnen → **Teilen** → **„Zum Home-Bildschirm“**. Die App startet dann im Vollbild und funktioniert auch offline.
Hinweis: Die installierte App und der Safari-Tab haben **getrennte Daten** (eigenes Demo-Konto).

## Ordnerstruktur

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Grundgerüst der App |
| `js/daten.js` | **alle Produkte, Preise, Abo-Stufen, Rhythmen, Coupons und Prämien an einer Stelle** |
| `js/rechnen.js` | Preis-, Abo- und Coupon-Berechnung, Inhalt der QR-Codes (von App und Kasse gemeinsam genutzt) |
| `js/speicher.js` | Speichern im Browser, Datums- und Zahlenformate |
| `js/app.js` | Navigation, Seitenwechsel, Dialoge |
| `js/seite-*.js` | eine Datei pro Bereich (Start, Shop, Abo, Karte, Kasse, Profil) |
| `js/grafik.js` | zeichnet Flaschen und Symbole als SVG |
| `js/qr.js` | QR-Code erzeugen und mit der Kamera scannen |
| `js/vendor/` | QR-Bibliotheken (qrcode-generator, MIT · jsQR, Apache 2.0) |
| `css/app.css` | gesamtes Design (Farben ganz oben als Variablen, hell und dunkel) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation als App und Offline-Modus |

## Preise, Rabatte oder Coupons ändern

Alles steht in `js/daten.js`. Zahlen mit **Punkt** schreiben (`1.49`), die App zeigt sie mit Komma an.
Beispiele:
- Preis ändern: beim Produkt `preis: { "05": 1.49, "033": 1.19 }`
- Abo-Rabatt ändern: unter `abo.stufen` den Wert `rabatt`
- Neuer Coupon: unter `coupons` einen Block kopieren und eine neue `id` vergeben

Wenn du eine **neue Datei** hinzufügst, trage sie in `sw.js` in die Liste `DATEIEN` ein und erhöhe dort die `VERSION`.

---
*Fiktives Studienprojekt – keine echte Brauerei, keine echten Produkte, keine echten Bestellungen oder Zahlungen.*
