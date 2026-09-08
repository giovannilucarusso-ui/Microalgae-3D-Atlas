# Distinta anatomica — Spirulina (*Limnospira / Arthrospira platensis*)

**Versione 1.1 — 20 agosto 2026** *(v1.1: integrati i dati quantitativi estratti dalla tesi TU Delft di van Eykelenburg [8], scaricata in `docs/fonti/`)*
Base scientifica per il modello 3D interattivo. Ogni struttura che entrerà nel modello deve avere una scheda in questo documento; ogni valore numerico ha accanto la fonte e il livello di confidenza.

---

## 0. Come leggere questa distinta

Ogni dato è marcato con uno di tre livelli di confidenza. Questa distinzione è la spina dorsale del rigore del progetto: nel modello 3D e nei pannelli informativi dovremo dichiarare quando un dettaglio è documentato *sulla spirulina* e quando è dedotto da cianobatteri affini.

| Marcatore | Significato |
|---|---|
| ✅ **SPECIE** | Misurato/osservato direttamente su *Arthrospira/Limnospira* (fonte primaria specie- o genere-specifica) |
| ⚠️ **MODELLO** | Documentato in cianobatteri modello (*Synechocystis*, *Synechococcus*, *Anabaena*, *Phormidium*…); atteso nella spirulina per omologia/genoma, ma non misurato direttamente su di essa |
| ❓ **VERIFICARE** | Lacuna nota: dato non ancora reperito in fonte primaria; da colmare prima della modellazione di dettaglio |

**Nota tassonomica preliminare.** La "spirulina" commerciale **non** appartiene al genere *Spirulina*: è *Arthrospira platensis*, riclassificata nel 2019 nel nuovo genere ***Limnospira*** [1]; analisi genomiche successive indicano che *Limnospira* è di fatto monospecifico (*L. platensis*, con *A. maxima* e *A. fusiformis* come sottoceppi) [2][3]. Nel documento usiamo "spirulina" come nome comune e *Arthrospira/Limnospira* come nome scientifico. È un **procariote** (cianobatterio): questo determina tutta l'anatomia interna (nessun organello delimitato da membrana).

**Ceppo della tesi [8]:** i dati di van Eykelenburg provengono da *S. platensis* del Lago Nakuru (Africa), cellule Ø ~10 µm; i valori possono variare tra ceppi (range di specie: 6–12 µm).

---

## 1. Carta d'identità

| Campo | Valore | Fonte |
|---|---|---|
| Nome comune | Spirulina | — |
| Nome scientifico attuale | *Limnospira platensis* (basionimo *Arthrospira platensis*) | [1][2][3] ✅ |
| Gruppo | Cyanobacteria, ordine Oscillatoriales (filamentosi, non eterocistici) | [1][6] ✅ |
| Organizzazione | Procariote multicellulare filamentoso: tricoma di cellule cilindriche impilate | [1][6] ✅ |
| Habitat tipico | Laghi alcalino-salini tropicali/subtropicali (pH e conducibilità elevati), planctonica | [1] ✅ |
| Genoma (ceppo NIES-39) | 1 cromosoma circolare ~6,8 Mb; 6630 geni codificanti; 2 operoni rRNA; 40 tRNA; **non** azoto-fissatrice | [10][11] ✅ |
| Ceppi di riferimento | NIES-39 (Giappone), PCC 8005 (= *L. indica*, programma spaziale MELiSSA; morfotipi P2 dritto / P6 elicoidale), UTEX 2720 (*L. maxima*), SAG 85.79 (*L. fusiformis*), C1 (= PCC 9438), Lago Nakuru (tesi [8]) | [1][8][10][30] ✅ |

### Perché non è né una "vera" *Spirulina* né un'alga eucariote

| Carattere | *Spirulina* sensu stricto | *Arthrospira / Limnospira* (la nostra) | Fonte |
|---|---|---|---|
| Larghezza cellula | 2–4 µm | 6–12 µm | [2] ✅ |
| Elica | quasi chiusa (spira serrata a molla) | aperta (molla stirata), tendenza ad allentarsi | [2] ✅ |
| Setti trasversali | invisibili al microscopio ottico | visibili al microscopio ottico | [2] ✅ |
| Vescicole gassose | assenti | generalmente presenti (facoltative) | [2] ✅ |
| Motilità | rotazione permanente | scivolamento con rotazione | [2] ✅ |

---

## 2. LIVELLO 1 — Il filamento (scala 10–500 µm)

### 2.1 Tricoma elicoidale

- **Che cos'è.** L'"individuo" visibile: una fila non ramificata di cellule cilindriche (tricoma) avvolta a elica aperta, isopolare, senza guaina evidente. È l'oggetto che l'utente vede al primo livello di zoom.
- **Geometria per il 3D.** Cilindro di diametro cellulare avvolto su un'elica; spire regolari con passo maggiore del diametro del cilindro (elica "aperta"); estremità arrotondate. Nessuna ramificazione, nessun flagello.

| Grandezza | Valore | Fonte | Confidenza |
|---|---|---|---|
| Larghezza cellula/tricoma | 6–12 µm (tipico); 2,5–15 µm in natura; ~10 µm nel ceppo Nakuru | [2]; Sili et al. 2012 in [26]; [8] | ✅ |
| Diametro dell'elica | 15–60 µm (fino a 20–60 µm in coltura; valori 30–70 µm riportati) | Sili et al. 2012 in [26]; [27] | ✅ |
| Passo dell'elica (pitch) | 12–72 µm, fino a 80 µm | Sili et al. 2012 in [26] | ✅ |
| **Elica in funzione di T (ceppo Nakuru)** | **15 °C: passo 152 µm, Ø 69 µm → 30 °C: passo 113 µm, Ø 36 µm** (correlazione con T: r=0,92 passo, r=0,97 diametro); la luce NON influenza né passo né diametro | [5][8] | ✅ |
| Lunghezza tricoma | 100–500 µm (coltura, 7 giorni) | [27] | ✅ |
| Verso dell'elica | prevalentemente **sinistrorso**: su 36 ceppi clonali, 29 sinistrorsi, 5 destrorsi, 2 dritti | [9] | ✅ |

