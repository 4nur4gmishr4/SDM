/**
 * Advanced Bilingual (Hinglish/Hindi/English) & Fuzzy Search Engine
 * for Sai Darshan Shopping Mart (SDSM)
 *
 * Capabilities:
 * 1. 200+ Indian Grocery Hinglish & Hindi transliterated synonyms
 *    (e.g., 'shakkar' -> 'sugar', 'namak' -> 'salt', 'tel' -> 'oil', 'doodh' -> 'milk')
 * 2. Fuzzy Typo Matching using Levenshtein distance
 *    (e.g., 'shakar', 'suger', 'cadbery', 'colget', 'detol', 'magy', 'biscut')
 * 3. Intelligent Multi-factor Relevance Scoring
 *    (Exact match > Prefix match > Brand match > Synonym match > Fuzzy match)
 * 4. Query Autocomplete / Search Suggestions
 */

// ---------------------------------------------------------------------------
// 1. Comprehensive Bilingual Grocery Synonym Dictionary
// ---------------------------------------------------------------------------

export const SYNONYM_MAP: Record<string, string[]> = {
  // --- Sugar & Sweeteners ---
  'shakkar': ['sugar', 'cheeni', 'chini', 'madhur', 'sakhar', 'bura', 'boora', 'jaggery', 'gud', 'gur', 'khand'],
  'shakar': ['sugar', 'cheeni', 'chini', 'madhur', 'sakhar'],
  'sakhar': ['sugar', 'cheeni', 'chini', 'madhur', 'shakkar'],
  'cheeni': ['sugar', 'madhur', 'shakkar', 'chini', 'pure sugar'],
  'chini': ['sugar', 'madhur', 'shakkar', 'cheeni'],
  'sugar': ['sugar', 'madhur', 'cheeni', 'shakkar'],
  'bura': ['sugar', 'boora', 'shakkar', 'cheeni'],
  'boora': ['sugar', 'bura', 'shakkar'],
  'misri': ['sugar', 'mishri', 'candy sugar'],
  'mishri': ['sugar', 'misri'],
  'gud': ['jaggery', 'guda', 'gur'],
  'gur': ['jaggery', 'gud'],
  'jaggery': ['gud', 'gur', 'jaggery powder'],

  // --- Salt ---
  'namak': ['salt', 'tata salt', 'iodised salt', 'rock salt', 'sendha namak', 'black salt', 'kala namak'],
  'salt': ['salt', 'namak', 'tata salt'],
  'sendha': ['rock salt', 'sendha namak', 'salt'],
  'kala namak': ['black salt', 'rock salt', 'namak'],

  // --- Dairy & Ghee ---
  'doodh': ['milk', 'amul taaza', 'amul gold', 'amul cow', 'dairy whitener', 'toned milk', 'moti'],
  'dudh': ['milk', 'amul taaza', 'amul gold', 'dairy whitener'],
  'dhudh': ['milk', 'amul taaza', 'amul gold'],
  'milk': ['milk', 'doodh', 'amul', 'taaza', 'gold'],
  'dahi': ['curd', 'masti', 'yogurt', 'amul masti curd', 'cup curd', 'pouch curd'],
  'dahee': ['curd', 'masti', 'dahi'],
  'curd': ['curd', 'dahi', 'masti', 'yogurt'],
  'yogurt': ['curd', 'dahi', 'greek yogurt'],
  'makhan': ['butter', 'amul butter', 'maska', 'table butter', 'salted butter'],
  'maska': ['butter', 'amul butter', 'maska chaska'],
  'butter': ['butter', 'amul butter', 'makhan', 'delicious'],
  'ghee': ['ghee', 'pure ghee', 'desi ghee', 'cow ghee', 'amul ghee', 'patanjali ghee', 'ananda'],
  'ghi': ['ghee', 'pure ghee', 'cow ghee'],
  'desi ghee': ['ghee', 'cow ghee', 'pure ghee'],
  'paneer': ['paneer', 'cottage cheese', 'fresh paneer', 'amul paneer', 'malai paneer'],
  'panir': ['paneer', 'cottage cheese'],
  'cheese': ['cheese', 'cheese slices', 'cheese cubes', 'cheese block', 'mozzarella', 'amul cheese', 'britannia cheese'],
  'shrikhand': ['shrikhand', 'amul shrikhand', 'kesar shrikhand', 'elaichi shrikhand'],

  // --- Cooking Oils & Vanaspati ---
  'tel': ['oil', 'refined oil', 'mustard oil', 'sunflower oil', 'soyabean oil', 'kachi ghani', 'fortune oil', 'dhara', 'emami', 'gemini'],
  'tail': ['oil', 'mustard oil', 'refined oil'],
  'thel': ['oil', 'mustard oil'],
  'oil': ['oil', 'tel', 'fortune', 'mustard', 'refined', 'soyabean', 'sunflower', 'kachi ghani'],
  'sarson': ['mustard oil', 'kachi ghani', 'sarso', 'mustard'],
  'sarso': ['mustard oil', 'kachi ghani', 'sarson'],
  'mustard oil': ['mustard oil', 'sarson ka tel', 'kachi ghani', 'fortune kachi ghani'],
  'refined': ['refined oil', 'soyabean oil', 'sunflower oil', 'fortune refined'],
  'soyabean': ['soyabean oil', 'fortune soya', 'refine'],
  'soya': ['soya chunks', 'nutrela', 'soyabean oil', 'soya'],
  'nutrela': ['soya chunks', 'nutrela soya', 'mini chunks'],

  // --- Flours, Grains & Staples ---
  'atta': ['atta', 'flour', 'wheat flour', 'chakki fresh', 'aashirvaad', 'fortune atta', 'sharbati'],
  'aata': ['atta', 'flour', 'wheat flour', 'chakki fresh'],
  'flour': ['atta', 'flour', 'wheat flour', 'maida', 'besan'],
  'wheat': ['atta', 'wheat flour', 'gehun'],
  'gehun': ['atta', 'wheat flour'],
  'maida': ['maida', 'refined wheat flour', 'all purpose flour'],
  'sooji': ['sooji', 'suji', 'rava', 'rawa', 'semolina'],
  'suji': ['suji', 'sooji', 'rava', 'semolina'],
  'rava': ['suji', 'sooji', 'rava', 'semolina'],
  'rawa': ['suji', 'sooji', 'rava'],
  'semolina': ['suji', 'sooji', 'rava'],
  'besan': ['besan', 'gram flour', 'chana atta', 'fortune besan', 'rajdhani'],
  'poha': ['poha', 'pohe', 'flattened rice', 'chivda', 'aval', 'thick poha'],
  'pohe': ['poha', 'flattened rice'],
  'chawal': ['rice', 'basmati', 'india gate', 'daawat', 'fortune rice', 'kolam', 'sona masoori', 'tibar', 'dubor'],
  'chaawal': ['rice', 'basmati', 'india gate', 'daawat'],
  'rice': ['rice', 'chawal', 'basmati', 'india gate', 'daawat', 'fortune rice'],
  'basmati': ['basmati rice', 'india gate', 'daawat', 'fortune basmati', 'tibra', 'dubor'],
  'dal': ['dal', 'daal', 'toor dal', 'arhar dal', 'moong dal', 'chana dal', 'urad dal', 'masoor dal', 'pulses', 'tata sampann'],
  'daal': ['dal', 'toor dal', 'arhar dal', 'moong dal', 'chana dal', 'urad dal', 'masoor dal'],
  'toor': ['toor dal', 'arhar dal', 'tuvar dal', 'dal'],
  'arhar': ['toor dal', 'arhar dal', 'dal'],
  'moong': ['moong dal', 'moong dhuli', 'moong chilka', 'green moong', 'dal'],
  'chana': ['chana dal', 'kala chana', 'kabuli chana', 'chhole', 'gram'],
  'chhole': ['kabuli chana', 'chhole', 'safed chana', 'chana'],
  'rajma': ['rajma', 'red rajma', 'chitra rajma', 'kidney beans'],
  'urad': ['urad dal', 'urad dhuli', 'urad chilka', 'black urad'],
  'masoor': ['masoor dal', 'malka masoor', 'red masoor'],

  // --- Spices & Masalas ---
  'masala': ['masala', 'spice', 'garam masala', 'sabji masala', 'chaat masala', 'kitchen king', 'chhole masala', 'everest', 'mdh', 'catch'],
  'mirch': ['chilli powder', 'red chilli', 'lal mirch', 'degii mirch', 'kashmiri mirch', 'everest tikhalal'],
  'mirchi': ['chilli powder', 'red chilli', 'lal mirch'],
  'chilli': ['chilli powder', 'red chilli', 'mirch', 'tikhalal'],
  'haldi': ['turmeric powder', 'haldi powder', 'turmeric', 'everest haldi', 'catch haldi'],
  'turmeric': ['turmeric powder', 'haldi', 'haldi powder'],
  'dhaniya': ['coriander powder', 'dhaniya powder', 'coriander'],
  'coriander': ['coriander powder', 'dhaniya powder', 'dhaniya'],
  'jeera': ['cumin seeds', 'cumin', 'jeera powder', 'zeera'],
  'zeera': ['cumin seeds', 'jeera'],
  'cumin': ['cumin seeds', 'jeera'],
  'hing': ['asafoetida', 'hing powder', 'bandhani hing', 'catch hing', 'everest hing'],
  'asafoetida': ['hing', 'bandhani hing'],
  'ajwain': ['carom seeds', 'ajwain'],
  'methi': ['fenugreek', 'kasuri methi', 'methi dana'],
  'kasuri methi': ['kasuri methi', 'fenugreek leaves', 'everest kasuri methi'],
  'elaichi': ['cardamom', 'green cardamom', 'chhoti elaichi'],
  'cardamom': ['elaichi', 'green cardamom'],
  'laung': ['clove', 'cloves', 'lavang'],
  'clove': ['laung', 'cloves'],
  'dalchini': ['cinnamon', 'cinnamon sticks'],
  'cinnamon': ['dalchini'],
  'tezpatta': ['bay leaf', 'bay leaves', 'tej patta'],
  'kali mirch': ['black pepper', 'black pepper powder', 'kali mirch'],
  'black pepper': ['kali mirch', 'black pepper powder'],

  // --- Tea & Coffee ---
  'chai': ['tea', 'wagh bakri', 'tata tea', 'red label', 'taaza', 'tea bags', 'taj mahal', 'chai patti', 'society tea'],
  'chay': ['tea', 'chai', 'tata tea', 'red label'],
  'chaay': ['tea', 'chai', 'tata tea'],
  'tea': ['tea', 'chai', 'tata tea', 'red label', 'wagh bakri', 'taj mahal', 'green tea'],
  'patti': ['tea', 'chai', 'chai patti', 'tata tea'],
  'chai patti': ['tea', 'chai', 'tata tea', 'red label'],
  'green tea': ['green tea', 'lipton', 'tetley', 'honey lemon green tea'],
  'coffee': ['coffee', 'nescafe', 'bru', 'sunrise', 'instant coffee', 'classic coffee'],
  'kafee': ['coffee', 'nescafe', 'bru'],

  // --- Cold Drinks, Water & Juices ---
  'paani': ['water', 'bisleri', 'mineral water', 'aquafina', 'kinley'],
  'pani': ['water', 'bisleri', 'mineral water'],
  'water': ['water', 'bisleri', 'mineral water', 'kinley'],
  'bisleri': ['bisleri', 'mineral water', 'water'],
  'cold drink': ['pepsi', 'coca cola', 'coke', 'thums up', 'sprite', '7up', 'fanta', 'limca', 'mountain dew', 'frooti', 'maaza', 'slice', 'sting', 'red bull'],
  'thanda': ['pepsi', 'coke', 'thums up', 'sprite', 'cold drink', 'frooti'],
  'coke': ['coca cola', 'diet coke', 'coke zero', 'coke'],
  'coca cola': ['coca cola', 'coke', 'diet coke'],
  'pepsi': ['pepsi', 'diet pepsi', 'pepsi black'],
  'frooti': ['frooti', 'mango drink', 'parle frooti'],
  'maaza': ['maaza', 'mango drink', 'slice'],
  'sting': ['sting energy drink', 'sting'],
  'red bull': ['red bull', 'energy drink', 'red bull energy'],
  'sharbat': ['rooh afza', 'squash', 'gulab sharbat'],
  'rooh afza': ['rooh afza', 'hamdard rooh afza', 'sharbat'],

  // --- Instant Food & Noodles ---
  'maggi': ['maggi', 'maggie', 'noodles', 'maggi 2-minute', 'masala noodles', 'nestle maggi'],
  'maggie': ['maggi', 'noodles', 'maggi 2-minute'],
  'magy': ['maggi', 'noodles'],
  'noodles': ['maggi', 'yippee', 'noodles', 'hakka noodles', 'chowmein'],
  'noodle': ['maggi', 'yippee', 'noodles'],
  'yippee': ['yippee noodles', 'sunfeast yippee', 'noodles'],
  'pasta': ['pasta', 'macaroni', 'penne', 'bambino pasta'],
  'macaroni': ['macaroni', 'pasta', 'bambino'],
  'vermicelli': ['vermicelli', 'sewai', 'seviyan', 'bambino vermicelli'],
  'sewai': ['vermicelli', 'seviyan', 'bambino'],
  'sauce': ['tomato sauce', 'ketchup', 'maggi ketch up', 'kissan ketchup', 'chilli sauce', 'soya sauce'],
  'ketchup': ['tomato ketchup', 'kissan', 'maggi sauce', 'tomato sauce'],

  // --- Biscuits, Cookies & Snacks ---
  'biscuit': ['biscuit', 'biscuits', 'cookie', 'cookies', 'parle-g', 'britannia', 'marie gold', 'good day', 'bourbon', 'monaco', 'krackjack', 'oreo', '50-50', 'hide & seek', 'dark fantasy', 'rusk'],
  'biskut': ['biscuit', 'biscuits', 'cookies', 'parle-g', 'britannia'],
  'biscuits': ['biscuit', 'biscuits', 'cookie', 'parle-g', 'britannia', 'good day'],
  'cookies': ['cookie', 'cookies', 'biscuit', 'good day', 'butter cookies'],
  'cookie': ['cookie', 'cookies', 'biscuit'],
  'rusk': ['rusk', 'toast', 'britannia toast', 'suji rusk', 'milk rusk'],
  'toast': ['rusk', 'toast', 'britannia rusk'],
  'parle': ['parle-g', 'parle', 'monaco', 'krackjack', 'frooti'],
  'parle-g': ['parle-g', 'parleg', 'parle g biscuit'],
  'britannia': ['britannia', 'good day', 'marie gold', 'bourbon', '50-50', 'nutrichoice', 'milk bikis'],
  'chips': ['chips', "lay's", 'kurkure', 'bingo', 'doritos', 'potato chips', 'wafers'],
  'lays': ["lay's", 'potato chips', 'lays classic', 'lays cream & onion', 'lays magic masala'],
  'kurkure': ['kurkure', 'masala munch', 'namkeen', 'corn puffs'],
  'namkeen': ['namkeen', 'bhujia', 'sev', 'mixture', 'bikaji', 'haldiram', 'ratlami sev', 'aloo bhujia', 'moong dal'],
  'bhujia': ['bhujia', 'aloo bhujia', 'bikaneri bhujia', 'haldiram bhujia', 'bikaji'],
  'sev': ['sev', 'ratlami sev', 'nylon sev', 'bhujia', 'besan sev'],
  'chana jor': ['chana chor garam', 'namkeen'],

  // --- Chocolates & Sweets ---
  'meetha': ['chocolate', 'cadbury', 'sweet', 'candy', 'dairy milk', 'kitkat'],
  'chocolate': ['chocolate', 'cadbury', 'dairy milk', '5 star', 'kitkat', 'perk', 'munch', 'dark chocolate', 'amul dark chocolate', 'bournville'],
  'cadbury': ['cadbury', 'dairy milk', '5 star', 'perk', 'fuse', 'gems'],
  'dairy milk': ['dairy milk', 'cadbury dairy milk', 'silk', 'chocolate'],
  'kitkat': ['kitkat', 'nestle kitkat', 'chocolate wafer'],
  'toffee': ['toffee', 'candy', 'eclairs', 'alpenliebe', 'pulse', 'kaccha aam'],
  'candy': ['candy', 'toffee', 'pulse candy', 'lollipop'],

  // --- Bath, Soaps & Skin Care ---
  'sabun': ['soap', 'bar', 'bath soap', 'dettol', 'lifebuoy', 'lux', 'dove', 'pears', 'cinthol', 'godrej no.1', 'medimix', 'santoor', 'vivel', 'fiama'],
  'saabun': ['soap', 'bar', 'dettol', 'lux', 'lifebuoy'],
  'soap': ['soap', 'sabun', 'bath soap', 'dettol', 'lux', 'dove', 'lifebuoy', 'pears', 'santoor'],
  'handwash': ['hand wash', 'dettol handwash', 'lifebuoy handwash', 'liquid soap', 'handwash refill'],
  'face wash': ['face wash', 'himalaya neem face wash', 'garnier', 'clean & clear', 'fair & lovely', 'glow & lovely'],
  'cream': ['cream', 'cold cream', 'body lotion', 'ponds', 'nivea', 'fair & lovely', 'glow & lovely', 'boroplus', 'vaseline'],
  'lotion': ['body lotion', 'vaseline lotion', 'nivea lotion', 'moisturizer'],
  'powder': ['talcum powder', 'ponds powder', 'derpicool', 'navratna cool', 'cinthol powder'],

  // --- Hair Care ---
  'shampoo': ['shampoo', 'conditioner', 'clinic plus', 'head & shoulders', 'pantene', 'dove shampoo', 'sunsilk', 'tresemme', 'himalaya'],
  'shampu': ['shampoo', 'conditioner', 'clinic plus', 'head & shoulders'],
  'conditioner': ['conditioner', 'dove conditioner', 'pantene conditioner', 'tresemme'],
  'hair oil': ['hair oil', 'coconut oil', 'parachute', 'bajaj almond drops', 'dabur amla', 'navratna oil', 'maha bhringraj'],
  'tel bal': ['hair oil', 'coconut oil', 'parachute', 'amla oil'],
  'parachute': ['parachute coconut oil', 'hair oil', 'coconut oil'],

  // --- Oral Care ---
  'toothpaste': ['toothpaste', 'colgate', 'close-up', 'pepsodent', 'sensodyne', 'dabur red', 'patanjali dant kanti', 'meswak'],
  'colgate': ['colgate', 'colgate maxfresh', 'colgate strong teeth', 'colgate total', 'toothpaste', 'colget'],
  'colget': ['colgate', 'toothpaste', 'colgate strong teeth'],
  'kolgat': ['colgate', 'toothpaste'],
  'paste': ['toothpaste', 'colgate', 'close-up', 'pepsodent'],
  'dant': ['toothpaste', 'toothbrush', 'colgate', 'dant manjan', 'dabur red'],
  'daant': ['toothpaste', 'toothbrush', 'colgate'],
  'manjan': ['toothpaste', 'colgate', 'dabur red', 'dant kanti'],
  'brush': ['toothbrush', 'colgate toothbrush', 'oral-b', 'soft toothbrush'],
  'toothbrush': ['toothbrush', 'brush', 'colgate toothbrush', 'oral-b'],
  'close up': ['close-up', 'closeup', 'red hot gel', 'toothpaste'],
  'sensodyne': ['sensodyne', 'sensitive toothpaste', 'rapid relief'],

  // --- Laundry & Home Care ---
  'detergent': ['detergent', 'washing powder', 'surf excel', 'tide', 'ariel', 'ghadi', 'rin', 'wheel', 'detergent bar', 'liquid detergent'],
  'surf': ['surf excel', 'detergent', 'washing powder', 'surf excel easy wash', 'surf excel quick wash'],
  'sarf': ['surf excel', 'detergent', 'washing powder', 'tide', 'ariel'],
  'nirma': ['washing powder', 'detergent', 'nirma'],
  'ghadi': ['ghadi detergent', 'ghadi powder', 'ghadi bar'],
  'rin': ['rin bar', 'rin detergent', 'rin washing powder', 'fabric whitener'],
  'tide': ['tide plus', 'tide detergent', 'washing powder'],
  'ariel': ['ariel matic', 'ariel detergent', 'complete washing powder'],
  'kapda': ['detergent', 'washing powder', 'surf excel', 'rin bar', 'fabric conditioner', 'comfort'],
  'comfort': ['comfort fabric conditioner', 'after wash', 'fabric softener'],
  'ujala': ['ujala supreme', 'fabric whitener', 'neel', 'ujala crisp and shine'],
  'neel': ['ujala', 'fabric whitener'],

  // --- Dishwashing & Cleaners ---
  'bartan': ['vim', 'exo', 'dishwash', 'dishwash bar', 'dishwash gel', 'dishwash liquid', 'pril', 'scrub pad', 'scotch brite'],
  'vim': ['vim bar', 'vim gel', 'vim dishwash liquid', 'dishwash'],
  'exo': ['exo bar', 'exo dishwash', 'round bar'],
  'harpic': ['harpic', 'toilet cleaner', 'harpic power plus', 'harpic bathroom cleaner'],
  'phenyl': ['phenyl', 'floor cleaner', 'lizol', 'gainda phenyl'],
  'lizol': ['lizol floor cleaner', 'disinfectant surface cleaner', 'lizol citrus'],
  'pocha': ['floor wiper', 'mop', 'floor cleaner', 'lizol'],

  // --- Pest Control & Mosquito ---
  'machar': ['mosquito', 'good knight', 'all out', 'mortein', 'hit', 'mosquito coil', 'fast card', 'refill machine'],
  'machhar': ['mosquito', 'good knight', 'all out', 'hit', 'mortein'],
  'all out': ['all out refill', 'all out machine', 'mosquito repellent'],
  'good knight': ['good knight flash', 'good knight gold', 'good knight refill', 'mosquito repellent'],
  'hit': ['kala hit', 'lal hit', 'cockroach spray', 'mosquito spray'],
  'mortein': ['mortein', 'mosquito repellent', 'rat kill', 'mortein coil'],

  // --- Health, OTC & Pooja ---
  'dawa': ['balm', 'amrutanjan', 'zandu balm', 'vicks', 'moov', 'iodex', 'volini', 'pain relief'],
  'dard': ['balm', 'moov', 'iodex', 'vicks vaporub', 'pain relief spray'],
  'vicks': ['vicks vaporub', 'vicks inhaler', 'vicks cough drops'],
  'moov': ['moov pain relief cream', 'moov spray', 'pain balm'],
  'iodex': ['iodex balm', 'fast relief', 'pain balm'],
  'pooja': ['agarbatti', 'dhoop', 'kapoor', 'camphor', 'matchbox', 'diya batti', 'cotton wicks'],
  'agarbatti': ['incense sticks', 'cycle agarbatti', 'mangaldeep', 'zed black', 'dhoop bati'],
  'kapoor': ['camphor', 'pure kapoor', 'mangaldeep camphor'],
  'diya': ['cotton wicks', 'batti', 'pooja oil'],
  'machis': ['matchbox', 'homelites', 'matches'],
  'matchbox': ['machis', 'matches', 'homelites'],

  // --- Pet Food ---
  'dog food': ['pedigree', 'meat up', 'dog biscuits', 'puppy food'],
  'pedigree': ['pedigree dog food', 'adult dog food', 'puppy food'],
  'cat food': ['whiskas', 'kitten food', 'cat treats']
};

