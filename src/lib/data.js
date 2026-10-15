// Mock data for the demo. Everything lives in the browser (localStorage) so the
// worker, employer and admin screens share one state with no backend.

export const NAKAS = {
  ghatkopar: { id: 'ghatkopar', name: { hi: 'घाटकोपर नाका', mr: 'घाटकोपर नाका', en: 'Ghatkopar naka' }, lat: 19.0863, lng: 72.9089 },
  kurla: { id: 'kurla', name: { hi: 'कुर्ला नाका', mr: 'कुर्ला नाका', en: 'Kurla naka' }, lat: 19.0728, lng: 72.8826 },
  vikhroli: { id: 'vikhroli', name: { hi: 'विक्रोली नाका', mr: 'विक्रोळी नाका', en: 'Vikhroli naka' }, lat: 19.1103, lng: 72.9271 },
}

export const TRADES = [
  { id: 'painter', icon: 'PaintRoller', name: { hi: 'पेंटर', mr: 'पेंटर', en: 'Painter' } },
  { id: 'plumber', icon: 'Wrench', name: { hi: 'प्लंबर', mr: 'प्लंबर', en: 'Plumber' } },
  { id: 'electrician', icon: 'Zap', name: { hi: 'बिजली मिस्त्री', mr: 'वायरमन', en: 'Electrician' } },
  { id: 'carpenter', icon: 'Hammer', name: { hi: 'बढ़ई', mr: 'सुतार', en: 'Carpenter' } },
  { id: 'mason', icon: 'BrickWall', name: { hi: 'राजमिस्त्री', mr: 'गवंडी', en: 'Mason' } },
  { id: 'helper', icon: 'HardHat', name: { hi: 'हेल्पर', mr: 'मदतनीस', en: 'Helper' } },
  { id: 'cleaning', icon: 'SprayCan', name: { hi: 'सफ़ाई', mr: 'साफसफाई', en: 'Cleaning' } },
]
export const tradeById = (id) => TRADES.find((t) => t.id === id) || TRADES[5]

// Usual daily rate per trade around Ghatkopar (mock; in production: state minimum
// wage notification + median of completed Kaam Parchis on the platform).
export const FAIR = {
  painter: [750, 950], plumber: [800, 1000], electrician: [850, 1100], carpenter: [800, 1050],
  mason: [700, 900], helper: [550, 700], cleaning: [500, 650],
}
export const MIN_WAGE = 450

export const dayISO = (offset = 0) => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
export const daysFrom = (startOffset, n) => Array.from({ length: n }, (_, i) => dayISO(startOffset + i))

const job = (o) => ({
  status: 'open', advanceFee: 0, verified: true, rating: 4.5, payWhen: { hi: 'रोज़ शाम · UPI', mr: 'रोज संध्याकाळी · UPI', en: 'Daily evening · UPI' },
  createdBy: 'seed', reported: false, approved: false, ...o,
})

