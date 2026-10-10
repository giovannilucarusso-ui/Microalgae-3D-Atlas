# Distinta anatomica — *Phaeodactylum tricornutum* Bohlin 1897, ceppo di riferimento Pt1 8.6

**Versione 0.3 — 10 ottobre 2026.** *v0.3: **costruito l'esterno** (§7.1): il campo di Pt1 nell'atlante, con il suo controllo; misurati qui lo spessore della parete degli ovali sulle sezioni di [6] e il bordo degli ovali su [35] (§2.3, §2.10).* *v0.1: prima ricerca per la prima diatomea dell'atlante: identità e accessioni, i quattro morfotipi con le loro misure (dalla letteratura e da due micrografie con licenza aperta, misurate qui), la divisione cellulare, il comportamento in un preparato, il colore, l'ultrastruttura dalla ricostruzione FIB-SEM di Pt1 e una proposta di come disegnarla (§7). **v0.2: decisioni del proprietario** (Pt1 8.6, campo di 100 µm, solo l'esterno, linea rossa nell'albero; nessuna foto propria disponibile, §8) e **lettura per intero di Borowitzka & Volcani 1978 [6] e Tesson et al. 2009 [10]**, forniti dal proprietario: parete, bande di silice, vacuoli, varianti di forma, ovali lunghi e tondi, trasformazioni.*

Base scientifica per l'ottavo esemplare dell'atlante (il settimo, *Aurantiochytrium mangrovei*, è entrato il 28/9). Ogni struttura che entrerà nel modello deve avere qui una riga, con fonte e livello di confidenza.

---

## 0. Come leggere questa distinta

| Marcatore | Significato |
|---|---|
| ✅ **SPECIE** | Misurato/osservato su *P. tricornutum*; si dice su quale accessione (Pt1 8.6, Pt3, Pt4, Pt8…) quando la fonte lo dice |
| ⚠️ **MODELLO** | Da altre diatomee (*Thalassiosira pseudonana*, pennate rafidee in generale), dagli stramenopili o dalle alghe con plastidio rosso complesso in generale, oppure ricavato da un modello e non misurato |
| ❓ **VERIFICARE** | Letto solo in un riassunto, in un estratto o in una fonte secondaria, oppure non ancora trovato |

**Misure prese da noi.** Alcuni numeri sono misurati sulle figure aperte (barra di scala → px/µm) o sui dati supplementari. Sono indicati come *misurato qui su [n]*.

**Il punto più interessante, che è anche la trappola.** *P. tricornutum* è la diatomea modello per eccellenza (genoma, trasformazione, CRISPR) ed è anche la meno tipica: esiste in tre forme comuni e una rara, **solo la forma ovale costruisce una valva di silice**, la specie cresce senza silicio, le cellule non rimpiccioliscono generazione dopo generazione e la riproduzione sessuale non è nota. La prima diatomea dell'atlante, quindi, non ha l'aspetto di una diatomea: in una coltura di Pt1 la "scatola di vetro" dei libri di testo manca in quasi tutte le cellule. Disegnarla come una diatomea da manuale sarebbe sbagliato; dirlo è la scheda più interessante che questo esemplare può avere (§1.1).

---

## 1. Carta d'identità

| Campo | Valore | Fonte |
|---|---|---|
| Nome accettato | *Phaeodactylum tricornutum* Bohlin 1897 (WoRMS AphiaID 175584, stato "non valutato") | [33] ✅ |
| Genere | di fatto monotipico; WoRMS elenca anche *P. reichelti* (Voigt) Bohlin 1902, non valutata e senza letteratura moderna | [33] ❓ |
| Protologo | Bohlin 1897, *Öfvers. Kongl. Vetensk.-Akad. Förh.* 9:507–529, p. 520, fig. 9: descritto sulle cellule **triradiate**, considerate lo stadio vegetativo; la forma **fusiforme** e una coppia di cellule sono disegnate come **stadi di divisione** ("Teilungsstadien") | [1] ✅ (tavola letta; citazione da [6][10]) |
| Prime colture | la forma fusiforme fu isolata da Allen & Nelson 1910 a Plymouth come "*Nitzschia closterium* forma *minutissima*"; la coltura di Plymouth è all'origine delle accessioni Pt2/Pt3 | [2] via [10] ✅; [28] |
| Le quattro forme | descritte da Wilson 1946 (ovale, fusiforme, triradiata, cruciforme) | [3] via [13] ❓ |
| Riconosciuta come diatomea | Hendey 1954 la escluse dalle diatomee perché la parete non ha silice; Lewin 1958 la riportò tra le Bacillariophyceae dopo aver visto un **rafe silicizzato nella forma ovale** | [10] ✅ (Lewin [5] non letto) |
| Posizione | unico rappresentante del sottordine Phaeodactylineae, famiglia Phaeodactylaceae; pennata rafidea, ma solo l'ovale ha il rafe | [10] ✅ |
| Classificazione (WoRMS) | Chromista › Heterokontophyta › Bacillariophytina › Bacillariophyceae › Bacillariophycidae › Bacillariophycanae › Naviculales › Phaeodactylineae › Phaeodactylaceae › *Phaeodactylum* | [33] ✅ |
| Nell'atlante | nodo **Bacillariophyta**, già presente come posto vuoto sotto SAR in `src/tree.js`; freccia di endosimbiosi da decidere (§8) | — |
| **Ceppo di riferimento proposto** | **Pt1 8.6** = CCAP 1055/1 = CCMP2561 ("PtGen"): clone isolato nel 2003 da De Martino e Ten-Hage dalla coltura Pt1 (CCMP632 = CCAP 1055/3), a sua volta isolata da Coughlan intorno al 1956 in un estuario inquinato al largo di Blackpool (Inghilterra) | [34] ✅ |
| Perché Pt1 8.6 | è il ceppo del genoma [30][32], quello della ricostruzione FIB-SEM [18] e della divisione cellulare [21], ed è in maggioranza fusiforme | ✅ |
| Genoma | pennate e centriche divergono da ~90 milioni di anni; ~40 % dei geni non condivisi con *T. pseudonana*; più di 300 geni di origine batterica condivisi dalle due diatomee [30]; annotazione Phatr3: 12 233 modelli genici [31]; assemblaggio telomero-telomero: **25 cromosomi nucleari** (non i 33 proposti nel 2008), più il genoma del plastidio e del mitocondrio [32] | ✅ |
| Dimensione del genoma | ~27 Mb | ❓ (non verificato in questo passaggio) |
| Ploidia | diploide | [32] ✅ |
| Riproduzione | vegetativa; la frustola non rimpicciolisce con le divisioni, quindi la coltura non ha bisogno del ciclo sessuale; riproduzione sessuale non dimostrata | ❓ (fonte secondaria) |
| Morfotipi e generazioni | le tre forme hanno lo stesso contenuto di DNA: non sono un'alternanza di generazioni aploide e diploide, né l'ovale è una spora di resistenza | [6][10] ✅ |
| Ecologia | acque costiere: zone di marea, estuari, pozze di scogliera, acque basse, con forti variazioni di luce e salinità | [29] ✅ |
| Distribuzione delle accessioni | 10 ceppi da 9 località (litorali, estuari, pozze di scogliera, canali di marea) dalle latitudini subpolari ai tropici, raccolti tra il 1908 e il 2000; altri 7 raccolti fino al 2016 | [28][29] ✅ |
| Un'accessione vicina | **Pt14, Golfo di Salerno**: le cellule più corte delle 17 accessioni (10–15 µm) | [29] ✅ |
| Interesse | EPA e fucoxantina; organismo modello per anticorpi ricombinanti e biologia sintetica [14][32]. **Unione europea:** nel 2023 l'EFSA non ha potuto concludere sulla sicurezza di un estratto etanolico della biomassa (processo non dimostrato costante, composizione incompleta) [40]; a inizio 2025 la specie non risultava autorizzata come novel food [41] | ✅ / ❓ da riverificare sulla Union list prima di scriverlo in una scheda |

### 1.1 È davvero una diatomea?

