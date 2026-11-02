// All learning content for Lote. Shared by the server and the web client.
// German text has been written for learners; keep sentences short and natural.

export const LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Cumulative study hours (from zero) commonly needed to reach each level.
export const LEVEL_HOURS = { A1: 150, A2: 300, B1: 500, B2: 700 };

export const PROFESSIONS = [
  { id: 'nursing', label: 'Nurse' },
  { id: 'care', label: 'Care worker' },
  { id: 'trades', label: 'Skilled trade' },
  { id: 'it', label: 'IT' },
  { id: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Vocabulary decks
// ---------------------------------------------------------------------------
const v = (de, en, ex) => ({ de, en, ex });

export const DECKS = [
  {
    id: 'a1-basics', title: 'First words', level: 'A1', profession: null,
    cards: [
      v('Hallo', 'hello', 'Hallo, ich bin Amira.'),
      v('Guten Morgen', 'good morning', 'Guten Morgen, Frau Weber!'),
      v('Danke', 'thank you', 'Danke für Ihre Hilfe.'),
      v('Bitte', 'please / you’re welcome', 'Einen Kaffee, bitte.'),
      v('Entschuldigung', 'excuse me / sorry', 'Entschuldigung, wo ist der Bahnhof?'),
      v('ja', 'yes', 'Ja, das stimmt.'),
      v('nein', 'no', 'Nein, das weiß ich nicht.'),
      v('heißen', 'to be called', 'Wie heißen Sie?'),
      v('kommen aus', 'to come from', 'Ich komme aus Marokko.'),
      v('wohnen', 'to live (somewhere)', 'Ich wohne in Köln.'),
      v('arbeiten', 'to work', 'Ich arbeite im Krankenhaus.'),
      v('sprechen', 'to speak', 'Ich spreche ein bisschen Deutsch.'),
      v('verstehen', 'to understand', 'Ich verstehe das nicht.'),
      v('die Familie', 'the family', 'Meine Familie wohnt in Tunis.'),
      v('der Name', 'the name', 'Mein Name ist Karim.'),
      v('die Telefonnummer', 'the phone number', 'Wie ist Ihre Telefonnummer?'),
      v('die Adresse', 'the address', 'Meine Adresse ist Hauptstraße 5.'),
      v('heute', 'today', 'Heute arbeite ich nicht.'),
      v('morgen', 'tomorrow', 'Morgen habe ich einen Termin.'),
      v('jetzt', 'now', 'Ich habe jetzt keine Zeit.'),
      v('das Wasser', 'the water', 'Ein Glas Wasser, bitte.'),
      v('essen', 'to eat', 'Wir essen um zwölf Uhr.'),
      v('trinken', 'to drink', 'Ich trinke gern Tee.'),
      v('die Zeit', 'the time', 'Haben Sie morgen Zeit?'),
      v('wie viel', 'how much', 'Wie viel kostet das?'),
    ],
  },
  {
    id: 'a1-daily', title: 'Daily life', level: 'A1', profession: null,
    cards: [
      v('die Wohnung', 'the apartment', 'Die Wohnung hat zwei Zimmer.'),
      v('die Miete', 'the rent', 'Die Miete ist 650 Euro.'),
      v('der Supermarkt', 'the supermarket', 'Der Supermarkt ist um die Ecke.'),
      v('einkaufen', 'to go shopping', 'Am Samstag kaufe ich ein.'),
      v('der Bus', 'the bus', 'Ich fahre mit dem Bus zur Arbeit.'),
      v('die Haltestelle', 'the (bus/tram) stop', 'Die Haltestelle ist direkt vor dem Haus.'),
      v('die Fahrkarte', 'the ticket', 'Ich brauche eine Fahrkarte.'),
      v('der Arzt / die Ärztin', 'the doctor', 'Ich muss zum Arzt.'),
      v('krank', 'sick', 'Ich bin heute krank.'),
      v('der Termin', 'the appointment', 'Ich habe um 10 Uhr einen Termin.'),
      v('die Uhr', 'the clock / o’clock', 'Es ist acht Uhr.'),
      v('der Montag', 'Monday', 'Am Montag beginnt der Kurs.'),
      v('das Wochenende', 'the weekend', 'Am Wochenende besuche ich Freunde.'),
      v('teuer', 'expensive', 'Die Wohnung ist zu teuer.'),
      v('billig', 'cheap', 'Das Brot ist billig.'),
      v('brauchen', 'to need', 'Ich brauche Hilfe.'),
      v('suchen', 'to look for', 'Ich suche eine Wohnung.'),
      v('finden', 'to find', 'Ich finde meinen Schlüssel nicht.'),
      v('der Schlüssel', 'the key', 'Hast du den Schlüssel?'),
      v('öffnen', 'to open', 'Können Sie das Fenster öffnen?'),
      v('schließen', 'to close', 'Die Apotheke schließt um 18 Uhr.'),
      v('links', 'left', 'Gehen Sie hier links.'),
      v('rechts', 'right', 'Die Toilette ist rechts.'),
      v('geradeaus', 'straight ahead', 'Gehen Sie immer geradeaus.'),
      v('die Bank', 'the bank / the bench', 'Ich eröffne ein Konto bei der Bank.'),
    ],
  },
  {
    id: 'a2-work', title: 'Work and jobs', level: 'A2', profession: null,
    cards: [
      v('die Stelle', 'the position / job', 'Ich bewerbe mich auf die Stelle als Pflegefachkraft.'),
      v('sich bewerben', 'to apply', 'Ich möchte mich bei Ihnen bewerben.'),
      v('die Bewerbung', 'the application', 'Ich habe meine Bewerbung per E-Mail geschickt.'),
      v('der Lebenslauf', 'the CV', 'Mein Lebenslauf ist im Anhang.'),
      v('das Vorstellungsgespräch', 'the job interview', 'Das Vorstellungsgespräch ist am Dienstag.'),
      v('die Erfahrung', 'the experience', 'Ich habe fünf Jahre Erfahrung.'),
      v('der Arbeitgeber', 'the employer', 'Mein Arbeitgeber zahlt pünktlich.'),
      v('die Kollegin / der Kollege', 'the colleague', 'Meine Kollegen sind sehr nett.'),
      v('der Chef / die Chefin', 'the boss', 'Ich muss mit meiner Chefin sprechen.'),
      v('die Schicht', 'the shift', 'Ich habe heute die Spätschicht.'),
      v('der Urlaub', 'the vacation / leave', 'Ich habe 30 Tage Urlaub im Jahr.'),
      v('das Gehalt', 'the salary', 'Das Gehalt ist 3.200 Euro brutto.'),
      v('der Vertrag', 'the contract', 'Bitte unterschreiben Sie den Vertrag.'),
      v('Vollzeit / Teilzeit', 'full-time / part-time', 'Ich möchte in Vollzeit arbeiten.'),
      v('pünktlich', 'on time', 'Bitte seien Sie pünktlich.'),
      v('die Aufgabe', 'the task', 'Das ist eine wichtige Aufgabe.'),
      v('erledigen', 'to get (something) done', 'Ich erledige das sofort.'),
      v('sich krankmelden', 'to call in sick', 'Ich muss mich heute krankmelden.'),
      v('die Krankmeldung', 'the sick note', 'Die Krankmeldung schicke ich morgen.'),
      v('die Ausbildung', 'the vocational training', 'Ich habe eine Ausbildung als Elektriker.'),
      v('die Anerkennung', 'the recognition (of a qualification)', 'Die Anerkennung meines Diploms dauert drei Monate.'),
      v('der Feierabend', 'end of the work day', 'Um 17 Uhr habe ich Feierabend.'),
      v('die Überstunde', 'the overtime hour', 'Ich habe diese Woche vier Überstunden gemacht.'),
      v('zuständig sein für', 'to be responsible for', 'Wer ist dafür zuständig?'),
      v('die Probezeit', 'the probation period', 'Die Probezeit dauert sechs Monate.'),
    ],
  },
  {
    id: 'a2-official', title: 'Offices and paperwork', level: 'A2', profession: null,
    cards: [
      v('die Behörde', 'the public authority', 'Ich muss zur Behörde.'),
      v('die Ausländerbehörde', 'the immigration office', 'Mein Termin bei der Ausländerbehörde ist am Freitag.'),
      v('das Visum', 'the visa', 'Ich habe ein Visum für die Arbeit beantragt.'),
      v('die Aufenthaltserlaubnis', 'the residence permit', 'Meine Aufenthaltserlaubnis gilt zwei Jahre.'),
      v('beantragen', 'to apply for (officially)', 'Ich möchte einen Pass beantragen.'),
      v('das Formular', 'the form', 'Bitte füllen Sie das Formular aus.'),
      v('ausfüllen', 'to fill in', 'Können Sie mir beim Ausfüllen helfen?'),
      v('unterschreiben', 'to sign', 'Bitte hier unterschreiben.'),
      v('der Ausweis', 'the ID card', 'Haben Sie Ihren Ausweis dabei?'),
      v('der Reisepass', 'the passport', 'Mein Reisepass ist noch gültig.'),
      v('gültig', 'valid', 'Das Dokument ist nicht mehr gültig.'),
      v('sich anmelden', 'to register', 'Ich muss mich in der Stadt anmelden.'),
      v('die Krankenversicherung', 'the health insurance', 'Die Krankenversicherung ist Pflicht.'),
      v('das Konto', 'the bank account', 'Für das Gehalt brauche ich ein Konto.'),
      v('die Steuer', 'the tax', 'Die Steuer wird vom Gehalt abgezogen.'),
      v('die Unterlagen', 'the documents', 'Bitte bringen Sie alle Unterlagen mit.'),
      v('die Kopie', 'the copy', 'Ich brauche eine Kopie von Ihrem Zeugnis.'),
      v('das Zeugnis', 'the certificate / reference', 'Das Zeugnis ist auf Französisch.'),
      v('übersetzen', 'to translate', 'Das Zeugnis muss übersetzt werden.'),
      v('die Frist', 'the deadline', 'Die Frist endet am 30. Juni.'),
      v('die Wartenummer', 'the queue number', 'Ziehen Sie bitte eine Wartenummer.'),
      v('der Nachweis', 'the proof', 'Ich brauche einen Nachweis über meine Deutschkenntnisse.'),
      v('die Prüfung', 'the exam', 'Die B1-Prüfung ist im Mai.'),
      v('bestehen', 'to pass (an exam)', 'Ich habe die Prüfung bestanden!'),
      v('das Amt', 'the office (public)', 'Das Amt ist heute geschlossen.'),
    ],
  },
  {
    id: 'b1-connectors', title: 'B1: Connecting ideas', level: 'B1', profession: null,
    cards: [
      v('weil', 'because (verb at end)', 'Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.'),
      v('obwohl', 'although', 'Obwohl ich müde bin, lerne ich noch eine Stunde.'),
      v('deshalb', 'therefore', 'Ich war krank, deshalb bin ich zu Hause geblieben.'),
      v('trotzdem', 'nevertheless', 'Es regnet, trotzdem gehe ich spazieren.'),
      v('damit', 'so that', 'Ich spreche langsam, damit alle mich verstehen.'),
      v('während', 'while / during', 'Während der Schicht trinke ich viel Wasser.'),
      v('nachdem', 'after (conjunction)', 'Nachdem ich gegessen hatte, rief ich an.'),
      v('bevor', 'before', 'Bevor ich gehe, schreibe ich den Bericht.'),
      v('außerdem', 'in addition', 'Außerdem habe ich Erfahrung mit Kindern.'),
      v('zum Beispiel', 'for example', 'Zum Beispiel arbeite ich gern im Team.'),
      v('meiner Meinung nach', 'in my opinion', 'Meiner Meinung nach ist das eine gute Idee.'),
      v('einerseits … andererseits', 'on the one hand … on the other', 'Einerseits ist die Stadt teuer, andererseits gibt es viele Jobs.'),
      v('sowohl … als auch', 'both … and', 'Ich spreche sowohl Arabisch als auch Französisch.'),
      v('entweder … oder', 'either … or', 'Entweder komme ich heute oder morgen.'),
      v('je … desto', 'the … the', 'Je mehr ich übe, desto besser spreche ich.'),
      v('falls', 'in case / if', 'Falls Sie Fragen haben, rufen Sie mich an.'),
      v('sondern', 'but rather', 'Ich komme nicht aus Algerien, sondern aus Tunesien.'),
      v('sobald', 'as soon as', 'Sobald ich das Visum habe, buche ich den Flug.'),
      v('seitdem', 'since then / since', 'Seitdem ich in Berlin wohne, spreche ich mehr Deutsch.'),
      v('ob', 'whether / if', 'Ich weiß nicht, ob der Zug pünktlich ist.'),
      v('zuerst', 'first', 'Zuerst wasche ich mir die Hände.'),
      v('danach', 'afterwards', 'Danach messe ich den Blutdruck.'),
      v('schließlich', 'finally', 'Schließlich dokumentiere ich alles.'),
      v('zusammenfassend', 'in summary', 'Zusammenfassend kann man sagen, dass …'),
      v('im Gegensatz zu', 'in contrast to', 'Im Gegensatz zu Marokko ist es hier im Winter kalt.'),
    ],
  },
  {
    id: 'nursing', title: 'Nursing and hospital', level: 'A2', profession: 'nursing',
    cards: [
      v('die Pflegefachkraft', 'the registered nurse', 'Ich arbeite als Pflegefachkraft.'),
      v('der Patient / die Patientin', 'the patient', 'Der Patient in Zimmer 4 hat Schmerzen.'),
      v('die Station', 'the ward', 'Ich arbeite auf der Station 3B.'),
      v('die Übergabe', 'the shift handover', 'Die Übergabe beginnt um 13:45 Uhr.'),
      v('der Blutdruck', 'the blood pressure', 'Der Blutdruck ist 140 zu 90.'),
      v('der Puls', 'the pulse', 'Der Puls ist sehr schnell.'),
      v('das Fieber', 'the fever', 'Die Patientin hat 38,5 Grad Fieber.'),
      v('die Schmerzen', 'the pain', 'Wo haben Sie Schmerzen?'),
      v('das Medikament', 'the medication', 'Bitte nehmen Sie das Medikament nach dem Essen.'),
      v('die Spritze', 'the injection', 'Sie bekommen jetzt eine Spritze.'),
      v('der Verband', 'the bandage / dressing', 'Ich wechsle jetzt den Verband.'),
      v('die Wunde', 'the wound', 'Die Wunde heilt gut.'),
      v('die Infusion', 'the IV drip', 'Die Infusion läuft noch eine Stunde.'),
      v('nüchtern', 'fasting (before a test)', 'Sie müssen morgen nüchtern bleiben.'),
      v('der Notfall', 'the emergency', 'Das ist ein Notfall, rufen Sie den Arzt!'),
      v('die Pflegedokumentation', 'the care documentation', 'Ich trage alles in die Pflegedokumentation ein.'),
      v('die Visite', 'the doctor’s round', 'Die Visite ist um 9 Uhr.'),
      v('der Blutzucker', 'the blood sugar', 'Ich messe jetzt Ihren Blutzucker.'),
      v('mobilisieren', 'to mobilize (a patient)', 'Wir mobilisieren den Patienten zweimal am Tag.'),
      v('lagern', 'to position (a patient)', 'Der Patient muss alle zwei Stunden gelagert werden.'),
      v('die Klingel', 'the call bell', 'Bitte klingeln Sie, wenn Sie Hilfe brauchen.'),
      v('die Allergie', 'the allergy', 'Haben Sie eine Allergie gegen Medikamente?'),
      v('entlassen', 'to discharge', 'Herr Yilmaz wird morgen entlassen.'),
      v('die Aufnahme', 'the admission', 'Wir haben eine neue Aufnahme in Zimmer 7.'),
      v('die Hygiene', 'the hygiene', 'Hygiene ist auf der Station sehr wichtig.'),
    ],
  },
  {
    id: 'care', title: 'Elderly care', level: 'A2', profession: 'care',
    cards: [
      v('die Pflegekraft', 'the care worker', 'Ich bin Ihre Pflegekraft für heute.'),
      v('der Bewohner / die Bewohnerin', 'the resident', 'Die Bewohnerin in Zimmer 12 möchte aufstehen.'),
      v('das Pflegeheim', 'the care home', 'Ich arbeite in einem Pflegeheim in Hamburg.'),
      v('die Körperpflege', 'the personal hygiene care', 'Ich helfe bei der Körperpflege.'),
      v('waschen', 'to wash', 'Darf ich Ihnen beim Waschen helfen?'),
      v('anziehen', 'to dress', 'Ich helfe Ihnen beim Anziehen.'),
      v('der Rollstuhl', 'the wheelchair', 'Ich bringe Sie mit dem Rollstuhl zum Essen.'),
      v('der Rollator', 'the walker', 'Bitte nehmen Sie Ihren Rollator.'),
      v('stürzen', 'to fall', 'Frau Müller ist heute Nacht gestürzt.'),
      v('die Demenz', 'the dementia', 'Herr Schmidt hat Demenz.'),
      v('verwirrt', 'confused', 'Er ist heute sehr verwirrt.'),
      v('beruhigen', 'to calm', 'Ich versuche, sie zu beruhigen.'),
      v('die Mahlzeit', 'the meal', 'Die nächste Mahlzeit ist um 12 Uhr.'),
      v('Essen reichen', 'to help someone eat', 'Ich reiche ihm das Essen.'),
      v('die Angehörigen', 'the relatives', 'Die Angehörigen kommen am Sonntag.'),
      v('das Inkontinenzmaterial', 'the incontinence products', 'Wir brauchen neues Inkontinenzmaterial.'),
      v('aufstehen', 'to get up', 'Möchten Sie jetzt aufstehen?'),
      v('sich hinlegen', 'to lie down', 'Ich möchte mich kurz hinlegen.'),
      v('der Spaziergang', 'the walk', 'Wollen wir einen Spaziergang machen?'),
      v('vorsichtig', 'careful', 'Bitte stehen Sie vorsichtig auf.'),
      v('trinken (genug)', 'to drink (enough)', 'Sie müssen genug trinken.'),
      v('die Tablette', 'the pill', 'Hier sind Ihre Tabletten für den Abend.'),
      v('die Pflegestufe / der Pflegegrad', 'the care level', 'Sie hat Pflegegrad 3.'),
      v('die Würde', 'the dignity', 'Wir respektieren die Würde der Bewohner.'),
      v('der Bericht', 'the report', 'Ich schreibe den Bericht für die Nachtschicht.'),
    ],
  },
  {
    id: 'trades', title: 'Trades and workshop', level: 'A2', profession: 'trades',
    cards: [
      v('die Baustelle', 'the construction site', 'Wir arbeiten heute auf der Baustelle.'),
      v('das Werkzeug', 'the tool', 'Hast du das Werkzeug dabei?'),
      v('der Hammer', 'the hammer', 'Gib mir bitte den Hammer.'),
      v('der Schraubenzieher', 'the screwdriver', 'Ich brauche einen Schraubenzieher.'),
      v('die Bohrmaschine', 'the drill', 'Die Bohrmaschine ist kaputt.'),
      v('die Leitung', 'the cable / pipe', 'Die Leitung ist unter Strom.'),
      v('der Strom', 'the electricity', 'Schalte zuerst den Strom ab!'),
      v('reparieren', 'to repair', 'Ich kann die Heizung reparieren.'),
      v('einbauen', 'to install', 'Wir bauen heute die Küche ein.'),
      v('messen', 'to measure', 'Ich messe die Wand.'),
      v('die Schutzbrille', 'the safety goggles', 'Trag immer die Schutzbrille!'),
      v('der Helm', 'the helmet', 'Auf der Baustelle ist ein Helm Pflicht.'),
      v('die Sicherheit', 'the safety', 'Sicherheit geht vor.'),
      v('der Auftrag', 'the job / order', 'Wir haben einen neuen Auftrag.'),
      v('der Kunde / die Kundin', 'the customer', 'Der Kunde wartet schon.'),
      v('das Material', 'the material', 'Das Material kommt morgen.'),
      v('die Heizung', 'the heating', 'Die Heizung funktioniert nicht.'),
      v('das Rohr', 'the pipe', 'Das Rohr ist undicht.'),
      v('undicht', 'leaking', 'Der Wasserhahn ist undicht.'),
      v('der Meister / die Meisterin', 'the master craftsman', 'Der Meister prüft die Arbeit.'),
      v('die Leiter', 'the ladder', 'Halt bitte die Leiter fest.'),
      v('die Steckdose', 'the socket', 'Die Steckdose hat keinen Strom.'),
      v('schweißen', 'to weld', 'Ich habe Erfahrung im Schweißen.'),
      v('der Plan', 'the plan / blueprint', 'Kannst du den Plan lesen?'),
      v('fertig', 'finished', 'Wann ist die Arbeit fertig?'),
    ],
  },
  {
    id: 'it', title: 'IT and office', level: 'A2', profession: 'it',
    cards: [
      v('der Rechner', 'the computer', 'Mein Rechner ist sehr langsam.'),
      v('die Besprechung', 'the meeting', 'Die Besprechung beginnt um zehn.'),
      v('das Meeting', 'the meeting (informal)', 'Wir haben gleich ein Meeting.'),
      v('die Anforderung', 'the requirement', 'Die Anforderungen sind noch nicht klar.'),
      v('der Fehler', 'the bug / mistake', 'Ich habe den Fehler gefunden.'),
      v('beheben', 'to fix', 'Ich behebe den Fehler bis morgen.'),
      v('die Datenbank', 'the database', 'Die Datenbank ist offline.'),
      v('der Server', 'the server', 'Der Server antwortet nicht.'),
      v('das Netzwerk', 'the network', 'Es gibt ein Problem mit dem Netzwerk.'),
      v('das Passwort', 'the password', 'Bitte ändern Sie Ihr Passwort.'),
      v('die Datei', 'the file', 'Ich schicke dir die Datei.'),
      v('speichern', 'to save', 'Hast du die Änderungen gespeichert?'),
      v('herunterladen', 'to download', 'Bitte laden Sie die Software herunter.'),
      v('die Frist / die Deadline', 'the deadline', 'Die Deadline ist am Freitag.'),
      v('das Projekt', 'the project', 'Das Projekt dauert sechs Monate.'),
      v('die Aufgabe', 'the task / ticket', 'Ich übernehme diese Aufgabe.'),
      v('testen', 'to test', 'Wir müssen das noch testen.'),
      v('die Lösung', 'the solution', 'Ich habe eine Lösung vorgeschlagen.'),
      v('der Kunde', 'the client', 'Der Kunde möchte eine Demo.'),
      v('remote arbeiten', 'to work remotely', 'Ich arbeite zwei Tage pro Woche remote.'),
      v('die Rückmeldung', 'the feedback / reply', 'Ich warte auf Ihre Rückmeldung.'),
      v('erklären', 'to explain', 'Kannst du mir das noch einmal erklären?'),
      v('verantwortlich', 'responsible', 'Ich bin für das Backend verantwortlich.'),
      v('die Schulung', 'the training session', 'Morgen gibt es eine Schulung.'),
      v('das Update', 'the update', 'Das Update wird heute Nacht installiert.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Grammar lessons. Exercise types:
//  mc:    { q, options, answer (index) }
//  fill:  { q (with ___), answer, accept? }
//  order: { words: [...], answer: 'sentence' }
// ---------------------------------------------------------------------------
export const LESSONS = [
  {
    id: 'a1-sein-haben', level: 'A1', title: 'sein and haben',
    minutes: 20,
    explain: [
      '“sein” (to be) and “haben” (to have) are the two most important verbs. They are irregular, so learn them by heart.',
      'sein: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.',
      'haben: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
    ],
    examples: ['Ich bin Krankenpfleger.', 'Sie hat zwei Kinder.', 'Wir sind müde.'],
    exercises: [
      { type: 'fill', q: 'Ich ___ aus Ägypten.', answer: 'bin' },
      { type: 'fill', q: 'Er ___ einen Termin.', answer: 'hat' },
      { type: 'fill', q: 'Wir ___ Kollegen.', answer: 'sind' },
      { type: 'mc', q: 'Du ___ Hunger.', options: ['hast', 'habt', 'hat'], answer: 0 },
      { type: 'mc', q: 'Ihr ___ sehr nett.', options: ['sind', 'seid', 'ist'], answer: 1 },
      { type: 'order', words: ['habe', 'ich', 'heute', 'Zeit'], answer: 'Ich habe heute Zeit', alt: ['Heute habe ich Zeit'] },
    ],
  },
  {
    id: 'a1-present', level: 'A1', title: 'Present tense of regular verbs',
    minutes: 25,
    explain: [
      'Take the stem (arbeit-en → arbeit) and add the ending.',
      'ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en.',
      'If the stem ends in -t or -d, add an extra -e: du arbeitest, er arbeitet.',
    ],
    examples: ['Ich wohne in Berlin.', 'Arbeitest du heute?', 'Sie lernt jeden Tag.'],
    exercises: [
      { type: 'fill', q: 'Ich ___ (wohnen) in München.', answer: 'wohne' },
      { type: 'fill', q: 'Du ___ (lernen) sehr schnell.', answer: 'lernst' },
      { type: 'fill', q: 'Er ___ (arbeiten) im Krankenhaus.', answer: 'arbeitet' },
      { type: 'mc', q: 'Wir ___ (machen) eine Pause.', options: ['macht', 'machen', 'machst'], answer: 1 },
      { type: 'mc', q: 'Ihr ___ (kommen) aus Indien.', options: ['kommt', 'kommen', 'kommst'], answer: 0 },
      { type: 'order', words: ['spielt', 'Fußball', 'er', 'gern'], answer: 'Er spielt gern Fußball', alt: ['Fußball spielt er gern'] },
    ],
  },
  {
    id: 'a1-word-order', level: 'A1', title: 'Verb in position 2',
    minutes: 20,
    explain: [
      'In a German main clause, the conjugated verb is always the second element.',
      'If you start with time or place, the subject moves after the verb: Heute arbeite ich.',
      'In yes/no questions the verb comes first: Arbeitest du heute?',
    ],
    examples: ['Morgen habe ich frei.', 'Um 7 Uhr beginnt meine Schicht.', 'Kommst du mit?'],
    exercises: [
      { type: 'order', words: ['arbeite', 'heute', 'ich'], answer: 'Heute arbeite ich', alt: ['Ich arbeite heute'] },
      { type: 'order', words: ['beginnt', 'der Kurs', 'am Montag'], answer: 'Am Montag beginnt der Kurs', alt: ['Der Kurs beginnt am Montag'] },
      { type: 'mc', q: 'Which sentence is correct?', options: ['Morgen ich habe frei.', 'Morgen habe ich frei.', 'Habe morgen ich frei.'], answer: 1 },
      { type: 'mc', q: 'Make a yes/no question:', options: ['Du sprichst Deutsch?', 'Sprichst du Deutsch?', 'Deutsch du sprichst?'], answer: 1 },
      { type: 'order', words: ['wohnt', 'in Köln', 'seit 2024', 'sie'], answer: 'Seit 2024 wohnt sie in Köln', alt: ['Sie wohnt seit 2024 in Köln', 'In Köln wohnt sie seit 2024'] },
    ],
  },
  {
    id: 'a1-articles', level: 'A1', title: 'der, die, das and ein/eine',
    minutes: 25,
    explain: [
      'Every noun has a gender: masculine (der), feminine (die) or neuter (das). Plural is always die.',
      'Indefinite: ein (masculine/neuter), eine (feminine). Negative: kein / keine.',
      'Tips: -ung, -heit, -keit, -ion → die. -chen, -lein → das. Always learn the noun with its article.',
    ],
    examples: ['der Arzt, die Station, das Krankenhaus', 'Ich habe eine Frage.', 'Das ist kein Problem.'],
    exercises: [
      { type: 'mc', q: '___ Wohnung ist groß.', options: ['Der', 'Die', 'Das'], answer: 1 },
      { type: 'mc', q: '___ Mädchen spielt.', options: ['Der', 'Die', 'Das'], answer: 2 },
      { type: 'mc', q: '___ Rechnung kommt morgen.', options: ['Der', 'Die', 'Das'], answer: 1 },
      { type: 'fill', q: 'Ich habe ___ Frage. (a)', answer: 'eine' },
      { type: 'fill', q: 'Das ist ___ Problem. (no)', answer: 'kein' },
      { type: 'mc', q: '___ Termin ist um acht.', options: ['Der', 'Die', 'Das'], answer: 0 },
    ],
  },
  {
    id: 'a2-modal', level: 'A2', title: 'Modal verbs',
    minutes: 30,
    explain: [
      'können (can), müssen (must), dürfen (may), sollen (should), wollen (want), möchten (would like).',
      'The modal verb is in position 2 and the main verb goes to the end in the infinitive.',
      'ich/er forms have no ending: ich kann, er muss, sie will.',
    ],
    examples: ['Ich muss heute länger arbeiten.', 'Können Sie mir helfen?', 'Hier darf man nicht rauchen.'],
    exercises: [
      { type: 'fill', q: 'Ich ___ (können) gut kochen.', answer: 'kann' },
      { type: 'fill', q: 'Er ___ (müssen) morgen früh aufstehen.', answer: 'muss' },
      { type: 'mc', q: 'Hier ___ man nicht parken.', options: ['darf', 'dürfen', 'darfst'], answer: 0 },
      { type: 'order', words: ['ich', 'muss', 'den Bericht', 'schreiben'], answer: 'Ich muss den Bericht schreiben', alt: ['Den Bericht muss ich schreiben'] },
      { type: 'order', words: ['Sie', 'können', 'langsamer', 'sprechen'], answer: 'Können Sie langsamer sprechen' },
      { type: 'mc', q: 'Wir ___ einen Kaffee, bitte.', options: ['möchte', 'möchten', 'möchtet'], answer: 1 },
    ],
  },
  {
    id: 'a2-perfekt', level: 'A2', title: 'Talking about the past (Perfekt)',
    minutes: 30,
    explain: [
      'Spoken German uses the Perfekt for the past: haben/sein (position 2) + past participle (end).',
      'Regular: ge- + stem + -t (gemacht, gearbeitet). Irregular: ge- + stem + -en (gegessen, geschrieben).',
      'Use sein with movement or change of state: ich bin gefahren, er ist eingeschlafen.',
    ],
    examples: ['Ich habe gestern lange gearbeitet.', 'Sie ist nach Berlin gefahren.', 'Wir haben zusammen gegessen.'],
    exercises: [
      { type: 'fill', q: 'Ich habe den Patienten ___ (fragen).', answer: 'gefragt' },
      { type: 'fill', q: 'Er ___ nach Hause gegangen.', answer: 'ist' },
      { type: 'mc', q: 'Wir ___ einen Brief geschrieben.', options: ['sind', 'haben', 'hat'], answer: 1 },
      { type: 'mc', q: 'Participle of “essen”:', options: ['geesst', 'gegessen', 'geessen'], answer: 1 },
      { type: 'order', words: ['ich', 'habe', 'gestern', 'Deutsch', 'gelernt'], answer: 'Gestern habe ich Deutsch gelernt', alt: ['Ich habe gestern Deutsch gelernt', 'Deutsch habe ich gestern gelernt'] },
      { type: 'mc', q: 'Sie ___ um 6 Uhr aufgestanden.', options: ['hat', 'ist', 'haben'], answer: 1 },
    ],
  },
  {
    id: 'a2-dativ', level: 'A2', title: 'Accusative and dative',
    minutes: 35,
    explain: [
      'Accusative (direct object): den / einen for masculine; die, das unchanged.',
      'Dative (indirect object, and after mit, bei, nach, von, zu, aus, seit): dem / einem (masc./neut.), der / einer (fem.), den + -n (plural).',
      'Common: Ich gebe dem Patienten das Medikament.',
    ],
    examples: ['Ich sehe den Arzt.', 'Ich fahre mit dem Bus.', 'Sie arbeitet bei einer Firma.'],
    exercises: [
      { type: 'mc', q: 'Ich brauche ___ Schlüssel. (der)', options: ['der', 'den', 'dem'], answer: 1 },
      { type: 'mc', q: 'Ich fahre mit ___ Bahn. (die)', options: ['die', 'der', 'den'], answer: 1 },
      { type: 'mc', q: 'Er kommt aus ___ Krankenhaus. (das)', options: ['das', 'dem', 'den'], answer: 1 },
      { type: 'fill', q: 'Ich gebe ___ Patientin das Wasser. (die → dative)', answer: 'der' },
      { type: 'mc', q: 'Wir gehen zu ___ Arzt.', options: ['dem', 'den', 'der'], answer: 0 },
      { type: 'mc', q: 'Ich kaufe ___ Fahrkarte.', options: ['einen', 'eine', 'einem'], answer: 1 },
    ],
  },
  {
    id: 'b1-nebensatz', level: 'B1', title: 'Subordinate clauses (weil, dass, wenn)',
    minutes: 35,
    explain: [
      'After weil, dass, wenn, ob, obwohl, damit, the conjugated verb goes to the end of the clause.',
      'If the subordinate clause comes first, the main clause starts with the verb: Wenn ich Zeit habe, lerne ich.',
      'There is always a comma between the clauses.',
    ],
    examples: [
      'Ich lerne Deutsch, weil ich in Deutschland arbeiten will.',
      'Ich glaube, dass die Prüfung schwer ist.',
      'Wenn der Patient klingelt, gehe ich sofort hin.',
    ],
    exercises: [
      { type: 'order', words: ['weil', 'ich', 'krank', 'bin'], answer: 'weil ich krank bin' },
      { type: 'mc', q: 'Ich weiß, dass er morgen ___.', options: ['kommt', 'kommt er', 'er kommt'], answer: 0 },
      { type: 'mc', q: 'Wenn ich Zeit habe, ___.', options: ['ich lerne', 'lerne ich', 'lerne'], answer: 1 },
      { type: 'fill', q: 'Ich bleibe zu Hause, ___ ich Fieber habe. (because)', answer: 'weil' },
      { type: 'fill', q: 'Er fragt, ___ der Bus pünktlich ist. (whether)', answer: 'ob' },
      { type: 'order', words: ['obwohl', 'sie', 'müde', 'ist'], answer: 'obwohl sie müde ist' },
    ],
  },
  {
    id: 'b1-passiv', level: 'B1', title: 'Passive voice',
    minutes: 30,
    explain: [
      'Use the passive when the action matters more than who does it — very common at work and in instructions.',
      'werden (position 2) + past participle (end): Der Patient wird operiert.',
      'Past: wurde + participle: Das Formular wurde geschickt. With modals: muss … werden.',
    ],
    examples: ['Die Medikamente werden um 8 Uhr verteilt.', 'Der Verband wurde gewechselt.', 'Die Wunde muss täglich kontrolliert werden.'],
    exercises: [
      { type: 'mc', q: 'Das Essen ___ um 12 Uhr serviert.', options: ['wird', 'werden', 'wurde werden'], answer: 0 },
      { type: 'fill', q: 'Die Betten werden jeden Tag ___ (machen).', answer: 'gemacht' },
      { type: 'mc', q: 'Gestern ___ der Patient entlassen.', options: ['wird', 'wurde', 'werden'], answer: 1 },
      { type: 'order', words: ['der Bericht', 'muss', 'heute', 'geschrieben', 'werden'], answer: 'Der Bericht muss heute geschrieben werden', alt: ['Heute muss der Bericht geschrieben werden'] },
      { type: 'mc', q: 'Die Fenster ___ geputzt.', options: ['wird', 'werden', 'wirst'], answer: 1 },
    ],
  },
  {
    id: 'b1-konjunktiv', level: 'B1', title: 'Polite requests (Konjunktiv II)',
    minutes: 25,
    explain: [
      'For polite requests and wishes use: würde + infinitive, könnte, hätte, wäre.',
      'Könnten Sie mir bitte helfen? sounds much more polite than Helfen Sie mir!',
      'Wishes and advice: Ich hätte gern …, An Ihrer Stelle würde ich …',
    ],
    examples: ['Könnten Sie das bitte wiederholen?', 'Ich hätte gern einen Termin.', 'Ich würde gern in Vollzeit arbeiten.'],
    exercises: [
      { type: 'mc', q: '___ Sie mir bitte das Formular geben?', options: ['Können', 'Könnten', 'Konnten'], answer: 1 },
      { type: 'fill', q: 'Ich ___ gern einen Termin. (would like to have)', answer: 'hätte' },
      { type: 'mc', q: 'An Ihrer Stelle ___ ich den Arzt anrufen.', options: ['würde', 'werde', 'wurde'], answer: 0 },
      { type: 'order', words: ['ich', 'würde', 'gern', 'mehr', 'lernen'], answer: 'Ich würde gern mehr lernen', alt: ['Gern würde ich mehr lernen'] },
      { type: 'mc', q: 'Es ___ schön, wenn Sie kommen könnten.', options: ['ist', 'wäre', 'war'], answer: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// AI speaking partner scenarios
// ---------------------------------------------------------------------------
export const SCENARIOS = [
  {
    id: 'intro', level: 'A1', profession: null, title: 'Introduce yourself',
    role: 'a friendly new neighbour in a German apartment building',
    goal: 'Introduce yourself: name, where you come from, your job and why you are in Germany.',
    opener: 'Hallo! Ich glaube, Sie sind neu hier im Haus. Ich bin Petra. Und wie heißen Sie?',
  },
  {
    id: 'doctor', level: 'A1', profession: null, title: 'At the doctor’s office',
    role: 'a receptionist at a family doctor’s practice (Hausarztpraxis)',
    goal: 'Explain that you feel sick, say what hurts and get an appointment.',
    opener: 'Guten Tag, Praxis Dr. Becker. Was kann ich für Sie tun?',
  },
  {
    id: 'landlord', level: 'A2', profession: null, title: 'Call a landlord',
    role: 'a landlord who placed an online ad for a two-room apartment',
    goal: 'Ask about the rent, the size and when you can visit the apartment.',
    opener: 'Schneider, guten Tag. Sie rufen wegen der Wohnung an?',
  },
  {
    id: 'interview', level: 'A2', profession: null, title: 'Job interview',
    role: 'an HR manager interviewing the learner for a job that matches their profession',
    goal: 'Talk about your experience, strengths, why you want this job and when you can start.',
    opener: 'Guten Tag, schön, dass Sie da sind. Erzählen Sie doch bitte kurz etwas über sich.',
  },
  {
    id: 'auslaenderbehoerde', level: 'A2', profession: null, title: 'Immigration office',
    role: 'a clerk at the Ausländerbehörde handling residence permits for skilled workers',
    goal: 'Explain why you are here, answer questions about your job and documents.',
    opener: 'Guten Morgen. Ihre Wartenummer bitte. Worum geht es heute?',
  },
  {
    id: 'handover', level: 'B1', profession: 'nursing', title: 'Shift handover',
    role: 'a nurse from the early shift handing over to the learner, who takes the late shift',
    goal: 'Receive the handover, ask follow-up questions about patients and confirm the tasks.',
    opener: 'Hallo, gut dass du da bist. Fangen wir mit Zimmer 4 an: Herr Weber, 78, gestern operiert. Was möchtest du zuerst wissen?',
  },
  {
    id: 'resident', level: 'A2', profession: 'care', title: 'Morning care with a resident',
    role: 'Frau Hoffmann, an 84-year-old care-home resident who is a bit grumpy this morning',
    goal: 'Greet her politely, offer help with getting up and washing, and calm her down.',
    opener: 'Ach, schon wieder so früh? Ich will heute gar nicht aufstehen.',
  },
  {
    id: 'customer', level: 'A2', profession: 'trades', title: 'A customer’s broken heating',
    role: 'a customer whose heating stopped working, calling a plumbing company',
    goal: 'Ask what the problem is, gather details and arrange a visit.',
    opener: 'Hallo, hier ist Kowalski. Unsere Heizung ist seit gestern kalt. Können Sie heute noch kommen?',
  },
  {
    id: 'standup', level: 'B1', profession: 'it', title: 'Daily stand-up meeting',
    role: 'a team lead running the daily stand-up of a software team',
    goal: 'Say what you did yesterday, what you plan today and whether something blocks you.',
    opener: 'Guten Morgen zusammen! Fangen wir an. Was hast du gestern gemacht?',
  },
  {
    id: 'debate', level: 'B1', profession: null, title: 'Give your opinion',
    role: 'a friendly German colleague chatting in the break room',
    goal: 'Discuss: is it better to live in a big city or a small town in Germany? Give reasons.',
    opener: 'Sag mal, du bist ja neu in Deutschland. Möchtest du lieber in einer großen Stadt oder auf dem Land wohnen?',
  },
];

// ---------------------------------------------------------------------------
// Writing tasks (graded by AI in the style of Goethe/telc writing tasks)
// ---------------------------------------------------------------------------
export const WRITING_TASKS = [
  {
    id: 'w-a1-form', level: 'A1', title: 'Message to a friend',
    prompt: 'Sie können am Samstag nicht zum Geburtstag Ihrer Freundin Lena kommen. Schreiben Sie eine kurze Nachricht: Entschuldigen Sie sich, nennen Sie den Grund und machen Sie einen neuen Vorschlag.',
    words: '30–40',
  },
  {
    id: 'w-a2-sick', level: 'A2', title: 'Call in sick by email',
    prompt: 'Sie sind krank und können heute nicht arbeiten. Schreiben Sie eine E-Mail an Ihre Chefin, Frau Klein. Schreiben Sie: was Sie haben, wie lange Sie fehlen und wer Ihre Aufgaben übernehmen kann.',
    words: '40–60',
  },
  {
    id: 'w-a2-apartment', level: 'A2', title: 'Reply to an apartment ad',
    prompt: 'Sie haben eine Anzeige für eine 2-Zimmer-Wohnung gelesen. Schreiben Sie an den Vermieter: Stellen Sie sich vor, fragen Sie nach den Nebenkosten und bitten Sie um einen Besichtigungstermin.',
    words: '50–70',
  },
  {
    id: 'w-b1-application', level: 'B1', title: 'Short job application',
    prompt: 'Sie haben eine Stellenanzeige für Ihren Beruf gesehen. Schreiben Sie ein kurzes Bewerbungsschreiben: Wer sind Sie? Welche Erfahrung haben Sie? Warum passen Sie zu der Stelle? Wann können Sie anfangen?',
    words: '100–130',
  },
  {
    id: 'w-b1-opinion', level: 'B1', title: 'Forum post: Home office',
    prompt: 'In einem Online-Forum diskutieren Leute über das Thema „Homeoffice“. Schreiben Sie Ihre Meinung: Was sind Vorteile, was sind Nachteile? Wie ist es in Ihrem Beruf?',
    words: '80–100',
  },
  {
    id: 'w-b1-complaint', level: 'B1', title: 'Formal complaint',
    prompt: 'Ihre Heizung ist seit zwei Wochen kaputt und der Vermieter hat noch nichts gemacht. Schreiben Sie eine Beschwerde: Beschreiben Sie das Problem, was Sie schon getan haben, und was Sie jetzt erwarten.',
    words: '100–120',
  },
];

// ---------------------------------------------------------------------------
// Mock exams. Listening texts are read aloud with the browser voice.
// ---------------------------------------------------------------------------
export const EXAMS = [
  {
    id: 'mock-a2-1', level: 'A2', title: 'A2 practice exam 1', minutes: 25,
    sections: [
      {
        kind: 'reading', title: 'Reading: Notice at work',
        text: 'Liebe Kolleginnen und Kollegen,\n\nab dem 1. März gibt es neue Pausenzeiten. Die Frühschicht macht von 10:00 bis 10:30 Uhr Pause, die Spätschicht von 18:00 bis 18:30 Uhr. Die Kantine ist ab März auch am Samstag geöffnet, aber nur von 11 bis 14 Uhr. Wer Fragen zum neuen Dienstplan hat, kann sich bei Frau Özdemir melden (Zimmer 112, Telefon 4410). Bitte tragen Sie Ihre Urlaubswünsche für den Sommer bis zum 15. März in die Liste im Büro ein.\n\nViele Grüße\nIhre Pflegedienstleitung',
        questions: [
          { q: 'Wann macht die Spätschicht ab März Pause?', options: ['10:00–10:30 Uhr', '18:00–18:30 Uhr', '11:00–14:00 Uhr'], answer: 1 },
          { q: 'Was ist neu bei der Kantine?', options: ['Sie ist am Samstag geöffnet.', 'Sie schließt am Samstag.', 'Sie ist jetzt den ganzen Tag offen.'], answer: 0 },
          { q: 'Wer hilft bei Fragen zum Dienstplan?', options: ['Die Pflegedienstleitung', 'Frau Özdemir', 'Die Kantine'], answer: 1 },
          { q: 'Bis wann soll man die Urlaubswünsche eintragen?', options: ['Bis zum 1. März', 'Bis zum Sommer', 'Bis zum 15. März'], answer: 2 },
        ],
      },
      {
        kind: 'listening', title: 'Listening: Voicemail',
        text: 'Hallo, hier ist Jonas von der Firma Hartmann Elektrotechnik. Ich rufe wegen Ihrer Bewerbung an. Wir möchten Sie gern zu einem Vorstellungsgespräch einladen. Hätten Sie am Donnerstag um 14 Uhr Zeit? Bitte bringen Sie Ihre Zeugnisse und eine Kopie Ihres Passes mit. Unsere Adresse ist Lindenstraße 22, im zweiten Stock. Rufen Sie mich bitte zurück unter 0221 58 93 40. Vielen Dank und bis bald!',
        questions: [
          { q: 'Warum ruft Jonas an?', options: ['Wegen einer Rechnung', 'Wegen einer Bewerbung', 'Wegen eines Termins beim Arzt'], answer: 1 },
          { q: 'Wann ist das Gespräch?', options: ['Donnerstag, 14 Uhr', 'Dienstag, 14 Uhr', 'Donnerstag, 4 Uhr'], answer: 0 },
          { q: 'Was soll man mitbringen?', options: ['Ein Foto', 'Zeugnisse und eine Passkopie', 'Den Arbeitsvertrag'], answer: 1 },
          { q: 'In welchem Stock ist die Firma?', options: ['Im ersten Stock', 'Im zweiten Stock', 'Im Erdgeschoss'], answer: 1 },
        ],
      },
    ],
  },
  {
    id: 'mock-b1-1', level: 'B1', title: 'B1 practice exam 1', minutes: 35,
    sections: [
      {
        kind: 'reading', title: 'Reading: Article',
        text: 'Immer mehr Pflegekräfte aus dem Ausland arbeiten in Deutschland. Viele Kliniken suchen ihre neuen Mitarbeiterinnen und Mitarbeiter inzwischen direkt in Ländern wie den Philippinen, Indien oder Tunesien. Bevor die Pflegekräfte in Deutschland voll arbeiten dürfen, muss ihre Ausbildung anerkannt werden. Dafür brauchen sie in der Regel Deutschkenntnisse auf dem Niveau B1 oder B2.\n\nDie größte Herausforderung ist für viele nicht die Fachsprache, sondern die Alltagssprache: Dialekte, schnelle Gespräche im Team oder Telefonate mit Angehörigen. „Am Anfang habe ich bei der Übergabe nur die Hälfte verstanden“, erzählt Maria Santos, die seit zwei Jahren in einer Klinik in Stuttgart arbeitet. „Geholfen haben mir die Kolleginnen, die langsam gesprochen und alles erklärt haben.“\n\nExperten empfehlen deshalb, schon vor der Ankunft täglich Deutsch zu üben – besonders das Sprechen. Einige Kliniken bieten außerdem Mentoren an, die den neuen Kolleginnen in den ersten Monaten helfen.',
        questions: [
          { q: 'Was müssen ausländische Pflegekräfte vor der vollen Arbeit in Deutschland machen?', options: ['Eine neue Ausbildung beginnen', 'Ihre Ausbildung anerkennen lassen', 'Ein Jahr Praktikum machen'], answer: 1 },
          { q: 'Was ist laut Text für viele am schwierigsten?', options: ['Die Fachsprache', 'Die Alltagssprache', 'Die Schrift'], answer: 1 },
          { q: 'Was hat Maria Santos geholfen?', options: ['Ein Sprachkurs am Abend', 'Hilfsbereite Kolleginnen', 'Ein Wörterbuch'], answer: 1 },
          { q: 'Was empfehlen Experten?', options: ['Erst in Deutschland Deutsch lernen', 'Vor der Ankunft täglich Deutsch üben', 'Nur Fachsprache lernen'], answer: 1 },
        ],
      },
      {
        kind: 'listening', title: 'Listening: Radio report',
        text: 'Und nun zum Verkehr. Wegen Bauarbeiten ist die S-Bahn-Linie S3 zwischen Hauptbahnhof und Flughafen ab Montag für zwei Wochen gesperrt. Fahrgäste können die Ersatzbusse nehmen, die alle zehn Minuten fahren. Die Fahrt dauert dadurch etwa zwanzig Minuten länger. Wer zum Flughafen muss, sollte also früher losfahren. Für Pendler gibt es eine gute Nachricht: Die Tickets für die S-Bahn gelten auch in den Ersatzbussen. Weitere Informationen finden Sie auf der Internetseite der Verkehrsbetriebe.',
        questions: [
          { q: 'Was passiert ab Montag?', options: ['Die S3 fährt häufiger.', 'Die S3 ist teilweise gesperrt.', 'Der Flughafen schließt.'], answer: 1 },
          { q: 'Wie oft fahren die Ersatzbusse?', options: ['Alle zehn Minuten', 'Alle zwanzig Minuten', 'Jede Stunde'], answer: 0 },
          { q: 'Wie viel länger dauert die Fahrt?', options: ['Etwa zehn Minuten', 'Etwa zwanzig Minuten', 'Etwa zwei Stunden'], answer: 1 },
          { q: 'Was gilt für die Tickets?', options: ['Man braucht ein neues Ticket.', 'Die Tickets gelten auch im Bus.', 'Die Fahrt ist kostenlos.'], answer: 1 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Live class schedule (Berlin time). The operator sets the meeting links.
// ---------------------------------------------------------------------------
export const CLASS_SCHEDULE = [
  { id: 'a1-am', level: 'A1', days: [1, 2, 3, 4, 5], time: '09:00', teacher: 'Frau Weber' },
  { id: 'a1-pm', level: 'A1', days: [1, 2, 3, 4, 5], time: '18:00', teacher: 'Herr Krause' },
  { id: 'a2-am', level: 'A2', days: [1, 2, 3, 4, 5], time: '10:30', teacher: 'Frau Weber' },
  { id: 'a2-pm', level: 'A2', days: [1, 2, 3, 4, 5], time: '19:30', teacher: 'Frau Yildiz' },
  { id: 'b1-am', level: 'B1', days: [1, 2, 3, 4, 5], time: '12:00', teacher: 'Herr Krause' },
  { id: 'b1-pm', level: 'B1', days: [1, 2, 3, 4, 5], time: '20:00', teacher: 'Frau Yildiz' },
  { id: 'b2-pm', level: 'B2', days: [1, 3, 5], time: '17:00', teacher: 'Dr. Lang' },
];

// Activity types used for time tracking and the daily plan.
export const ACTIVITIES = {
  class: 'Live class',
  speak: 'AI speaking',
  vocab: 'Vocabulary',
  lesson: 'Grammar',
  write: 'Writing',
  exam: 'Mock exam',
};

// Build the daily plan from the learner's daily goal (in minutes).
export function dailyPlan(goalMinutes = 180) {
  const base = [
    { type: 'class', minutes: 60 },
    { type: 'speak', minutes: 45 },
    { type: 'vocab', minutes: 30 },
    { type: 'lesson', minutes: 30 },
    { type: 'write', minutes: 15 },
  ];
  const total = base.reduce((s, x) => s + x.minutes, 0);
  const scale = goalMinutes / total;
  return base.map((x) => ({ ...x, minutes: Math.max(10, Math.round((x.minutes * scale) / 5) * 5) }));
}

export function deckById(id) { return DECKS.find((d) => d.id === id); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id); }
export function scenarioById(id) { return SCENARIOS.find((s) => s.id === id); }
export function writingById(id) { return WRITING_TASKS.find((w) => w.id === id); }
export function examById(id) { return EXAMS.find((e) => e.id === id); }