export function seedJobs() {
  return [
    job({
      id: 'j1', trade: 'painter', title: { hi: '2BHK पेंटिंग', mr: '2BHK रंगकाम', en: '2BHK flat painting' },
      employer: { hi: 'शर्मा जी', mr: 'शर्मा जी', en: 'Sharma ji' }, employerId: 'sharma',
      area: { hi: 'विद्याविहार पश्चिम', mr: 'विद्याविहार पश्चिम', en: 'Vidyavihar West' },
      address: 'B-204, Sai Krupa, Vidyavihar West', lat: 19.0793, lng: 72.8962,
      pay: 900, days: daysFrom(1, 3), hours: '9 – 6', rating: 4.7,
    }),
    job({
      id: 'j2', trade: 'painter', title: { hi: 'दुकान की पुट्टी', mr: 'दुकानाची पुट्टी', en: 'Shop wall putty' },
      employer: { hi: 'पटेल किराना', mr: 'पटेल किराणा', en: 'Patel Kirana' }, employerId: 'patel',
      area: { hi: 'घाटकोपर पूर्व', mr: 'घाटकोपर पूर्व', en: 'Ghatkopar East' },
      address: 'Shop 4, RB Mehta Marg, Ghatkopar East', lat: 19.0815, lng: 72.9142,
      pay: 750, days: daysFrom(0, 1), hours: '10 – 5', rating: 4.5,
    }),
    job({
      id: 'j3', trade: 'helper', title: { hi: 'मज़दूर चाहिए, तुरंत', mr: 'मजूर हवा, लगेच', en: 'Labour needed urgently' },
      employer: { hi: 'अनजान', mr: 'अज्ञात', en: 'Unknown' }, employerId: 'unknown',
      area: { hi: 'पता नहीं दिया', mr: 'पत्ता नाही', en: 'Not given' },
      address: '', lat: 19.0935, lng: 72.9195, pay: 2500, advanceFee: 500, verified: false, rating: 0,
      days: daysFrom(0, 1), hours: '8 – 8', payWhen: { hi: 'काम के बाद', mr: 'कामानंतर', en: 'After work' },
    }),
    job({
      id: 'j4', trade: 'painter', title: { hi: 'सोसाइटी गेट पेंटिंग', mr: 'सोसायटी गेट रंगकाम', en: 'Society gate painting' },
      employer: { hi: 'ओम सोसाइटी', mr: 'ओम सोसायटी', en: 'Om Society' }, employerId: 'om',
      area: { hi: 'पंत नगर', mr: 'पंत नगर', en: 'Pant Nagar' },
      address: 'Om CHS, Pant Nagar, Ghatkopar East', lat: 19.0803, lng: 72.9178,
      pay: 850, days: daysFrom(4, 2), hours: '9 – 5', rating: 4.6,
    }),
    job({
      id: 'j5', trade: 'painter', title: { hi: 'बिल्डिंग साइट पेंटर (1 महीना)', mr: 'बिल्डिंग साइट पेंटर (1 महिना)', en: 'Building site painter (1 month)' },
      employer: { hi: 'श्री बिल्डर्स', mr: 'श्री बिल्डर्स', en: 'Shree Builders' }, employerId: 'shree',
      area: { hi: 'विक्रोली', mr: 'विक्रोळी', en: 'Vikhroli' },
      address: 'Shree Heights site, LBS Marg, Vikhroli', lat: 19.1062, lng: 72.9248,
      pay: 800, days: daysFrom(6, 26), hours: '8 – 5', rating: 4.4,
      payWhen: { hi: 'हर हफ़्ते · बैंक', mr: 'दर आठवड्याला · बँक', en: 'Weekly · bank' },
    }),
    job({
      id: 'j6', trade: 'helper', title: { hi: 'सामान शिफ्टिंग हेल्पर', mr: 'सामान हलवणे मदतनीस', en: 'House shifting helper' },
      employer: { hi: 'मेहता परिवार', mr: 'मेहता कुटुंब', en: 'Mehta family' }, employerId: 'mehta',
      area: { hi: 'किरोल रोड', mr: 'किरोळ रोड', en: 'Kirol Road' },
      address: 'Flat 12, Neelkanth, Kirol Road', lat: 19.0882, lng: 72.9012,
      pay: 650, days: daysFrom(2, 1), hours: '10 – 4', rating: 4.3,
    }),
    job({
      id: 'j7', trade: 'helper', title: { hi: 'साइट पर हेल्पर', mr: 'साइटवर मदतनीस', en: 'Helper for site work' },
      employer: { hi: 'आर. के. ठेकेदार', mr: 'आर. के. ठेकेदार', en: 'R.K. Contractor' }, employerId: 'rk',
      area: { hi: 'असल्फा', mr: 'असल्फा', en: 'Asalpha' },
      address: 'Asalpha village road', lat: 19.0955, lng: 72.8985, pay: 300, verified: false, rating: 3.1,
      days: daysFrom(1, 2), hours: '8 – 7',
    }),
  ]
}

export function seedWorker() {
  return {
    onboarded: true,
    name: 'रमेश काले', nameLatin: 'Ramesh Kale', phone: '98XXXXXX21', setu: '2417',
    trade: 'painter', years: '10+', naka: 'ghatkopar',
    jobsDone: 23, rating: 4.8, onTime: 98,
    phoneVerified: true, vouched: true, idVerified: false,
    skills: [
      { label: { hi: 'टेक्सचर पेंटिंग', mr: 'टेक्स्चर पेंटिंग', en: 'Texture painting' }, n: 3 },
      { label: { hi: 'वॉटरप्रूफिंग', mr: 'वॉटरप्रूफिंग', en: 'Waterproofing' }, n: 2 },
      { label: { hi: 'पुट्टी', mr: 'पुट्टी', en: 'Putty' }, n: 1 },
    ],
    photos: [], offDays: [0], checkedIn: false, checkedInAt: null,
  }
}

export const OTHER_WORKERS = [
  { setu: '3851', name: 'Suresh Patil', trade: 'painter', years: '6–10', jobsDone: 15, rating: 4.6, atNaka: true },
  { setu: '5120', name: 'Arif Y.', trade: 'painter', years: '10+', jobsDone: 31, rating: 4.9, atNaka: true },
  { setu: '7703', name: 'Mohan S.', trade: 'helper', years: '3–5', jobsDone: 9, rating: 4.2, atNaka: true },
]

