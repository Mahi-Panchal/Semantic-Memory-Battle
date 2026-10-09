/**
 * vocab.js — WordMind VOCABULARY
 * ~1 500 common English words (nouns, adjectives, verbs), lowercase, letters only, length >= 3
 * Loaded before script.js so VOCABULARY is available globally.
 */
const VOCABULARY = [
  // A
  "able","above","absence","abstract","accept","access","account","achieve","act","action",
  "active","activity","adapt","add","address","adjust","admire","admit","adopt","advance",
  "affect","afford","age","agree","aim","air","alarm","alive","allow","alone",
  "alter","anger","announce","answer","appeal","appear","apply","approve","argue","arise",
  "arm","army","arrange","arrive","art","ask","assist","assume","attach","attempt",
  "attract","audio","aware","away",
  // B
  "back","balance","bank","base","beauty","begin","belief","belong","bend","bite",
  "black","blade","blend","blind","block","blood","blow","blue","body","bone",
  "book","border","born","bottle","bounce","branch","brave","break","bright","bring",
  "broad","brown","brush","build","burn","burst","bush","busy","buy",
  // C
  "calm","call","carry","cast","catch","cause","cell","chain","change","charge",
  "chase","check","choose","circle","claim","class","clean","clear","climb","close",
  "cloud","coast","cold","collect","color","combine","come","compare","compete","complex",
  "concern","connect","consider","contain","continue","control","cook","core","count","cover",
  "create","cross","crowd","crush","current","cut","cycle",
  // D
  "dance","dark","data","deal","decide","declare","deep","define","demand","depth",
  "design","detail","develop","die","differ","direct","discover","discuss","display","distance",
  "divide","draw","dream","drive","drop","dry","dust",
  // E
  "earn","earth","east","edge","effect","effort","empty","enable","end","energy",
  "engine","enter","equal","establish","even","examine","exist","expect","explain","expose",
  "extend","extra",
  // F
  "face","fact","fail","fall","false","fast","fear","feel","field","fill",
  "find","firm","focus","follow","force","form","forward","free","fresh","friend",
  "from","full","fund","future",
  // G
  "gain","gather","give","goal","good","grab","great","green","grow","guide",
  // H
  "handle","happen","hard","harm","have","heat","help","high","hold","hope",
  "hurt",
  // I
  "identify","impact","improve","include","increase","indicate","influence","information","inner","insert",
  "inspect","inspire","interpret","introduce","invest","involve","issue",
  // J
  "join","judge","jump",
  // K
  "keep","kill","know",
  // L
  "large","last","lead","learn","leave","let","level","light","like","link",
  "list","listen","live","long","look","lose","loud","love",
  // M
  "main","make","manage","mean","measure","meet","mind","miss","move","must",
  // N
  "name","narrow","need","next","notice","number",
  // O
  "obtain","open","order","own",
  // P
  "pain","pass","pay","perform","place","plan","play","point","power","prepare",
  "prove","push","put",
  // Q
  "question",
  // R
  "raise","reach","read","receive","reduce","remain","remove","repeat","replace","represent",
  "require","respond","return","reveal","rise","risk","run",
  // S
  "save","seek","select","send","serve","show","sign","solve","sort","speak",
  "start","stay","stop","study","support","suggest",
  // T
  "take","tell","tend","test","think","try","turn",
  // U
  "understand","use",
  // V
  "value","view","visit",
  // W
  "wait","walk","want","watch","work","write",

  // ====== NOUNS - NATURE & ENVIRONMENT ======
  "ocean","sea","wave","tide","current","whale","dolphin","coral","reef","depth",
  "abyss","ship","island","sailor","shore","beach","tsunami","submarine","anchor","harbor",
  "water","river","lake","stream","rain","drop","ice","vapor","liquid","flood",
  "fire","flame","spark","heat","burn","ember","ash","smoke","inferno","blaze",
  "warmth","torch","candle","volcano","lava","sun","fury","galaxy","star","planet",
  "cosmos","universe","nebula","asteroid","comet","orbit","solar","lunar","gravity","telescope",
  "space","blackhole","void","astronaut","constellation","forest","tree","wood","leaf","branch",
  "root","jungle","canopy","wildlife","moss","bark","pine","nature","flora","path",
  "green","wilderness","mountain","peak","summit","rock","cliff","altitude","ridge","slope",
  "snow","hiking","valley","canyon","boulder","elevation","glacier","oasis","dune","desert",
  "tundra","savanna","meadow","prairie","grove","foliage","blossom","petal","flower","nectar",
  "honey","bee","insect","beetle","butterfly","moth","cocoon","silk","web","spider",
  "storm","thunder","lightning","wind","cloud","gale","tempest","hurricane","cyclone","tornado",
  "earth","ground","soil","dirt","continent","clay","mud","terrain","globe","crust",
  "mineral","sky","atmosphere","horizon","dawn","dusk","twilight","midnight","rainbow",
  "light","beam","ray","glow","shine","bright","laser","flash","shadow","reflection",
  "prism","spectrum","crystal","diamond","amber","silver","gold","copper","iron","steel",
  "bronze","plasma","frost","blizzard","creek","coast","cliff","cave","tunnel",
  "sand","pebble","stone","mud","swamp","marsh","wetland","delta","lagoon","fjord",

  // ====== NOUNS - LIVING THINGS ======
  "brain","mind","thought","neuron","synapse","memory","intelligence","idea","logic","dream",
  "consciousness","head","nerve","cortex","mental","genius","imagination","wisdom","reason","sense",
  "predator","hunter","falcon","hawk","eagle","wolf","tiger","panther","leopard","fang",
  "claw","talon","scale","reptile","serpent","dragon","beast","monster","myth","legend",
  "fable","lore","chronicle","ghost","bird","wing","fish","swim","cat","dog",
  "deer","bear","rabbit","horse","cow","pig","sheep","goat","elephant","giraffe",
  "lion","cheetah","hyena","zebra","antelope","monkey","gorilla","chimp","baboon","parrot",
  "penguin","seal","walrus","shark","octopus","squid","crab","lobster","shrimp","jellyfish",
  "turtle","crocodile","alligator","lizard","frog","toad","salamander","worm","ant","fly",
  "mosquito","wasp","hornet","dragonfly","cricket","grasshopper","beetle","cockroach","termite","tick",
  "oak","maple","birch","willow","bamboo","cactus","fern","moss","algae","mushroom",
  "wheat","rice","corn","barley","oat","rye","soybean","cotton","tobacco","hemp",
  "apple","orange","banana","grape","cherry","strawberry","blueberry","raspberry","melon","mango",
  "pineapple","coconut","avocado","peach","pear","plum","lemon","lime","fig","date",
  "tomato","potato","carrot","broccoli","spinach","lettuce","cucumber","onion","garlic","pepper",

  // ====== NOUNS - HUMAN WORLD ======
  "person","people","child","adult","woman","man","family","group","team","society",
  "culture","tradition","custom","ritual","ceremony","festival","celebration","holiday","birthday","anniversary",
  "city","town","village","neighborhood","community","country","nation","empire","republic","kingdom",
  "government","politics","law","justice","court","police","military","army","navy","soldier",
  "war","peace","conflict","battle","victory","defeat","revolution","rebellion","protest","vote",
  "economy","market","trade","money","currency","bank","investment","profit","loss","budget",
  "business","company","corporation","factory","industry","production","worker","employer","employee","manager",
  "science","research","experiment","discovery","invention","technology","machine","device","computer","robot",
  "internet","network","code","algorithm","software","hardware","digital","virtual","artificial","data",
  "medicine","doctor","hospital","patient","surgery","therapy","vaccine","disease","virus","bacteria",
  "health","fitness","exercise","sport","athlete","competition","championship","tournament","league","team",
  "music","song","melody","rhythm","harmony","tempo","tune","beat","chord","symphony",
  "orchestra","note","voice","guitar","piano","drum","violin","saxophone","trumpet","flute",
  "art","painting","sculpture","drawing","photography","film","cinema","theater","performance","dance",
  "book","story","novel","poem","verse","rhyme","chapter","author","writer","reader",
  "school","education","student","teacher","class","lesson","study","knowledge","skill","talent",
  "house","home","room","door","window","wall","roof","floor","kitchen","bedroom",
  "furniture","table","chair","bed","sofa","lamp","carpet","curtain","shelf","wardrobe",
  "food","meal","breakfast","lunch","dinner","snack","recipe","ingredient","cooking","flavor",
  "bread","butter","cheese","milk","egg","meat","fish","soup","salad","sandwich",
  "coffee","tea","juice","soda","water","wine","beer","alcohol","sugar","salt",
  "clothes","shirt","pants","dress","shoes","hat","glove","coat","jacket","suit",
  "color","red","blue","yellow","orange","purple","pink","brown","black","white",
  "shape","circle","square","triangle","rectangle","sphere","cube","line","angle","curve",
  "number","time","date","year","month","week","day","hour","minute","second",
  "speed","distance","weight","size","temperature","pressure","volume","area","energy","force",
  "vehicle","car","bus","train","airplane","boat","bicycle","motorcycle","truck","helicopter",
  "road","highway","bridge","tunnel","railway","airport","port","station","parking","traffic",
  "tool","hammer","nail","screw","wrench","drill","saw","knife","scissors","needle",
  "material","wood","metal","plastic","glass","rubber","fabric","paper","leather","clay",
  "building","tower","bridge","dam","monument","statue","castle","temple","church","mosque",
  "museum","library","theater","stadium","hospital","school","office","mall","market","park",

  // ====== ABSTRACT & CONCEPTUAL ======
  "time","clock","second","minute","century","eternity","history","delay","moment","past",
  "future","present","beginning","ending","cycle","period","phase","duration","instant","era",
  "truth","lie","fact","opinion","belief","doubt","certainty","possibility","probability","chance",
  "success","failure","progress","growth","change","evolution","revolution","crisis","solution","problem",
  "beauty","ugly","good","evil","moral","ethics","virtue","sin","justice","mercy",
  "love","hate","joy","sadness","anger","fear","surprise","disgust","pride","shame",
  "freedom","prison","power","weakness","strength","courage","cowardice","loyalty","betrayal","trust",
  "relationship","friendship","family","marriage","divorce","birth","death","life","existence","identity",
  "meaning","purpose","goal","vision","mission","strategy","plan","method","process","system",
  "pattern","structure","order","chaos","complexity","simplicity","balance","harmony","conflict","tension",
  "communication","language","word","sentence","meaning","sign","symbol","code","signal","message",
  "perception","sensation","emotion","feeling","thought","concept","idea","imagination","creativity","innovation",
  "memory","experience","learning","understanding","knowledge","wisdom","intelligence","consciousness","awareness","attention",

  // ====== SCIENCE & ACADEMIC ======
  "physics","chemistry","biology","mathematics","geometry","algebra","calculus","statistics","logic","philosophy",
  "atom","molecule","element","compound","reaction","energy","quantum","particle","wave","field",
  "gravity","magnetism","electricity","radiation","frequency","wavelength","amplitude","velocity","momentum","force",
  "cell","gene","protein","enzyme","hormone","chromosome","evolution","mutation","species","ecology",
  "ecosystem","habitat","population","organism","anatomy","skeleton","muscle","tissue","organ","system",
  "climate","weather","season","temperature","humidity","pressure","wind","precipitation","drought","flood",
  "geology","erosion","sediment","fossil","continent","plate","volcano","earthquake","tsunami","landslide",
  "astronomy","telescope","satellite","rocket","orbit","gravity","blackhole","nebula","supernova","quasar",

  // ====== EMOTIONS & PSYCHOLOGY ======
  "happy","sad","angry","afraid","surprised","disgusted","bored","excited","nervous","relaxed",
  "confident","shy","jealous","lonely","grateful","hopeful","disappointed","frustrated","confused","curious",
  "motivated","determined","creative","patient","impulsive","stubborn","flexible","empathetic","critical","optimistic",
  "stress","anxiety","depression","trauma","healing","recovery","therapy","meditation","mindfulness","wellness",

  // ====== ACTIVITIES & SPORTS ======
  "running","swimming","cycling","hiking","climbing","skiing","surfing","diving","wrestling","boxing",
  "football","basketball","baseball","tennis","golf","cricket","rugby","volleyball","hockey","soccer",
  "gardening","cooking","painting","writing","reading","singing","playing","working","traveling","exploring",
  "hunting","fishing","camping","walking","jogging","stretching","lifting","throwing","catching","jumping",

  // ====== ADDITIONAL COMMON WORDS ======
  "about","after","again","also","always","another","any","around","asked","away",
  "back","because","been","before","being","between","both","came","come","could",
  "did","does","done","down","during","each","even","every","from","gave",
  "goes","gone","good","gotten","give","has","have","her","here","him",
  "his","how","just","know","knew","made","make","many","more","most",
  "much","must","new","not","now","often","only","other","our","out",
  "own","part","place","play","possible","put","really","said","same","saw",
  "say","see","seen","she","some","still","such","than","that","their",
  "them","then","there","these","they","thing","those","though","through","told",
  "too","took","two","under","until","upon","used","very","want","was",
  "were","what","when","where","which","while","who","will","with","would",
  "year","yet","you","your",

  // ====== TECHNOLOGY & MODERN ======
  "artificial","intelligence","machine","learning","neural","network","deep","model","training","dataset",
  "algorithm","prediction","classification","regression","clustering","feature","vector","embedding","transformer","attention",
  "smartphone","tablet","laptop","desktop","keyboard","monitor","mouse","screen","display","interface",
  "application","program","function","variable","database","server","client","browser","website","social",
  "search","filter","sort","query","index","cache","memory","storage","processor","circuit",
  "wireless","signal","frequency","bandwidth","latency","protocol","encryption","security","privacy","authentication",
  "blockchain","cryptocurrency","token","wallet","transaction","ledger","decentralized","digital","virtual","augmented",
  "drone","robot","automation","sensor","camera","microphone","speaker","battery","charge","power",

  // ====== HOUSE & EVERYDAY ======
  "morning","afternoon","evening","night","sleep","wake","shower","bath","clean","dirty",
  "hot","cold","warm","cool","dry","wet","heavy","light","fast","slow",
  "big","small","large","tiny","long","short","tall","wide","narrow","thick",
  "smooth","rough","sharp","dull","soft","hard","strong","weak","old","new",
  "open","closed","inside","outside","above","below","beside","behind","front","back",
  "left","right","straight","curved","flat","round","hollow","solid","empty","full",
  "loud","quiet","bright","dark","clear","blurry","visible","invisible","real","fake",

  // Additional unique words to reach ~2000 total
  "saga","myth","epic","tale","quest","hero","villain","warrior","knight","wizard",
  "magic","spell","curse","blessing","portal","realm","dimension","alternate","parallel","infinite",
  "boundary","limit","threshold","margin","edge","border","frontier","horizon","zenith","nadir",
  "apex","peak","summit","pinnacle","base","foundation","root","core","center","hub",
  "radius","diameter","circumference","perimeter","area","volume","surface","depth","height","width",
  "angle","degree","rotation","revolution","spiral","helix","fractal","pattern","sequence","series",
  "harmony","melody","rhythm","beat","tempo","pitch","tone","note","scale","chord",
  "color","hue","saturation","brightness","contrast","shade","tint","gradient","blend","mix",
  "texture","pattern","shape","form","structure","design","layout","composition","balance","proportion",
  "motion","movement","direction","orientation","position","location","coordinate","distance","proximity","adjacency"
];

VOCABULARY.push("animal","bug","pest","amoeba","mammal","prey","plant","moon","fruit","vegetable","movie","game","ball","plane","garden","phone","math","price","shop","reptile","predator","insect","organism","microbe","parasite","creature","wildlife","livestock");

// Deduplicate and ensure quality
(function cleanVocabulary() {
  const seen = new Set();
  const cleaned = [];
  for (const w of VOCABULARY) {
    const lower = w.toLowerCase().trim();
    if (/^[a-z]{3,}$/.test(lower) && !seen.has(lower)) {
      seen.add(lower);
      cleaned.push(lower);
    }
  }
  VOCABULARY.length = 0;
  VOCABULARY.push(...cleaned);
})();
