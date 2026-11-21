export interface EducationTrack {
  id: string;
  tier: 'School Education' | 'Undergraduate' | 'Postgraduate' | 'Other Education';
  title: string;
  boardsOrStreams: string[];
  coreSubjects: string[];
  officialPortal: string;
  portalLabel: string;
}

export const EDUCATION_TRACKS: EducationTrack[] = [
  {
    id: 'school-1-12',
    tier: 'School Education',
    title: 'Class 1 to 12 (CBSE, ICSE, State Boards & NCERT)',
    boardsOrStreams: ['CBSE', 'ICSE / ISC', 'UPMSP / Bihar / Maharashtra / State Boards', 'NCERT Textbooks'],
    coreSubjects: ['Mathematics', 'Science (Physics, Chemistry, Biology)', 'Social Science (History, Geography, Civics, Economics)', 'English & Hindi', 'Computer Science / Informatics'],
    officialPortal: 'https://ncert.nic.in/textbook.php',
    portalLabel: 'NCERT Official Textbooks',
  },
  {
    id: 'ug-ba-bsc-bcom',
    tier: 'Undergraduate',
    title: 'BA, BSc, BCom, BBA & BCA Programmes',
    boardsOrStreams: ['NEP 2020 Four-Year UG', 'BA (Humanities)', 'BSc (Sciences)', 'BCom / BBA (Commerce)', 'BCA (Computer Applications)'],
    coreSubjects: ['Political Science & History', 'Physics, Chemistry & Mathematics', 'Financial Accounting & Corporate Law', 'Data Structures & DBMS', 'Business Economics'],
    officialPortal: 'https://www.ugc.gov.in',
    portalLabel: 'UGC Curricular Framework',
  },
  {
    id: 'ug-professional',
    tier: 'Undergraduate',
    title: 'BA LLB, BTech, MBBS & BEd',
    boardsOrStreams: ['BA LLB (5-Year Integrated)', 'BTech / BE Engineering', 'MBBS Medical Sciences', 'BEd Teacher Training'],
    coreSubjects: ['Constitutional & Criminal Law (BNS/BNSS/BSA)', 'Algorithms, OS & Engineering Maths', 'Anatomy, Physiology & Pathology', 'Educational Psychology & Pedagogy'],
    officialPortal: 'https://www.aicte-india.org',
    portalLabel: 'AICTE / Regulatory Portals',
  },
  {
    id: 'pg-degrees',
    tier: 'Postgraduate',
    title: 'MA, MSc, MCom, MBA, MCA, LLM & MTech',
    boardsOrStreams: ['MA / MSc / MCom', 'MBA / PGDM', 'MCA / MTech', 'LLM (Master of Laws)'],
    coreSubjects: ['Research Methodology', 'Strategic Management & Finance', 'Distributed Systems & AI', 'Comparative Constitutional Law & Jurisprudence'],
    officialPortal: 'https://swayam.gov.in',
    portalLabel: 'SWAYAM PG Courses',
  },
  {
    id: 'other-skills',
    tier: 'Other Education',
    title: 'Coding, AI, English Communication, Research & Career Skills',
    boardsOrStreams: ['Programming (Python, TypeScript, C++)', 'Artificial Intelligence', 'English Communication', 'Research Methodology', 'Career Development'],
    coreSubjects: ['Full-Stack Web Engineering', 'Prompt & Applied AI Literacy', 'Academic Writing & Citation Ethics', 'Workplace & Interview Communication'],
    officialPortal: 'https://nptel.ac.in',
    portalLabel: 'NPTEL Technical Portal',
  },
];

export const INDIAN_UNIVERSITIES: string[] = [
  'University of Delhi (DU)',
  'Banaras Hindu University (BHU)',
  'University of Allahabad',
  'Jawaharlal Nehru University (JNU)',
  'University of Lucknow',
  'Patna University',
  'University of Calcutta',
  'University of Mumbai',
  'Savitribai Phule Pune University',
  'Anna University',
  'Aligarh Muslim University (AMU)',
  'Jamia Millia Islamia (JMI)',
  'Dr. Ram Manohar Lohiya National Law University (RMLNLU)',
  'National Law School of India University (NLSIU)',
  'IGNOU (Indira Gandhi National Open University)',
  'Other / State University',
];

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh',
];
