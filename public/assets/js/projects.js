window.PROJECTS = (function () {
  'use strict';

  var P = 'assets/images/Projects/';
  var BUENO = P + 'BUe%C3%B1o/';
  var FW    = P + 'BU-FW/';
  var GWA   = P + 'BU-GWA/';
  var LF    = P + 'BU-L%26F/';
  var OBRA  = P + 'Obra-BU/';
  var SMS   = P + 'SMS%20for%20LECS/';
  var CART  = P + 'CartCraft/';

  function shot(dir, stamp) {
    return dir + 'Screenshot%20' + stamp.replace(' ', '%20') + '.png';
  }

  return {

    /* ── Flagship hub ─────────────────────────────────────── */
    bueno: {
      title: 'BUeño',
      tag: 'Flagship',
      year: '2026',
      live: 'https://bueno-hub.vercel.app',
      code: 'https://github.com/renjiyomo',
      lede: 'One entry point for the tools Bicol University students use every day.',
      body: [
        'BUeño is the front door to a small ecosystem of apps I built for Bicol University students.',
        'Each tool ships as its own deployed app, and the hub brings them together in one place.'
      ],
      items: [
        { src: BUENO + 'BUe%C3%B1o.mp4', type: 'video', poster: BUENO + 'home-hero.png', w: 1920, h: 1080, alt: 'Screen recording of the BUeño platform', cap: 'Walkthrough — navigating the hub and its apps' },
        { src: BUENO + 'home-hero.png', w: 1919, h: 908, alt: 'BUeño home page hero section', cap: 'Landing page — the entry point for the ecosystem' },
        { src: BUENO + 'tools.png', w: 1918, h: 906, alt: 'BUeño tools directory', cap: 'Tools directory' },
        { src: BUENO + 'web-apps.png', w: 1918, h: 905, alt: 'BUeño web applications overview', cap: 'Web apps overview' },
        { src: BUENO + 'community.png', w: 1918, h: 906, alt: 'BUeño community section', cap: 'Community section' }
      ]
    },

    /* ── Deployed applications ────────────────────────────── */
    obra: {
      title: 'Obra BU',
      tag: 'Live',
      year: '2026',
      live: 'https://obra-bu.vercel.app',
      code: 'https://github.com/renjiyomo',
      lede: 'A gallery where student artists publish their work.',
      body: [
        'Obra BU gives student artists somewhere to publish and be found.',
        'Artists sign in with Google, upload to their own collection, and get a public profile.'
      ],
      items: [
        { src: OBRA + 'home-hero.png', w: 1918, h: 907, alt: 'Obra BU gallery home page', cap: 'Gallery landing page' },
        { src: OBRA + 'collection.png', w: 1918, h: 907, alt: 'Obra BU artwork collection grid', cap: 'Artwork collection' },
        { src: OBRA + 'student-artists.png', w: 1918, h: 907, alt: 'Obra BU student artists directory', cap: 'Student artists directory' }
      ]
    },

    bulf: {
      title: 'BU Lost & Found',
      tag: 'Live',
      year: '2026',
      live: 'https://bu-lost-and-found.vercel.app',
      code: 'https://github.com/renjiyomo',
      lede: 'A campus registry for reporting and claiming lost items.',
      body: [
        'Lost items on campus used to get buried in group chats. This gives them a searchable registry instead.',
        'Report what you lost, browse what has been turned in, and claim it. New reports appear without a refresh.'
      ],
      items: [
        { src: LF + 'home-hero.png', w: 1918, h: 907, alt: 'Lost and Found home page', cap: 'Home — report or search for an item' },
        { src: LF + 'browse-items.png', w: 1918, h: 913, alt: 'Lost and Found item browser', cap: 'Browse reported items' }
      ]
    },

    bufw: {
      title: 'BU Freedom Wall',
      tag: 'Live',
      year: '2026',
      live: 'https://bu-freedom-wall.vercel.app',
      code: 'https://github.com/renjiyomo',
      lede: 'An anonymous posting board with bot protection built in.',
      body: [
        'A freedom wall is only useful if it stays readable, so the real problem was spam rather than posting.',
        'Turnstile screens every submission without asking students to log in or solve a puzzle first.'
      ],
      items: [
        { src: FW + 'bufw.png', w: 1918, h: 907, alt: 'BU Freedom Wall post feed', cap: 'Post feed' },
        { src: FW + 'submit-confession.png', w: 1918, h: 906, alt: 'BU Freedom Wall submission form', cap: 'Submission form' }
      ]
    },

    bugwa: {
      title: 'GWA Calculator',
      tag: 'Live',
      year: '2026',
      live: 'https://bueno-calculator.vercel.app',
      code: 'https://github.com/renjiyomo',
      lede: 'Weighted average and Latin honors, computed in the browser.',
      body: [
        'Students used to recompute their weighted average by hand and argue about honors eligibility. This settles it.',
        'Everything runs client-side, so results are instant and grades never leave the browser.'
      ],
      items: [
        { src: GWA + 'result-card.png', w: 1918, h: 905, alt: 'GWA calculator result card', cap: 'Result card — computed weighted average' },
        { src: GWA + 'semester-honor.png', w: 1918, h: 903, alt: 'Semester honor eligibility view', cap: 'Semester honor eligibility' },
        { src: GWA + 'latin-honors.png', w: 1918, h: 906, alt: 'Latin honors calculator input', cap: 'Latin honors — input' },
        { src: GWA + 'latin-results.png', w: 1918, h: 902, alt: 'Latin honors calculator results', cap: 'Latin honors — results' }
      ]
    },

    /* ── Academic work ────────────────────────────────────── */
    sms: {
      title: 'Student Management System',
      tag: 'Academic',
      year: '2025 — 2026',
      live: '',
      code: '',
      lede: 'Digitizes school records and generates official forms automatically.',
      body: [
        'My capstone for Libon East Central School. It replaced paper record-keeping and generates the school forms teachers used to fill in by hand.',
        'Scored 4.83 out of 5.00 against ISO 25010 across 32 respondents, and named Best Undergraduate Capstone Thesis in BSIS.'
      ],
      items: [
        { src: SMS + 'sms-landing-page.png', w: 1919, h: 908, alt: 'Student Management System landing page', cap: 'Landing page' },
        { src: SMS + 'sms-login-page-dark.png', w: 1919, h: 905, alt: 'Login screen in dark theme', cap: 'Login — dark theme' },
        { src: SMS + 'sms-login-page-light.png', w: 1919, h: 908, alt: 'Login screen in light theme', cap: 'Login — light theme' },
        { src: shot(SMS, '2025-12-02 122759'), w: 1919, h: 908, alt: 'System interface screen', cap: 'Interface 01' },
        { src: shot(SMS, '2025-12-02 160800'), w: 1919, h: 910, alt: 'System interface screen', cap: 'Interface 02' },
        { src: shot(SMS, '2025-12-02 183613'), w: 1919, h: 911, alt: 'System interface screen', cap: 'Interface 03' },
        { src: shot(SMS, '2025-12-02 193123'), w: 1919, h: 910, alt: 'System interface screen', cap: 'Interface 04' },
        { src: shot(SMS, '2025-12-02 205400'), w: 1919, h: 908, alt: 'System interface screen', cap: 'Interface 05' },
        { src: shot(SMS, '2025-12-02 224458'), w: 1919, h: 907, alt: 'System interface screen', cap: 'Interface 06' },
        { src: shot(SMS, '2025-12-03 102002'), w: 1919, h: 911, alt: 'System interface screen', cap: 'Interface 07' },
        { src: shot(SMS, '2025-12-03 161036'), w: 1919, h: 910, alt: 'System interface screen', cap: 'Interface 08' },
        { src: shot(SMS, '2025-12-03 164617'), w: 1919, h: 910, alt: 'System interface screen', cap: 'Interface 09' },
        { src: shot(SMS, '2025-12-04 130721'), w: 1919, h: 908, alt: 'System interface screen', cap: 'Interface 10' },
        { src: shot(SMS, '2025-12-04 143323'), w: 1919, h: 907, alt: 'System interface screen', cap: 'Interface 11' },
        { src: shot(SMS, '2025-12-04 150035'), w: 1919, h: 908, alt: 'System interface screen', cap: 'Interface 12' }
      ]
    },

    cart: {
      title: 'CartCraft',
      tag: 'Academic',
      year: '2024',
      live: '',
      code: '',
      lede: 'An art marketplace where prices are set by auction.',
      body: [
        'Artists publish their work, buyers place competing bids, and the highest bid closes the sale.',
        'Both sides can export their transaction history as a PDF report.'
      ],
      items: [
        { src: shot(CART, '2024-11-08 142245'), w: 772, h: 907, alt: 'CartCraft interface screen', cap: 'Interface 01' },
        { src: shot(CART, '2024-11-08 142701'), w: 769, h: 910, alt: 'CartCraft interface screen', cap: 'Interface 02' },
        { src: shot(CART, '2024-11-11 174536'), w: 1920, h: 1080, alt: 'CartCraft interface screen', cap: 'Interface 03' },
        { src: shot(CART, '2024-11-13 123626'), w: 1120, h: 550, alt: 'CartCraft interface screen', cap: 'Interface 04' },
        { src: shot(CART, '2024-11-14 204755'), w: 790, h: 907, alt: 'CartCraft interface screen', cap: 'Interface 05' },
        { src: shot(CART, '2024-12-01 103915'), w: 1920, h: 1080, alt: 'CartCraft interface screen', cap: 'Interface 06' },
        { src: shot(CART, '2024-12-02 095712'), w: 1121, h: 630, alt: 'CartCraft interface screen', cap: 'Interface 07' },
        { src: shot(CART, '2024-12-09 212218'), w: 1919, h: 1017, alt: 'CartCraft interface screen', cap: 'Interface 08' },
        { src: shot(CART, '2024-12-10 131219'), w: 1919, h: 1020, alt: 'CartCraft interface screen', cap: 'Interface 09' },
        { src: shot(CART, '2024-12-10 151211'), w: 1919, h: 1079, alt: 'CartCraft interface screen', cap: 'Interface 10' }
      ]
    },

    fast: {
      title: 'FAST for CSD Faculty',
      tag: 'Academic',
      year: '2024',
      live: '',
      code: '',
      lede: 'Shows faculty consultation hours to students any time of day.',
      body: [
        'Students used to walk room to room asking whether a faculty member was free.',
        'FAST replaced that with a schedule anyone can check before planning a visit.'
      ],
      items: []
    }

  };
})();

