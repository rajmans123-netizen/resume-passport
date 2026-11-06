// What each country commonly expects from a resume. These are conventions from career services and
// recruiters, not laws, and sources often disagree at the edges. Where they did, the note says so.
const base = { paper: 'A4', photo: 'off', dob: false, nationality: false, visa: false, licence: false, referees: false, declaration: false, sign: false, dates: 'mon', layout: 'centre', summary: 'Summary' };

export const COUNTRIES = [
  { ...base, id: 'IN', plate: 'IND', name: 'India', doc: 'Resume', pages: 1, len: '1 page, 2 with a long career',
    leftOut: 'Private companies mostly don\'t expect a photo or date of birth.',
    tip: 'Applying to a government job or PSU? Switch to that format above. If the notice gives its own format, follow the notice.',
    sources: [['Monster India', 'https://www.monster.com/career-advice/resume/indian-resume-format'], ['StylingCV', 'https://stylingcv.com/in/2026/03/26/resume-format-for-freshers-india/']] },
  { ...base, id: 'US', plate: 'USA', name: 'USA', doc: 'Resume', paper: 'Letter', pages: 1, len: '1 page, 2 with a long career',
    leftOut: 'US career centres say to leave off your photo, date of birth and marital status.',
    tip: 'US employers print on Letter, not A4, so this one comes out wider and shorter.',
    sources: [['Saint Martin\'s University', 'https://www.stmartin.edu/documents/us-style-resume'], ['University of New Mexico', 'https://career.unm.edu/career-tools/resumeguide2024.pdf']] },
  { ...base, id: 'CA', plate: 'CDN', name: 'Canada', doc: 'Resume', paper: 'Letter', pages: 2, len: '1 to 2 pages',
    leftOut: 'Newcomer guides say to leave off your photo, date of birth and country of birth.',
    tip: 'Keep references on a separate sheet and share them when asked. Listing English and French levels helps.',
    sources: [['WelcomeAide', 'https://welcomeaide.com/en/blog/canadian-resume-format-guide-newcomers'], ['Employment Hero', 'https://employmenthero.com/en-ca/blog/canadian-resume-format/']] },
  { ...base, id: 'UK', plate: 'UK', name: 'UK', doc: 'CV', pages: 2, len: 'Up to 2 pages', summary: 'Profile',
    leftOut: 'UK careers services say a photo, date of birth and marital status aren\'t needed.',
    tip: 'Name and contact details are enough at the top. In the UK this is called a CV.',
    sources: [['University of Cumbria', 'https://my.cumbria.ac.uk/media/University-of-Cumbria-Website/Content-Assets/LISS/Documents/Careers/CV_Guidelines.pdf'], ['University of Manchester', 'https://www.careers.manchester.ac.uk/applicationsinterviews/cv/step1creatingyourcv/']] },
  { ...base, id: 'AU', plate: 'AUS', name: 'Australia', doc: 'Resume', pages: 3, len: '2 to 3 pages', visa: true, referees: true, summary: 'Profile',
    leftOut: 'Australian guides say to leave off your photo and date of birth.',
    tip: 'Advice on referees is split. Listing two or three is the safe choice. State your visa if you need one.',
    sources: [['Randstad Australia', 'https://www.randstad.com.au/s3fs-media/au/public/2022-05/applying_for_jobs_ranstad_australia.pdf'], ['University of Queensland', 'https://employability.uq.edu.au/files/176803/Resume%20Fact%20Sheet%20%26%20Example.pdf']] },
  { ...base, id: 'NZ', plate: 'NZ', name: 'New Zealand', doc: 'CV', pages: 2, len: 'About 2 pages', referees: true, summary: 'Profile',
    leftOut: 'NZ guides say your date of birth, gender and marital status aren\'t needed, and a photo isn\'t usual.',
    tip: 'Two referees is the usual number. Ask their permission first.',
    sources: [['Te Herenga Waka', 'https://www.wgtn.ac.nz/careers/pdf-resources/career-essentials-pdfs/Your-CV-PDF.pdf'], ['University of Otago', 'https://www.otago.ac.nz/careers/jobs/cv/otago281401.pdf']] },
  { ...base, id: 'DE', plate: 'D', name: 'Germany', doc: 'CV', pages: 2, len: 'Up to 2 pages', photo: 'on', dob: true, nationality: true, sign: true, dates: 'num', layout: 'table', german: true, summary: 'Profile',
    leftOut: '',
    tip: 'A photo is common but not required. If the ad asks for none, leave it out. Write it in German if the ad is in German.',
    sources: [['Expatrio', 'https://www.expatrio.com/about-germany/german-cv-guide'], ['Fintiba', 'https://fintiba.com/germany/working/german-cv']] },
  { ...base, id: 'CH', plate: 'CH', name: 'Switzerland', doc: 'CV', pages: 2, len: 'Up to 2 pages', photo: 'on', dob: true, nationality: true, visa: true, dates: 'num', layout: 'photo', german: true, summary: 'Profile',
    leftOut: '',
    tip: 'Applications usually go as a full set: cover letter, diplomas and work references. Match the language of the ad.',
    sources: [['University of Zurich', 'https://prof.uzh.ch/en/welcome/dual_career/finding_employment/application.html'], ['IamExpat', 'https://www.iamexpat.ch/career/employment-guides-tools/cv-guide-switzerland']] },
  { ...base, id: 'AE', plate: 'UAE', name: 'UAE', doc: 'CV', pages: 2, len: '1 to 2 pages', photo: 'optional', dob: true, nationality: true, visa: true, licence: true, layout: 'photo', summary: 'Profile',
    leftOut: '',
    tip: 'Advice on the photo is split. Keep one version with it, and one without for online job portals.',
    sources: [['VisualCV', 'https://www.visualcv.com/international/uae-resume/'], ['Betterhomes', 'https://www.bhomes.com/en/blog/betterinformed/how-to-write-a-cv-for-a-dubai-job-that-gets-you-shortlisted']] },
  { ...base, id: 'SG', plate: 'SGP', name: 'Singapore', doc: 'Resume', pages: 2, len: '1 to 2 pages, longer for senior roles', photo: 'optional', photoDefaultOff: true, nationality: true, visa: true, summary: 'Profile',
    leftOut: 'Guides say to leave off your NRIC or FIN, date of birth, race and religion.',
    tip: 'Say your citizenship or work pass near the top. MyCareersFuture uploads must be under 2 MB.',
    sources: [['Jobstreet Singapore', 'https://sg.jobstreet.com/career-advice/article/resume-format'], ['VisualCV', 'https://visualcv.com/international/singapore-resume']] },
];

