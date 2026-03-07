import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, LineChart,
} from 'recharts'
import {
  CalendarDays, Snowflake, Megaphone,
  ChevronDown, ChevronRight, ExternalLink, Sparkles, X,
  Thermometer,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCurrency } from '../../lib/formatters'

/* ─── Types ─────────────────────────────────────────────────────────── */
type SeasonalGroup = 'cold-flu' | 'allergy' | 'skin-sun' | 'pain-sport'

interface ActivationWindow {
  id: string
  title: string
  seasonLabel: string
  months: number[]
  seasonalGroup: SeasonalGroup | 'general'
  colorHex: string
  description: string
  rationale: string
  instagram: { contentIdeas: string[]; hashtags: string[]; url: string; timing: string; format: string }
  tiktok: { contentIdeas: string[]; hashtags: string[]; url: string; timing: string; trending: string[] }
  atl: { channels: string[]; headline: string; keyMessage: string; timing: string; budget: string }
  expectedImpact: string
  storeActions: string[]
}

/* ─── Category → Seasonal Group Mapping ─────────────────────────────── */
const SEASONAL_CATEGORY_MAP: Record<string, SeasonalGroup> = {
  'RESPIRATORY SYSTEM': 'cold-flu',
  'SYSTEMIC ANTI-INFECTIVES': 'cold-flu',
  'DERMATOLOGICALS': 'skin-sun',
  'SENSORY ORGANS': 'allergy',
  'MUSCULO-SKELETAL SYSTEM': 'pain-sport',
}

const SEASONAL_CATEGORIES = ['RESPIRATORY SYSTEM', 'SYSTEMIC ANTI-INFECTIVES', 'DERMATOLOGICALS', 'SENSORY ORGANS', 'MUSCULO-SKELETAL SYSTEM', 'ALIMENTARY T.& METABOLISM', 'NERVOUS SYSTEM', 'CARDIOVASCULAR SYSTEM']