/* Order used by the project index modal and the Projects section. */
window.PROJECT_ORDER = ['sms', 'bueno', 'obra', 'bulf', 'bufw', 'bugwa', 'cart', 'fast'];

/* Full technology inventory for the "View full stack" modal. */
window.TECH = [
  {
    group: 'Frontend',
    items: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'React', 'Next.js', 'Vite', 'React Router', 'TypeScript', 'Lucide React', 'SWR', 'Responsive layout', 'Accessible components']
  },
  {
    group: 'Backend',
    items: ['PHP', 'Laravel', 'SQL', 'Node.js', 'Google OAuth', 'Role-based access control', 'Cloudflare Turnstile']
  },
  {
    group: 'Database & ORM',
    items: ['MySQL', 'PostgreSQL', 'Supabase', 'Neon Serverless Postgres']
  },
  {
    group: 'Developer Tools',
    items: ['Git', 'GitHub', 'VS Code', 'Figma', 'XAMPP', 'Antigravity', 'Composer']
  },
  {
    group: 'Deployment & Services',
    items: ['Vercel', 'Cloudinary', 'PDF / Excel / DOCX export']
  },
  {
    group: 'Engineering Practice',
    items: ['Requirements gathering', 'Usability testing (ISO 25010)', 'Technical documentation', 'Analytical problem solving', 'Adaptability']
  }
];
