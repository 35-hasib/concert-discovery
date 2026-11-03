import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const DEMO_WIDGET = `<div class="tn-demo">
<style>
  .tn-demo { --tn-accent:#1791c7; --tn-ink:#535353; font-family: inherit; color: var(--tn-ink); }
  .tn-demo * { box-sizing: border-box; }
  .tn-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:20px 22px; border-bottom:1px solid #e5e5e5; }
  .tn-head h3 { margin:0; font-size:20px; letter-spacing:-0.01em; }
  .tn-head p { margin:3px 0 0; font-size:12px; color:#6b6b76; }
  .tn-powered { font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#9a9aa5; }
  .tn-controls { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; padding:16px 22px; background:#f7f7f7; border-bottom:1px solid #e5e5e5; }
  .tn-controls select, .tn-controls input { width:100%; height:38px; border:1px solid #cccccc; border-radius:4px; padding:0 10px; font-size:12px; background:#fff; color:#101014; outline:none; }
  .tn-controls select:focus, .tn-controls input:focus { border-color:var(--tn-accent); box-shadow:0 0 0 3px rgba(23,145,199,.15); }
  .tn-events { display:flex; flex-direction:column; }
  .tn-event { display:grid; grid-template-columns:92px minmax(0,1.5fr) minmax(0,1fr) auto auto; gap:14px; align-items:center; padding:14px 22px; border-bottom:1px solid #eeeeee; }
  .tn-event:hover { background:#f4fafd; }
  .tn-date { border-left:3px solid var(--tn-accent); padding-left:10px; }
  .tn-date strong { display:block; font-size:14px; }
  .tn-date span { display:block; font-size:10px; color:#777783; text-transform:uppercase; letter-spacing:.1em; }
  .tn-event h4 { margin:0; font-size:14px; }
  .tn-event p { margin:2px 0 0; font-size:12px; color:#6b6b76; }
  .tn-price { font-size:13px; font-weight:700; white-space:nowrap; }
  .tn-price small { display:block; font-size:10px; font-weight:500; color:#8a8a95; }
  .tn-buy { display:inline-flex; align-items:center; justify-content:center; height:36px; padding:0 16px; border-radius:3px; background:var(--tn-accent); color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; text-decoration:none; white-space:nowrap; }
  .tn-buy:hover { background:#127794; }
  .tn-more-wrap { padding:16px 22px; text-align:center; }
  .tn-more { border:1px solid #cccccc; background:#fff; color:#535353; height:40px; padding:0 20px; border-radius:3px; font-size:12px; font-weight:700; cursor:pointer; }
  .tn-more:hover { border-color:#1791c7; color:#1791c7; }
  .tn-more[hidden] { display:none; }
  .tn-empty { padding:40px 22px; text-align:center; color:#777783; font-size:13px; }
  .tn-note { padding:10px 22px 16px; font-size:10px; color:#9a9aa5; text-align:center; }
  @media (max-width:760px){
    .tn-controls { grid-template-columns:1fr 1fr; }
    .tn-event { grid-template-columns:74px minmax(0,1fr) auto; gap:10px; padding:13px 16px; }
    .tn-event .tn-loc { display:none; }
    .tn-price { display:none; }
    .tn-head, .tn-controls, .tn-note { padding-left:16px; padding-right:16px; }
  }
</style>
<div class="tn-wrap">
  <div class="tn-head">
    <div>
      <h3>Midnight Frequency Tour Dates</h3>
      <p>Filter by month, performer and city. Demo schedule using the TicketNetwork widget container.</p>
    </div>
    <span class="tn-powered">Powered by TicketNetwork</span>
  </div>
  <div class="tn-controls">
    <select id="tn-month" aria-label="Filter by month">
      <option value="">All dates</option>
      <option value="2027-03">March 2027</option>
      <option value="2027-04">April 2027</option>
      <option value="2027-05">May 2027</option>
      <option value="2027-06">June 2027</option>
    </select>
    <select id="tn-performer" aria-label="Filter by performer">
      <option value="">All performers</option>
      <option value="Neon Harbor">Neon Harbor</option>
      <option value="Neon Harbor Acoustic">Neon Harbor Acoustic</option>
      <option value="DJ Afterglow">DJ Afterglow</option>
    </select>
    <select id="tn-city" aria-label="Filter by city">
      <option value="">All cities</option>
      <option value="New York">New York</option>
      <option value="Los Angeles">Los Angeles</option>
      <option value="Chicago">Chicago</option>
      <option value="Austin">Austin</option>
      <option value="Seattle">Seattle</option>
      <option value="Miami">Miami</option>
    </select>
    <input id="tn-search" type="search" placeholder="Search venue…" aria-label="Search venue" />
  </div>
  <div id="tn-events" class="tn-events"></div>
  <div class="tn-more-wrap"><button id="tn-more" class="tn-more" type="button">Load more dates</button></div>
  <div class="tn-note">Demo schedule — replace this widget with your official TicketNetwork embed. Ticket links go to ticketnetwork.com.</div>
</div>
<script>
(function () {
  var events = [
    { date: '2027-03-12', performer: 'Neon Harbor', city: 'New York', venue: 'Mercury Arena', price: 79, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-03-18', performer: 'Neon Harbor', city: 'Chicago', venue: 'Lakefront Pavilion', price: 65, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-03-26', performer: 'DJ Afterglow', city: 'Miami', venue: 'Solaris Club', price: 45, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-04-02', performer: 'Neon Harbor', city: 'Austin', venue: 'Desert Sound Hall', price: 69, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-04-09', performer: 'Neon Harbor Acoustic', city: 'Seattle', venue: 'Rain Room', price: 55, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-04-17', performer: 'Neon Harbor', city: 'Los Angeles', venue: 'Neon Bowl', price: 95, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-04-23', performer: 'DJ Afterglow', city: 'New York', venue: 'Skyline Warehouse', price: 49, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-05-01', performer: 'Neon Harbor', city: 'Miami', venue: 'Atlantic Amphitheater', price: 85, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-05-08', performer: 'Neon Harbor Acoustic', city: 'Chicago', venue: 'The Listening Room', price: 52, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-05-15', performer: 'Neon Harbor', city: 'Seattle', venue: 'Emerald Stage', price: 72, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-06-04', performer: 'Neon Harbor', city: 'Austin', venue: 'Nightwave Fields', price: 88, url: 'https://www.ticketnetwork.com/' },
    { date: '2027-06-19', performer: 'Neon Harbor', city: 'Los Angeles', venue: 'Pacific Sound Park', price: 99, url: 'https://www.ticketnetwork.com/' }
  ];
  var state = { month: '', performer: '', city: '', q: '', limit: 5 };
  function el(id) { return document.getElementById(id); }
  function filtered() {
    return events.filter(function (item) {
      if (state.month && item.date.indexOf(state.month) !== 0) return false;
      if (state.performer && item.performer !== state.performer) return false;
      if (state.city && item.city !== state.city) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        if ((item.venue + ' ' + item.city).toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
  }
  function monthLabel(iso) {
    var parts = iso.split('-');
    var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return { day: Number(parts[2]), month: months[Number(parts[1]) - 1], year: parts[0] };
  }
  function render() {
    var container = el('tn-events');
    var list = filtered();
    var visible = list.slice(0, state.limit);
    if (!visible.length) {
      container.innerHTML = '<div class="tn-empty">No concerts match these filters. Try another city or month.</div>';
      el('tn-more').hidden = true;
      return;
    }
    var html = '';
    visible.forEach(function (item) {
      var label = monthLabel(item.date);
      html += '<div class="tn-event">' +
        '<div class="tn-date"><strong>' + label.month + ' ' + label.day + '</strong><span>' + label.year + '</span></div>' +
        '<div><h4>' + item.performer + '</h4><p>' + item.venue + '</p></div>' +
        '<div class="tn-loc"><h4>' + item.city + '</h4><p>' + item.date + '</p></div>' +
        '<div><div class="tn-price">$' + item.price + '<small>starting at</small></div></div>' +
        '<a class="tn-buy" href="' + item.url + '" target="_blank" rel="noopener noreferrer">Tickets</a>' +
        '</div>';
    });
    container.innerHTML = html;
    el('tn-more').hidden = list.length <= state.limit;
  }
  el('tn-month').addEventListener('change', function (e) { state.month = e.target.value; state.limit = 5; render(); });
  el('tn-performer').addEventListener('change', function (e) { state.performer = e.target.value; state.limit = 5; render(); });
  el('tn-city').addEventListener('change', function (e) { state.city = e.target.value; state.limit = 5; render(); });
  el('tn-search').addEventListener('input', function (e) { state.q = e.target.value; state.limit = 5; render(); });
  el('tn-more').addEventListener('click', function () { state.limit += 5; render(); });
  render();
})();
</script>
</div>`;