export function seedBookings() {
  const days = [dayISO(-3), dayISO(-2)]
  return [
    {
      id: 'b0', jobId: null, status: 'completed', empYes: true, workerYes: true, rating: 4.5, createdAt: dayISO(-4),
      snap: {
        title: { hi: 'सोसाइटी गेट मरम्मत', mr: 'सोसायटी गेट दुरुस्ती', en: 'Society gate repair' },
        employer: { hi: 'साईं दर्शन सोसाइटी', mr: 'साई दर्शन सोसायटी', en: 'Sai Darshan Society' },
        address: 'Sai Darshan CHS, Ghatkopar East', pay: 850, hours: '9 – 5', trade: 'painter',
        payWhen: { hi: 'रोज़ शाम · नकद', mr: 'रोज संध्याकाळी · रोख', en: 'Daily evening · cash' }, advanceFee: 0,
      },
      log: days.map((d, i) => ({ date: d, worked: true, empConfirmed: true, paid: i === 0 })),
    },
  ]
}

export function seedComplaints() {
  return [
    { id: 'c1', worker: 'Mohan S. · Helper', amount: 1300, note: '2 days unpaid · Kaam Parchi attached', status: 'open' },
    { id: 'c2', worker: 'Anil K. · Carpenter', amount: 800, note: '1 day unpaid · employer not responding', status: 'open' },
  ]
}

export function seedState() {
  return {
    v: 3,
    lang: 'hi',
    worker: seedWorker(),
    jobs: seedJobs(),
    bookings: seedBookings(),
    complaints: seedComplaints(),
    pendingEmployers: 4,
  }
}

// Scheme rules for the scheme finder (simplified; the app says it is an estimate).
export const SCHEMES = [
  {
    id: 'eshram', icon: 'IdCard',
    name: { hi: 'e-Shram कार्ड', mr: 'ई-श्रम कार्ड', en: 'e-Shram card' },
    benefit: { hi: '₹2 लाख दुर्घटना बीमा, सरकारी योजनाओं से जुड़ाव', mr: '₹2 लाख अपघात विमा, सरकारी योजनांशी जोडणी', en: '₹2 lakh accident cover, link to welfare schemes' },
    eligible: (a) => a.age !== '60+',
    docs: ['aadhaar', 'bank', 'mobile'],
  },
  {
    id: 'pmsym', icon: 'Clock',
    name: { hi: 'PM-SYM पेंशन', mr: 'PM-SYM पेन्शन', en: 'PM-SYM pension' },
    benefit: { hi: '60 साल के बाद ₹3,000 महीना पेंशन', mr: '60 वर्षांनंतर दरमहा ₹3,000 पेन्शन', en: '₹3,000/month pension after 60' },
    eligible: (a) => a.age === '18-40' && a.income === 'yes' && a.bank === 'yes',
    docs: ['aadhaar', 'bank'],
  },
  {
    id: 'bocw', icon: 'Landmark',
    name: { hi: 'BOCW कल्याण बोर्ड', mr: 'बांधकाम कामगार मंडळ', en: 'Construction Workers Board' },
    benefit: { hi: 'औज़ार, बच्चों की पढ़ाई, बीमा के लिए मदद', mr: 'अवजारे, मुलांचे शिक्षण, विम्यासाठी मदत', en: 'Help for tools, children\'s education, insurance' },
    eligible: (a) => a.work === 'construction' && a.age !== '60+',
    docs: ['aadhaar', 'bank', 'photo', 'work90'],
  },
  {
    id: 'pmsby', icon: 'ShieldCheck',
    name: { hi: 'PM सुरक्षा बीमा', mr: 'PM सुरक्षा विमा', en: 'PM Suraksha Bima' },
    benefit: { hi: '₹20 साल में ₹2 लाख का बीमा', mr: '₹20 वर्षाला ₹2 लाख विमा', en: '₹2 lakh cover for ₹20 a year' },
    eligible: (a) => a.bank === 'yes' && a.age !== '60+',
    docs: ['aadhaar', 'bank'],
  },
]

export const DOCS = {
  aadhaar: { icon: 'IdCard', name: { hi: 'आधार कार्ड', mr: 'आधार कार्ड', en: 'Aadhaar card' } },
  bank: { icon: 'Wallet', name: { hi: 'बैंक पासबुक', mr: 'बँक पासबुक', en: 'Bank passbook' } },
  mobile: { icon: 'Phone', name: { hi: 'आधार से जुड़ा मोबाइल', mr: 'आधारशी जोडलेला मोबाईल', en: 'Mobile linked to Aadhaar' } },
  photo: { icon: 'Camera', name: { hi: 'पासपोर्ट फ़ोटो', mr: 'पासपोर्ट फोटो', en: 'Passport photo' } },
  work90: { icon: 'FileText', name: { hi: '90 दिन काम का प्रमाण (पर्चियां चलेंगी)', mr: '90 दिवस कामाचा पुरावा (पावत्या चालतील)', en: '90 days work proof (Kaam Parchis help)' } },
}