- **Dinamica (stati del modello).** L'elica si stringe all'aumentare della temperatura, con i valori quantitativi qui sopra [5][8]; il verso può invertirsi con shift termico 30→32–34 °C, reversibilmente [9]; transizione reversibile elica↔spirale piatta passando da mezzo liquido a solido (van Eykelenburg & Fuchs, cit. in [3]; capitolo IV di [8]); il passo dell'elica è proporzionale alla sovrapposizione dei setti (modello meccanico del capitolo III di [8]); in coltura compaiono spontaneamente morfotipi lineari stabili [9][28][30]. La geometria elicoidale ha un ruolo biomeccanico di "molla" [28].
- **Fonti:** [1][2][3][5][8][9][26][27][28][30]

### 2.2 La singola cellula

- **Che cos'è.** Cellula cilindrica **più larga che lunga** (un "disco" impilato), unita alle vicine dai setti trasversali; costrizioni assenti o lievi ai setti.
- **Geometria per il 3D.** Disco cilindrico: diametro 6–12 µm, altezza (lunghezza) 2,6–5,6 µm; setti visibili come sottili pareti trasversali.

| Grandezza | Valore | Fonte | Confidenza |
|---|---|---|---|
| Diametro | 6–12 µm (6–8 µm in *L. fusiformis* SAG 85.79 e *A. jenneri*; ~10 µm ceppo Nakuru) | [1][2][8] | ✅ |
| Lunghezza (altezza del disco) | 2,6–5,6 µm; sempre minore del diametro in *Limnospira* | [1] | ✅ |

- **Fonti:** [1][2][8]

### 2.3 Cellula apicale (calittra)

- **Che cos'è.** La cellula terminale del tricoma: arrotondata o subcapitata, in *Limnospira* con parete esterna ispessita o **calittra** (cappuccio); in *A. jenneri* (non commerciale) senza calittra. Dettaglio diagnostico da mostrare allo zoom sull'estremità del filamento.
- **Fonti:** [1] ✅

### 2.4 Motilità per scivolamento (gliding)

- **Che cos'è.** Il tricoma scivola su superfici e ruota attorno al proprio asse (movimento "a vite"); niente flagelli. La geometria elicoidale conferisce **compensazione termica** della velocità longitudinale [29] ✅.
- **Meccanismo.** Le **file di pori presso i setti**, che attraversano la parete, sono documentate direttamente in *S. platensis* [4][8] ✅; il diametro dei pori (~15 nm) e il meccanismo di propulsione (secrezione di muco dal "junctional pore complex" + fibrille superficiali elicoidali della glicoproteina **oscillina** come binario) vengono da *Phormidium/Anabaena* [12][13] ⚠️. In *S. platensis* le fibrille elicoidali dello strato L-III (Ø 8–10 nm, elica destrorsa) sono il probabile corrispettivo strutturale [4][8] ✅.
- **Per il 3D** (proposta; stato attuale fra parentesi). Animazione: traslazione + rotazione coordinate lungo l'asse dell'elica *(implementata)*; allo zoom sull'involucro, mostrare le file di pori presso i setti e le fibrille elicoidali superficiali *(**non implementate e non implementabili in quella vista**: 15 e 8 nm stanno due ordini di grandezza sotto il potere risolutivo del microscopio ottico che quella vista dichiara di essere)*.
- **Fonti:** [4][8][12][13][29]

### 2.5 Riproduzione: necridi e ormogoni

- **Che cos'è.** Nessuna spora, nessuna eterocisti, nessuna acineta: il tricoma si moltiplica per **frammentazione**. Alcune cellule intercalari si sacrificano (morte programmata), diventano biconcave e ricche di muco (**necridi**); il tricoma si spezza in corrispondenza dei necridi liberando corte catene di cellule (**ormogoni**, indicativamente 5–25 cellule ❓ da confermare per *Arthrospira*) che scivolano via, si allungano per divisioni intercalari e ricostruiscono l'elica.
- **Per il 3D.** Sequenza animabile in 4 fasi: necridio → rottura → ormogonio mobile → nuovo tricoma. Ottimo contenuto didattico ("come si riproduce senza spore").
- **Fonti:** [4][6] ✅ (descrizione classica); dimensione ormogonio ❓

---

## 3. LIVELLO 2 — L'involucro cellulare (scala 20–100 nm)

Architettura di tipo **Gram-negativo**, sottile, in 4 strati (nomenclatura L-I…L-IV di van Eykelenburg [4][8]), sopra la membrana plasmatica.

### 3.1 Guaina / strato mucoso (EPS)

- Tricomi **senza guaina o con guaina sottile e inconspicua** [1] ✅. Nel ceppo Nakuru, a temperature elevate compare uno strato fibrillare lasso esterno (fibrille ~3 nm), interpretabile come guaina rudimentale o artefatto di preparazione [5][8] ✅. La secrezione di esopolisaccaridi è legata alla motilità (muco dai pori) [12] ⚠️.
- **Misure dirette su *Arthrospira* sp. PCC 8005** [43] ✅. Sul lato esterno della parete le sostanze polimeriche extracellulari formano una guaina di **~50 nm** in coltura non carenziata; dopo alcuni giorni di **carenza di azoto** ispessisce a **50–200 nm**. A 240 h si distinguono due strati: **cEPS**, film continuo aderente alla parete, e **fEPS**, fibrillare, più esterno e più spesso, che su alcune cellule raggiunge **300 nm** e in certi punti alcuni µm. L’aumento è confermato dai saggi (acidi uronici e carboidrati totali degli EPS crescono significativamente sotto N-stress). Interpretazione degli autori: **deposito extracellulare di carbonio** — carbonio dirottato fuori dalla cellula per riequilibrare il rapporto C/N — con effetti sull’adesione cellulare.
- **Nota di coerenza.** [1] descrive il genere come privo di guaina e [43] la fotografa: 50 nm sono un ordine di grandezza sotto il potere risolutivo del microscopio ottico, quindi le due affermazioni non sono in conflitto. È la motivazione dell’asserzione in `tools/check-science.mjs`.