- **Una diatomea è una cellula in una scatola di vetro**: due valve di silice e le bande del cingolo. In *P. tricornutum* questo vale solo in parte e solo per una forma.
- **La frustola è soprattutto organica in tutte le forme.** La valva dei fusiformi, dei triradiati e di alcuni ovali è interamente organica, salvo **0–10 bande di silice** incastonate nella parete della regione del cingolo: bastoncelli larghi 13 nm (27–34 nm con il rivestimento organico), di solito solo sull'epiteca, a volte anche sull'ipoteca delle cellule vecchie; con la crescita la parete li ricopre quasi del tutto [6] ✅.
- **La parete ha tre strati.** Fuori uno strato corrugato di creste parallele, a gruppi di due-cinque (papille alte 6–10 nm, distanti 13–17 nm), che manca nel cingolo; dentro uno strato di fibrille in una matrice amorfa; tra i due uno strato meno opaco [6][10] ✅. Il componente principale è un glucuronomannano solfatato [6] ✅. Al microscopio a forza atomica le valve silicizzate degli ovali sono le più resistenti [11] via [10] ✅.
- **Solo l'ovale può avere silice nella valva.** La parte silicea è una valva naviculoide molto ridotta, con il rafe al centro, formata in una vescicola di deposizione sotto la membrana al centro della cellula: prima il rafe, poi le parti laterali [6] ✅. Quattro tipi di frustola: entrambe le valve organiche, oppure parzialmente silicee l'ipovalva, l'epivalva o entrambe [6] ✅. Il grado di silicificazione va dal solo rafe a una valva intera; di solito l'ovale tiene solo il rafe nuovo, nell'ipoteca [10] ✅. È la forma "da diatomea": bentonica, con rafe [15][14][10].
- **La specie cresce senza silicio.** Si divide senza silice aggiunta [10] ✅; Pt1 8.6 si coltiva normalmente in f/2 **senza silicato** [21] ✅; variare il silicato non cambia la forma [6] ✅.
- **Per l'atlante:** la prima diatomea non sembra una diatomea, e la scheda deve dirlo. È la tesi dell'atlante applicata a un caso reale: mostrare quello che si sa, anche quando smentisce l'immagine da manuale.

### 1.2 Accessioni e morfotipi

| Accessione | Codici | Origine | Morfotipo prevalente | Fonte |
|---|---|---|---|---|
| **Pt1** | CCMP632 = CCAP 1055/3; clone **Pt1 8.6** = CCAP 1055/1 = CCMP2561 | estuario, Blackpool (UK), ~1956 | fusiforme 95–100 % (Pt1 8.6F: 80 % a 19 °C) | [8][9] via [13]; [34] |
| Pt2 | CCAP 1052/1A | Plymouth (UK), coltura del 1908–1910 | fusiforme 95–100 % | [8] via [13]; [28] |
| **Pt3** | CCAP 1052/1B | sottoclone di Pt2 a Plymouth | **ovale**: forma di stress, tollera la bassa salinità (Pt3O: 60 % ovali) | [8][9] via [13]; [15] |
| Pt4 | CCAP 1052/6 | alte latitudini: Segelskär (Baltico) secondo [43], "fiordi norvegesi" secondo [29] | fusiforme 95–100 % | [8] via [13] ❓ origine |
| Pt5 | CCMP630 | Golfo del Maine | fusiforme; le cellule più lunghe (25–30 µm) | [43] ❓; [29] |
| Pt6 | CCMP631 | Woods Hole (USA) | fusiforme | [43] ❓; [8] via [13] |
| Pt7 | CCMP1327 | Long Island (USA) | fusiforme | [43] ❓; [8] via [13] |
| **Pt8** | NEPCC 640 | vicino a Vancouver (Canada) | **triradiato** 80–85 %, instabile (non visto nel 2024) | [8] via [13]; [29] |
| Pt9 | CCMP633 | Guam (Micronesia) | ovale 60–75 % a 15–19 °C, fusiforme 80–95 % a 25–28 °C | [8] via [13] |
| Pt10 | MACC B228 | Dalian, Mar Giallo, 2000 | fusiforme 95–100 % | [8] via [13]; [28] |
| Pt11–Pt17 | — | Hong Kong; baia di Bourneuf (Francia, due); **Golfo di Salerno (Pt14)**; Mar Cinese Orientale; Helgoland; Banyuls | Pt16: 75 % fusiforme, 25 % triradiato; ovali nel 7 % di Pt3 e Pt9 | [29] ✅ |

- La forma non dipende dal genotipo ma dall'ambiente: ogni accessione può passare da un morfotipo all'altro [8] via [15] ❓.
- **Con Pt1 8.6 come riferimento la vista è una coltura di fusiformi**, con pochi ovali e qualche triradiato. Le altre forme si mostrano con un interruttore (§5, §7).

---

## 2. LIVELLO 1 — Al microscopio ottico (scala 1–35 µm)

### 2.1 La cellula fusiforme (la forma di Pt1)