// ---------------------------------------------------------------------------
// 2. High-Performance Fuzzy String Distance (Damerau-Levenshtein)
// ---------------------------------------------------------------------------

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Swap to save memory
  if (al > bl) {
    const tmp = a; a = b; b = tmp;
  }

  const row = new Array(a.length + 1);
  for (let i = 0; i <= a.length; i++) row[i] = i;

  for (let j = 1; j <= b.length; j++) {
    let prev = j;
    for (let i = 1; i <= a.length; i++) {
      let val: number;
      if (a[i - 1] === b[j - 1]) {
        val = row[i - 1];
      } else {
        val = Math.min(row[i - 1] + 1, prev + 1, row[i] + 1);
      }
      row[i - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }

  return row[a.length];
}

/**
 * Normalized string similarity score between 0.0 and 1.0
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}

/**
 * Checks if search word fuzzy matches any word in target text (or target contains word)
 * Allows 1 typo for words of length 4-6, and 2 typos for words of length > 6.
 */
export function fuzzyMatchToken(searchToken: string, targetWords: string[]): boolean {
  const cleanSearch = searchToken.toLowerCase().trim();
  if (!cleanSearch) return true;

  const searchLen = cleanSearch.length;
  const maxAllowedDist = searchLen <= 3 ? 0 : searchLen <= 5 ? 1 : 2;

  for (const targetWord of targetWords) {
    if (!targetWord) continue;

    // Substring contains check (e.g., 'suga' in 'sugar')
    if (targetWord.includes(cleanSearch) || cleanSearch.includes(targetWord)) {
      return true;
    }

    // Direct edit distance check
    if (Math.abs(targetWord.length - searchLen) <= maxAllowedDist) {
      const dist = levenshteinDistance(cleanSearch, targetWord);
      if (dist <= maxAllowedDist) {
        return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 3. Query Token Expansion & Bilingual Synonyms
// ---------------------------------------------------------------------------

/**
 * Expands a search query to include all synonyms and related transliterated words.
 * Handles both whole-query lookup and individual token lookups.
 */
export function expandSearchQuery(query: string): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const rawTokens = clean.split(/[\s,./\-_+]+/).filter(Boolean);
  const terms = new Set<string>();

  // Always keep original clean query
  terms.add(clean);

  // Add individual tokens
  rawTokens.forEach(t => terms.add(t));

  // Check synonym for full query first
  if (SYNONYM_MAP[clean]) {
    SYNONYM_MAP[clean].forEach(syn => terms.add(syn));
  }

  // Check synonyms for individual tokens
  rawTokens.forEach(tok => {
    // Direct synonym lookup
    if (SYNONYM_MAP[tok]) {
      SYNONYM_MAP[tok].forEach(syn => terms.add(syn));
    }

    // Fuzzy check against synonym keys (e.g., user typed 'shakar' or 'suger')
    if (!SYNONYM_MAP[tok]) {
      for (const [key, synList] of Object.entries(SYNONYM_MAP)) {
        if (Math.abs(key.length - tok.length) <= 1 && levenshteinDistance(key, tok) <= 1) {
          terms.add(key);
          synList.forEach(syn => terms.add(syn));
          break;
        }
      }
    }
  });

  return Array.from(terms);
}

// ---------------------------------------------------------------------------
// 4. Multi-Factor Product Search Matching & Relevance Scoring
// ---------------------------------------------------------------------------

export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|l|ltr|litre|litres|ml|pc|pcs|pack|packs)\b/gi, '$1 $2')
    .replace(/['’"]/g, '')
    .trim();
}

/**
 * Returns true if product matches query via exact, synonym, or fuzzy matching
 */
export function matchesSearchQuery(
  productName: string,
  brandName: string | undefined | null,
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const cleanQuery = normalizeSearchText(query);
  const targetText = normalizeSearchText(`${productName} ${brandName || ''}`);
  const targetWords = targetText.split(/[\s,./\-_()]+/).filter(Boolean);

  // Fast direct substring match
  if (targetText.includes(cleanQuery)) {
    return true;
  }

  const searchTokens = cleanQuery.split(/[\s,./\-_+]+/).filter(Boolean);
  if (searchTokens.length === 0) return true;

  // For single-token queries, check expanded synonyms and transliterations (e.g., 'dahi' -> 'curd')
  if (searchTokens.length === 1) {
    const singleToken = searchTokens[0];
    const expandedTerms = expandSearchQuery(singleToken);
    for (const term of expandedTerms) {
      if (term.length >= 3 && targetText.includes(term)) {
        return true;
      }
    }
  }

  // Multi-token evaluation: EVERY search token must match either directly, via synonym, or fuzzy
  const allTokensMatch = searchTokens.every(tok => {
    // 1. Direct word or substring match
    if (targetWords.includes(tok) || targetText.includes(tok)) return true;

    // 2. Synonyms for this specific token (e.g. 'noodle' <-> 'maggi', 'atta' <-> 'flour')
    const syns = SYNONYM_MAP[tok] || [];
    for (const syn of syns) {
      if (targetWords.includes(syn) || targetText.includes(syn)) return true;
    }

    // 3. Fuzzy match token against target product words
    return fuzzyMatchToken(tok, targetWords);
  });

  return allTokensMatch;
}

/**
 * Calculates a numerical relevance score for ranking search results.
 * Higher score = higher ranking.
 */
export function scoreProductMatch(
  productName: string,
  brandName: string | undefined | null,
  query: string,
  isFeatured = false
): number {
  if (!query || !query.trim()) {
    return isFeatured ? 10 : 0;
  }

  const cleanQuery = normalizeSearchText(query);
  const pName = normalizeSearchText(productName || '');
  const bName = normalizeSearchText(brandName || '');
  const targetText = `${pName} ${bName}`.trim();
  const targetWords = targetText.split(/[\s,./\-_()]+/).filter(Boolean);

  let score = 0;

  // 1. Exact match on full product name
  if (pName === cleanQuery) {
    score += 150;
  }

  // 2. Product name starts with query
  if (pName.startsWith(cleanQuery)) {
    score += 100;
  }

  // 3. Exact Brand match
  if (bName && (bName === cleanQuery || cleanQuery.startsWith(bName))) {
    score += 80;
  }

  // 4. Word boundary / whole token match in product name
  const queryTokens = cleanQuery.split(/[\s,./\-_+]+/).filter(Boolean);
  let tokensMatched = 0;

  for (const tok of queryTokens) {
    if (targetWords.includes(tok)) {
      score += 40;
      tokensMatched++;
    } else if (targetText.includes(tok)) {
      score += 25;
      tokensMatched++;
    } else {
      // Check synonyms
      const syns = SYNONYM_MAP[tok] || [];
      let foundSyn = false;
      for (const syn of syns) {
        if (targetWords.includes(syn) || targetText.includes(syn)) {
          score += 35;
          tokensMatched++;
          foundSyn = true;
          break;
        }
      }

      // Check fuzzy typo match
      if (!foundSyn && fuzzyMatchToken(tok, targetWords)) {
        score += 20;
        tokensMatched++;
      }
    }
  }

  // Bonus if 100% of tokens matched
  if (queryTokens.length > 0 && tokensMatched === queryTokens.length) {
    score += 50;
  }

  // Curated / Featured product boost
  if (isFeatured) {
    score += 15;
  }

  return score;
}