function article(opts: {
  artist: string;
  tour: string;
  intro: string;
  cities: string;
  dates: string;
  highlight: string;
  quote: string;
  extraTitle: string;
  extra: string;
  ticketNote: string;
}) {
  return `<p>${opts.intro}</p>
<h2>Tour overview</h2>
<p>${opts.tour} brings ${opts.artist} to fans across a new run of live dates. The announcement follows months of studio work and a string of sold-out warm-up shows, and the full production is expected to include a brand-new stage design, an expanded setlist and a rotating support lineup.</p>
<p>${opts.extra}</p>
<h3>What to expect</h3>
<ul>
  <li>A career-spanning headline set built around the new record.</li>
  <li>Reserved seating, general admission and accessible ticket options.</li>
  <li>VIP packages with early entry and exclusive merchandise.</li>
  <li>Support acts announced progressively in each city.</li>
</ul>
<h2>Tour dates and cities</h2>
<p>${opts.dates}</p>
<p>${opts.cities}</p>
<blockquote><p>“${opts.quote}”</p></blockquote>
<h2>${opts.extraTitle}</h2>
<p>${opts.highlight}</p>
<h3>Ticket information</h3>
<p>${opts.ticketNote} Availability, pricing and venue policies are controlled by the official ticketing provider. Use the concert schedule below to browse dates, filter by city and follow the ticket links when you are ready to buy.</p>
<h2>Plan your night</h2>
<ol>
  <li>Choose a city and date from the schedule below.</li>
  <li>Compare ticket types and check venue accessibility details.</li>
  <li>Complete your purchase through the official ticket partner.</li>
  <li>Save the date and arrive early for support acts.</li>
</ol>
<p>Keep checking back — additional dates and support announcements are expected to be added throughout the year.</p>`;
}

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@concertdiscovery.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "Concert Discovery Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: { name, email, passwordHash, role: "ADMIN" },
    update: {},
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      websiteName: "Concert Discovery",
      tagline: "Discover Tours. Explore Artists. Find Tickets.",
      description:
        "A modern concert discovery and tour announcement platform. Follow the latest tours, explore artists by genre and find your next live show.",
      contactEmail: email,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/",
        facebook: "https://facebook.com/",
        instagram: "https://instagram.com/",
        youtube: "https://youtube.com/",
      }),
      defaultSeoTitle: "Concert Discovery - Discover Tours. Explore Artists. Find Tickets.",
      defaultSeoDescription:
        "Stay updated with the latest concert tour announcements, artist news, and live performances.",
    },
    update: {},
  });

  const blogs = [
    {
      slug: "neon-harbor-midnight-frequency-tour-2027",
      title: "Neon Harbor Announces Midnight Frequency Tour 2027",
      excerpt:
        "Neon Harbor is taking the Midnight Frequency Tour across North America in 2027, with 18 arena dates and a brand-new stage production.",
      artistName: "Neon Harbor",
      tourName: "Midnight Frequency Tour",
      genre: "Electronic",
      tourStartDate: new Date("2027-03-12T00:00:00.000Z"),
      tourEndDate: new Date("2027-08-30T00:00:00.000Z"),
      featuredImage: "/seed/neon-harbor.svg",
      content: article({
        artist: "Neon Harbor",
        tour: "The Midnight Frequency Tour",
        intro:
          "Neon Harbor has officially announced the Midnight Frequency Tour, a coast-to-coast run that will bring the group's shimmering electronic sound to arenas and amphitheaters across North America.",
        extra:
          "The tour supports the band's new album, a record that trades clubs for widescreen synth textures while keeping the pulse that made their early shows so beloved.",
        dates:
          "The 2027 run opens on March 12 in New York and travels through Chicago, Austin, Seattle and Los Angeles before wrapping in Miami. Additional dates will be added based on demand.",
        cities:
          "Confirmed cities include New York, Chicago, Miami, Austin, Seattle and Los Angeles, with special acoustic performances in selected markets.",
        quote:
          "We built this tour as a place to disappear into sound for two hours. Every city gets a different light show, and every night ends somewhere new.",
        extraTitle: "A production built for arenas",
        highlight:
          "The Midnight Frequency stage uses a 360-degree lighting rig, a moving LED constellation and an extended encore sequence. Fans can expect a setlist that moves from intimate album cuts to the band's biggest festival anthems.",
        ticketNote:
          "Tickets go on sale through official partners, with presales for fan-club members beginning ahead of the general sale.",
      }),
      widgetEnabled: true,
      widgetCode: DEMO_WIDGET,
      metaTitle: "Neon Harbor Midnight Frequency Tour 2027: Dates & Tickets",
      metaDescription:
        "Neon Harbor announces the Midnight Frequency Tour 2027. See all tour dates, cities, venue details and ticket links for the North American run.",
      seoKeywords: "Neon Harbor tour, Midnight Frequency Tour, 2027 concert tickets, electronic tour",
      status: "PUBLISHED",
      featured: true,
      publishedAt: daysAgo(2),
      supportingArtists: JSON.stringify(["Aster Vale", "Night Drive"]),
      previousTour:
        "The Neon Skyline run sold out 14 shows across North America in 2025, including a hometown finale that was livestreamed to more than 200,000 fans.",
      albums: JSON.stringify([
        {
          title: "Midnight Frequency",
          year: "2027",
          cover: "/seed/neon-harbor.svg",
          description:
            "The new record trades club textures for widescreen synths while keeping the pulse of the band's early shows.",
          tracks: ["Night Drive", "Static Bloom", "Neon Tide", "Afterglow"],
        },
        {
          title: "Signal Lost",
          year: "2024",
          cover: "/seed/neon-harbor.svg",
          description: "The breakout album that established Neon Harbor's shimmering live sound.",
          tracks: ["Signal Lost", "Glass City", "Low Orbit"],
        },
      ]),
      tourCities: JSON.stringify([
        "New York",
        "Chicago",
        "Austin",
        "Seattle",
        "Los Angeles",
        "Miami",
      ]),
    },
    {
      slug: "the-velvet-static-electric-bloom-tour",
      title: "The Velvet Static Brings Electric Bloom Tour to North America",
      excerpt:
        "The Velvet Static returns with the Electric Bloom Tour, a 14-city run of intimate venues and late-night shows.",
      artistName: "The Velvet Static",
      tourName: "Electric Bloom Tour",
      genre: "Alternative",
      tourStartDate: new Date("2027-04-04T00:00:00.000Z"),
      tourEndDate: new Date("2027-06-18T00:00:00.000Z"),
      featuredImage: "/seed/velvet-static.svg",
      content: article({
        artist: "The Velvet Static",
        tour: "The Electric Bloom Tour",
        intro:
          "The Velvet Static will hit the road in spring 2027 with the Electric Bloom Tour, a 14-city run that leans into the band's darker, more theatrical side.",
        extra:
          "The tour follows the release of Electric Bloom, a record recorded live to tape in a converted warehouse and mixed by the band themselves.",
        dates:
          "The run begins April 4 in Portland and continues through Seattle, Denver, Minneapolis and Nashville before closing in Atlanta on June 18.",
        cities:
          "Portland, Seattle, Denver, Minneapolis, Chicago, Detroit, Nashville and Atlanta are among the confirmed stops, with a second night added in Chicago.",
        quote:
          "We wanted rooms where you can see the sweat on the drums. This tour is about closeness, not size.",
        extraTitle: "Intimate rooms, bigger sound",
        highlight:
          "The Electric Bloom shows pair a stripped-back stage with a full surround-sound rig. The band will perform the new album in sequence during a mid-show segment before closing with fan favourites.",
        ticketNote:
          "A limited number of low-cost tickets are held for each show, and fan presales open one week before the general sale.",
      }),
      widgetEnabled: false,
      widgetCode: "",
      tourCities: JSON.stringify(["Portland", "Seattle", "Denver", "Minneapolis", "Chicago", "Detroit", "Nashville", "Atlanta"]),
      metaTitle: "The Velvet Static Electric Bloom Tour 2027",
      metaDescription:
        "The Velvet Static announce the Electric Bloom Tour with 14 shows across North America. Find dates, cities and ticket information.",
      seoKeywords: "The Velvet Static tour, Electric Bloom, alternative concert 2027",
      status: "PUBLISHED",
      featured: true,
      publishedAt: daysAgo(5),
    },
    {
      slug: "mara-sol-golden-hour-tour",
      title: "Mara Sol Reveals Golden Hour Tour: Dates, Cities and Tickets",
      excerpt:
        "Mara Sol's Golden Hour Tour will bring her sun-soaked Latin pop to arenas across the United States and Mexico in 2027.",
      artistName: "Mara Sol",
      tourName: "Golden Hour Tour",
      genre: "Latin",
      tourStartDate: new Date("2027-05-08T00:00:00.000Z"),
      tourEndDate: new Date("2027-09-22T00:00:00.000Z"),
      featuredImage: "/seed/mara-sol.svg",
      content: article({
        artist: "Mara Sol",
        tour: "The Golden Hour Tour",
        intro:
          "Mara Sol has announced the Golden Hour Tour, her largest headline run to date, with arena dates across the United States and Mexico scheduled for 2027.",
        extra:
          "The announcement arrives as her latest single reaches the top ten in three countries. The tour will feature a full live band, brass section and a rotating guest list of Latin collaborators.",
        dates:
          "The Golden Hour Tour opens May 8 in San Antonio and visits Houston, Dallas, Phoenix, San Diego and Los Angeles before moving into Mexico for a final run of dates in September.",
        cities:
          "San Antonio, Houston, Dallas, Phoenix, San Diego, Los Angeles, Monterrey and Mexico City are confirmed, with more markets to be announced.",
        quote:
          "This is the show I have been dreaming about since I started writing songs. Come ready to dance until the sun goes down.",
        extraTitle: "A celebration of the new record",
        highlight:
          "Expect an opening salsa set, a stripped-back acoustic middle section and a closing run of hits with full production. The show is designed to feel like one long golden-hour party.",
        ticketNote:
          "Fan presale and venue presales will run ahead of the general on-sale. VIP packages include a soundcheck experience and signed merchandise.",
      }),
      widgetEnabled: false,
      widgetCode: "",
      tourCities: JSON.stringify(["San Antonio", "Houston", "Dallas", "Phoenix", "San Diego", "Los Angeles", "Monterrey", "Mexico City"]),
      metaTitle: "Mara Sol Golden Hour Tour 2027 Dates and Tickets",
      metaDescription:
        "Mara Sol announces the Golden Hour Tour 2027 across the US and Mexico. See the full schedule and ticket details.",
      seoKeywords: "Mara Sol tour, Golden Hour Tour, Latin concert tickets 2027",
      status: "PUBLISHED",
      featured: true,
      publishedAt: daysAgo(8),
    },
    {
      slug: "echo-atlas-northern-lights-tour-2027",
      title: "Echo Atlas Announces Northern Lights Tour 2027",
      excerpt:
        "Echo Atlas will headline arenas for the first time on the Northern Lights Tour, starting in September 2027.",
      artistName: "Echo Atlas",
      tourName: "Northern Lights Tour",
      genre: "Rock",
      tourStartDate: new Date("2027-09-03T00:00:00.000Z"),
      tourEndDate: new Date("2027-12-11T00:00:00.000Z"),
      featuredImage: "/seed/echo-atlas.svg",
      content: article({
        artist: "Echo Atlas",
        tour: "The Northern Lights Tour",
        intro:
          "Echo Atlas has revealed the Northern Lights Tour, the band's first full arena headline run, with dates planned across North America and Europe.",
        extra:
          "The four-piece spent the last year writing in Iceland and recording in London. The new material is described as their most expansive and atmospheric work yet.",
        dates:
          "The tour starts September 3 in Toronto and travels through Boston, Philadelphia, Washington, D.C., Nashville and Dallas before heading to Europe in November.",
        cities:
          "Toronto, Boston, Philadelphia, Washington, Nashville, Dallas, London, Manchester, Glasgow and Dublin are confirmed for the first leg.",
        quote:
          "We have spent years playing rooms we love. Now we get to build something enormous and bring the lights with us.",
        extraTitle: "New songs, new horizon",
        highlight:
          "The Northern Lights production features a suspended mirror rig, a live string section on selected dates and a setlist that spans all four albums.",
        ticketNote:
          "Tickets are available through official partners, with a fan-club presale opening two weeks before the public sale.",
      }),
      widgetEnabled: false,
      widgetCode: "",
      tourCities: JSON.stringify(["Toronto", "Boston", "Philadelphia", "Washington", "Nashville", "Dallas", "London", "Manchester", "Glasgow", "Dublin"]),
      metaTitle: "Echo Atlas Northern Lights Tour 2027",
      metaDescription:
        "Echo Atlas announce the Northern Lights Tour 2027 with arena dates across North America and Europe.",
      seoKeywords: "Echo Atlas tour, Northern Lights Tour, rock concert 2027",
      status: "PUBLISHED",
      featured: false,
      publishedAt: daysAgo(12),
    },
    {
      slug: "luna-vale-afterglow-tour-europe",
      title: "Luna Vale Plots Afterglow Tour Across Europe",
      excerpt:
        "Luna Vale will bring the Afterglow Tour to twelve European cities in early 2027, with a new live show and a fresh setlist.",
      artistName: "Luna Vale",
      tourName: "Afterglow Tour",
      genre: "Pop",
      tourStartDate: new Date("2027-02-06T00:00:00.000Z"),
      tourEndDate: new Date("2027-04-02T00:00:00.000Z"),
      featuredImage: "/seed/luna-vale.svg",
      content: article({
        artist: "Luna Vale",
        tour: "The Afterglow Tour",
        intro:
          "Luna Vale has announced the Afterglow Tour, a twelve-city European run that will bring her dreamy pop production to some of the continent's most iconic venues.",
        extra:
          "The tour follows a breakout year of festival appearances and a new EP recorded between London and Stockholm.",
        dates:
          "Shows begin February 6 in Oslo and continue through Stockholm, Copenhagen, Berlin, Amsterdam, Paris, Brussels and London before closing in Lisbon on April 2.",
        cities:
          "Oslo, Stockholm, Copenhagen, Berlin, Amsterdam, Paris, Brussels, London, Madrid, Barcelona, Milan and Lisbon are on the itinerary.",
        quote:
          "I want the room to feel like the moment after a sunset. Warm, a little unreal, and impossible to forget.",
        extraTitle: "A softer, brighter live show",
        highlight:
          "The Afterglow stage is built around warm light, close-up camera work and a band arranged in a semicircle. The setlist will include every song from the new EP plus reworked versions of earlier favourites.",
        ticketNote:
          "European tickets go on sale through local partners, with accessible seating available at every venue.",
      }),
      widgetEnabled: false,
      widgetCode: "",
      tourCities: JSON.stringify(["Oslo", "Stockholm", "Copenhagen", "Berlin", "Amsterdam", "Paris", "Brussels", "London", "Madrid", "Barcelona", "Milan", "Lisbon"]),
      metaTitle: "Luna Vale Afterglow Tour 2027 European Dates",
      metaDescription:
        "Luna Vale announces the Afterglow Tour across Europe in 2027. See all dates, cities and ticket information.",
      seoKeywords: "Luna Vale tour, Afterglow Tour, pop concert Europe 2027",
      status: "PUBLISHED",
      featured: false,
      publishedAt: daysAgo(16),
    },
    {
      slug: "saint-and-sinners-cathedral-of-sound-tour",
      title: "Saint & Sinners Announces Cathedral of Sound Tour",
      excerpt:
        "A massive new metal tour is taking shape. Full dates and venue details are being finalized.",
      artistName: "Saint & Sinners",
      tourName: "Cathedral of Sound Tour",
      genre: "Metal",
      tourStartDate: new Date("2027-10-01T00:00:00.000Z"),
      tourEndDate: new Date("2027-12-20T00:00:00.000Z"),
      featuredImage: "/seed/saint-sinners.svg",
      content: `<p>Saint & Sinners are preparing the Cathedral of Sound Tour, a full-scale metal production that will be announced shortly.</p>
<h2>What we know so far</h2>
<p>The band has confirmed a autumn 2027 run with a new stage built around a cathedral-inspired light rig. Full dates, support acts and ticket details are still being finalized and this draft will be updated before publication.</p>`,
      widgetEnabled: false,
      widgetCode: "",
      metaTitle: "",
      metaDescription: "",
      seoKeywords: "",
      status: "DRAFT",
      featured: false,
      publishedAt: null as Date | null,
    },
  ];

  for (const blog of blogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      create: {
        ...blog,
        additionalImages: "[]",
      },
      update: {},
    });
  }

  console.log("Seed complete. Admin:", email);
  console.log(`Seeded ${blogs.length} demo blogs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