| Dato | Valore | Fonte |
|---|---|---|
| Forma | un fuso: un corpo centrale con il plastidio e due bracci ialini quasi tubolari, che si assottigliano poco e finiscono arrotondati | [14][18] ✅; misurato qui su [35] |
| Due varianti stabili | **dritta** ("normale") o **curva** ("lunata"); entrambe si mantengono in coltura | [6] ✅ |
| Lunghezza e larghezza, Pt1 in campo chiaro (2500–8000 cellule per campione, 19 °C, f/2) | **22,6–23,5 × 3,5–4 µm**; Pt4 27,7–28,6 × 4–4,4 µm | [26] ✅ |
| Lunghezza, Pt1 8.6 nella ricostruzione FIB-SEM | 13–15 µm | [18] ✅ |
| Estremi nella specie | fino a 35 µm; Pt5 25–30 µm; Pt14 10–15 µm | [4] ❓; [29] ✅ |
| Volume, Pt1 FIB-SEM (3 cellule, luce bassa) | **32,6 ± 2,4 µm³**; superficie 109 ± 16 µm² | [18] ✅ |
| Volume stimato come sferoide prolato dalle misure al microscopio | 158–199 µm³ (Pt1), 258–300 (Pt4). È una sovrastima: per una cellula di 14 µm larga 3–3,5 µm, come quelle della FIB-SEM, lo stesso modello darebbe 66–90 µm³, due o tre volte i 32,6 misurati, perché riempie i bracci sottili. Il disegno deve tornare con il volume FIB-SEM, non con questo | [26] ✅; calcolato qui |
| Bracci | ~0,9–1,0 µm di diametro a metà braccio, punta arrotondata, a volte un puntino rifrangente in punta; pieni di vacuoli | misurato qui su [35]; [6][14] ✅ |
| Parte pigmentata | ~7 µm in una cellula di 17 µm (~40 %), larga 2,4–3,0 µm [35]; circa il terzo centrale nelle immagini confocali di Pt3 [14]; ~60 % della lunghezza in Pt1 8.6 (FIB-SEM, stimato a occhio sulla fig. 3a) [18] | misurato qui / ✅ |
| Plastidio | uno solo, centrale, allungato, sul lato dell'epivalva, fino a poco prima della divisione | [6][14][18] ✅ |
| Nucleo | centrale, arrotondato, accanto al plastidio; il suo involucro è parte del reticolo che avvolge il plastidio; 2,0 µm³ (sfera equivalente di ~1,6 µm) | [6][14][18] ✅ |
| Golgi | da uno a quattro, sempre a contatto con l'involucro nucleare | [6][14] ✅ |
| Mitocondri | allungati e ramificati, lungo il plastidio, fino alle due punte; sotto il limite di risoluzione | [21][14][18] ✅ |
| Vacuoli | **diversi vacuoli grandi occupano le estremità** e riempiono il volume in più dei bracci; in crescita esponenziale hanno solo uno strato periferico granulare; in fase stazionaria contengono materiale scuro con spazi chiari (probabilmente polifosfato) e a volte lipidi | [6] ✅; [14] ✅ |
| Gocce lipidiche, coltura ricca di nutrienti | 3–4 per cellula, ~0,09 µm³ l'una (diametro ~0,56 µm), vicino al plastidio e nei bracci | [26][14] ✅ |
| Corpo rifrangente bluastro accanto al plastidio | ~0,7 µm; probabilmente una goccia lipidica | misurato qui su [35] ❓ |
| Mucillagine | assente nei fusiformi (la capsula c'è solo negli ovali) | [4] ❓ (estratto); [6] ✅ per gli ovali |
| Superficie in 3D | la superficie FIB-SEM di Pt1 mostra una **cucitura longitudinale** lungo tutta la cellula, che gli autori chiamano "rafe"; per le altre fonti i fusiformi un rafe non lo hanno [13][15]. Probabilmente è la regione del cingolo | [18] ✅ immagine; ❓ interpretazione |
| Motilità | nessuna: niente flagelli, niente rafe | [6][10][13][15] ✅ |
| Velocità di crescita | indipendente dal morfotipo; una coltura mista cresce allo stesso modo tra il 15 e il 100 % di acqua di mare | [6] ✅ |

### 2.2 La cellula triradiata

| Dato | Valore | Fonte |
|---|---|---|
| Forma | tre bracci nello stesso piano, a ~120° (misurati 117°, 117°, 126°); corpo centrale triangolare | misurato qui su [35]; [14] ✅ |
| Bracci | 6,9 / 8,0 / 7,1 µm dal centro; da punta a punta 11,9–13,3 µm; ~1 µm di diametro | misurato qui su [35] |
| Plastidio | al centro, si allunga nella prima parte dei tre bracci | [14] ✅ |
| Gocce lipidiche | più grandi e numerose che negli ovali; le più grandi nei bracci | [14] ✅ |
| Dove si trova | Pt8 (NEPCC 640): 80–85 %, instabile; colture di Pt3 arricchite al 77 %; favorito da condizioni alcaline | [8] via [13]; [15]; [29] |
| Varianti | di solito tre bracci uguali, ma la lunghezza varia molto tra i cloni ("a bracci lunghi" e "a bracci corti"); la variante più frequente ha **due bracci più corti vicini a un'estremità**; in tutte le colture compare anche una forma a due bracci "a boomerang" | [6] ✅ |
| Stabilità | bassa: con i trapianti i triradiati diventano fusiformi o ovali; il passaggio a fusiforme passa per forme asimmetriche con un braccio più corto | [10] ✅ |

### 2.3 La cellula ovale

| Dato | Valore | Fonte |
|---|---|---|
| Forma | ellissoide con una parete ialina spessa, ben visibile come bordo chiaro; il plastidio ne occupa gran parte | [14] ✅; misurato qui su [35] |
| Dimensioni | ~8 × 3 µm; 5,4–7,7 × 2,8–3,2 µm su [35] | [4] ❓; misurato qui |
| Silice | una valva silicizzata con rafe, oppure parete solo organica; è l'unico morfotipo con silicio | [5][6][11] ❓ |
| Spessore della parete | **30–45 nm** nelle due sezioni trasversali di [6] (figg. 15–16, misurate qui contro le barre di 0,1 µm), con creste di pochi nm in superficie. Il "bordo ialino spesso" del microscopio ottico non è lo spessore della parete, molto sotto la risoluzione, ma il suo bordo come lo disegna l'obiettivo (§2.10) | [6] ✅; misurato qui |
| Come si posa | aderisce con ciò che secerne dal rafe [10], di solito solo nell'ipoteca [10]; il plastidio sta dal lato dell'epivalva [6]: **posato sul vetro, mostra il plastidio di faccia**, che ne riempie il contorno, come gli ovali di [35]. È una deduzione, non un'osservazione diretta | [6][10] ✅ / ⚠️ |
| Formazione della valva | la silicificazione parte da una struttura "a pi greco" che posiziona uno sterno; crescita non uniforme ma riproducibile | [12] ❓ (riassunto) |
| Mucillagine | capsula solubile in acqua calda, 16 % del peso secco [4] ❓; gli ovali fermi sono spesso immersi in materiale fibrillare extracellulare (mucillagine) [6] ✅; secernono sostanze polimeriche dal rafe, che servono ad aderire e a formare colonie [10] ✅ | |
| Ovali lunghi e tondi | **lunghi e sottili** in buone condizioni (la forma più comune in laboratorio, anche in Pt1); **tondi** in condizioni sfavorevoli, raggruppati nella mucillagine e attaccati alle pareti del recipiente | [10] ✅ |
| Adesione | aderisce al vetro e al PDMS; i fusiformi no | [17] via [13] ✅ |
| Stile di vita | bentonico, con rafe | [15][14] ✅ |
| Movimento | la valva silicea "può conferire mobilità" (Iwasa et al. 1971; Iwasa & Shimizu 1972): **velocità non trovata** | [6][14] ✅ / ❓ |
| Quando prevale | terreni impoveriti (in tutti i ceppi), terreni solidi (agar), temperatura sub-ottimale; è l'unica forma che sopravvive a poca luce e a lunga carenza di nutrienti. La salinità non è un fattore generale: conta solo per Pt2/Pt3 (Pt3 in acqua di mare al 10 %: 98 % ovali) | [10] ✅; [15] |
| Origine | il protoplasto si ritira dalle punte dei bracci (grazie ai vacuoli) verso il centro del fusiforme gonfio; lì si forma il primo ovale, con due mitosi senza citocinesi; si divide dentro la parete madre e le figlie escono quando questa si rompe lungo il cingolo, orientate parallele ai bracci; illustrato su Pt1 8.6 | [10] ✅; [13] ✅; [4] ❓ |
| Secrezione | l'ovale rilascia oltre l'80 % delle proteine nei primi 4 giorni, il triradiato il 38 % | [14] ✅ |

### 2.4 La cellula cruciforme (rara)

- Quattro bracci da un corpo quadrato. Descritta da Wilson nel 1946 e poi quasi mai [3][13]. Borowitzka & Volcani la ritengono forse una coppia di triradiati non ancora separati [6] ✅.
- Nel ceppo CCMM 2004 (Istituto di Oceanologia, Accademia Cinese delle Scienze) in terreno L1 diventa la forma principale: **fino al 55 % a 10 °C**, 39 % a 25 °C; dopo tre mesi la coltura si stabilizza su 10,5 % ovali, 11,3 % fusiformi, 37,2 % triradiati, 41,0 % cruciformi [13] ✅.
- Perde i bracci e diventa ovale, uno alla volta o tutti insieme [13] ✅.

### 2.5 Trasformazioni tra le forme

| Dato | Valore | Fonte |
|---|---|---|
| Quattro stadi verso l'ovale | 1, cellula sottile e povera di contenuto; 2, cellula piena; 3, il contorno cambia; 4, i bracci si riducono e spariscono | [13] ✅ (figure in campo chiaro, barre di 10 µm) |
| Mappa delle trasformazioni | sei vie note prima del 2014, più cruciforme → ovale | [13] ✅ |
| Temperatura | Pt1 8.6F: più ovali passando da 19 a 15 °C; CCMP633: ovali a 15–19 °C, fusiformi a 25–28 °C | [9][8] via [13] |
| Trascrittomi | fusiforme e triradiato differiscono per l'1 % dei geni; ovale contro fusiforme il 22 %, ovale contro triradiato il 29 % | [16] via [14] ❓ |

### 2.6 La divisione cellulare (Pt1 8.6, colture sincronizzate)

| Tempo dall'accensione della luce | Evento | Fonte |
|---|---|---|
| — | tempo di duplicazione 1–1,5 giorni in coltura liquida | [21] ✅ |
| ~4 h | inizia la sintesi del DNA | [21] ✅ |
| subito dopo | **il plastidio si divide per strozzatura al centro**: è il primo evento visibile | [21] ✅ |
| 8–10 h | i solchi di divisione partono **dalle due punte** della cellula e avanzano verso il centro, pieni di vescicole | [21] ✅ |
| poi | il Golgi si duplica e si dispone ai due lati del nucleo; il nucleo viene **tagliato dal solco** (nessun fuso mitotico osservato); un anello di actina si stringe con il solco | [21] ✅ |
| ~12 h, fine del giorno | i solchi si fondono: due cellule figlie, una accanto all'altra, ciascuna con un nucleo, un Golgi e metà dei mitocondri | [21] ✅ |

- La divisione è uguale in tutte le forme e la figlia ha la stessa forma della madre [6] ✅. La membrana si invagina dalle regioni del cingolo verso l'interno, cominciando **dalle estremità dei bracci**; senza microtubuli; il solco taglia i mitocondri che passano da una metà all'altra, ed è così che si dividono [6] ✅. Lo spazio tra le due figlie è pieno di fibrille sottili [6] ✅.
- La divisione è longitudinale: le figlie giacciono affiancate per il lungo. Bohlin nel 1897 disegnò proprio un fusiforme e una coppia di cellule come "stadi di divisione" [1] ✅.
- Un clone forma catene perché le pareti delle figlie si fondono nella regione centrale durante la loro deposizione [7] ❓ (riassunto).
- Le cellule non rimpiccioliscono: niente auxospore da disegnare (§1).

### 2.7 Galleggiamento, sedimentazione, adesione

| Dato | Valore | Fonte |
|---|---|---|
| Velocità di sedimentazione, coltura ricca di fosfato | **−0,06 ± 0,13 m/giorno**: in pratica non sedimenta | [27] ✅ |
| Con poco fosfato / senza fosfato | 0,58 ± 0,10 / 0,79 ± 0,03 m/giorno; correlata al contenuto lipidico (R = 0,91) | [27] ✅ |
| Coltura di [27] | fusiformi e triradiati codominanti; ceppo non indicato | [27] ✅ |
| Ovali | bentonici, aderiscono al vetro | [17][15] ✅ |
| Perché i fusiformi galleggiano | i grandi vacuoli periferici dei bracci rendono fusiformi e triradiati più leggeri degli ovali: forme da plancton | [10] ✅ |
| **Conseguenza per un vetrino** | in un preparato fresco di una coltura sana i fusiformi restano sospesi a tutte le profondità dell'intercapedine: a ogni piano di fuoco quasi tutti sono sfocati, come nella foto di Monteil (§2.11). Una coltura affamata di fosfato attraverserebbe 30 µm in pochi secondi (0,79 m/giorno ≈ 9 µm/s). Gli ovali stanno sul vetro | derivato da [27][17] |

Il contrario di *Chlorella*, che nell'atlante si posa sul vetrino: qui la biologia dice di non farlo.

### 2.8 Colore e pigmenti

| Dato | Valore | Fonte |
|---|---|---|
| Pigmenti | clorofilla *a*, clorofille *c*, **fucoxantina** nelle proteine FCP; 42 geni di antenne LHC | [14] ✅ |
| Autofluorescenza | eccitazione a 490, 555 e 620 nm; emissione a 685 nm, con una spalla a 720 nm negli ovali e nei triradiati | [14] ✅ |
| Plastidio su [35] (rapporto sul fondo, R G B) | nel punto più denso **0,53 / 0,68 / 0,33**; zone più sottili 0,70–0,80 / 0,85–0,89 / 0,75–0,82: verde oliva; fondo (162, 171, 166) | misurato qui |
| Cellule su [36] | centri pigmentati 1,00 / 0,92 / 0,26 (mediana): giallo oro; fondo (219, 216, 154), bilanciamento del bianco molto giallo | misurato qui |
| Le due foto non concordano | [35] mette il verde sopra il rosso, [36] il rosso sopra il verde; entrambe dicono che il blu è assorbito forte. È lo stesso caso di *Chlorella* sulle tavole CAUP: il rapporto tra i canali di una foto misura anche il suo bilanciamento del bianco | misurato qui |
| Regola dell'atlante | **la luminanza dalle foto, la tinta dallo spettro del pigmento** | `src/species/chlorella.js` |
| Spettro da usare | spettri di assorbimento di sospensioni di *P. tricornutum* SAG 1090-1b [42] (CC BY), oppure i rapporti tra pigmenti con i coefficienti specifici in vivo | ❓ da fare |
| Atteso dai pigmenti | la fucoxantina in vivo assorbe tra ~460 e ~570 nm e toglie una parte del canale verde; la clorofilla *a* a 675 nm toglie il rosso; il blu è il più assorbito. In uno strato sottile il plastidio è oliva-giallo, in uno spesso bruno dorato | ⚠️ |
| Confronto interno all'atlante | il plastidio di *Braarudosphaera* (pigmenti dello stesso tipo, misurato sul filmato): 0,96 / 0,91 / 0,67 per µm | `src/species/braarudosphaera-bigelowii.js` |

### 2.9 Indici di rifrazione

| Dato | Valore | Fonte |
|---|---|---|
| Cellula intera, relativo all'acqua di mare | 1,04 (da un modello di diffusione su colture, non misurato sulla cellula), cioè n ≈ 1,39 | [38] ⚠️ |
| Componenti (olotomografia su fitoplancton) | indice del cloroplasto simile in tutti i gruppi; citosol vicino all'acqua di mare | [39] ❓ (riassunto) |
| Costanti già nell'atlante | mezzo 1,335; citoplasma 1,36; plastidio 1,415 (`EuglenaField.jsx`) | — |
| Controllo | con le frazioni di volume FIB-SEM (plastidio 34 %, nucleo 6 %, mitocondri 4 %, resto 56 %) le costanti dell'atlante danno ~1,38: in accordo con 1,39 | calcolato qui |
| Bracci | quasi vuoti otticamente: su [35] l'interno del braccio è a 0,98–1,00 del fondo e i bordi a 0,93–0,95. Il braccio si vede per la parete e per l'alone, non per quello che contiene | misurato qui |
| Gocce lipidiche | > 1,46 | r91 ⚠️ |

### 2.10 La micrografia di Gruber (Commons, CC BY 4.0) [35]

Tre forme della stessa specie in un'unica tavola: ovali in alto a sinistra (riquadro), triradiato in alto a destra, fusiforme in basso. Campo chiaro ad alto ingrandimento, ceppo non indicato (Università di Konstanz). In `docs/fonti/commons-gruber2008-morphotypes.jpg`.

**Scala.** La barra di 10 µm misura 454 px: **45,4 px/µm**.

| | misurato qui |
|---|---|
| fusiforme | da punta a punta 16,5 µm in linea retta (~17 µm lungo l'arco); parte pigmentata ~7 × 2,4–3,0 µm; bracci ~0,9–1,0 µm |
| profilo attraverso un braccio | interno 0,98–1,00 del fondo, bordi 0,93–0,95, alone chiaro fuori fino a 1,08–1,11 nel rosso |
| profilo attraverso il corpo | alone chiaro sopra (1,3 nel rosso), plastidio 0,53 / 0,68 / 0,33 al massimo, zona chiara (vacuolo?) 0,86 / 0,97 / 0,82 |
| triradiato | bracci di 6,9 / 8,0 / 7,1 µm dal centro, a 117°, 117°, 126° |
| ovali (4) | 5,4–7,7 × 2,8–3,2 µm, con un bordo ialino spesso |
| profilo attraverso il bordo di un ovale | verso l'esterno: dentro la parete il rosso cala (0,93–0,96; verde e blu ~1,0: bordo freddo), poi una **linea scura a 0,85 nel verde** (rosso 0,82, blu 0,79 appena fuori), poi un alone caldo (rosso 1,09, verde 1,02, blu 0,95–0,97), largo ~0,4 µm |

- Il fusiforme di questa tavola ha bracci tubolari netti e un corpo corto; quello della ricostruzione FIB-SEM [18] si assottiglia in modo più graduale. Le due forme esistono: il disegno dovrà variare il profilo tra le cellule.
- Le frange colorate dell'alone sono in parte dell'obiettivo: non vanno copiate (la regola dello strumento unico, decisa il 27/9 per *Aurantiochytrium*).

### 2.11 Il campo di Pt1 di Monteil (Commons, CC BY-SA 4.0) [36]

Foto del campo intero di una coltura di Pt1 (2022), 4032 × 3040 px, senza barra di scala. In `docs/fonti/commons-monteil2022-pt1-field.jpg`.

| | misurato qui |
|---|---|
| fondo | (219, 216, 154): bilanciamento del bianco molto giallo |
| oggetti pigmentati segmentati | 122 abbastanza a fuoco, più molti sfocati |
| lunghezza della parte pigmentata | mediana 183 px (10°–90° percentile 114–244 px) |
| scala stimata | se un Pt1 è lungo ~23 µm [26] e la parte pigmentata ne è ~40 %, ~19 px/µm: campo di ~210 × 160 µm, cioè un obiettivo 40× |
| ovali | due o tre nel campo |
| profondità | cellule a fuoco e sfocate mescolate in tutto il campo: le cellule sono sospese a profondità diverse (§2.7) |

- Il giallo intenso è in parte il bilanciamento del bianco e la nitidezza artificiale del telefono; le frange viola su un lato delle cellule sono dell'obiettivo. Si prendono da questa foto la densità, l'orientamento e la distribuzione in profondità, non il colore.

---

## 3. LIVELLO 2 — Ultrastruttura (fase 2)

Al contrario di *Aurantiochytrium*, **per questa specie esiste una ricostruzione tridimensionale della cellula intera**: FIB-SEM su cellule di Pt1 crio-fissate, tre cellule per condizione, con i volumi in un foglio di dati supplementari [18]. Gli stack grezzi sono pubblici (BioStudies S-BSST575). Un interno di *Phaeodactylum* potrebbe quindi poggiare su geometria segmentata, non su sezioni TEM isolate.

| Struttura | Dato | Fonte |
|---|---|---|
| Cellula | 32,6 ± 2,4 µm³ a luce bassa (40 µmol fotoni m⁻² s⁻¹); 27,4 ± 6,5 µm³ a luce alta (350) | [18] ✅ |
| Plastidio | 10,97 ± 0,27 µm³ = **33,7 ± 1,8 %** della cellula (luce bassa); 7,05 ± 3,17 µm³ = 24,7 ± 6,7 % (luce alta); superficie 45,5 ± 4,0 µm²; allungato | [18] ✅ |
| Pirenoide | uno solo, interno, delimitato da membrana, con matrice granulare più densa dello stroma; lo attraversano **due tilacoidi appena accostati**, che al centro si separano di 6–7 nm, con il lume gonfio (da 2 a 6 nm) e pieno di materiale opaco [6]. 0,77 ± 0,13 µm³ = **7,1 ± 1,2 % del plastidio** (luce bassa), 13,2 ± 2,5 % (luce alta); rapporto superficie/volume 20,6 ± 6 [18] | [6][18] ✅ |
| Guscio del pirenoide (PyShell) | un guscio proteico avvolge il pirenoide delle diatomee; senza di esso il pirenoide si deforma e la crescita in aria rallenta | [23] ⚠️ / ❓ (riassunto; tomografie su *T. pseudonana*) |
| Tilacoidi | pile lasche di tre tilacoidi (a volte due o quattro), collegate tra loro; plastoglobuli; fotosistemi separati tra membrane periferiche e centrali della pila | [19] ✅ |
| Involucro del plastidio | quattro membrane; la più esterna è continua con l'involucro nucleare; compartimento periplastidiale tra la seconda e la terza | [18][14] ✅; [20] ❓ (non letto) |
| Mitocondri | uno o più, a volte molto grandi e ramificati [6]; 1,27 ± 0,15 µm³ = 3,9 ± 0,2 % (luce bassa), 6,6 ± 0,7 % (luce alta); superficie 26,1 ± 3,8 µm²; creste 11,6 ± 2,8 % del volume mitocondriale; rete allungata e ramificata fino alle punte | [6][18][21] ✅ |
| Membrana plasmatica | densamente coperta di particelle di ~8 nm (1000 per µm²); tonoplasto quasi liscio ma molto rugoso | [6] ✅ |
| Contatti plastidio–mitocondrio | **7,1 ± 1,1 %** della superficie del plastidio entro 30 nm, 15,7 ± 0,3 % entro 90 nm (gli altri sei organismi: 0,1–1,8 %); aumentano di ~36 % e ~25 % a luce alta | [18] ✅ |
| Accoppiamento energetico | il dialogo tra plastidio e mitocondrio sostiene la fissazione del carbonio nelle diatomee | [22] ❓ (citato da [14][18]) |
| Nucleo | 2,01 ± 0,16 µm³ = 6,2 ± 0,7 %; superficie 14,4 µm²; tondo, accanto al plastidio | [18][14] ✅ |
| Golgi | vicino al nucleo; si duplica prima della divisione | [14][21] ✅ |
| Resto (citosol, vacuoli, reticolo, vescicole, gocce) | 18,4 µm³ = 56 % | [18] ✅ |
| Gocce lipidiche, Pt1 in carenza di azoto | da 3,6 gocce e 0,32 µm³ per cellula (giorno 0) a 7,0 gocce e **6,15 µm³** (giorno 11); la goccia media da 0,09 a 0,88 µm³; Pt4 arriva a 8,7 µm³ concentrati in due gocce grandi; dopo la riaggiunta di azoto tornano ai valori iniziali in 72 h | [26] ✅ |
| Gocce lipidiche, architettura | sottopopolazioni successive; a contatto con il plastidio | [25][24] ❓ |

---

## 4. Cosa NON deve esserci nel modello

- Una frustola da manuale (due valve di silice ornate di strie e areole) sui fusiformi e sui triradiati; un rafe sui fusiformi e sui triradiati (con l'avvertenza della cucitura FIB-SEM, §2.1).
- Più plastidi per cellula (tranne una cellula in divisione, con il plastidio strozzato in due); un plastidio verde come quello di *Chlorella*.
- Flagelli; colonie; catene (salvo il clone particolare di [7]).
- Auxospore, cellule che rimpiccioliscono, ciclo sessuale.
- Uno strato di fusiformi posati sul vetrino: in una coltura sana restano sospesi (§2.7). Gli ovali invece sì, sul vetro.
- Fusiformi che scivolano o nuotano. Ovali che scivolano finché non si trova una velocità misurata.
- Una capsula di mucillagine intorno ai fusiformi.
- Bande del cingolo vere e proprie, o silice nella valva dei fusiformi: le loro sole parti silicee sono bande di 13 nm, invisibili al microscopio ottico.
- I difetti delle foto di riferimento: frange colorate dell'obiettivo, nitidezza del telefono, bilanciamento del bianco giallo.

---

## 5. Stati dinamici (per i controlli del modello)

| Variabile | Effetto | Fonte |
|---|---|---|
| Ceppo e condizioni | Pt1: fusiformi; Pt3 in acqua di mare al 10 %: 98 % ovali; Pt8: triradiati (instabili); CCMM 2004 a 10–15 °C: cruciformi | [8][13][15] |
| Temperatura | più ovali a 15 °C che a 19–28 °C (Pt1 8.6F, CCMP633); più cruciformi a 10 °C (CCMM 2004) | [9][8][13] |
| Salinità | ovali a bassa salinità; Pt3 tollera le variazioni di salinità e si coltiva in acqua di mare al 10 % | [15][29] |
| Carbonio inorganico, pH | triradiati in condizioni alcaline | [15] ❓ (tramite citazione) |
| Azoto | in carenza le gocce lipidiche crescono (fino a ~6 µm³ per cellula in Pt1, giorno 11), i tilacoidi si riducono, la cellula si accorcia un poco | [26] ✅ |
| Fosfato | in carenza le cellule affondano (fino a 0,79 m/giorno) | [27] ✅ |
| Luce | a luce alta plastidio più piccolo, più mitocondri, pirenoide relativamente più grande, più contatti | [18] ✅ (solo interno) |
| Ora del giorno | plastidi in divisione dal mattino, cellule figlie a fine giornata | [21] ✅ |

---

## 6. Riferimenti visivi e licenze

| Riferimento | Che cosa mostra | Licenza | Uso |
|---|---|---|---|
| [35] Gruber 2008, Wikimedia Commons | ovale, triradiato e fusiforme ad alto ingrandimento, barra di 10 µm | **CC BY 4.0** | **riferimento principale per le forme e il plastidio**; in `docs/fonti/` |
| [36] Monteil 2022, Wikimedia Commons | campo di una coltura di Pt1 | **CC BY-SA 4.0** | riferimento per densità, orientamento e profondità; in `docs/fonti/`; un adattamento di questa immagine porterebbe la stessa licenza |
| [1] Bohlin 1897, fig. 9 | la tavola del protologo | pubblico dominio | scheda storica; in `docs/fonti/` |
| [18] Uwizeye et al. 2021, figg. 1, 3, 5 | superfici e organelli ricostruiti in 3D (Pt1), pirenoide | **CC BY 4.0** | riferimento per l'interno; in `docs/fonti/` |
| [14] Galas et al. 2021, figg. 1–2 | TEM dei tre morfotipi; plastidio in autofluorescenza sovrapposto alla luce trasmessa | **CC BY 4.0** | posizione di plastidio, nucleo, vacuoli; in `docs/fonti/` |
| [13] He et al. 2014, fig. 2 | i quattro stadi della trasformazione in ovale per cruciformi, triradiati e fusiformi, barre di 10 µm | **CC BY 4.0** | per un controllo dei morfotipi; in `docs/fonti/` |
| [19] Flori et al. 2017, fig. 5 | rete dei tilacoidi in 3D (FIB-SEM) | CC BY 4.0 | interno, consultata |
| [21] Tanaka et al. 2015 | divisione cellulare in TEM e in fluorescenza | CC BY-NC-ND 4.0 | solo consultazione |
| [37] Bradbury 2004 | micrografia di De Martino e Bowler | CC BY 2.5 | non scaricata (limite di richieste di Commons) |

---

## 7. Proposta di rappresentazione (v0.1)

1. **Specie e ceppo:** *P. tricornutum* Pt1 8.6; `id: 'phaeodactylum-tricornutum'`. Livelli: `species: 'Measured in Phaeodactylum tricornutum'`, `model: 'From other diatoms'`. Una scheda "Quale ceppo?" racconta Blackpool, il clone 8.6, il genoma e le diciassette accessioni (con Pt14 dal Golfo di Salerno).
2. **Prima vista: un preparato fresco di una coltura di Pt1 sana, in campo chiaro.** Quasi tutti fusiformi, pochi ovali sul vetro, qualche triradiato (le proporzioni da decidere, §8). **Le cellule sono sospese in tutta l'intercapedine** (§2.7), quindi la manopola del fuoco fine le attraversa una dopo l'altra, come nel campo di Monteil. Orientamento quasi parallelo al vetrino con piccole inclinazioni, come per *Euglena*: nella foto di Monteil quasi tutte le cellule si vedono per intero (la parte pigmentata ha il 10° percentile a 114 px contro una mediana di 183). Il numero di cellule si ricava da una densità di coltura dichiarata, come per gli altri esemplari.
3. **Campo inquadrato:** ~100 µm (i fusiformi sono un quinto del campo; a 1600 px un braccio di 1 µm è largo ~15 px e si risolve). In alternativa ~50 µm come *Chlorella*, per vedere meglio l'interno (§8).
4. **Geometria del fusiforme:** un solido di rotazione lungo un asse appena arcuato, sezione circolare; bracci di 0,9–1,0 µm che si assottigliano poco e finiscono arrotondati; rigonfiamento centrale largo 2,5–3,5 µm per il 35–60 % della lunghezza; lunghezze dalla distribuzione di Pt1 (~23 µm, §2.1). Il profilo varia tra le cellule, dal corpo corto con bracci tubolari [35] al fuso più graduale [18]. Un controllo verifica che il volume disegnato torni con i ~33 µm³ della FIB-SEM per una cellula di 13–15 µm.
5. **Interno visibile al microscopio ottico:** un solo plastidio assorbente, allungato e appoggiato su un lato del corpo; il nucleo come debole corpo di fase accanto a esso; i bracci come tubi vacuolati quasi trasparenti; 0–4 piccole gocce lipidiche (~0,5–0,7 µm) rifrangenti vicino al plastidio e nei bracci; alcune cellule con il plastidio strozzato in due (§2.6) e qualche coppia di figlie affiancate. I mitocondri e il pirenoide restano sotto il limite di risoluzione e non si disegnano in questa vista.
6. **Triradiato e ovale:** il triradiato come tre bracci nello stesso piano a ~120°, lunghi 7–8 µm, con il plastidio al centro che entra nei bracci; l'ovale come ellissoide di 6–8 × 3 µm con una parete spessa e rifrangente, il plastidio che lo riempie in gran parte, posato sul vetro. Il cruciforme solo nella condizione "freddo".
7. **Strumento:** lo stesso obiettivo di tutto l'atlante. Campo chiaro come predefinito, come nelle due foto. Il **DIC** sarebbe la scelta classica per le diatomee: oggi solo il renderer di *Euglena* calcola la pendenza del cammino ottico (`renderers: ['euglenoid-field']` in `microscope.js`); se il nuovo renderer ne deriva, il DIC viene con lui.
8. **Colore:** tinta dallo spettro in vivo (§2.8), luminanza tarata sul plastidio di [35]; `colour`, `band` e `bandWeak` come per *Braarudosphaera*, che ha pigmenti dello stesso tipo. Due foto discordi sul rapporto rosso/verde non bastano a fissare la tinta.
9. **Motore:** nuovo `kind` (per esempio `'pennate-field'`) accanto a `EuglenaField.jsx`, da cui può prendere quasi tutto: la corda analitica di un fuso a sezione circolare, la sfocatura integrata invece che campionata, gli strati sfocati ciascuno alla propria distanza dal fuoco, il calcolo del rilievo per il DIC; da `twoBeam.jsx` il colore e i due fasci del condensatore. Senza nuoto. Il triradiato come tre bracci uniti al centro; l'ovale come ellissoide con una parete. La popolazione in un file `pennate.js` sul modello di `euglenoid.js`.
10. **Controlli:** un interruttore "ceppo / condizione" (Pt1 fusiforme · Pt3 in acqua salmastra, ovale · Pt8 triradiato · freddo, cruciforme) e uno "azoto" (coltura sana / 11 giorni senza azoto, con le gocce lipidiche che crescono, §5). Un "ciclo vitale" facoltativo, come per *Aurantiochytrium*: una cellula che si divide con i tempi di [21], oppure un fusiforme che ritira i bracci e diventa ovale [13].
11. **Albero:** Bacillariophyta sotto SAR (il posto esiste già). Una freccia di endosimbiosi da Rhodophyta a Bacillariophyta, "Plastid of red-algal origin — by a route still debated", con le stesse fonti della freccia per le aptofite (r61, r63).
12. **Schede (bozza):** la cellula fusiforme · quattro forme, una specie · il plastidio (uno solo, bruno dorato, fucoxantina) · una diatomea quasi senza vetro · i bracci vacuolati · le gocce lipidiche e l'azoto · la divisione · quale ceppo? · perché è un organismo modello · nel cibo? (EPA, fucoxantina, stato in UE).
13. **Interno (fase 2):** una cellula di Pt1 costruita sui volumi FIB-SEM (§3): plastidio a quattro membrane con il pirenoide attraversato dai tilacoidi, rete mitocondriale a contatto con il plastidio, nucleo avvolto dalla membrana più esterna del plastidio. Gli stack grezzi pubblici permetterebbero di segmentare la geometria vera; è un lavoro grande.


### 7.1 Cosa è stato costruito (v0.3, 10 ottobre 2026)

Il campo è in `src/PennateField.jsx` (`kind: 'pennate-field'`), la popolazione in `src/pennate.js`, la specie in `src/species/phaeodactylum-tricornutum.js` con nove schede in `phaeodactylum-cards.js`, le fonti r97–r112 in `src/structures.js`; `tools/check-phaeodactylum.mjs` tiene il disegno legato alle misure (34 controlli, in `npm run check`). Rispetto alla proposta:

- **Fatto come proposto:** Pt1 8.6, campo di ~100 µm, preparato fresco in campo chiaro; fusiformi sospesi in tutta l'intercapedine con piccole inclinazioni (4500 cellule/mm², contate su [36]); ~4 % di ovali posati sul vetro; plastidio unico spostato su un lato, nucleo come debole corpo di fase, 0–5 gocce lipidiche (media 3,6), plastidi strozzati (~15 %) e coppie di figlie (~5 %); freccia rossa nell'albero; disco nella pagina iniziale.
- **Geometria:** corpo a fuso parabolico raccordato a due bracci tubolari (norma p, p = 3); un'ellisse dava cellule "a limone". Larghezza del corpo 2,8–3,4 µm, scelta perché una cellula di 13–15 µm abbia il volume FIB-SEM (34,7 µm³ al centro dei parametri contro 32,6 ± 2,4). Bracci disegnati di ~0,84 µm, che nel disegno si leggono a ~1,0 µm tra le due linee di parete, come gli 0,9–1,0 µm di [35], che includono la sfocatura.
- **Parete e bracci:** parete come guscio, 40 nm a indice 1,395 nei fusiformi (scelta, tarata sui bordi dei bracci di [35]), 45 nm negli ovali (misurata, §2.3); vacuolo a 1,343 nei bracci.
- **Ovale:** plastidio a profilo ellittico che riempie la cellula, posato con il plastidio in alto (§2.3); la scheda mette il piano di fuoco **0,4 µm sotto il centro della cellula**, dove il bordo esce come su [35] (§2.10). Con il fuoco al centro la parete non dà nessuna linea scura, solo le frange colorate dell'obiettivo.
- **Colore:** tinta dall'ordine dei pigmenti (blu > verde > rosso assorbiti), luminanza da [35] (verde 0,68 nel punto più denso); per µm di plastidio R 0,89, G 0,82, B 0,64.
- **Non fatto (per ora):** il triradiato e il cruciforme; il DIC; gli interruttori "ceppo/condizione" e "azoto"; il ciclo vitale; l'interno.

---

## 8. Decisioni

**Decise il 10 ottobre 2026:** ceppo di riferimento **Pt1 8.6** · campo inquadrato di **~100 µm** · **solo l'esterno** per ora · **linea rossa** (plastidio di origine rossa) verso Bacillariophyta nell'albero · nessuna foto propria disponibile (la collezione ACUF non ne ha): i riferimenti restano le figure aperte di §6.

**Non ancora decisa, quindi scelta qui e da confermare:** le proporzioni dei morfotipi nella vista principale. Si disegna Pt1 come in una coltura liquida normale: quasi tutti fusiformi (95–100 % nelle accessioni di genotipo A [8] via [13]; il fusiforme è la forma più stabile [6][10]), qualche ovale "lungo" posato sul vetro (pochi nella foto di Pt1 [36]) e nessun triradiato, che in Pt1 non è documentato in coltura liquida.

---

## 9. Lacune e fonti da procurare

1. ~~Borowitzka & Volcani 1978 [6]~~ e ~~Tesson et al. 2009 [10]~~ — letti per intero il 10/10/2026 (PDF forniti dal proprietario, in `docs/fonti/`, esclusi da git).
2. **De Martino et al. 2007 [8]** — le dimensioni e i morfotipi di Pt1–Pt10 nelle stesse condizioni. Letto solo attraverso altri articoli. Wiley, *J. Phycol.*
3. **Lewin, Lewin & Philpott 1958 [4] e Lewin 1958 [5]** — dimensioni, mucillagine, valva e rafe. Ad accesso libero sul sito della Microbiology Society, ma il server rifiuta il download automatico: basta scaricarli dal browser.
4. **Iwasa & Shimizu 1972** (*Exp. Cell Res.* 74:552–558) — la motilità degli ovali, cioè la velocità che manca.
5. **Francius et al. 2008 [11]** — la parete dei tre morfotipi al microscopio a forza atomica. Wiley.
6. **De Martino et al. 2011 [9]** — le trasformazioni indotte dall'ambiente. Elsevier, *Protist*.
7. Una **velocità di scivolamento degli ovali** misurata: non trovata.
8. **Kamowski et al. 2023 [39]** — gli indici di rifrazione dei componenti cellulari. *Optics Express* è ad accesso aperto, ma il sito ha bloccato la lettura automatica.
9. Uno **spettro di assorbimento in vivo** da digitalizzare (§2.8), per esempio da [42].
10. La **dimensione del genoma** e l'assenza di riproduzione sessuale da una fonte primaria.

---

## 10. Bibliografia

Gli identificativi `r97` in poi verranno assegnati in `src/structures.js` quando l'esemplare sarà costruito.

1. Bohlin K (1897). Zur Morphologie und Biologie einzelliger Algen. *Öfversigt af Kongl. Vetenskaps-Akademiens Förhandlingar* 9:507–529 (citazione da [6][10]); p. 520, fig. 9. Tavola su Wikimedia Commons, pubblico dominio.
2. Allen EJ, Nelson EW (1910). On the artificial culture of marine plankton organisms. *Journal of the Marine Biological Association of the UK* 8:421–474 — citato tramite fonti secondarie.
3. Wilson DP (1946). The triradiate and other forms of *Nitzschia closterium* (Ehrenberg) Wm. Smith, forma *minutissima* of Allen and Nelson. *Journal of the Marine Biological Association of the UK* 26:235–270 — citato tramite [13].
4. Lewin JC, Lewin RA, Philpott DE (1958). Observations on *Phaeodactylum tricornutum*. *Journal of General Microbiology* 18:418–426. https://doi.org/10.1099/00221287-18-2-418 — letto solo un estratto.
5. Lewin JC (1958). The taxonomic position of *Phaeodactylum tricornutum*. *Journal of General Microbiology* 18:427–432. https://doi.org/10.1099/00221287-18-2-427 — non letto.
6. Borowitzka MA, Volcani BE (1978). The polymorphic diatom *Phaeodactylum tricornutum*: ultrastructure of its morphotypes. *Journal of Phycology* 14:10–21. https://doi.org/10.1111/j.1529-8817.1978.tb00625.x — letto per intero (PDF del proprietario, locale). Ceppi: 74-M di Lewin (1956, ovali e fusiformi) e il clone di Great South Bay, Long Island (1952; fusiformi e triradiati, singoli e in catene).
7. Borowitzka MA, Chiappino ML, Volcani BE (1977). Ultrastructure of a chain-forming diatom *Phaeodactylum tricornutum*. *Journal of Phycology* 13:162–170 — letto il riassunto.
8. De Martino A, Meichenin A, Shi J, Pan K, Bowler C (2007). Genetic and phenotypic characterization of *Phaeodactylum tricornutum* (Bacillariophyceae) accessions. *Journal of Phycology* 43:992–1009. https://doi.org/10.1111/j.1529-8817.2007.00384.x — citato tramite [13][15][29].
9. De Martino A, Bartual A, Willis A, Meichenin A, Villazán B, Maheswari U, Bowler C (2011). Physiological and molecular evidence that environmental changes elicit morphological interconversion in the model diatom *Phaeodactylum tricornutum*. *Protist* 162:462–481. https://doi.org/10.1016/j.protis.2011.02.002 — citato tramite [13][15].
10. Tesson B, Gaillard C, Martín-Jézéquel V (2009). Insights into the polymorphism of the diatom *Phaeodactylum tricornutum* Bohlin. *Botanica Marina* 52:104–116. https://doi.org/10.1515/bot.2009.012 — letto per intero (PDF del proprietario, locale); illustra Pt1 8.6 in luce trasmessa, SEM e TEM.
11. Francius G, Tesson B, Dague E, Martin-Jézéquel V, Dufrêne YF (2008). Nanostructure and nanomechanics of live *Phaeodactylum tricornutum* morphotypes. *Environmental Microbiology* 10:1344–1356. https://doi.org/10.1111/j.1462-2920.2007.01551.x — citato tramite [13].
12. Vartanian M, Desclés J, Quinet M, Douady S, Lopez PJ (2009). Plasticity and robustness of pattern formation in the model diatom *Phaeodactylum tricornutum*. *New Phytologist* 182:429–442. https://doi.org/10.1111/j.1469-8137.2009.02769.x — letto il riassunto.
13. He L, Han X, Yu Z (2014). A rare *Phaeodactylum tricornutum* cruciform morphotype: culture conditions, transformation and unique fatty acid characteristics. *PLoS ONE* 9:e93922. https://doi.org/10.1371/journal.pone.0093922 — CC BY 4.0, letto per intero.
14. Galas L, Burel C, Schapman D, Ropitaux M, Bernard S, Bénard M, Bardor M (2021). Comparative structural and functional analyses of the fusiform, oval, and triradiate morphotypes of *Phaeodactylum tricornutum* Pt3 strain. *Frontiers in Plant Science* 12:638181. https://doi.org/10.3389/fpls.2021.638181 — CC BY 4.0, letto per intero.
15. Chuberre C, Chan P, Walet-Balieu ML, Thiébert F, Burel C, Hardouin J, Gügi B, Bardor M (2022). Comparative proteomic analysis of the diatom *Phaeodactylum tricornutum* reveals new insights into intra- and extra-cellular protein contents of its oval, fusiform, and triradiate morphotypes. *Frontiers in Plant Science* 13:673113. https://doi.org/10.3389/fpls.2022.673113 — CC BY, letto in parte.
16. Ovide C, Kiefer-Meyer MC, Bérard C, et al. (2018). Comparative in depth RNA sequencing of *P. tricornutum*'s morphotypes reveals specific features of the oval morphotype. *Scientific Reports* 8:14340. https://doi.org/10.1038/s41598-018-32519-7 — citato tramite [14].
17. Stanley MS, Callow JA (2007). Whole cell adhesion strength of morphotypes and isolates of *Phaeodactylum tricornutum* (Bacillariophyceae). *European Journal of Phycology* 42:191–197. https://doi.org/10.1080/09670260701240863 — citato tramite [13].
18. Uwizeye C, Decelle J, Jouneau PH, Flori S, Gallet B, Keck JB, et al. (2021). Morphological bases of phytoplankton energy management and physiological responses unveiled by 3D subcellular imaging. *Nature Communications* 12:1049. https://doi.org/10.1038/s41467-021-21314-0 — CC BY 4.0, letto per intero con i dati supplementari (Supplementary Data 1, Tabella S1); stack grezzi su BioStudies S-BSST575.
19. Flori S, Jouneau PH, Bailleul B, Gallet B, Estrozi LF, Moriscot C, et al. (2017). Plastid thylakoid architecture optimizes photosynthesis in diatoms. *Nature Communications* 8:15885. https://doi.org/10.1038/ncomms15885 — CC BY 4.0, letto in parte.
20. Flori S, Jouneau PH, Finazzi G, Maréchal E, Falconet D (2016). Ultrastructure of the periplastidial compartment of the diatom *Phaeodactylum tricornutum*. *Protist* 167:254–267. https://doi.org/10.1016/j.protis.2016.04.001 — non letto.
21. Tanaka A, De Martino A, Amato A, Montsant A, Mathieu B, Rostaing P, Tirichine L, Bowler C (2015). Ultrastructure and membrane traffic during cell division in the marine pennate diatom *Phaeodactylum tricornutum*. *Protist* 166:506–521. https://doi.org/10.1016/j.protis.2015.07.005 — CC BY-NC-ND 4.0, letto per intero.
22. Bailleul B, Berne N, Murik O, Petroutsos D, Prihoda J, Tanaka A, et al. (2015). Energetic coupling between plastids and mitochondria drives CO2 assimilation in diatoms. *Nature* 524:366–369. https://doi.org/10.1038/nature14599 — citato tramite [14][18].
23. Shimakawa G, Demulder M, Flori S, et al. (2024). Diatom pyrenoids are encased in a protein shell that enables efficient CO2 fixation. *Cell* 187:5919–5934.e19. https://doi.org/10.1016/j.cell.2024.09.013 — letti il riassunto e i comunicati.
24. Lupette J, et al. (2019). The architecture of lipid droplets in the diatom *Phaeodactylum tricornutum*. *Algal Research* 38:101415 — citato tramite [18].
25. Jaussaud A, et al. (2020). Stepwise biogenesis of subpopulations of lipid droplets in nitrogen starved *Phaeodactylum tricornutum* cells. *Frontiers in Plant Science* — citato tramite [26].
26. Murison V, Hérault J, Côme M, Guinio S, Lebon A, Chamot C, Bénard M, Galas L, Schoefs B, Marchand J, Bardor M, Ulmann L (2023). Comparison of two *Phaeodactylum tricornutum* ecotypes under nitrogen starvation and resupply reveals distinct lipid accumulation strategies but a common degradation process. *Frontiers in Plant Science* 14:1257500. https://doi.org/10.3389/fpls.2023.1257500 — CC BY, letto per intero.
27. Zhang W, Hao Q, Zhu J, Deng Y, Xi M, Cai Y, Liu C, Zhai H, Le F (2023). Nanoplanktonic diatom rapidly alters sinking velocity via regulating lipid content and composition in response to changing nutrient concentrations. *Frontiers in Marine Science* 10:1255915. https://doi.org/10.3389/fmars.2023.1255915 — letto in parte.
28. Rastogi A, Vieira FRJ, Deton-Cabanillas AF, Veluchamy A, Cantrel C, Wang G, Vanormelingen P, Bowler C, Piganeau G, Hu H, Tirichine L (2020). A genomics approach reveals the global genetic polymorphism, structure, and functional diversity of ten accessions of the marine model diatom *Phaeodactylum tricornutum*. *The ISME Journal* 14:347–363. https://doi.org/10.1038/s41396-019-0528-3 — letto in parte il preprint (bioRxiv 176008).
29. Chaumier T, Yang F, Manirakiza E, Ait-Mohamed O, Wu Y, Chandola U, Jesus B, Piganeau G, Groisillier A, Tirichine L (2024). Genome-wide assessment of genetic diversity and transcript variations in 17 accessions of the model diatom *Phaeodactylum tricornutum*. *ISME Communications* 4:ycad008. https://doi.org/10.1093/ismeco/ycad008 — CC BY 4.0, letto in parte.
30. Bowler C, Allen AE, Badger JH, et al. (2008). The *Phaeodactylum* genome reveals the evolutionary history of diatom genomes. *Nature* 456:239–244. https://doi.org/10.1038/nature07410 — letto il riassunto.
31. Rastogi A, Maheswari U, Dorrell RG, et al. (2018). Integrative analysis of large scale transcriptome data draws a comprehensive landscape of *Phaeodactylum tricornutum* genome and evolutionary origin of diatoms. *Scientific Reports* 8:4834. https://doi.org/10.1038/s41598-018-23106-x — CC BY, letto in parte.
32. Giguere DJ, Bahcheli AT, Slattery SS, Patel RR, Browne TS, Flatley M, Karas BJ, Edgell DR, Gloor GB (2022). Telomere-to-telomere genome assembly of *Phaeodactylum tricornutum*. *PeerJ* 10:e13607. https://doi.org/10.7717/peerj.13607 — CC BY, letto in parte.
33. WoRMS. *Phaeodactylum tricornutum* Bohlin, 1897, AphiaID 175584; genere *Phaeodactylum* (consultati il 10/10/2026).
34. CCAP. Ceppi 1055/1 e 1055/3, schede di catalogo (consultate il 10/10/2026). https://www.ccap.ac.uk/catalogue/strain-1055-1
35. Gruber A (2008). *Phaeodactylum tricornutum*: tre forme, barra di 10 µm. Wikimedia Commons, "Phaeodactylum tricornutum.jpg", CC BY 4.0.
36. Monteil R (2022). *Phaeodactylum tricornutum* Pt1. Wikimedia Commons, "Phaeodactylum tricornutum Pt1.jpg", CC BY-SA 4.0.
37. Bradbury J (2004). Nature's nanotechnologists: unveiling the secrets of diatoms. *PLoS Biology* 2:e306. https://doi.org/10.1371/journal.pbio.0020306 — micrografia di A. De Martino e C. Bowler, CC BY 2.5.
38. Volten H, de Haan JF, Hovenier JW, Schreurs R, Vassen W, Dekker AG, et al. (1998). Laboratory measurements of angular distributions of light scattered by phytoplankton and silt. *Limnology and Oceanography* 43:1180–1197. https://doi.org/10.4319/lo.1998.43.6.1180 — valore letto nel database di diffusione della luce di Amsterdam-Granada.
39. Kamowski et al. (2023). Refractive index and volume fractions of various cellular components of plankton. *Optics Express* 31(22):35892 — letto il riassunto.
40. EFSA NDA Panel (2023). Safety of an ethanolic extract of the dried biomass of the microalga *Phaeodactylum tricornutum* as a novel food pursuant to Regulation (EU) 2015/2283. *EFSA Journal* 21(7):8072 — letto il riassunto.
41. Ebbing T, Kopp L, Frick K, Simon T, Würtz B, Pfannstiel J, et al. (2025). Exploring *Phaeodactylum tricornutum* for nutraceuticals: cultivation techniques and neurotoxin risk assessment. *Marine Drugs* 23:58. https://doi.org/10.3390/md23020058 — letto il riassunto.
42. Yeh YC, Ebbing T, Frick K, Schmid-Staiger U, Haasdonk B, Tovar GEM (2023). Improving determination of pigment contents in microalgae suspension with absorption spectroscopy: light scattering effect and Bouguer–Lambert–Beer law. *Marine Drugs* 21:619. https://doi.org/10.3390/md21120619 — CC BY 4.0; candidato per lo spettro (§2.8).
43. Abida H, et al. (2015). Membrane glycerolipid remodeling triggered by nitrogen and phosphorus starvation in *Phaeodactylum tricornutum*. *Plant Physiology* 167:118–136 — fig. 1, mappa delle accessioni, letta solo in un estratto.