### 3.2 Parete cellulare a 4 strati (L-I → L-IV) — **dati completi dalla tesi [8]**

| Strato | Posizione | Natura | Spessore | Fonte | Confidenza |
|---|---|---|---|---|---|
| L-I | più interno | fibrillare, **β-1,2-glucano** (idrolisi: solo glucosio); elettron-trasparente | 10–15 nm | [4][8][41] | ✅ |
| L-II | secondo | **peptidoglicano** (murein); elettron-denso; strato rigido, prosegue nei setti; vi si osservano particelle associate a pattern caratteristico | 10–15 nm | [4][8] | ✅ |
| L-III | terzo | fibrillare, elettron-trasparente; **fibrille Ø 8–10 nm continue sulla superficie del tricoma in elica destrorsa** | 10–15 nm | [4][8] | ✅ |
| L-IV | più esterno | elettron-denso; **elementi lineari di 12–15 nm paralleli all'asse del tricoma** | 10–15 nm | [4][8] | ✅ |
| **Parete totale** | | | **fino a ~60 nm** | [4][8] | ✅ |

- **Setto trasversale** = parete a 3 strati: L-II (peptidoglicano) racchiuso tra due L-I; lo spessore dell'L-II settale è uguale a quello longitudinale, mentre gli strati L-I appaiono espansi. Il materiale settale è accompagnato da fibrille di Ø 14–15 nm. Nel L-II, **file di pori sono frequentemente visibili ai due lati dei setti** (crio-frattura e sezioni ultrasottili) [4][8] ✅.
- **Lettura moderna** (per il pannello divulgativo): L-IV corrisponde funzionalmente alla **membrana esterna** con lipopolisaccaridi dei Gram-negativi; le fibrille elicoidali L-III corrispondono al sistema tipo oscillina ⚠️ (interpretazione, da dichiarare come tale).

### 3.3 Membrana plasmatica

- Doppio strato lipidico standard (~7–8 nm) aderente alla faccia interna della parete ⚠️ (valore generico di membrana biologica; misura specie-specifica non reperita ❓; la crio-frattura in [8] espone il plasmalemma ma senza quota di spessore).

### 3.4 Pori giunzionali e fibrille superficiali

- **File di pori presso i setti documentate in *S. platensis*** [4][8] ✅; diametro (~15 nm) e funzione di organello di secrezione del muco (motore dello scivolamento) da *Phormidium* [12] ⚠️; fibrille elicoidali esterne: in *S. platensis* = fibrille L-III Ø 8–10 nm destrorse [4][8] ✅, interpretate come sistema oscillina-simile [13] ⚠️.

### 3.5 Setti e comunicazione cellula-cellula

- Il peptidoglicano settale dei cianobatteri filamentosi è perforato da **decine di nanopori (~20 nm)** attraversati da complessi proteici: le **giunzioni settali**, canali regolabili con "cappuccio" che si chiude sotto stress — l'analogo procariotico delle gap junction. Dimostrato con crio-tomografia in *Anabaena/Nostoc* [14][15] ⚠️; in *S. platensis* le file di pori settali osservate in [4][8] ✅ sono la struttura candidata, ma la giunzione molecolare non è stata caratterizzata ❓.
- **Per il 3D** (proposta). Allo zoom sul setto: disco con campo di nanopori *(implementato: 56 pori passanti)* + complesso giunzionale con cappuccio apribile/chiudibile *(**non implementato**)*.
- **Fonti:** [4][8][12][13][14][15]

---

## 4. LIVELLO 3 — La macchina fotosintetica

### 4.1 Tilacoidi

- **Che cos'è.** Sacche membranose appiattite libere nel citoplasma (NON dentro un cloroplasto — punto didattico centrale). In *Limnospira* i tilacoidi hanno **disposizione irregolare, con sezioni "a vortice" (whirl-like) nella parte centrale della cellula** [1] ✅; la tesi conferma: "nessuna uniformità strutturale nell'orientamento delle lamelle fotosintetiche" [5][8] ✅. In *Arthrospira* sensu stricto sono invece **radiali** — carattere diagnostico tra i due generi [1] ✅.
- **Spaziatura:** lamelle fotosintetiche distanziate **~56 nm** (cellule a 38,5 °C, 1 klux) [5][8] ✅.
- **Doppio mestiere.** La stessa membrana tilacoidale ospita **sia** la catena fotosintetica **sia** quella respiratoria (condividono plastochinone e citocromo b6f): di giorno fotosintesi, sempre respirazione — peculiarità cianobatterica da raccontare [16] ⚠️ (dimostrato in modelli; supportato dal genoma di *A. platensis* [10]).
- **Complessi di membrana da modellare** (tutti codificati nel genoma [10]): fotosistema II, fotosistema I (nei cianobatteri tipicamente trimerico ⚠️), citocromo b6f, ATP sintasi, NDH-1 e ossidasi terminali ⚠️. Tutta (o quasi) la clorofilla *a* e gran parte dei carotenoidi risiedono nelle lamelle [5][8] ✅.
- **Per il 3D** (proposta). 4–8 profili membranosi periferici irregolari *(**non implementato**: il generatore produce famiglie in fascicoli di 3–6 su tutta la banda, non 4–8 profili)* + vortici centrali *(implementati)*, interdistanza ~56 nm *(implementata)*; superficie punteggiata dai ficobilisomi *(implementata)*.
- **Fonti:** [1][4][5][8][10][16]