const INDIA_GOV = { doc: 'Bio-data', pages: 2, len: 'Up to 2 pages', photo: 'on', dob: true, nationality: true, declaration: true, layout: 'photo',
  leftOut: '', tip: 'Government and PSU forms often ask for a photo, date of birth and signed declaration. If the notice gives its own format, follow the notice.' };

export function getRule(id, indiaGov) {
  const r = COUNTRIES.find(c => c.id === id) || COUNTRIES[0];
  return id === 'IN' && indiaGov ? { ...r, ...INDIA_GOV } : r;
}

export const SAMPLE = {
  name: 'Ananya Kulkarni', title: 'Data Analyst', email: 'ananya@example.com', phone: '+91 98765 43210', city: 'Pune, India', links: 'linkedin.com/in/ananya-example',
  summary: 'Data analyst with three years of experience turning messy sales data into reports that teams actually use. Comfortable with SQL, Python and Power BI.',
  exp: [
    { role: 'Data Analyst', org: 'Northwind Logistics', place: 'Pune', from: '2024-06', to: '', now: true, points: 'Built a delivery dashboard used by 40 managers every week\nCut monthly report time from 3 days to 4 hours with Python\nFound a routing error that was costing Rs 6 lakh a year' },
    { role: 'Junior Analyst', org: 'Bluebird Retail', place: 'Mumbai', from: '2022-07', to: '2024-05', now: false, points: 'Cleaned sales data from 120 stores into one SQL database\nWrote the weekly sales report for the regional team' },
  ],
  edu: [{ degree: 'B.E. Computer Engineering', org: 'Western India College of Engineering', place: 'Pune', from: '2018-08', to: '2022-05', score: 'CGPA 8.4' }],
  skills: 'SQL, Python, Power BI, Excel\nStatistics, data cleaning, dashboards',
  projects: [{ name: 'City rainfall tracker', link: '', points: 'Mapped 20 years of rainfall data for 30 Indian cities' }],
  certs: 'Microsoft Power BI Data Analyst', langs: 'English, Hindi, Marathi',
  dob: '1999-03-12', nationality: 'Indian', visa: 'Needs a work permit', licence: 'Indian driving licence',
  referees: [{ name: 'Rohan Mehta', role: 'Head of Analytics, Northwind Logistics', contact: 'rohan@example.com' }, { name: 'Sara Thomas', role: 'Regional Manager, Bluebird Retail', contact: 'sara@example.com' }],
};