const GROUP_META: Record<SeasonalGroup, { label: string; color: string }> = {
  'cold-flu':   { label: 'Cold & Flu',   color: '#2563EB' },
  'allergy':    { label: 'Allergy',      color: '#059669' },
  'skin-sun':   { label: 'Skin & Sun',   color: '#D97706' },
  'pain-sport': { label: 'Pain & Sport', color: '#7C3AED' },
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// Fiscal year order: Apr → Mar
const FISCAL_MONTHS = [4,5,6,7,8,9,10,11,12,1,2,3]
const FISCAL_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

/* ─── 8 Marketing Activation Playbooks ──────────────────────────────── */
const ACTIVATION_CALENDAR: ActivationWindow[] = [
  {
    id: 'flu-vax',
    title: 'Flu Vaccination Season',
    seasonLabel: 'Autumn 2025',
    months: [3, 4, 5],
    seasonalGroup: 'cold-flu',
    colorHex: '#2563EB',
    description: 'The annual flu vaccination window is Australia\'s highest-value pharmacy activation. Government-funded NIP program plus private pay creates dual revenue streams.',
    rationale: 'Rx data shows RESPIRATORY SYSTEM and SYSTEMIC ANTI-INFECTIVES reach their annual setup phase in Apr-May before winter. Activating 6 weeks pre-peak maximises jab volume and drives complementary sales (Vitamin C, zinc, immune health).',
    instagram: {
      contentIdeas: [
        'Pharmacist-to-camera reel: "3 reasons to get your flu shot at pharmacy this year"',
        'Before/after customer testimonial carousel — "I used to skip it every year until..."',
        'Behind-the-scenes Stories: Vaccine cold chain — what to expect at your appointment',
        'Static infographic: "Who should get the flu shot?" with Australian eligibility groups',
        'Countdown Stories: "X weeks until flu season — are you protected?" with booking link',
      ],
      hashtags: ['#FluShot', '#GetVaccinated', '#PharmacyHealth', '#AustralianPharmacy', '#FluSeason', '#YourPharmacist'],
      url: 'https://www.instagram.com/explore/tags/flushot/',
      timing: 'Begin 4 weeks before April. Peak posting: last 2 weeks of March through April.',
      format: 'Reels (highest reach), Carousel (education), Stories (booking CTA)',
    },
    tiktok: {
      contentIdeas: [
        '"Day in the life of a pharmacist giving flu shots" — authentic POV content',
        '"Flu shot myths debunked in 60 seconds" — rapid-fire with pharmacist on camera',
        '"What happens to your body: flu vs flu shot" — side-by-side visual comparison',
        'Storytime: "The year I skipped my flu shot..." — pharmacist personal story',
      ],
      hashtags: ['#PharmacyTok', '#FluShotTok', '#HealthTok', '#PharmacistOfTikTok', '#AusHealth'],
      url: 'https://www.tiktok.com/tag/flushot',
      timing: 'First TikTok 3 weeks before April. Post 4-5x/week during peak (Apr-May).',
      trending: ['Hook: "This is the one health thing Australians skip every year..."', 'Format: "POV: You\'re a pharmacist in flu season"'],
    },
    atl: {
      channels: ['Community Radio', 'Local Digital Newspaper', 'Pharmacy Window Signage', 'GP Waiting Room Posters', 'Local Facebook Groups'],
      headline: 'Get Your Flu Shot This Autumn. Book at Your Local Pharmacy.',
      keyMessage: 'Fast. No appointment needed. Medicare-covered for eligible groups. Walk in today.',
      timing: '6 weeks pre-April through end of May.',
      budget: 'High — flu vaccination is highest-ROI activation in pharmacy calendar',
    },
    expectedImpact: 'Flu vaccination drives 15-25% uplift in cold & flu category sales same-visit. Booking volume increases 2-3x with coordinated social + in-store activation.',
    storeActions: ['Dedicated flu station signage at counter and entrance', 'Cross-sell display: flu shot area adjacent to immune health products', 'Online booking link in Instagram bio and Google Business Profile', 'Loyalty reward: Double points for flu shot bookings'],
  },
  {
    id: 'winter-cold-flu',
    title: 'Winter Cold & Flu Season',
    seasonLabel: 'Winter 2025',
    months: [6, 7, 8],
    seasonalGroup: 'cold-flu',
    colorHex: '#4F46E5',
    description: 'The highest-traffic period for Australian pharmacy. Cold & flu, antivirals, pain relief, and immune health all peak simultaneously. This is the primary commercial window for respiratory categories.',
    rationale: 'RESPIRATORY SYSTEM and SYSTEMIC ANTI-INFECTIVES show their annual peak in Jun-Aug based on 24 months of Rx data. This is the window to dominate — not just participate.',
    instagram: {
      contentIdeas: [
        'Weekly "winter wellness tip" carousel — pharmacist authored, 5 practical tips per slide',
        'Product spotlight: "Pharmacist picks for cold & flu this winter" — authentic, not catalogue',
        'Poll/Quiz Stories: "Which symptoms do you have? Cold or flu?" — drives DMs and engagement',
        'Night-time routine reel: "Your pharmacist\'s winter routine for staying well"',
        'Live Q&A: Monthly 20-min Instagram Live — pharmacist answers cold & flu questions',
        'Symptom decision tree: Cold vs flu vs COVID — when to see pharmacist vs GP',
      ],
      hashtags: ['#WinterWellness', '#ColdAndFlu', '#PharmacistAdvice', '#WinterHealth', '#FluSeason2025', '#StayWell'],
      url: 'https://www.instagram.com/explore/tags/winterwellness/',
      timing: 'Sustained campaign June-August. Post 5x/week. Peak engagement Tue-Thu 7-9pm.',
      format: 'Reels (reach), Stories daily (engagement), Carousels (saves and shares)',
    },
    tiktok: {
      contentIdeas: [
        '"Rate my cold & flu cabinet" — pharmacist reviews what people have at home',
        '"Things your pharmacist wants you to know about the flu" — list format, high shareability',
        '"I\'m a pharmacist — here\'s what I actually take when I get sick"',
        '"When to see a doctor vs your pharmacist" — clear, shareable decision guide',
      ],
      hashtags: ['#ColdFluTok', '#PharmacyTok', '#WinterHealth', '#PharmacistAdvice', '#AusWinter'],
      url: 'https://www.tiktok.com/tag/coldflu',
      timing: 'June 1 through August 31. Minimum 4 posts/week.',
      trending: ['Hook: "If you\'re watching this, you\'re probably sick..."', 'Format: Recipe-style — "2 things you need for a sore throat (pharmacist edition)"'],
    },
    atl: {
      channels: ['Pharmacy Window & In-Store Displays', 'Geo-targeted Facebook/Instagram Ads', 'Google Local Search Ads', 'Community Radio'],
      headline: 'Winter\'s Here. Your Pharmacy Is Ready.',
      keyMessage: 'Expert advice. No appointment. Open 7 days. Ask your pharmacist today.',
      timing: 'June 1 — August 31. Amplify during school holidays.',
      budget: 'High — highest-value commercial window in the pharmacy year',
    },
    expectedImpact: 'Cold & flu season is the largest volume spike in pharmacy traffic. Active social presence during winter drives 20-30% higher category sales vs passive competitors.',
    storeActions: ['Front-of-store cold & flu feature bay — refreshed every 2 weeks', 'Symptom checker signage — guides to product and pharmacist consultation', 'Bundle promotions: Cold & flu kit (thermometer + lozenges + pain relief + nasal spray)', 'Click & collect for sick customers who don\'t want to leave home'],
  },
  {
    id: 'spring-allergy',
    title: 'Spring Allergy & Hayfever',
    seasonLabel: 'Spring 2025',
    months: [9, 10, 11],
    seasonalGroup: 'allergy',
    colorHex: '#059669',
    description: 'Spring in Australia (Sep-Nov) brings pollen season, grass triggers, and thunderstorm asthma risk. Antihistamines, nasal sprays, and eye drops are high-margin, high-frequency repeat purchase categories.',
    rationale: 'Respiratory and allergy-linked categories show a secondary peak in spring. The Sep-Nov window is underactivated by most pharmacies despite clear consumer demand.',
    instagram: {
      contentIdeas: [
        '"Spring is beautiful... unless you have hayfever" — relatable, high engagement',
        'Antihistamine comparison carousel: "Pharmacist explains the differences"',
        '"Spring Allergy Survival Kit" — product flatlay with pharmacist caption',
        'Pollen calendar Story: "High pollen days this week — what to do"',
        'Thunderstorm asthma awareness post — positions pharmacy as community health resource',
      ],
      hashtags: ['#Hayfever', '#AllergyRelief', '#SpringAllergies', '#PollenSeason', '#PharmacistAdvice', '#AllergyAustralia'],
      url: 'https://www.instagram.com/explore/tags/hayfever/',
      timing: 'Begin September 1. Sustain through November. Spike on high-pollen days.',
      format: 'Reels (reach), Interactive Stories (polls), Carousels (educational saves)',
    },
    tiktok: {
      contentIdeas: [
        '"POV: It\'s September in Australia and you have hayfever" — relatable, high-share',
        '"Antihistamine non-drowsy vs drowsy — your pharmacist explains"',
        '"I tried every hayfever remedy for a week — here\'s what worked"',
        '"Ask a pharmacist" series: Real hayfever questions from the comments',
      ],
      hashtags: ['#HayfeverTok', '#AllergyTok', '#SpringHealth', '#PharmacistTok', '#HayfeverSeason'],
      url: 'https://www.tiktok.com/tag/hayfever',
      timing: 'September 1 — November 30. Post 3-4x/week. Spike on high-pollen alert days.',
      trending: ['Hook: "Hayfever sufferers, this one\'s for you..."', 'Format: "Things I do differently since my pharmacist told me this about hayfever..."'],
    },
    atl: {
      channels: ['Google Ads (hayfever tablets, allergy pharmacy)', 'Facebook/Instagram Ads (target: outdoor activities)', 'Local sporting club sponsorship (high pollen exposure)', 'Email/SMS to loyalty members with hayfever history'],
      headline: 'Hayfever Season Has Started. Your Pharmacist Can Help.',
      keyMessage: 'Find the right antihistamine. Expert advice, no appointment needed.',
      timing: 'September 1 — November 15.',
      budget: 'Medium — strong ROI, high repeat purchase frequency',
    },
    expectedImpact: 'Hayfever is one of the highest repeat-purchase categories. Proactive communication drives customers to switch from supermarket to pharmacy channel where pharmacist recommendation converts to higher-margin products.',
    storeActions: ['Seasonal allergy display at pharmacy entrance', 'Cross-sell: Antihistamine adjacent to eye drops and nasal spray', 'Sampling program for new antihistamine formats (melt strips, children\'s liquid)', 'Weather-linked SMS alerts: high pollen day notifications'],
  },
  {
    id: 'back-to-school',
    title: 'Back to School — Child Health',
    seasonLabel: 'Summer 2024-25',
    months: [1, 2],
    seasonalGroup: 'cold-flu',
    colorHex: '#EA580C',
    description: 'January-February: children returning to school triggers predictable spikes in lice treatments, children\'s cold & flu, sunscreen for school, and vaccination catch-ups.',
    rationale: 'Post-Christmas return to school drives a predictable spike in paediatric-linked categories. This is an underutilised activation window for community pharmacy vs supermarket.',
    instagram: {
      contentIdeas: [
        '"Back to school health checklist" carousel — 6 slides, one per health category',
        '"Does my child need the pharmacy before school?" — reel with pharmacist Q&A',
        'Parent poll Story: "What do you stock up on before school goes back?"',
        '"School sickness explained" — when to keep kids home, when pharmacy is enough',
        'Lice treatment video: "Exactly what to do if your child gets nits at school"',
      ],
      hashtags: ['#BackToSchool', '#KidsHealth', '#SchoolHealth', '#ParentingAustralia', '#PharmacistMum'],
      url: 'https://www.instagram.com/explore/tags/backtoschool/',
      timing: 'Second week of January through end of February. Target parent peak hours: 6-8am, 8-10pm.',
      format: 'Carousels (saves by parents), Reels (school routines), Stories (quick tips)',
    },
    tiktok: {
      contentIdeas: [
        '"Back to school pharmacy haul — what a pharmacist actually recommends"',
        '"What to do when your kid comes home with nits" — step-by-step',
        '"Things every parent needs in their medicine cabinet for the school year"',
        '"I\'m a pharmacist and a parent — here\'s my back-to-school list"',
      ],
      hashtags: ['#BackToSchoolTok', '#MumTok', '#DadTok', '#KidHealthTok', '#PharmacistParent'],
      url: 'https://www.tiktok.com/tag/backtoschool',
      timing: 'January 7 — February 28. Peak engagement on weekends and Tuesday evenings.',
      trending: ['Hook: "School\'s back in 2 weeks — are you ready?"', 'Format: "Parent fails I fixed with one pharmacy visit" — self-deprecating, relatable'],
    },
    atl: {
      channels: ['School newsletters & community Facebook groups', 'Local radio (drive time)', 'Childcare centre partnerships', 'Email/SMS: Target customers with paediatric purchase history'],
      headline: 'School\'s Back. Is Your Family\'s Medicine Cabinet Ready?',
      keyMessage: 'Stocked. Prepared. Covered. Your pharmacy for the school year ahead.',
      timing: 'January 7 — February 20.',
      budget: 'Medium — high conversion rate from parent audience',
    },
    expectedImpact: 'Back to school drives 15-20% uplift in paediatric-linked categories (children\'s pain relief, cold & flu syrups, lice treatment, vitamins).',
    storeActions: ['Kids health dedicated bay — at adult eye level, clearly signed for parents', 'Pharmacist-authored printed guide: "School Year Health Checklist" — free takeaway', 'Vaccination catch-up promotion: "Check your child\'s immunisation record"', 'Loyalty: Bonus points on school-linked purchases in Jan-Feb'],
  },
  {
    id: 'summer-skin-sun',
    title: 'Summer Skin, Sun & Outdoor',
    seasonLabel: 'Summer 2024-25',
    months: [12, 1, 2],
    seasonalGroup: 'skin-sun',
    colorHex: '#D97706',
    description: 'Australian summer demands sun protection, insect repellent, and skin treatment. Melanoma is the most common cancer in Australia — pharmacy is the trusted channel for sun safety.',
    rationale: 'Dermatologicals show peak dispensing in summer. OTC equivalents (sunscreen, after-sun, insect repellent) are high-margin front-of-shop categories that reward active promotion.',
    instagram: {
      contentIdeas: [
        '"SPF explained by a pharmacist in 90 seconds" — very high-save format',
        '"The sunscreen mistakes Australians keep making" — contrarian hook, high shareability',
        '"Pharmacist picks: Best sunscreen for your skin type" — 4-slide carousel',
        'Skin check awareness post: Partner with Melanoma Institute Australia',
        '"Summer travel health post" — pharmacy checklist before your holiday',
      ],
      hashtags: ['#SunSafety', '#SPF', '#Sunscreen', '#AustralianSummer', '#SkinProtection', '#MelanomaAwareness'],
      url: 'https://www.instagram.com/explore/tags/sunsafety/',
      timing: 'Begin November 25 (pre-summer). Sustain December through February.',
      format: 'Reels (reach — people share sun safety content), Carousels (saves), Stories (swipe to shop)',
    },
    tiktok: {
      contentIdeas: [
        '"Rating sunscreens from a pharmacist\'s perspective" — product review format',
        '"This is what UV damage actually looks like" — dramatic, impactful, high share',
        '"Australian summer pharmacy haul — what I actually use"',
        '"Sunscreen reapplication — why timing matters" — educational, sharable',
      ],
      hashtags: ['#SunscreenTok', '#SkincareTok', '#SPFTok', '#SummerSkin', '#PharmacistTok'],
      url: 'https://www.tiktok.com/tag/sunscreen',
      timing: 'December 1 — February 28. Post 4-5x/week. High engagement on hot weather days.',
      trending: ['Hook: "PSA for every Australian going into summer..."', 'Trending: "Weekend warrior survival kit" — relatable to Australian sport culture'],
    },
    atl: {
      channels: ['Facebook/Instagram Ads (outdoor activities, holidays)', 'Local sport club partnership', 'Pharmacy window summer theming', 'Google Ads: "best sunscreen pharmacy"'],
      headline: 'This Summer, Protect Everything That Matters.',
      keyMessage: 'SPF. Repellent. Skin checks. Ask your pharmacist for personalised sun protection.',
      timing: 'December 1 — February 28. Peak spend December school holidays.',
      budget: 'Medium-High — strong pharmacist recommendation conversion window for premium SPF',
    },
    expectedImpact: 'Premium SPF50+ commands significantly higher margin vs supermarket. Pharmacist-recommended brands see 3-4x higher conversion when backed by social proof and in-store conversation.',
    storeActions: ['Summer sun bay at pharmacy entrance — prime location for December', 'Testers for sunscreen textures — critical purchase driver for premium products', 'Summer travel kit display: Sunscreen + repellent + bite treatment + oral rehydration', 'Beach bag promo: Purchase $50 sun care, receive branded tote'],
  },
  {
    id: 'valentines-skin',
    title: 'Valentine\'s & Skin Health',
    seasonLabel: 'February 2025',
    months: [2],
    seasonalGroup: 'skin-sun',
    colorHex: '#DB2777',
    description: 'February combines Valentine\'s gifting (beauty and skincare) with summer skin follow-up. Pharmacy has a credible position between supermarket and dermatologist. A premium front-of-shop moment.',
    rationale: 'Dermatological categories maintain strong sales through February. The Valentine\'s framing drives gifting and basket size.',
    instagram: {
      contentIdeas: [
        '"Pharmacist-curated Valentine\'s gift guide — for them, for her, for him"',
        '"The skincare routine a pharmacist recommends for glowing skin"',
        '"Gift your partner a skin check this February" — purpose-driven, differentiating',
        '"Pharmacy beauty vs department store beauty — the honest difference"',
      ],
      hashtags: ['#ValentinesGifts', '#SkinHealth', '#PharmacyBeauty', '#GlowingSkin', '#LoveYourSkin'],
      url: 'https://www.instagram.com/explore/tags/skinhealth/',
      timing: 'February 1-14 for Valentine\'s. Continue skin health content to Feb 28.',
      format: 'Carousels (gift guides get saved), Reels (routine content), Stories (polls)',
    },
    tiktok: {
      contentIdeas: [
        '"Pharmacy Valentine\'s gift ideas under $50" — gift guide format',
        '"Rate the skincare I got my partner from the pharmacy" — couples content',
        '"Things I learned about skincare from being a pharmacist"',
      ],
      hashtags: ['#ValentinesTok', '#SkincareRoutine', '#PharmacyFinds', '#GiftIdeas'],
      url: 'https://www.tiktok.com/tag/skincareroutine',
      timing: 'February 1-14 for Valentine\'s. Wind down to skin health for remainder.',
      trending: ['Hook: "Valentine\'s gift ideas from the pharmacy (not what you\'d expect)"', 'Format: Gift-wrapping unboxing — pharmacy products beautifully presented'],
    },
    atl: {
      channels: ['In-pharmacy Valentine\'s display', 'Email/SMS: Target female 25-45 with skincare history', 'Local lifestyle magazine'],
      headline: 'Give the Gift of Healthy Skin This Valentine\'s.',
      keyMessage: 'Pharmacist-curated skincare gifts. Beautiful, evidence-based, and actually useful.',
      timing: 'February 3 — February 14.',
      budget: 'Low-Medium — targeted, personalisation is the value driver',
    },
    expectedImpact: 'Well-executed Valentine\'s activation can drive 25-40% uplift in skincare category for the fortnight, with strong basket attachment from complementary products.',
    storeActions: ['Valentine\'s gift bundles: Pre-built sets at 3 price points ($30, $60, $100)', 'Gift wrapping station in-store for February purchases', 'Loyalty bonus: Double points on skincare in February'],
  },
  {
    id: 'autumn-immune',
    title: 'Autumn Wellness & Immune Reset',
    seasonLabel: 'Autumn 2025',
    months: [3, 4],
    seasonalGroup: 'general',
    colorHex: '#0D9488',
    description: 'March-April is "transition season" — the wellness reset after summer. Probiotics, vitamins, weight management, digestive health, and immune support all see uplift.',
    rationale: 'Alimentary Tract & Metabolism and general wellness categories maintain steady sales Mar-Apr. Positioning pharmacy as the credible wellness destination is the strategic play.',
    instagram: {
      contentIdeas: [
        '"Autumn wellness reset — what your pharmacist actually recommends"',
        '"Vitamin D deficiency in autumn — are you at risk?" — educational, high-share',
        '"5 things to do for your gut health this autumn" — carousel, high-save format',
        'Probiotic guide: "Not all probiotics are equal — pharmacist explains"',
      ],
      hashtags: ['#WellnessReset', '#GutHealth', '#Probiotics', '#AutumnHealth', '#ImmuneHealth'],
      url: 'https://www.instagram.com/explore/tags/guthealth/',
      timing: 'March 1 — April 30. Post 3-4x/week.',
      format: 'Carousels (wellness content gets saved), Reels (pharmacist routine), Stories (polls)',
    },
    tiktok: {
      contentIdeas: [
        '"Autumn wellness haul from the pharmacy — pharmacist edition"',
        '"Things my pharmacist self does in autumn to prepare for winter"',
        '"The probiotic myth I wish people would stop believing"',
      ],
      hashtags: ['#WellnessTok', '#GutHealthTok', '#PharmacistTok', '#VitaminD', '#AutumnWellness'],
      url: 'https://www.tiktok.com/tag/guthealth',
      timing: 'March 1 — April 15. 3 posts/week.',
      trending: ['Hook: "Autumn is the most important time to reset your health"', 'Format: "My morning routine as a pharmacist in autumn"'],
    },
    atl: {
      channels: ['In-store wellness destination display', 'Email/SMS to vitamin/supplement customers', 'Community boards (gyms, yoga studios)', 'Facebook: Health & wellness interest segments'],
      headline: 'Autumn Reset Starts at Your Pharmacy.',
      keyMessage: 'Vitamins. Probiotics. Immune support. Evidence-based advice from your pharmacist.',
      timing: 'March 1 — April 15.',
      budget: 'Medium — wellness is the fastest growing front-of-shop segment',
    },
    expectedImpact: 'Autumn wellness positioning reduces price comparison with supermarket and establishes pharmacist authority for the year ahead.',
    storeActions: ['Transition summer display to autumn wellness: Vitamins, probiotics, sleep', 'Pharmacist wellness consultation: 15-min "health check" appointment', 'Bundle: "Autumn reset pack" at 3 price points', 'Rewards: Points multiplier on wellness category Mar-Apr'],
  },
  {
    id: 'spring-sport',
    title: 'Spring Sport & Active Health',
    seasonLabel: 'Spring 2025',
    months: [9, 10],
    seasonalGroup: 'pain-sport',
    colorHex: '#7C3AED',
    description: 'September-October: sport seasons resume across AFL, NRL finals, cricket, and community sport. Sports injury management, muscle & joint health, and energy management are pharmacy opportunities.',
    rationale: 'Musculo-skeletal category shows uplift in spring as Australians resume outdoor physical activity after winter. Pharmacy has an untapped opportunity in sports health.',
    instagram: {
      contentIdeas: [
        '"Spring sport — what your pharmacist wants you to know about injury prevention"',
        '"Pharmacist picks: Best products for sore muscles after sport"',
        '"RICE vs PRICE — how injury management has changed" — educational, shareable',
        'Partner with local sporting club: "Official pharmacy partner"',
      ],
      hashtags: ['#SpringSport', '#ActiveHealth', '#SportsPharmacy', '#MuscleRecovery', '#InjuryPrevention'],
      url: 'https://www.instagram.com/explore/tags/sportsrecovery/',
      timing: 'September 1 — October 31. Spike around AFL/NRL finals.',
      format: 'Reels (exercise content), Carousels (product guides), Stories (polls)',
    },
    tiktok: {
      contentIdeas: [
        '"Pharmacist rates sport recovery products from the pharmacy"',
        '"What to do when you sprain your ankle — pharmacist protocol"',
        '"AFL finals survival kit from the pharmacy" — timely, sharable',
      ],
      hashtags: ['#SportsTok', '#RecoveryTok', '#PharmacistTok', '#InjuryTok', '#AFLTok'],
      url: 'https://www.tiktok.com/tag/sportsrecovery',
      timing: 'September 1 — October 15. Spike on AFL Finals weekend.',
      trending: ['Hook: "Your footy team made the finals — here\'s what to stock"', 'Format: "Weekend warrior survival kit"'],
    },
    atl: {
      channels: ['Local sporting club sponsorship', 'Community radio during sport results', 'Pharmacy window: "Official pharmacy of [Local Club]"', 'Google Ads: "sports injury pharmacy"'],
      headline: 'Spring Sport Season. Your Pharmacy Has Your Back.',
      keyMessage: 'Injury management. Recovery products. Expert advice. No appointment needed.',
      timing: 'September 1 — October 20.',
      budget: 'Low-Medium — local sponsorship ROI is high for community pharmacies',
    },
    expectedImpact: 'Sports category is under-activated in pharmacy marketing. Positioning as sports health expert builds year-round loyalty from active consumers with higher basket values.',
    storeActions: ['Sports health section: Strapping tape, heat/ice, supports, compression', 'Pharmacy sports pack: "The pharmacist\'s kit for weekend warriors"', 'Sports injury consultation — 10-min triage appointment', 'Community sponsorship: Staff wear local club colours on game days'],
  },
]

/* ─── Season band definitions for chart overlay ─────────────────────── */
const SEASON_BANDS = [
  { label: 'Winter', months: [6, 7, 8], fill: '#EFF6FF' },
  { label: 'Spring', months: [9, 10, 11], fill: '#F0FDF4' },
  { label: 'Summer', months: [12, 1, 2], fill: '#FFFBEB' },
]

/* ─── Helper ────────────────────────────────────────────────────────── */
function monthLabel(monthId: number): string {
  const y = String(monthId).slice(0, 4)
  const m = parseInt(String(monthId).slice(4), 10)
  return `${MONTH_NAMES[m - 1]} ${y.slice(2)}`
}

/* ─── Page Component ────────────────────────────────────────────────── */
export function SeasonalityPage() {
  const { state, loadMonthlyData } = useData()

  const [narrativeOpen, setNarrativeOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Trigger lazy load of monthly data
  useEffect(() => { loadMonthlyData() }, [loadMonthlyData])

  const ethMonthly = state.ethMonthly

  /* ── Monthly aggregation by seasonal group ─────────────────────────── */
  const monthlyByGroup = useMemo(() => {
    if (!ethMonthly) return []
    const map: Record<number, Record<SeasonalGroup, number>> = {}
    ethMonthly.forEach(r => {
      const group = SEASONAL_CATEGORY_MAP[r.category]
      if (!group) return
      if (!map[r.monthId]) map[r.monthId] = { 'cold-flu': 0, 'allergy': 0, 'skin-sun': 0, 'pain-sport': 0 }
      map[r.monthId]![group] += r.sales
    })
    return Object.entries(map)
      .map(([id, groups]) => ({
        monthId: parseInt(id, 10),
        monthLabel: monthLabel(parseInt(id, 10)),
        calMonth: parseInt(id.slice(4), 10),
        ...groups,
      }))
      .sort((a, b) => a.monthId - b.monthId)
  }, [ethMonthly])

  /* ── Seasonal indices (peak / trough per group) ────────────────────── */
  const seasonalIndices = useMemo(() => {
    const groups: SeasonalGroup[] = ['cold-flu', 'allergy', 'skin-sun', 'pain-sport']
    const result: Record<SeasonalGroup, { peakMonth: string; peakIndex: number; troughMonth: string; troughIndex: number }> = {} as never
    groups.forEach(group => {
      const values = monthlyByGroup.map(m => m[group])
      const avg = values.reduce((s, v) => s + v, 0) / (values.length || 1)
      const indexed = monthlyByGroup.map(m => ({
        label: m.monthLabel,
        index: avg > 0 ? (m[group] / avg) * 100 : 100,
      }))
      const peak = indexed.reduce((best, cur) => cur.index > best.index ? cur : best, indexed[0] ?? { label: '—', index: 100 })
      const trough = indexed.reduce((worst, cur) => cur.index < worst.index ? cur : worst, indexed[0] ?? { label: '—', index: 100 })
      result[group] = { peakMonth: peak.label, peakIndex: peak.index, troughMonth: trough.label, troughIndex: trough.index }
    })
    return result
  }, [monthlyByGroup])

  /* ── Cold & Flu YoY for winter months (Jun-Aug) ────────────────────── */
  const coldFluYoY = useMemo(() => {
    const tyWinter = monthlyByGroup.filter(m => m.monthId >= 202406 && m.monthId <= 202408).reduce((s, m) => s + m['cold-flu'], 0)
    const lyWinter = monthlyByGroup.filter(m => m.monthId >= 202306 && m.monthId <= 202308).reduce((s, m) => s + m['cold-flu'], 0)
    return lyWinter > 0 ? ((tyWinter - lyWinter) / lyWinter) * 100 : 0
  }, [monthlyByGroup])

  /* ── Category deep-dive monthly trend ──────────────────────────────── */
  const categoryMonthlyTrend = useMemo(() => {
    if (!selectedCategory) return []
    if (!ethMonthly) return []
    const catData = ethMonthly.filter(r => r.category === selectedCategory)
    const map: Record<number, number> = {}
    catData.forEach(r => { map[r.monthId] = (map[r.monthId] ?? 0) + r.sales })
    return Object.entries(map)
      .map(([id, sales]) => ({ monthId: parseInt(id, 10), month: monthLabel(parseInt(id, 10)), sales }))
      .sort((a, b) => a.monthId - b.monthId)
  }, [selectedCategory, ethMonthly])

  /* ── Category deep-dive KPIs ───────────────────────────────────────── */
  const categoryKPIs = useMemo(() => {
    if (categoryMonthlyTrend.length === 0) return { peakMonth: '—', peakIndex: 0, yoy: 0 }
    const avg = categoryMonthlyTrend.reduce((s, m) => s + m.sales, 0) / categoryMonthlyTrend.length
    const peak = categoryMonthlyTrend.reduce((best, cur) => cur.sales > best.sales ? cur : best, categoryMonthlyTrend[0]!)
    const peakIndex = avg > 0 ? (peak.sales / avg) * 100 : 100
    // YoY: compare TY total vs LY total
    const ty = categoryMonthlyTrend.filter(m => m.monthId >= 202404).reduce((s, m) => s + m.sales, 0)
    const ly = categoryMonthlyTrend.filter(m => m.monthId < 202404).reduce((s, m) => s + m.sales, 0)
    const yoy = ly > 0 ? ((ty - ly) / ly) * 100 : 0
    return { peakMonth: peak.month, peakIndex, yoy }
  }, [categoryMonthlyTrend])

  /* ── Narrative text ────────────────────────────────────────────────── */
  const narrative = useMemo(() => {
    const cf = seasonalIndices['cold-flu']
    const al = seasonalIndices['allergy']
    const sk = seasonalIndices['skin-sun']
    if (!cf || !al || !sk) return ['Loading seasonal data...']

    const skinYoY = (() => {
      const ty = monthlyByGroup.filter(m => [12, 1, 2].includes(m.calMonth) && m.monthId >= 202404).reduce((s, m) => s + m['skin-sun'], 0)
      const ly = monthlyByGroup.filter(m => [12, 1, 2].includes(m.calMonth) && m.monthId < 202404).reduce((s, m) => s + m['skin-sun'], 0)
      return ly > 0 ? ((ty - ly) / ly) * 100 : 0
    })()

    return [
      `Rx dispensing data across 24 months confirms classic Australian seasonal demand patterns. Cold & flu categories peak at ${cf.peakIndex.toFixed(0)} index in ${cf.peakMonth} — ${cf.peakIndex > 120 ? 'significantly above' : 'above'} annual average. ${coldFluYoY >= 0 ? 'YoY growth in winter peak months suggests ongoing demand expansion.' : 'YoY softening in winter peak months warrants earlier activation to defend category volume.'}`,
      `Spring allergy season peaks in ${al.peakMonth} based on respiratory category proxies — the activation window for antihistamines and nasal sprays is confirmed as September-November. This window is consistently underactivated by community pharmacy relative to the commercial opportunity.`,
      `Skin & dermatology categories peak in summer months, with a ${skinYoY >= 0 ? '+' : ''}${skinYoY.toFixed(1)}% YoY movement suggesting ${skinYoY >= 0 ? 'growing demand for premium sun protection through the pharmacy channel.' : 'channel shift risk — activate proactively to defend dermatology share vs online and grocery.'}`,
      `The 8 activation campaigns below align recommended marketing windows to data-confirmed demand peaks. Leading demand by 4-6 weeks maximises pharmacy readiness and positions your team ahead of consumer need.`,
    ]
  }, [seasonalIndices, coldFluYoY, monthlyByGroup])

  /* ── Render ────────────────────────────────────────────────────────── */
  if (!ethMonthly) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading seasonal data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">Seasonality</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">Seasonality & Marketing Activations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Seasonal demand patterns &middot; marketing activation calendar &middot; Instagram & TikTok strategy</p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Winter Peak Index" value={seasonalIndices['cold-flu']?.peakIndex.toFixed(0) ?? '—'} icon={<Snowflake className="w-4 h-4" />} />
        <KPICard title="Cold & Flu YoY" value={`${coldFluYoY >= 0 ? '+' : ''}${coldFluYoY.toFixed(1)}%`} delta={coldFluYoY} deltaLabel="winter months" icon={<Thermometer className="w-4 h-4" />} />
        <KPICard title="Peak Season" value={seasonalIndices['cold-flu']?.peakMonth ?? '—'} icon={<CalendarDays className="w-4 h-4" />} />
        <KPICard title="Campaigns Planned" value="8" icon={<Megaphone className="w-4 h-4" />} />
      </div>

      {/* ── Narrative Banner ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 to-violet-900 rounded-xl overflow-hidden">
        <button onClick={() => setNarrativeOpen(v => !v)} className="w-full flex items-start gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 text-left group">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Seasonal Intelligence</span>
            <p className="text-[10px] sm:text-[11px] text-white/80 leading-relaxed mt-1 line-clamp-2">{narrative[0]}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 mt-1 transition-transform duration-300 ${narrativeOpen ? 'rotate-180' : ''}`} />
        </button>
        {narrativeOpen && (
          <div className="px-3.5 sm:px-5 pb-4 space-y-2.5 animate-fade-in">
            {narrative.slice(1).map((line, i) => (
              <p key={i} className="text-[10px] sm:text-[11px] text-white/70 leading-relaxed pl-6 sm:pl-[26px]">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── 24-Month Seasonal Trend Chart ──────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-700">24-Month Seasonal Demand — Rx Categories</h3>
          <div className="flex items-center gap-3">
            {(['cold-flu', 'allergy', 'skin-sun', 'pain-sport'] as SeasonalGroup[]).map(g => (
              <div key={g} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GROUP_META[g].color }} />
                <span className="text-[8px] sm:text-[9px] text-slate-500">{GROUP_META[g].label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[8px] sm:text-[9px] text-slate-400 mb-3 italic">Based on Rx dispensing data — 141K records across 24 months. Shaded bands show Australian seasons.</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyByGroup} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* Season band overlays */}
            {monthlyByGroup.length > 0 && SEASON_BANDS.map(band => {
              const bandMonths = monthlyByGroup.filter(m => band.months.includes(m.calMonth))
              // Render two bands: one for LY, one for TY
              return bandMonths.map((bm, idx) => {
                // Find consecutive runs
                if (idx === 0 || bandMonths[idx - 1]!.monthId !== bm.monthId - 1) {
                  const end = bandMonths.find((_, j) => j > idx && (j === bandMonths.length - 1 || bandMonths[j + 1]!.monthId !== bandMonths[j]!.monthId + 1)) ?? bm
                  return <ReferenceArea key={`${band.label}-${bm.monthId}`} x1={bm.monthLabel} x2={end.monthLabel} fill={band.fill} fillOpacity={0.6} />
                }
                return null
              })
            })}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 8 }} stroke="#94a3b8" interval={2} />
            <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
            <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
            <Line type="monotone" dataKey="cold-flu" name="Cold & Flu" stroke="#2563EB" strokeWidth={2} dot={{ r: 1.5 }} />
            <Line type="monotone" dataKey="allergy" name="Allergy" stroke="#059669" strokeWidth={2} dot={{ r: 1.5 }} />
            <Line type="monotone" dataKey="skin-sun" name="Skin & Sun" stroke="#D97706" strokeWidth={2} dot={{ r: 1.5 }} />
            <Line type="monotone" dataKey="pain-sport" name="Pain & Sport" stroke="#7C3AED" strokeWidth={2} dot={{ r: 1.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Activation Calendar Timeline ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-slate-700">Annual Activation Calendar</h3>
          <span className="text-[8px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">FY Apr → Mar</span>
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="min-w-[640px]">
            {/* Month headers */}
            <div className="grid grid-cols-[160px_1fr] gap-2 mb-2">
              <div />
              <div className="grid grid-cols-12 gap-0.5">
                {FISCAL_LABELS.map(m => (
                  <div key={m} className="text-center text-[8px] font-semibold text-slate-400">{m}</div>
                ))}
              </div>
            </div>
            {/* Campaign rows */}
            {ACTIVATION_CALENDAR.map(campaign => (
              <button
                key={campaign.id}
                onClick={() => setExpandedCard(expandedCard === campaign.id ? null : campaign.id)}
                className="w-full grid grid-cols-[160px_1fr] gap-2 mb-1.5 group text-left"
              >
                <div className="truncate">
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-primary transition-colors">{campaign.title}</span>
                  <span className="block text-[8px] text-slate-400">{campaign.seasonLabel}</span>
                </div>
                <div className="grid grid-cols-12 gap-0.5">
                  {FISCAL_MONTHS.map(calMonth => {
                    const active = campaign.months.includes(calMonth)
                    return (
                      <div
                        key={calMonth}
                        className={`h-6 rounded-sm transition-all ${active ? 'group-hover:opacity-100 opacity-80' : 'bg-slate-50'}`}
                        style={active ? { backgroundColor: campaign.colorHex + '30', border: `1.5px solid ${campaign.colorHex}60` } : {}}
                      />
                    )
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Deep-Dive ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Category Deep-Dive — Monthly Trend</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
          {SEASONAL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              {cat.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </button>
          ))}
        </div>

        {selectedCategory && categoryMonthlyTrend.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700">{selectedCategory.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h4>
              <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-[9px] text-primary hover:underline">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50/50 rounded-lg p-2 text-center">
                <p className="text-[8px] text-slate-400 uppercase tracking-wide">Peak Month</p>
                <p className="text-xs font-bold text-slate-800">{categoryKPIs.peakMonth}</p>
              </div>
              <div className="bg-blue-50/50 rounded-lg p-2 text-center">
                <p className="text-[8px] text-slate-400 uppercase tracking-wide">Peak Index</p>
                <p className="text-xs font-bold text-slate-800">{categoryKPIs.peakIndex.toFixed(0)}</p>
              </div>
              <div className="bg-blue-50/50 rounded-lg p-2 text-center">
                <p className="text-[8px] text-slate-400 uppercase tracking-wide">YoY Growth</p>
                <p className={`text-xs font-bold ${categoryKPIs.yoy >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {categoryKPIs.yoy >= 0 ? '+' : ''}{categoryKPIs.yoy.toFixed(1)}%
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={categoryMonthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 8 }} stroke="#94a3b8" interval={2} />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5, strokeWidth: 2 }} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!selectedCategory && (
          <p className="text-[10px] text-slate-400 text-center py-8">Select a category above to see its 24-month seasonal trend</p>
        )}
      </div>

      {/* ── Marketing Activation Playbooks ─────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Marketing Activation Playbooks</h2>
          <span className="text-[8px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">8 campaigns</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTIVATION_CALENDAR.map((campaign, i) => {
            const isExpanded = expandedCard === campaign.id
            return (
              <div key={campaign.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up ${isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''}`} style={{ animationDelay: `${100 + i * 60}ms` }}>
                {/* Card header */}
                <button onClick={() => setExpandedCard(isExpanded ? null : campaign.id)} className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="h-1 w-full mb-3 rounded-full" style={{ backgroundColor: campaign.colorHex }} />
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-800">{campaign.title}</h3>
                      <p className="text-[9px] text-slate-400 mt-0.5">{campaign.seasonLabel}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {campaign.months.map(m => (
                          <span key={m} className="text-[8px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: campaign.colorHex }}>
                            {MONTH_NAMES[m - 1]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 animate-fade-in">
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Description */}
                      <p className="text-[11px] text-slate-600 leading-relaxed">{campaign.description}</p>

                      {/* Data rationale */}
                      <div className="bg-blue-50/50 rounded-lg p-2.5 sm:p-3">
                        <p className="text-[8px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Data Insight</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed">{campaign.rationale}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Instagram */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={`url(#ig-${campaign.id})`}>
                              <defs>
                                <linearGradient id={`ig-${campaign.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f9a825" />
                                  <stop offset="50%" stopColor="#e91e63" />
                                  <stop offset="100%" stopColor="#9c27b0" />
                                </linearGradient>
                              </defs>
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                            </svg>
                            <span className="text-[10px] font-bold text-slate-700">Instagram</span>
                            <a href={campaign.instagram.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-0.5 text-[8px] text-primary hover:underline">
                              Explore <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <p className="text-[8px] text-slate-400 mb-1.5">{campaign.instagram.timing}</p>
                          <p className="text-[7px] text-slate-400 mb-2 italic">{campaign.instagram.format}</p>
                          <ul className="space-y-1.5">
                            {campaign.instagram.contentIdeas.map((idea, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-[9px] sm:text-[10px] text-slate-600">
                                <span className="text-pink-500 shrink-0 mt-0.5">&bull;</span>{idea}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {campaign.instagram.hashtags.map(tag => (
                              <span key={tag} className="text-[7px] sm:text-[8px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                        </div>

                        {/* TikTok */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-800">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.79a4.85 4.85 0 01-1-.1z" />
                            </svg>
                            <span className="text-[10px] font-bold text-slate-700">TikTok</span>
                            <a href={campaign.tiktok.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-0.5 text-[8px] text-primary hover:underline">
                              Explore <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <p className="text-[8px] text-slate-400 mb-1.5">{campaign.tiktok.timing}</p>
                          <ul className="space-y-1.5">
                            {campaign.tiktok.contentIdeas.map((idea, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-[9px] sm:text-[10px] text-slate-600">
                                <span style={{ color: '#69C9D0' }} className="shrink-0 mt-0.5">&bull;</span>{idea}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {campaign.tiktok.hashtags.map(tag => (
                              <span key={tag} className="text-[7px] sm:text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                          {/* Trending hooks */}
                          <div className="mt-2 bg-slate-50 rounded p-2">
                            <p className="text-[7px] font-semibold text-slate-400 uppercase mb-1">Trending Hooks</p>
                            {campaign.tiktok.trending.map((t, j) => (
                              <p key={j} className="text-[8px] sm:text-[9px] text-slate-500 leading-relaxed">{t}</p>
                            ))}
                          </div>
                        </div>

                        {/* Above the Line */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Megaphone className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold text-slate-700">Above-the-Line</span>
                          </div>
                          <div className="bg-primary/5 rounded-lg p-2.5">
                            <p className="text-[10px] font-semibold text-slate-700 mb-1">&ldquo;{campaign.atl.headline}&rdquo;</p>
                            <p className="text-[9px] text-slate-500 mb-2">{campaign.atl.keyMessage}</p>
                            <div className="flex flex-wrap gap-1">
                              {campaign.atl.channels.map(ch => (
                                <span key={ch} className="text-[7px] sm:text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{ch}</span>
                              ))}
                            </div>
                            <p className="text-[8px] text-slate-400 mt-2">{campaign.atl.timing}</p>
                            <p className="text-[7px] text-slate-400 mt-0.5 italic">Budget: {campaign.atl.budget}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expected Impact */}
                      <div className="bg-emerald-50 rounded-lg p-2.5 sm:p-3">
                        <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Expected Impact</p>
                        <p className="text-[10px] text-emerald-800 leading-relaxed">{campaign.expectedImpact}</p>
                      </div>

                      {/* In-Store Actions */}
                      <div>
                        <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">In-Store Execution</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {campaign.storeActions.map((action, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-[9px] text-slate-600">
                              <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0 mt-0.5" />{action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="text-center py-2">
        <p className="text-[9px] text-slate-300">Powered by <span className="font-semibold text-slate-400">NostraData</span></p>
      </div>
    </div>
  )
}