### 4.2 Ficobilisomi

- **Che cos'è.** Le "antenne" che danno alla spirulina il colore blu-verde: complessi proteici a ventaglio (emidiscoidali) appoggiati sulla faccia citoplasmatica dei tilacoidi. In *S. platensis* C1: **nucleo tricilindrico di alloficocianina + 6 bastoncelli radiali di C-ficocianina** [17] ✅. Flusso dell'energia: CPC (assorbe ~620 nm) → APC (~650 nm) → clorofilla a del PSII/PSI.
- **Densità:** occupano **~4,5% dello spazio interlamellare** (38,5 °C, 1 klux); **meno abbondanti ad alta intensità luminosa** [5][8] ✅.
- **Numeri chiave.** Ficobiliproteine (CPC+APC) = **15–20% del peso secco** (fino a ~24% in condizioni ottimizzate) [18] ✅ — per questo l'estratto blu (ficocianina) è il prodotto di punta della spirulina. Struttura molecolare della C-ficocianina di *S. platensis* risolta a 2,2 Å: **PDB 1GH0 / 1HA7** [19][20] ✅ (utilizzabile per il livello di zoom molecolare!).
- **Dimensioni del ficobilisoma assemblato:** ❓ per *Arthrospira*; architetture crio-EM disponibili da specie affini (*Anabaena* PCC 7120 [PDB 7EYD], *Synechococcus* PCC 7002 [7EXT], *T. vulcanus*) [21] ⚠️.
- **Dinamica.** Sotto luce forte, fotoprotezione via **OCP (Orange Carotenoid Protein)**: si attiva e "spegne" i ficobilisomi; la struttura di riferimento dell'OCP è stata risolta proprio da *Arthrospira maxima* a 2,1 Å (**PDB 1M98**) [22] ✅. In carenza d'azoto i ficobilisomi vengono degradati (clorosi: la coltura ingiallisce) ⚠️.
- **Fonti:** [5][8][17][18][19][20][21][22]

### 4.3 Pigmenti (inventario per i materiali/colori del modello)

| Pigmento | Localizzazione | Nota | Fonte | Confidenza |
|---|---|---|---|---|
| Clorofilla *a* (unica clorofilla) | membrane tilacoidali (PSI/PSII) | niente clorofilla *b* nei cianobatteri: segnalazioni contrarie in letteratura di bassa qualità sono artefatti | [5][6][10] | ✅ |
| C-ficocianina (blu) | bastoncelli dei ficobilisomi | pigmento dominante, 15–20% p.s. | [17][18][19] | ✅ |
| Alloficocianina | nucleo dei ficobilisomi | — | [17] | ✅ |
| Ficoeritrina | — | assente/trascurabile in *A. platensis* | [17] | ✅ |
| β-carotene, zeaxantina | membrane e OCP | carotenoidi dominanti nella polvere commerciale | [23] | ✅ |
| Echinenone, mixoxantofilla | membrane | tipici dei cianobatteri | — | ⚠️ ❓ |

---

## 5. LIVELLO 4 — Carbossisomi (fabbriche del carbonio)

- **Che cos'è.** Microcompartimenti poliedrici (icosaedrici) **senza membrana**: guscio interamente proteico che racchiude la Rubisco. Cuore del meccanismo di concentrazione della CO₂ (CCM): lo ione HCO₃⁻ entra dal guscio, l'anidrasi carbonica interna lo converte in CO₂ proprio accanto alla Rubisco, sopprimendo la fotorespirazione.
- **Presenza in *S. platensis*:** corpi poliedrici con **profilo poligonale netto e substruttura granulare**, nella **regione nucleoplasmatica** della cellula, presenti **a tutte le temperature e intensità luminose testate** [5][8] ✅; tipo **β** (Rubisco forma 1B, come tutti i β-cianobatteri) [25] ⚠️ (classificazione genomica).

| Grandezza | Valore | Fonte | Confidenza |
|---|---|---|---|
| Diametro | fino a ~500 nm (osservati in *S. platensis*; nei cianobatteri in genere ~100–200 nm, 169 ± 12 nm in β-carbossisomi nativi) | [5][8]; [25] | ✅/⚠️ |
| Spessore guscio | 3–4 nm ("membrana non unitaria" in [8]; esameri CcmK, pentameri CcmL ai vertici) | [8][25] | ✅/⚠️ |
| Pori del guscio | ~0,4–0,7 nm | [25] | ⚠️ |
| Contenuto | Rubisco L8S8 impacchettata da CcmM/CcmN + anidrasi carbonica | [25][31] | ⚠️ |
| Numero per cellula | ❓ per *Arthrospira* (da TEM quantitativa) | — | ❓ |

- **Nota storica.** Nelle stesse TEM compaiono anche i "**corpi cilindrici**" (a doppia membrana lamellare con nucleo massivo, talora a boomerang o a spirale nelle cellule in divisione) [5][8] ✅ — struttura la cui identità funzionale moderna resta incerta ❓; non inserire nel modello v1 se non come curiosità.
- **Per il 3D.** Icosaedro sfaccettato traslucido con reticolo interno di Rubisco; sezione che mostra il flusso HCO₃⁻ → CO₂. Livello molecolare possibile con strutture PDB del guscio ⚠️.
- **Fonti:** [5][8][24][25][31]

---

## 6. LIVELLO 5 — Inclusioni di riserva (la "dispensa")

Tutte prive di membrana (al più un monostrato lipidico o un rivestimento proteico) — differenza chiave dagli organelli eucariotici. La tesi [8] documenta in *S. platensis* un **interruttore metabolico netto a 17–20 °C**: sotto, riserva di azoto (cianoficina); sopra, riserva di carbonio (poliglucano) [5][8][42] ✅.

