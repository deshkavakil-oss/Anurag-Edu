export interface SscChslTopic {
  id: string;
  title: string;
  keyConcepts: string[];
  shortTrick: string;
  revisionPoints: string[];
  importantQuestions: {
    q: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    type: 'PYQ' | 'Practice';
  }[];
}

export interface SscChslSubject {
  id: string;
  name: string;
  hindiName: string;
  weightageNote: string;
  chapters: SscChslTopic[];
}

export const SSC_CHSL_SUBJECTS: SscChslSubject[] = [
  {
    id: 'history',
    name: 'History',
    hindiName: 'इतिहास',
    weightageNote: 'Tier-I & II General Awareness (3–5 Questions)',
    chapters: [
      {
        id: 'ancient-history',
        title: 'Ancient Indian History',
        keyConcepts: [
          'Indus Valley Civilization (2500–1750 BCE): Harappa (Ravi river, Daya Ram Sahni 1921), Mohenjo-daro (Indus, R.D. Banerji 1922), Lothal (dockyard), Dholavira (water management).',
          'Vedic Period: Rigveda (oldest, 1028 hymns, Gayatri Mantra in Mandala III), Later Vedic age (iron usage, Varna system).',
          'Buddhism & Jainism: Gautam Buddha (Lumbini, Bodh Gaya, Sarnath first sermon, Kushinagar), Mahavira (24th Tirthankara, Kundagrama, Pavapuri).',
          'Mauryan & Gupta Empires: Chandragupta Maurya (Arthashastra by Kautilya), Ashoka (Kalinga War 261 BCE, Rock Edicts), Samudragupta (Napoleon of India, Prayag Prashasti).',
        ],
        shortTrick: 'Buddhist Councils Memory Trick: "R-V-P-K" -> Rajgriha (Ajatashatru), Vaishali (Kalasoka), Pataliputra (Ashoka), Kashmir (Kanishka).',
        revisionPoints: [
          'James Prinsep deciphered Ashokan Brahmi script in 1837.',
          'Nalanda University was founded by Kumaragupta I.',
          'Brihadeshwara Temple (Thanjavur) was built by Rajaraja Chola I.',
        ],
        importantQuestions: [
          {
            q: 'Which Harappan site is famous for its ancient artificial brick dockyard?',
            options: ['Kalibangan', 'Lothal', 'Banawali', 'Ropar'],
            correctIndex: 1,
            explanation: 'Lothal in Gujarat (Bhogava river) had a brick-lined tidal dockyard.',
            type: 'PYQ',
          },
          {
            q: 'Who composed the Allahabad Pillar Inscription (Prayag Prashasti) praising Samudragupta?',
            options: ['Banabhatta', 'Harishena', 'Kalidasa', 'Ravikirti'],
            correctIndex: 1,
            explanation: 'Harishena was the court poet of Gupta Emperor Samudragupta.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'medieval-history',
        title: 'Medieval Indian History',
        keyConcepts: [
          'Delhi Sultanate (1206–1526): Slave (Qutb-ud-din Aibak, Iltutmish, Razia), Khalji (Alauddin market reforms), Tughlaq, Sayyid, Lodi.',
          'Mughal Empire (1526–1857): Babur (1st Battle of Panipat 1526), Akbar (Mansabdari, Din-i-Ilahi), Shah Jahan (architecture), Aurangzeb.',
          'Bhakti & Sufi Movements: Kabir, Guru Nanak, Mirabai, Chaitanya Mahaprabhu, Nizamuddin Auliya.',
          'Maratha Empire: Chhatrapati Shivaji Maharaj (Ashtapradhan council, Chauth & Sardeshmukhi).',
        ],
        shortTrick: 'Delhi Sultanate Dynasties: "S-K-T-S-L" -> Slave, Khalji, Tughlaq, Sayyid, Lodi.',
        revisionPoints: [
          'Ibn Battuta (Morocco) visited India during Muhammad bin Tughlaq’s reign.',
          'Second Battle of Panipat (1556): Akbar vs Hemu.',
        ],
        importantQuestions: [
          {
            q: 'Who introduced the "Iqta" administrative system in the Delhi Sultanate?',
            options: ['Balban', 'Iltutmish', 'Alauddin Khalji', 'Firoz Shah Tughlaq'],
            correctIndex: 1,
            explanation: 'Shams-ud-din Iltutmish institutionalized the Iqta system of revenue-cum-military land assignments.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'modern-freedom',
        title: 'Modern Indian History & Freedom Movement',
        keyConcepts: [
          'Revolt of 1857: Mangal Pandey (Barrackpore), Rani Lakshmibai (Jhansi), Kunwar Singh (Bihar), Begum Hazrat Mahal (Lucknow).',
          'INC Formation (1885): A.O. Hume, first president W.C. Bonnerjee (Bombay, 72 delegates).',
          'Gandhian Era: Champaran (1917), Kheda & Ahmedabad (1918), Non-Cooperation (1920), Civil Disobedience / Dandi March (1930), Quit India (1942).',
          'Important Acts: Regulating Act 1773, GoI Act 1919 (Dyarchy), GoI Act 1935 (Provincial Autonomy), Indian Independence Act 1947.',
        ],
        shortTrick: 'Gandhi Initial Movements: "C-A-K" -> Champaran (1917), Ahmedabad Mill Strike (1918), Kheda (1918).',
        revisionPoints: [
          'First woman President of INC: Annie Besant (1917, Calcutta); First Indian woman: Sarojini Naidu (1925, Kanpur).',
          'Poona Pact (1932) was signed between Mahatma Gandhi and Dr. B.R. Ambedkar.',
        ],
        importantQuestions: [
          {
            q: 'Who presided over the 1929 Lahore Session of INC where "Purna Swaraj" resolution was passed?',
            options: ['Motilal Nehru', 'Jawaharlal Nehru', 'Subhas Chandra Bose', 'Sardar Patel'],
            correctIndex: 1,
            explanation: 'Jawaharlal Nehru presided over the December 1929 Lahore Session.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'world-history-personalities',
        title: 'World History, Events & Personalities',
        keyConcepts: [
          'Industrial Revolution (Britain, late 18th century), French Revolution (1789 — Liberty, Equality, Fraternity), Russian Revolution (1917).',
          'World War I (1914–1918) & World War II (1939–1945), Founding of United Nations (24 October 1945).',
          'Important Personalities: Raja Ram Mohan Roy (Brahmo Samaj 1828), Swami Vivekananda (Ramakrishna Mission 1897), Jyotiba Phule (Satyashodhak Samaj 1873).',
        ],
        shortTrick: 'UN Day = 24 October 1945; Magna Carta = 1215 CE.',
        revisionPoints: ['Arya Samaj was founded by Swami Dayananda Saraswati in 1875 in Bombay.'],
        importantQuestions: [
          {
            q: 'Who founded the Satyashodhak Samaj in 1873 in Maharashtra?',
            options: ['Gopal Krishna Gokhale', 'Jyotirao Phule', 'M.G. Ranade', 'B.G. Tilak'],
            correctIndex: 1,
            explanation: 'Mahatma Jyotirao Phule founded Satyashodhak Samaj for social equality and education.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    hindiName: 'भूगोल',
    weightageNote: 'Tier-I & II General Awareness (3–4 Questions)',
    chapters: [
      {
        id: 'indian-rivers-mountains',
        title: 'Indian Geography: Rivers, Mountains & States',
        keyConcepts: [
          'Himalayan Mountain Ranges: Himadri (Greater Himalayas), Himachal (Lesser), Shiwalik (Outer); Karakoram (K2 / Godwin Austen), Western & Eastern Ghats meet at Nilgiri Hills.',
          'Himalayan Rivers: Indus, Ganga (origin Gangotri/Devprayag Bhagirathi+Alaknanda), Brahmaputra (Tsangpo in Tibet).',
          'Peninsular Rivers: East-flowing (Godavari, Krishna, Kaveri, Mahanadi — form deltas), West-flowing (Narmada, Tapi — flow through rift valleys, form estuaries).',
          'Indian Standard Time (IST): 82°30′ E longitude passing near Mirzapur (UP), +5:30 ahead of GMT.',
        ],
        shortTrick: 'West-flowing major rivers trick: "NAMASTE" -> Narmada, Mahi, Sabarmati, Tapi.',
        revisionPoints: [
          'Tropic of Cancer (23°30′ N) passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram.',
          'Highest peak in South India: Anamudi (2,695 m, Kerala).',
        ],
        importantQuestions: [
          {
            q: 'Which of the following rivers flows through a rift valley and drains into the Arabian Sea?',
            options: ['Godavari', 'Kaveri', 'Narmada', 'Mahanadi'],
            correctIndex: 2,
            explanation: 'Narmada flows westward between the Vindhya and Satpura ranges through a rift valley into the Gulf of Khambhat.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'climate-agriculture-resources',
        title: 'Climate, Agriculture, Resources & World Geography',
        keyConcepts: [
          'Indian Monsoon: South-West Monsoon (June–September, brings ~75% rainfall), Retreating Monsoon / North-East Monsoon (Oct–Dec, key for Tamil Nadu coast).',
          'Cropping Seasons: Kharif (monsoon: Rice, Maize, Cotton), Rabi (winter: Wheat, Mustard, Gram), Zaid (summer: Watermelon, Cucumber).',
          'Soils of India: Alluvial (most fertile & widespread), Black/Regur (cotton), Laterite (leaching, tea/coffee/cashew).',
          'World Geography: Atmospheric Layers (Troposphere, Stratosphere with Ozone, Mesosphere, Thermosphere, Exosphere), Ocean Currents, Straits.',
        ],
        shortTrick: 'Atmospheric Layers Bottom-to-Top: "Trust Me In The Exam" -> Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere.',
        revisionPoints: [
          'Palk Strait separates India (Tamil Nadu) and Sri Lanka.',
          'Alluvial soil covers ~40% of India’s total land area.',
        ],
        importantQuestions: [
          {
            q: 'Black soil (Regur soil) is best suited for the cultivation of which crop?',
            options: ['Tea', 'Cotton', 'Jute', 'Apple'],
            correctIndex: 1,
            explanation: 'Black soil has high moisture retention and is ideal for cotton cultivation in the Deccan plateau.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'mathematics',
    name: 'Mathematics / Quantitative Aptitude',
    hindiName: 'गणित / संख्यात्मक अभियोग्यता',
    weightageNote: 'Tier-I: 25 Qs (50 Marks) · Tier-II: 30 Qs (90 Marks)',
    chapters: [
      {
        id: 'number-system-percentage-profit',
        title: 'Number System, Simplification, Percentage & Profit-Loss',
        keyConcepts: [
          'Number System: Divisibility rules (7, 11, 13), Unit digit cyclicity, Remainder theorem, HCF × LCM = Product of two numbers.',
          'Percentage: Fraction equivalents (1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%, 1/12 = 8.33%).',
          'Profit & Loss: Profit% = (P/CP)×100; Discount% = (D/MP)×100; CP/MP = (100 - D%)/(100 + P%).',
          'SI & CI: SI = PRT/100; 2-year CI - SI = P(R/100)².',
        ],
        shortTrick: 'Successive % change of a% and b% = a + b + (ab)/100. For equal +x% and -x%, always net loss of x²/100%.',
        revisionPoints: [
          'Always compute Profit/Loss on Cost Price unless stated on SP.',
          'Use CP : MP = (100 - Discount%) : (100 + Profit%) for direct 10-second solutions.',
        ],
        importantQuestions: [
          {
            q: 'A shopkeeper marks an article 40% above cost price and gives a 25% discount. What is his profit percentage?',
            options: ['5%', '10%', '12%', '15%'],
            correctIndex: 0,
            explanation: 'Net % = +40 - 25 + (40 × -25)/100 = 15 - 10 = +5% profit.',
            type: 'Practice',
          },
          {
            q: 'The difference between Compound Interest and Simple Interest on ₹10,000 for 2 years at 10% p.a. is:',
            options: ['₹50', '₹100', '₹150', '₹200'],
            correctIndex: 1,
            explanation: '2-year CI - SI = P(R/100)² = 10000 × (10/100)² = 10000 × 0.01 = ₹100.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'ratio-time-work-speed',
        title: 'Ratio & Proportion, Average, Time & Work, Speed-Distance',
        keyConcepts: [
          'Time & Work: Efficiency ∝ 1/Time; MDH Formula: (M₁D₁H₁)/W₁ = (M₂D₂H₂)/W₂.',
          'Time, Speed & Distance: km/h × (5/18) = m/s; Average Speed for equal distances = 2xy/(x+y).',
          'Boats & Streams: Downstream = u + v, Upstream = u - v; Still water speed = (D + U)/2.',
        ],
        shortTrick: 'If A does work in x days and B in y days, together they finish in (xy)/(x+y) days.',
        revisionPoints: ['Convert units consistently (m/s vs km/h) before applying train crossing formulas.'],
        importantQuestions: [
          {
            q: 'A train 180 m long is running at 54 km/h. How long will it take to cross a stationary pole?',
            options: ['10 sec', '12 sec', '14 sec', '15 sec'],
            correctIndex: 1,
            explanation: '54 km/h = 54 × (5/18) = 15 m/s. Time = 180 / 15 = 12 seconds.',
            type: 'PYQ',
          },
        ],
      },
      {
        id: 'algebra-geometry-mensuration-trig-di',
        title: 'Algebra, Geometry, Mensuration, Trigonometry & DI',
        keyConcepts: [
          'Algebra: (a+b)³ = a³+b³+3ab(a+b); a³+b³+c³-3abc = (a+b+c)(a²+b²+c²-ab-bc-ca).',
          'Geometry: Sum of interior angles of n-gon = (n-2)×180°; Tangent is perpendicular to radius at point of contact.',
          'Mensuration: Cylinder TSA = 2πr(h+r), Cone Vol = (1/3)πr²h, Sphere Vol = (4/3)πr³.',
          'Trigonometry: sin²θ + cos²θ = 1; sec²θ - tan²θ = 1; cosec²θ - cot²θ = 1.',
        ],
        shortTrick: 'If a + b + c = 0, then a³ + b³ + c³ = 3abc immediately.',
        revisionPoints: ['Memorize Pythagorean triplets: (3,4,5), (5,12,13), (8,15,17), (7,24,25).'],
        importantQuestions: [
          {
            q: 'If sec θ + tan θ = 3, find the value of sec θ - tan θ.',
            options: ['1/2', '1/3', '2/3', '3'],
            correctIndex: 1,
            explanation: 'Since sec²θ - tan²θ = 1, (sec θ + tan θ)(sec θ - tan θ) = 1 => sec θ - tan θ = 1/3.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'reasoning',
    name: 'General Intelligence & Reasoning',
    hindiName: 'तर्कशक्ति',
    weightageNote: 'Tier-I: 25 Qs (50 Marks) · Tier-II: 30 Qs (90 Marks)',
    chapters: [
      {
        id: 'verbal-reasoning',
        title: 'Analogy, Classification, Coding-Decoding, Series & Blood Relations',
        keyConcepts: [
          'Alphabet Positional Values: A=1 ... Z=26 (EJOTY = 5, 10, 15, 20, 25); Opposite letter pairs sum to 27 (A-Z, B-Y, C-X).',
          'Number Series: Check prime differences, n²±1, n³±n, alternating series, and multiplication + offset.',
          'Blood Relations & Direction Sense: Draw clean generational tree (+ male, - female) and Pythagoras for shortest distance.',
          'Ranking: Total = Left + Right - 1.',
        ],
        shortTrick: 'Opposite letters trick: "A-Z, B-Y (Boy), C-X (Six), D-W (Dew), E-V (Even), F-U (Full), G-T (GT Road)".',
        revisionPoints: ['In Syllogism, draw minimum overlapping Venn diagrams before checking definite conclusions.'],
        importantQuestions: [
          {
            q: 'In a row of 45 students, Rohan is 18th from the left end. What is his rank from the right end?',
            options: ['27th', '28th', '29th', '26th'],
            correctIndex: 1,
            explanation: 'Right Rank = Total - Left + 1 = 45 - 18 + 1 = 28th.',
            type: 'Practice',
          },
        ],
      },
      {
        id: 'analytical-nonverbal-reasoning',
        title: 'Syllogism, Venn Diagrams, Puzzles & Non-Verbal Reasoning',
        keyConcepts: [
          'Syllogism: "All A are B", "Some A are B", "No A is B", and "Either-Or" complementary pairs.',
          'Non-Verbal: Mirror image (horizontal flip), Water image (vertical flip), Paper cutting/folding, Dice opposite faces.',
          'Standard Dice vs General Dice: Adjacent faces never appear opposite in folded cube.',
        ],
        shortTrick: 'In mirror image of a clock, subtract given time from 11:60 (or 23:60).',
        revisionPoints: ['For water image of a clock, subtract from 18:30 (or 17:90).'],
        importantQuestions: [
          {
            q: 'If a clock shows 4:20, what time will its mirror image show?',
            options: ['7:40', '8:40', '7:20', '6:40'],
            correctIndex: 0,
            explanation: 'Mirror time = 11:60 - 4:20 = 7:40.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'current-affairs',
    name: 'Current Affairs',
    hindiName: 'समसामयिकी',
    weightageNote: 'Tier-I & II General Awareness (4–6 Questions)',
    chapters: [
      {
        id: 'ca-national-schemes-appointments',
        title: 'National News, Government Schemes, Awards, Sports & Appointments',
        keyConcepts: [
          'Union Government Flagship Schemes: PM-KISAN, Ayushman Bharat (PM-JAY), PM Vishwakarma, Digital India, NEP 2020.',
          'Constitutional Appointments: Chief Justice of India, Chief Election Commissioner, CAG, RBI Governor, CDS.',
          'Sports & Awards: National Sports Awards (Major Dhyan Chand Khel Ratna, Arjuna Award), Padma Awards, Sahitya & Jnanpith.',
          'Science, Space & Summits: ISRO missions (Chandrayaan-3, Aditya-L1, Gaganyaan), G20, BRICS, COP Summits.',
        ],
        shortTrick: 'Always track 6–8 months prior to exam date across PIB, RBI, and official Ministry releases.',
        revisionPoints: ['Use the Live Current Affairs Centre inside AEC to verify latest dates and official PIB sources.'],
        importantQuestions: [
          {
            q: 'Which Indian institution launched the Aditya-L1 mission to study the Sun?',
            options: ['DRDO', 'ISRO', 'BARC', 'CSIR'],
            correctIndex: 1,
            explanation: 'ISRO launched Aditya-L1 on 2 September 2023 to Lagrange Point L1.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'polity',
    name: 'Indian Polity',
    hindiName: 'भारतीय राजव्यवस्था',
    weightageNote: 'Tier-I & II General Awareness (3–4 Questions)',
    chapters: [
      {
        id: 'constitution-rights-parliament',
        title: 'Constitution, Preamble, Fundamental Rights, DPSP & Parliament',
        keyConcepts: [
          'Preamble: Sovereign, Socialist, Secular, Democratic, Republic (Socialist, Secular, Integrity added by 42nd Amendment 1976).',
          'Fundamental Rights (Part III, Articles 12–35): Equality (14–18), Freedom (19–22), Against Exploitation (23–24), Religion (25–28), Cultural/Educational (29–30), Constitutional Remedies (Art 32 — Heart & Soul per Dr. Ambedkar).',
          'Fundamental Duties (Part IV-A, Article 51A): 11 duties (10 added by 42nd Amendment 1976 via Swaran Singh Committee, 11th by 86th Amendment 2002).',
          'Parliament & Executive: President (Art 52), Vice President (Art 63), Prime Minister (Art 74–75), Lok Sabha & Rajya Sabha, Supreme Court (Art 124), Election Commission (Art 324), Panchayati Raj (73rd Amendment, 11th Schedule).',
        ],
        shortTrick: 'Writs under Article 32: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto ("H-M-P-C-Q").',
        revisionPoints: [
          'Article 21A (Right to Free & Compulsory Education for ages 6–14) was added by the 86th Amendment Act, 2002.',
          'Joint Sitting of Parliament (Article 108) is summoned by the President and presided over by the Lok Sabha Speaker.',
        ],
        importantQuestions: [
          {
            q: 'Which Article of the Indian Constitution abolishes "Untouchability" and forbids its practice in any form?',
            options: ['Article 15', 'Article 16', 'Article 17', 'Article 18'],
            correctIndex: 2,
            explanation: 'Article 17 abolishes untouchability and makes its practice a punishable offence.',
            type: 'PYQ',
          },
          {
            q: 'Who presides over a Joint Sitting of both Houses of Parliament under Article 108?',
            options: ['President of India', 'Prime Minister', 'Speaker of Lok Sabha', 'Chairman of Rajya Sabha'],
            correctIndex: 2,
            explanation: 'Under Article 118(4), the Speaker of the Lok Sabha presides over a joint sitting.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'science',
    name: 'General Science',
    hindiName: 'सामान्य विज्ञान',
    weightageNote: 'Tier-I & II General Awareness (3–5 Questions)',
    chapters: [
      {
        id: 'physics-chemistry-biology',
        title: 'Physics, Chemistry, Biology, Human Body & Discoveries',
        keyConcepts: [
          'Physics: SI Units (Force=Newton, Power=Watt, Resistance=Ohm, Frequency=Hertz), Laws of Motion, Mirrors/Lenses (Myopia=Concave, Hypermetropia=Convex).',
          'Chemistry: pH Scale (<7 Acidic, 7 Neutral, >7 Basic), Common Compounds (Baking Soda NaHCO₃, Washing Soda Na₂CO₃·10H₂O, Bleaching Powder CaOCl₂), Alloys (Brass=Cu+Zn, Bronze=Cu+Sn).',
          'Biology & Human Body: Vitamins (A-Night blindness, B1-Beriberi, C-Scurvy, D-Rickets, K-Blood clotting), Blood Groups (O- Universal Donor, AB+ Universal Recipient), Cell organelles (Mitochondria = Powerhouse).',
        ],
        shortTrick: 'Alloys Trick: "Brass = Cu + Zn (Copper-Zinc)", "Bronze = Cu + Sn (Copper-Tin — Z is NOT in Bronze)".',
        revisionPoints: ['Normal human blood pH is 7.35–7.45 (slightly alkaline).'],
        importantQuestions: [
          {
            q: 'Deficiency of Vitamin C causes which disease?',
            options: ['Rickets', 'Scurvy', 'Beriberi', 'Goitre'],
            correctIndex: 1,
            explanation: 'Vitamin C (Ascorbic Acid) deficiency leads to Scurvy (bleeding gums).',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'general-awareness',
    name: 'General Awareness (Static GK)',
    hindiName: 'सामान्य जागरूकता',
    weightageNote: 'Tier-I & II General Awareness (4–6 Questions)',
    chapters: [
      {
        id: 'static-gk-orgs-parks',
        title: 'Books & Authors, National Parks, Capitals, Currencies & Organizations',
        keyConcepts: [
          'National Parks & Biosphere Reserves: Jim Corbett (Uttarakhand — oldest 1936), Kaziranga (Assam — One-horned Rhino), Gir (Gujarat — Asiatic Lion), Sundarbans (WB), Keibul Lamjao (Manipur — only floating park).',
          'International Organizations: UN (New York), UNESCO (Paris), WHO & ILO (Geneva), IMF & World Bank (Washington DC), ADB (Manila), SAARC (Kathmandu).',
          'Classic Books: Arthashastra (Kautilya), Indica (Megasthenes), Discovery of India (J. Nehru), Wings of Fire (Dr. A.P.J. Abdul Kalam).',
        ],
        shortTrick: 'Geneva Headquarters: Organizations with "World" + "O" or "Trade/Labour/Health" -> WHO, WTO, ILO, WIPO, WMO.',
        revisionPoints: ['India has 40+ UNESCO World Heritage Sites including Dholavira, Ramappa Temple, Santiniketan, and Hoysala temples.'],
        importantQuestions: [
          {
            q: 'Where is the headquarters of UNESCO located?',
            options: ['Geneva', 'Vienna', 'Paris', 'Rome'],
            correctIndex: 2,
            explanation: 'UNESCO (United Nations Educational, Scientific and Cultural Organization) is headquartered in Paris, France.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'english',
    name: 'English Language',
    hindiName: 'अंग्रेजी भाषा',
    weightageNote: 'Tier-I: 25 Qs (50 Marks) · Tier-II: 40 Qs (120 Marks)',
    chapters: [
      {
        id: 'grammar-vocab-comprehension',
        title: 'Grammar, Error Detection, Vocabulary, Idioms, OWS & Cloze Test',
        keyConcepts: [
          'Subject-Verb Agreement: "Neither...nor / Either...or" takes verb matching the nearest subject; "Each / Every / Everyone" takes singular verb.',
          'Fixed Prepositions: Prefer + to, Senior/Junior + to, Comprise (no "of" in active), Discuss (no "about").',
          'Conditionals: Type 3 ("If + had + V3 ... would have + V3").',
          'Active-Passive & Direct-Indirect Narration rules for tense shifts.',
        ],
        shortTrick: 'With "Scarcely / Hardly" always pair "when"; with "No sooner" always pair "than".',
        revisionPoints: ['Practice 1 Cloze Test + 10 Idioms + 10 One-Word Substitutions daily.'],
        importantQuestions: [
          {
            q: 'Identify the error segment: "Hardly had I reached the station (A) / than the train (B) / left the platform. (C) / No error (D)"',
            options: ['Segment (A)', 'Segment (B)', 'Segment (C)', 'No error (D)'],
            correctIndex: 1,
            explanation: '"Hardly" correlates with "when", not "than". Replace "than" with "when" in segment (B).',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
  {
    id: 'computer',
    name: 'Computer Knowledge',
    hindiName: 'कंप्यूटर ज्ञान',
    weightageNote: 'Tier-II Mandatory Qualifying Module: 15 Qs (45 Marks)',
    chapters: [
      {
        id: 'computer-fundamentals-networking-security',
        title: 'Fundamentals, Hardware, Software, Internet, MS Office & Cyber Security',
        keyConcepts: [
          'CPU Components: ALU (Arithmetic Logic Unit), CU (Control Unit), Registers (fastest memory).',
          'Memory Hierarchy: Registers > Cache > RAM (Volatile) > ROM (Non-Volatile) > SSD/HDD.',
          'OSI Model 7 Layers: Physical, Data Link, Network (IP), Transport (TCP/UDP), Session, Presentation, Application (HTTP/SMTP/DNS).',
          'MS Office Shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+H (Find & Replace), F7 (Spell Check), Shift+F5 (Slide Show from current slide).',
          'Cyber Security: Phishing, Ransomware, Trojan, Firewall, HTTPS (TLS encryption), Two-Factor Authentication.',
        ],
        shortTrick: 'OSI Layers Bottom-to-Top: "Please Do Not Throw Sausage Pizza Away" (Physical, Data Link, Network, Transport, Session, Presentation, Application).',
        revisionPoints: ['1 Kilobyte = 1024 Bytes; 1 Nibble = 4 Bits; HTTP Port = 80, HTTPS Port = 443.'],
        importantQuestions: [
          {
            q: 'Which of the following is a volatile primary memory?',
            options: ['ROM', 'EPROM', 'RAM', 'SSD'],
            correctIndex: 2,
            explanation: 'RAM (Random Access Memory) loses its stored data when power is turned off, making it volatile.',
            type: 'PYQ',
          },
        ],
      },
    ],
  },
];
