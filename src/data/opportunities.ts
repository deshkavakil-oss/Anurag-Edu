export interface CurrentAffairItem {
  id: string;
  date: string;
  category: string;
  headline: string;
  shortExplanation: string;
  detailedExplanation: string;
  examRelevance: string;
  importantFacts: string[];
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
  mcq: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ScholarshipItem {
  id: string;
  name: string;
  type: 'Central Government' | 'State Government' | 'University / Research' | 'Merit & Need-Based';
  provider: string;
  eligibility: string;
  documents: string[];
  applicationProcess: string;
  officialUrl: string;
  lastVerified: string;
  deadlineNote: string;
}

export interface OfficialAlertPortal {
  id: string;
  body: string;
  category: 'Recruitment & Exams' | 'Admit Card & Results' | 'Education & Schemes';
  description: string;
  officialUrl: string;
  lastVerified: string;
}

export interface VideoResource {
  id: string;
  subject: string;
  title: string;
  provider: string;
  description: string;
  url: string;
}

export const VERIFIED_CURRENT_AFFAIRS: CurrentAffairItem[] = [
  {
    id: 'ca-1',
    date: '2026-11-01',
    category: 'Government Schemes & Governance',
    headline: 'Implementation Framework of Bharatiya Nyaya Sanhita, BNSS & BSA Across Indian Courts',
    shortExplanation: 'India’s three modernized criminal laws (BNS, BNSS, BSA) continue nationwide digital integration with eCourts and CCTNS.',
    detailedExplanation: 'Following their commencement on 1 July 2024, High Courts, State Police Departments, and Forensic Science Laboratories are expanding e-summons, Zero FIR routing, and audio-visual evidence recording across districts.',
    examRelevance: 'High relevance for SSC CHSL/CGL Polity & Current Affairs, UPSC GS-II, State PSC, Police SI, and Judiciary examinations.',
    importantFacts: ['BNS replaced IPC 1860', 'BNSS replaced CrPC 1973', 'BSA replaced Indian Evidence Act 1872', 'Zero FIR codified under Sec 173 BNSS'],
    sourceName: 'Press Information Bureau (PIB) / India Code',
    sourceUrl: 'https://www.pib.gov.in',
    lastVerified: '2026-11-15',
    mcq: {
      question: 'Which Act replaced the Indian Evidence Act, 1872 across India?',
      options: ['Bharatiya Nyaya Sanhita', 'Bharatiya Sakshya Adhiniyam', 'Bharatiya Nagarik Suraksha Sanhita', 'DPDP Act'],
      correctIndex: 1,
      explanation: 'Bharatiya Sakshya Adhiniyam (BSA), 2023 replaced the Indian Evidence Act, 1872.',
    },
  },
  {
    id: 'ca-2',
    date: '2026-11-05',
    category: 'Science & Technology',
    headline: 'ISRO Human Spaceflight (Gaganyaan) and Chandrayaan Follow-on Milestones',
    shortExplanation: 'ISRO advances orbital human-rating tests, crew escape validation, and deep-space exploration programmes.',
    detailedExplanation: 'India’s space agency continues human-rating propulsion tests and autonomous recovery operations in coordination with the Indian Navy ahead of crewed Gaganyaan objectives.',
    examRelevance: 'Frequently tested in SSC CHSL, RRB NTPC, NDA/CDS, and UPSC Science & Technology.',
    importantFacts: ['Gaganyaan aims to demonstrate human spaceflight to Low Earth Orbit (~400 km)', 'Aditya-L1 operates at Sun-Earth L1 point', 'National Space Day is observed on August 23'],
    sourceName: 'ISRO Official Portal',
    sourceUrl: 'https://www.isro.gov.in',
    lastVerified: '2026-11-15',
    mcq: {
      question: 'National Space Day in India is celebrated every year on which date?',
      options: ['15 August', '23 August', '2 October', '28 February'],
      correctIndex: 1,
      explanation: 'August 23 commemorates the successful soft landing of Chandrayaan-3 Vikram lander at Shiv Shakti Point in 2023.',
    },
  },
  {
    id: 'ca-3',
    date: '2026-11-10',
    category: 'Economy & Banking',
    headline: 'RBI Digital Public Infrastructure & UPI International Expansion',
    shortExplanation: 'RBI and NPCI expand cross-border UPI merchant linkages and CBDC retail/wholesale pilots.',
    detailedExplanation: 'Reserve Bank of India continues strengthening payment interoperability, financial inclusion, and instant settlement systems across partner nations.',
    examRelevance: 'Core for IBPS PO/Clerk, SBI PO, RBI Grade B, and SSC General Awareness.',
    importantFacts: ['UPI is operated by NPCI (National Payments Corporation of India)', 'RBI was established on 1 April 1935 under RBI Act 1934'],
    sourceName: 'Reserve Bank of India (RBI)',
    sourceUrl: 'https://www.rbi.org.in',
    lastVerified: '2026-11-15',
    mcq: {
      question: 'Which organization operates the Unified Payments Interface (UPI) in India?',
      options: ['SEBI', 'NPCI', 'SIDBI', 'NABARD'],
      correctIndex: 1,
      explanation: 'NPCI (National Payments Corporation of India) developed and operates UPI.',
    },
  },
  {
    id: 'ca-4',
    date: '2026-11-12',
    category: 'Education & Youth',
    headline: 'NEP 2020 & Academic Bank of Credits (ABC) Adoption Across Universities',
    shortExplanation: 'Indian universities implement flexible multiple entry-exit pathways and digital credit transfer via ABC.',
    detailedExplanation: 'Under UGC guidelines aligned with the National Education Policy 2020, undergraduate students accumulate verified credits in their Academic Bank of Credits linked via DigiLocker.',
    examRelevance: 'Directly tested in UGC NET Paper-I, CTET, CUET, and State PCS.',
    importantFacts: ['NEP 2020 replaced the 1986 National Policy on Education', '5+3+3+4 curricular structure for school education'],
    sourceName: 'Ministry of Education / UGC',
    sourceUrl: 'https://www.education.gov.in',
    lastVerified: '2026-11-15',
    mcq: {
      question: 'What is the school curricular structure introduced under NEP 2020?',
      options: ['10+2', '5+3+3+4', '6+3+3', '4+4+4'],
      correctIndex: 1,
      explanation: 'NEP 2020 adopts a 5+3+3+4 pedagogical structure covering ages 3 to 18.',
    },
  },
];

export const INDIAN_SCHOLARSHIPS: ScholarshipItem[] = [
  {
    id: 'nsp-central-sector',
    name: 'Central Sector Scheme of Scholarships for College and University Students (CSSS)',
    type: 'Central Government',
    provider: 'Department of Higher Education, Ministry of Education',
    eligibility: 'Students above 80th percentile in Class XII Board Exam pursuing regular degree courses; parental income within prescribed NSP limit.',
    documents: ['Aadhaar / OTR ID', 'Class XII Marksheet', 'Income Certificate', 'Bonafide Student Certificate', 'Bank Passbook linked with Aadhaar'],
    applicationProcess: 'Complete One-Time Registration (OTR) and submit fresh/renewal application on National Scholarship Portal (NSP).',
    officialUrl: 'https://scholarships.gov.in',
    lastVerified: '2026-11-15',
    deadlineNote: 'Verify exact annual opening/closing window directly on scholarships.gov.in.',
  },
  {
    id: 'nsp-post-matric',
    name: 'Post-Matric Scholarships (SC / ST / OBC / Minority / EBC Schemes)',
    type: 'Central Government',
    provider: 'Ministry of Social Justice & Empowerment / Tribal Affairs / Minority Affairs',
    eligibility: 'Students studying in Class XI to PhD from eligible categories meeting prescribed family income ceiling.',
    documents: ['Caste / Community Certificate', 'Income Certificate', 'Previous Year Marksheet', 'Fee Receipt', 'Domicile Certificate'],
    applicationProcess: 'Apply via National Scholarship Portal (scholarships.gov.in) or respective State Scholarship Portals (e.g., UP Scholarship, Bihar PMS).',
    officialUrl: 'https://scholarships.gov.in',
    lastVerified: '2026-11-15',
    deadlineNote: 'Verify state & central cycle dates on scholarships.gov.in.',
  },
  {
    id: 'dst-inspire-she',
    name: 'INSPIRE Scholarship for Higher Education (SHE)',
    type: 'University / Research',
    provider: 'Department of Science & Technology (DST), Govt of India',
    eligibility: 'Top 1% in Class XII Board Exams or qualified in JEE/NEET/IISER pursuing B.Sc / B.S / Int. M.Sc in Basic & Natural Sciences.',
    documents: ['Class XII Marksheet / Eligibility Note', 'Endorsement Form from College Principal', 'Science Course Admission Proof'],
    applicationProcess: 'Online application via DST INSPIRE portal during annual call.',
    officialUrl: 'https://online-inspire.gov.in',
    lastVerified: '2026-11-15',
    deadlineNote: 'Check online-inspire.gov.in for current batch call dates.',
  },
  {
    id: 'aicte-pragati-saksham',
    name: 'AICTE Pragati (Girls) & Saksham (Divyangjan) Technical Scholarships',
    type: 'Merit & Need-Based',
    provider: 'All India Council for Technical Education (AICTE)',
    eligibility: 'Students admitted to 1st year Degree/Diploma in AICTE-approved technical institutions meeting family income norms.',
    documents: ['Admission Letter', 'Tuition Fee Receipt', 'Family Income Certificate', 'Disability Certificate (for Saksham)'],
    applicationProcess: 'Apply online through NSP (scholarships.gov.in) under AICTE schemes.',
    officialUrl: 'https://www.aicte-india.org/schemes/students-development-schemes',
    lastVerified: '2026-11-15',
    deadlineNote: 'Verify active academic year notification on NSP & aicte-india.org.',
  },
  {
    id: 'state-up-bihar-scholarships',
    name: 'State Post-Matric & Dashmottar Scholarship Portals (UP, Bihar, MP, Rajasthan, WB)',
    type: 'State Government',
    provider: 'Respective State Social Welfare / Education Departments',
    eligibility: 'Permanent residents of the respective state enrolled in recognized schools, colleges, or universities.',
    documents: ['State Domicile', 'Aadhaar e-KYC', 'Caste & Income Certificate', 'Institute Verification'],
    applicationProcess: 'Apply exclusively through the official state portal (e.g., scholarship.up.gov.in, pmsonline.bih.nic.in, banglaruchchashiksha.wb.gov.in).',
    officialUrl: 'https://scholarships.gov.in',
    lastVerified: '2026-11-15',
    deadlineNote: 'State portals publish independent closing dates; check your state portal directly.',
  },
];

export const OFFICIAL_ALERT_PORTALS: OfficialAlertPortal[] = [
  {
    id: 'alert-ssc',
    body: 'Staff Selection Commission (SSC)',
    category: 'Recruitment & Exams',
    description: 'Official notifications, OTR registration, admit cards, answer keys, and results for SSC CHSL, CGL, MTS, GD, CPO, and Stenographer.',
    officialUrl: 'https://ssc.gov.in',
    lastVerified: '2026-11-15',
  },
  {
    id: 'alert-upsc',
    body: 'Union Public Service Commission (UPSC)',
    category: 'Recruitment & Exams',
    description: 'Official exam calendar, Civil Services (IAS/IPS), NDA, CDS, CAPF notifications, e-Admit Cards, and final merit lists.',
    officialUrl: 'https://upsc.gov.in',
    lastVerified: '2026-11-15',
  },
  {
    id: 'alert-rrb',
    body: 'Railway Recruitment Boards (RRB)',
    category: 'Admit Card & Results',
    description: 'Centralized Employment Notices (CEN) for RRB NTPC, ALP, Technician, JE, and Level-1 (Group D) exam schedules & results.',
    officialUrl: 'https://www.rrbcdg.gov.in',
    lastVerified: '2026-11-15',
  },
  {
    id: 'alert-ibps',
    body: 'IBPS & Public Sector Banks',
    category: 'Recruitment & Exams',
    description: 'Annual CRP Calendar, PO/Clerk/RRB Officer notifications, call letters, and scorecards.',
    officialUrl: 'https://www.ibps.in',
    lastVerified: '2026-11-15',
  },
  {
    id: 'alert-nta',
    body: 'National Testing Agency (NTA)',
    category: 'Education & Schemes',
    description: 'CUET UG/PG, UGC NET, JEE Main, and NEET UG official information bulletins, city intimation slips, and results.',
    officialUrl: 'https://www.nta.ac.in',
    lastVerified: '2026-11-15',
  },
  {
    id: 'alert-ncs',
    body: 'National Career Service & Employment News',
    category: 'Education & Schemes',
    description: 'Government of India verified job openings, apprenticeship portals, and weekly Employment News bulletins.',
    officialUrl: 'https://www.ncs.gov.in',
    lastVerified: '2026-11-15',
  },
];

export const OFFICIAL_VIDEO_RESOURCES: VideoResource[] = [
  {
    id: 'vid-ncert-evidya',
    subject: 'School Education (Class 1–12)',
    title: 'PM eVIDYA & NCERT Official Video Lectures',
    provider: 'NCERT / Ministry of Education',
    description: 'Free curriculum-aligned video lessons across Science, Maths, Social Studies, and Languages for Class 1–12.',
    url: 'https://diksha.gov.in',
  },
  {
    id: 'vid-swayam',
    subject: 'College, Law & Competitive Prep',
    title: 'SWAYAM Massive Open Online Courses (MOOCs)',
    provider: 'Ministry of Education & UGC',
    description: 'Full semester university lectures covering Constitutional Law, Economics, History, Computer Science, and Research Methodology.',
    url: 'https://swayam.gov.in',
  },
  {
    id: 'vid-nptel',
    subject: 'Engineering, Coding & Sciences',
    title: 'NPTEL Video Course Library (IITs & IISc)',
    provider: 'NPTEL',
    description: 'Verified university-grade technical lectures in Programming, AI, Data Structures, Mathematics, and Physics.',
    url: 'https://nptel.ac.in',
  },
  {
    id: 'vid-sansad',
    subject: 'Polity, Current Affairs & UPSC',
    title: 'Sansad TV Parliamentary & Policy Discussions',
    provider: 'Sansad TV Official',
    description: 'Official parliamentary debates, Bill analyses, and national policy discussions for UPSC & State PSC prep.',
    url: 'https://sansadtv.nic.in',
  },
];