### 6.1 Granuli di poliglucano / glicogeno (riserva di carbonio)

- **In *S. platensis* (Nakuru): bastoncelli di Ø ~25 nm, lunghi fino a 450 nm, impacchettati in configurazione esagonale, collocati tra i tilacoidi** e presso i setti; abbondanti a 17–20 °C, in calo con l'intensità luminosa crescente; assenti a 30–37 °C con nitrato basso/medio [5][8][42] ✅. (Nei cianobatteri in genere: bastoncelli ~30 nm; rosette α 60–200 nm in *Synechocystis* [32] ⚠️.) Presenza confermata anche a −5 °C (aumento dei granuli) [24] ✅.

### 6.2 Granuli di cianoficina (riserva di azoto)

- Polimero unico dei cianobatteri: **multi-L-arginil-poli-L-aspartato** (arginina:aspartato 1:1 [33][8]), sintetizzato senza ribosomi. **In *S. platensis*: granuli periferici allineati lungo i setti, talora in numero costante; sotto i 17 °C fino a Ø 2400 nm e fino al 18% del volume cellulare (15,5 °C); sopra i 17 °C max ~630 nm** [5][8] ✅. A 15–17 °C la quantità correla positivamente con la concentrazione di nitrato [42] ✅.

### 6.3 Corpi di polifosfato (riserva di fosforo)

- Granuli sferici elettrondensi ("volutina"), tipicamente 200–400 nm nei cianobatteri [34] ⚠️; presenti in *S. platensis* [5][8] ✅. In *Synechococcus* mantengono contatto col DNA (possibile ruolo di fornitore di fosfato per la replicazione) [35] ⚠️ — bel dettaglio per il pannello del nucleoide.

### 6.4 Granuli di PHB (poliestere naturale)

- Poli-β-idrossibutirrato: accumulo dimostrato **proprio in *S. platensis***: fino al **6% del peso secco** in crescita esponenziale, poi mobilizzato [36] ✅; aumenta in carenza di fosforo [37] ✅. I "depositi lipidici" osservati in TEM potrebbero in parte essere PHB [5][8] ✅. (Stesso polimero delle bioplastiche PHA: aggancio didattico.)

### 6.5 Corpi lipidici / granuli osmiofili

- Goccioline lipidiche scure in TEM, associate ai tilacoidi; osservate in *S. platensis* [5][8] ✅ (riduzione di dimensione a −5 °C [24] ✅).

---

## 7. LIVELLO 6 — Aerotopi (vescicole gassose)

- **Che cos'è.** Il "giubbotto di salvataggio": aggregati (aerotopi) di centinaia di **vescicole gassose** — cilindri proteici cavi con estremità coniche, permeabili ai gas, che riducono la densità della cellula e la fanno galleggiare verso la luce. In *Arthrospira/Limnospira* sono **facoltative** e si formano tipicamente **presso i setti** [1] ✅.
- **Geometria in *S. platensis* (misure dirette [5][8] ✅):** diametro **~65 nm**, lunghezza **fino a 1000 nm**, coste proteiche con periodicità **4,0 nm**, impacchettamento denso ed **esagonale**, estremità coniche. (Range generale nei cianobatteri: Ø 65–115 nm, lunghezza 200–1200 nm, coste 4,0–5,0 nm [5][38] ✅/⚠️; parete ~2 nm GvpA + rinforzo GvpC [38] ⚠️.)
- **Dinamica:** collassano irreversibilmente sotto pressione (esperimento storico del "martello": la coltura affonda) [38][39] ⚠️.
- **Per il 3D.** Fascio esagonale di cilindri paralleli Ø 65 nm a punte coniche presso i setti; stato "collassato" come variante dinamica.
- **Fonti:** [1][5][8][38][39]

---

## 8. LIVELLO 7 — Nucleoide, ribosomi, citosol

### 8.1 Nucleoide (il "centro dati" senza membrana)

- DNA circolare **nudo nel citoplasma centrale** (centroplasma), intrecciato tra granuli e tilacoidi: nessuna membrana nucleare (punto didattico n. 1 del confronto procariote/eucariote). I carbossisomi risiedono in questa regione [5][8] ✅.
- **Genoma NIES-39:** cromosoma circolare ~**6,8 Mb**, **6630 geni** codificanti, 2 operoni rRNA, 40 tRNA; niente geni della nitrogenasi (non fissa N₂) [10][11] ✅.
- **Poliploidia:** i cianobatteri portano tipicamente **più copie del cromosoma per cellula** (es. *Synechocystis* decine–centinaia di copie a seconda della fase) [40] ⚠️; numero di copie in *Arthrospira*: ❓ (non misurato — dichiararlo nel pannello).
- Organizzazione 3D del DNA compattato visualizzata in *Synechococcus* con crio-tomografia [35] ⚠️.

### 8.2 Ribosomi

- Ribosomi **70S** liberi nel citoplasma (migliaia per cellula ⚠️ stima generica procariotica; conteggio specie-specifico ❓). Traduzione co-trascrizionale: il DNA è nello stesso compartimento.

### 8.3 Divisione cellulare

- Scissione binaria su un solo piano: anello di **FtsZ** al centro della cellula, setto che cresce centripeto (L-I/L-II/L-I [4][8] ✅); il tricoma si allunga per divisioni intercalari [6] ✅. FtsZ presente nel genoma [10] ✅; dinamica dell'anello da specie modello ⚠️. La forma del setto è legata meccanicamente all'elica del tricoma (capitolo III di [8]) ✅.

---

## 9. Cosa NON deve esserci nel modello (errori da evitare)

Checklist anti-errore per la fase grafica — ogni voce è un errore già visto in illustrazioni divulgative:

1. ❌ **Nucleo con membrana** → c'è solo il nucleoide libero.
2. ❌ **Mitocondri** → la respirazione avviene su membrana plasmatica e tilacoidi [16].
3. ❌ **Cloroplasti** → i tilacoidi sono liberi nel citoplasma (il cianobatterio È l'antenato del cloroplasto — box didattico sull'endosimbiosi).
4. ❌ **Reticolo endoplasmatico, Golgi, lisosomi, vacuolo vegetale** → assenti nei procarioti.
5. ❌ **Flagelli** → si muove per scivolamento + rotazione [12][29].
6. ❌ **Eterocisti o acineti** → *Arthrospira* non fissa l'azoto e non produce cellule differenziate di resistenza [10].
7. ❌ **Clorofilla b / "verde foglia"** → solo clorofilla *a* + ficocianina: il colore giusto è blu-verde.
8. ❌ **Ficoeritrina abbondante (rosso)** → assente/trascurabile [17].
9. ❌ **Parete spessa tipo Gram-positivo o cellulosa vegetale** → parete sottile ~60 nm in 4 strati con peptidoglicano [4][8].
10. ❌ **"Vacuolo gassoso" come singola bolla** → sono fasci di centinaia di piccole vescicole proteiche [5][38].
11. ❌ **Mesosomi** → strutture osservate nelle TEM storiche [8] ma oggi considerate artefatti di fissazione; non inserirle.

---

## 10. Variabilità ambientale (per gli "stati" dinamici del modello)

| Condizione | Effetto osservato | Fonte | Confidenza |
|---|---|---|---|
| ↑ temperatura | elica più serrata: 15 °C → passo 152 µm, Ø 69 µm; 30 °C → passo 113 µm, Ø 36 µm; possibile inversione del verso (30→32–34 °C) | [5][8][9] | ✅ |
| ↑ intensità luminosa | **nessun effetto su passo/diametro dell'elica**; meno ficobilisomi; meno granuli di poliglucano | [5][8] | ✅ |
| **Interruttore 17–20 °C** | sotto: granuli di cianoficina abbondanti (fino a 18% del volume, Ø fino a 2,4 µm); sopra: sostituiti bruscamente da granuli di poliglucano | [5][8][42] | ✅ |
| ↑ nitrato (a 15–17 °C) | più cianoficina | [42] | ✅ |
| liquido → solido | transizione reversibile elica ↔ spirale piatta | cit. in [3]; cap. IV di [8] | ✅ |
| −5 °C | pareti più sottili, ficobilisomi scompaiono, tilacoidi meno definiti, carbossisomi più voluminosi, corpi lipidici ridotti, più granuli di poliglucano | [24] | ✅ |
| Carenza di azoto | degradazione dei ficobilisomi (clorosi), accumulo di glicogeno | [32] | ⚠️ |
| Carenza di fosforo | accumulo di PHB | [37] | ✅ |
| Luce forte blu-verde | attivazione OCP (fotoprotezione, quenching dei ficobilisomi) | [22] | ✅ (proteina di *A. maxima*) |
| Coltura prolungata | comparsa di morfotipi lineari; perdita facoltativa di aerotopi | [9][30][1] | ✅ |

---

## 11. Lacune residue (aggiornate in v1.1)

**Chiuse dalla tesi [8]:** spessori dei 4 strati parietali (10–15 nm ciascuno, totale ≤60 nm); spaziatura tilacoidi (~56 nm); dimensioni vescicole gassose (Ø 65 nm × ≤1000 nm, coste 4,0 nm); dimensioni cianoficina (≤2,4 µm) e poliglucano (Ø 25 nm × ≤450 nm); dimensione carbossisomi (≤500 nm); presenza dei pori settali in *S. platensis*; parametri quantitativi elica-temperatura.

**Ancora aperte (nessuna blocca l'avvio della modellazione):**
1. **Numero di carbossisomi per cellula** → TEM quantitativa mai pubblicata; nel modello: "alcuni per cellula" con flag.
2. **Ploidia di *Arthrospira*** → non misurata; nel pannello: "verosimilmente multiploide come gli altri cianobatteri [40]".
3. **Giunzioni settali molecolari in *Limnospira*** → pori settali osservati [4][8], ma il complesso proteico gate (tipo *Anabaena* [14][15]) non è caratterizzato.
4. **Velocità di scivolamento in µm/s per NIES-39** → nel paper [29] (accesso bloccato in sessione; da estrarre in seguito).
5. **Dimensione media degli ormogoni** → il valore 5–25 cellule è generico di letteratura.
6. **Struttura crio-EM del ficobilisoma di *Arthrospira*** → non esiste; usare architetture affini [21] dichiarandolo.
7. **Spessore membrana plasmatica specie-specifico** → usare ~7–8 nm generico con flag.
8. **Identità moderna dei "corpi cilindrici"** [5][8] → curiosità storica, fuori dal modello v1.

---

## 12. Bibliografia

Dove i nomi degli autori non sono stati verificati direttamente, la voce riporta solo titolo, rivista e identificativo.

1. Nowicka-Krawczyk P., Mühlsteinová R., Hauer T. (2019). *Detailed characterization of the Arthrospira type species separating commercially grown taxa into the new genus Limnospira (Cyanobacteria)*. **Scientific Reports** 9:694. https://doi.org/10.1038/s41598-018-36831-0 — testo libero: https://pmc.ncbi.nlm.nih.gov/articles/PMC6345927/
2. *Spirulina/Arthrospira/Limnospira — Three Names of the Single Organism* (2024). Review. https://pmc.ncbi.nlm.nih.gov/articles/PMC11395459/
3. *Monospecific renaming within the cyanobacterial genus Limnospira (Spirulina) and consequences for food authorization* (2023). **Journal of Applied Microbiology** 134(8):lxad159. https://doi.org/10.1093/jambio/lxad159
4. van Eykelenburg C. (1977). *On the morphology and ultrastructure of the cell wall of Spirulina platensis*. **Antonie van Leeuwenhoek** 43:89–99. https://doi.org/10.1007/BF00395664 (PubMed 413479) — riprodotto come cap. II di [8]
5. van Eykelenburg C. (1979). *The ultrastructure of Spirulina platensis in relation to temperature and light intensity*. **Antonie van Leeuwenhoek** 45:369–390. https://doi.org/10.1007/BF00443277 — riprodotto come cap. VII di [8]
6. Ciferri O. (1983). *Spirulina, the edible microorganism*. **Microbiological Reviews** 47(4):551–578. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC283708/
7. Tomaselli L. (1997). *Morphology, ultrastructure and taxonomy of Arthrospira (Spirulina) maxima and Arthrospira (Spirulina) platensis*. In: Vonshak A. (ed.), *Spirulina platensis (Arthrospira): Physiology, Cell-Biology and Biotechnology*, Taylor & Francis, pp. 1–16.
8. van Eykelenburg C. (1980). *Spirulina platensis: morphology and ultrastructure*. Tesi di dottorato, TU Delft, discussa il 20/11/1980. Copia locale: `docs/fonti/vanEykelenburg-tesi-TUDelft.pdf`; testo OCR: `docs/fonti/vanEykelenburg-tesi-testo-OCR.txt`. Fonte: https://repository.tudelft.nl/file/File_202ee8be-75f1-4211-bfad-f40c8d539d0d
9. Mühling M. et al. (2003). *Reversal of helix orientation in the cyanobacterium Arthrospira*. **Journal of Phycology** 39:360–367. https://doi.org/10.1046/j.1529-8817.2003.01246.x
10. Fujisawa T. et al. (2010). *Genomic structure of an economically important cyanobacterium, Arthrospira (Spirulina) platensis NIES-39*. **DNA Research** 17(2):85–103. https://doi.org/10.1093/dnares/dsq004
11. *Complete Genome Sequence of the Edible Filamentous Cyanobacterium Arthrospira platensis NIES-39, Based on Long-Read Sequencing* (2023). **Microbiology Resource Announcements**. https://doi.org/10.1128/mra.01139-22 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9872641/
12. Hoiczyk E., Baumeister W. (1998). *The junctional pore complex, a prokaryotic secretion organelle, is the molecular motor underlying gliding motility in cyanobacteria*. **Current Biology** 8:1161–1168. https://www.sciencedirect.com/science/article/pii/S0960982207004873
13. Hoiczyk E., Baumeister W. (1997). *Oscillin, an extracellular, Ca²⁺-binding glycoprotein essential for the gliding motility of cyanobacteria*. **Molecular Microbiology** 26:699–708.
14. Weiss G.L., Kieninger A.-K., Maldener I., Forchhammer K., Pilhofer M. (2019). *Structure and function of a bacterial gap junction analog*. **Cell** 178:374–384 (giunzioni settali, crio-ET). Review: *Cell–cell communication through septal junctions in filamentous cyanobacteria* (2021), **Current Opinion in Microbiology**. https://pubmed.ncbi.nlm.nih.gov/33676334/
15. *SepN is a septal junction component required for gated cell–cell communication in the filamentous cyanobacterium Nostoc* (2022). **Nature Communications** 13. https://doi.org/10.1038/s41467-022-34946-7
16. Mullineaux C.W. (2014). *Co-existence of photosynthetic and respiratory activities in cyanobacterial thylakoid membranes*. **Biochimica et Biophysica Acta – Bioenergetics** 1837:503–511. https://www.sciencedirect.com/science/article/pii/S0005272813002119
17. *Light regulation of phycobilisome structure and gene expression in Spirulina platensis C1 (Arthrospira sp. PCC 9438)* (1999). **Plant and Cell Physiology** 40(12):1194–1202. https://academic.oup.com/pcp/article-abstract/40/12/1194/1911115
18. *Enhanced biomass and phycocyanin production of Arthrospira (Spirulina) platensis by a cultivation management strategy* (2021). **Bioresource Technology**. https://www.sciencedirect.com/science/article/abs/pii/S096085242101419X (CPC+APC = 15–20% p.s.; fino a ~24%)
19. Wang X.-Q. et al. (2001). *Structure of C-phycocyanin from Spirulina platensis at 2.2 Å resolution*. **Acta Crystallographica D** 57:784–792. PDB **1GH0**: https://www.rcsb.org/structure/1GH0
20. *Crystal structure of a light-harvesting protein C-phycocyanin from Spirulina platensis* (2001). **BBRC**. PDB **1HA7**: https://www.rcsb.org/structure/1HA7
21. *Core and rod structures of a thermophilic cyanobacterial light-harvesting phycobilisome* (2022). **Nature Communications** 13. https://doi.org/10.1038/s41467-022-30962-9 — strutture correlate: PDB 7EYD (*Anabaena* PCC 7120), 7EXT (*Synechococcus* PCC 7002)
22. Kerfeld C.A. et al. (2003). Struttura cristallina dell'Orange Carotenoid Protein da *Arthrospira maxima* a 2,1 Å. **Structure** 11:55–65. PDB **1M98** — contesto: https://en.wikipedia.org/wiki/Orange_carotenoid_protein
23. *Two Classes of Pigments, Carotenoids and C-Phycocyanin, in Spirulina Powder and Their Antioxidant Activities* (2018). **Molecules** 23(8):2065. https://doi.org/10.3390/molecules23082065
24. *Low-Temperature Morphology and Ultrastructure of Arthrospira platensis Collected from Alkaline Lakes on the Erdos Plateau in China*. **Polish Journal of Environmental Studies**. https://www.pjoes.com/Low-Temperature-Morphology-and-Ultrastructure-nof-Arthrospira-platensis-Collected,187141,0,2.html
25. Rae B.D., Long B.M., Badger M.R., Price G.D. (2013). *Functions, compositions, and evolution of the two types of carboxysomes*. **Microbiology and Molecular Biology Reviews** 77:357–379. https://journals.asm.org/doi/10.1128/mmbr.00061-12 (dimensioni β-carbossisomi anche da: *Rubisco packaging and stoichiometric composition of a native β-carboxysome*, bioRxiv 2024)
26. Sili C., Torzillo G., Vonshak A. (2012). *Arthrospira (Spirulina)*. In: Whitton B.A. (ed.), *Ecology of Cyanobacteria II*, Springer. https://doi.org/10.1007/978-94-007-3855-3_25 (valori citati via [27])
27. *Morphology and Growth of Arthrospira platensis during Cultivation in a Flat-Type Bioreactor* (2021). **Life** 11(6):536. https://doi.org/10.3390/life11060536 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8229077/
28. *The biomechanical role of overall-shape transformation in a primitive multicellular organism: dimorphism in Arthrospira platensis* (2018). **PLOS ONE** 13:e0196383. https://doi.org/10.1371/journal.pone.0196383
29. *Helicoid Morphology of Arthrospira platensis NIES-39 Confers Temperature Compensation in the Longitudinal Movement Velocity of Its Trichomes* (2024). **Phycology** 4(1):6. https://doi.org/10.3390/phycology4010006
30. *Genetic Responses of Metabolically Active Limnospira indica Strain PCC 8005 Exposed to γ-Radiation during Its Lifecycle* (2021). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8400943/ (morfotipi P2/P6)
31. Wang H. et al. (2019). *Rubisco condensate formation by CcmM in β-carboxysome biogenesis*. **Nature** 566:131–135. https://doi.org/10.1038/s41586-019-0880-5
32. *Altering the Structure of Carbohydrate Storage Granules in the Cyanobacterium Synechocystis sp. PCC 6803 through Branching-Enzyme Truncations* (2015). **Journal of Bacteriology**. https://journals.asm.org/doi/10.1128/jb.00830-15 (granuli ~40 nm tra i tilacoidi; rosette α 60–200 nm). Contesto fisiologico: *The Multiple Functions of Common Microbial Carbon Polymers, Glycogen and PHB…* (2016), **Frontiers in Microbiology** 7:966.
33. Simon R.D. (1971). *Cyanophycin granules from the blue-green alga Anabaena cylindrica: a reserve material consisting of copolymers of aspartic acid and arginine*. **PNAS** 68:265–267. V. anche: *Structure and Composition of Cyanophycin Granules in the Cyanobacterium Aphanocapsa 6308*, **Journal of Bacteriology**. https://www.researchgate.net/publication/16430706
34. *Biogenic Polyphosphate Nanoparticles from a Marine Cyanobacterium Synechococcus sp. PCC 7002* (2018). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6163655/ (corpi di polifosfato 200–400 nm nei cianobatteri, con riferimenti)
35. *Ultrastructure of compacted DNA in cyanobacteria by high-voltage cryo-electron tomography* (2016). **Scientific Reports** 6:34934. https://doi.org/10.1038/srep34934
36. Campbell J., Stevens S.E., Balkwill D.L. (1982). *Accumulation of poly-beta-hydroxybutyrate in Spirulina platensis*. **Journal of Bacteriology** 149:361–363. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC216630/
37. *Poly-β-hydroxybutyrate accumulation in Nostoc muscorum and Spirulina platensis under phosphate limitation* (2005). **Journal of Plant Physiology**. https://www.researchgate.net/publication/7348236 — v. anche *Biosynthesis and mobilization of poly(3-hydroxybutyrate) by Spirulina platensis* (2005): https://www.sciencedirect.com/science/article/abs/pii/S014181300500084X
38. *Structural biology of microbial gas vesicles: historical milestones and current knowledge* (2024). **Biochemical Society Transactions** 52:205–. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10903477/
39. Walsby A.E. (1994). *Gas vesicles*. **Microbiological Reviews** 58:94–144. (Nella tesi [8] il riferimento d'epoca è Walsby 1978.)
40. Griese M., Lange C., Soppa J. (2011). *Ploidy in cyanobacteria*. **FEMS Microbiology Letters** 323:124–131. https://academic.oup.com/femsle/article/323/2/124/476031
41. van Eykelenburg C. (1978). *A glucan from the cell wall of the cyanobacterium Spirulina platensis*. **Antonie van Leeuwenhoek** 44:321–327 — riprodotto come cap. V di [8]. (β-1,2-glucano; probabile origine: strato fibrillare interno L-I.)
42. van Eykelenburg C. (1980). *Ecophysiological studies on Spirulina platensis: effect of temperature, light intensity and nitrate concentration on growth and ultrastructure*. **Antonie van Leeuwenhoek** 46:113–127 — riprodotto come cap. VIII di [8].
43. Deschoenmaeker F., Facchini R., Cabrera Pino J.C., Bayon-Vicente G., Sachdeva N., Flammang P., Wattiez R. (2016). *Nitrogen depletion in Arthrospira sp. PCC 8005, an ultrastructural point of view*. **Journal of Structural Biology** 196:385–393. (Titolo e autori corretti il 08/09/2026 contro il PDF locale: la voce precedente citava un altro lavoro dello stesso gruppo.) https://doi.org/10.1016/j.jsb.2016.08.007 — copia locale: `docs/fonti/deschoenmaeker-2016-ultrastructure.pdf`. (Setto 40 nm nutrito → 100–200 nm in carenza; guaina EPS ~50 nm → 50–200 nm; parete 35–40 nm su questo ceppo.)

---

*Documento generato con ricerca assistita (Claude) e verifica incrociata delle fonti. v1.1 del 20/08/2026: dati ultrastrutturali integrati direttamente dal testo OCR della tesi [8]. Le voci ⚠️ e ❓ vanno risolte o dichiarate esplicitamente nell'app.*
