export const DEFAULT_TICKETNETWORK_AFFILIATE_URL =
  "https://TicketNetwork.7eer.net/c/2491654/133430/2322?u=";

export const TICKETNETWORK_THEME_CSS = String.raw`.tner-container {
  --cd-accent: #1791c7;
  --cd-ink: #535353;
  --cd-muted: #6b6b76;
  --cd-line: #e5e5e5;
  font-family: inherit;
  color: var(--cd-ink);
}
.tner-container * { box-sizing: border-box; }
.tner-container .tner-filters-container {
  margin: 0 !important;
  padding: 16px 22px !important;
  background: #f7f7f7;
  border-bottom: 1px solid var(--cd-line);
  overflow: visible !important;
}
.tner-container .tner-filters {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 !important;
}
.tner-container .tner-filter-tab {
  position: relative;
  display: block !important;
  width: auto !important;
  margin: 0 !important;
}
.tner-container .tner-filter-title {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  height: 38px !important;
  padding: 0 12px !important;
  background: #fff !important;
  border: 1px solid #ccc !important;
  border-radius: 4px !important;
  color: #101014 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
  cursor: pointer;
}
.tner-container .tner-filter-title:hover,
.tner-container .tner-filter-title:focus {
  border-color: var(--cd-accent) !important;
  box-shadow: 0 0 0 3px rgba(23, 145, 199, 0.15);
}
.tner-container .tner-filter-title span::before {
  content: '' !important;
  display: none !important;
}
.tner-container .tner-filter-title::before { display: none !important; }
.tner-container .tner-filter-title::after {
  content: '\25BE' !important;
  font-family: inherit !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  color: #777783 !important;
  transform: none !important;
  margin-left: 8px;
}
.tner-container .tner-filter-dropdown {
  position: absolute !important;
  top: calc(100% + 6px) !important;
  left: 0 !important;
  right: auto !important;
  width: min(480px, calc(100vw - 48px));
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  border: 1px solid var(--cd-line) !important;
  border-radius: 6px !important;
  box-shadow: 0 18px 45px rgba(16, 16, 20, 0.16) !important;
  z-index: 30 !important;
  overflow: hidden !important;
}
.tner-container .tner-city-filter .tner-filter-dropdown {
  left: auto !important;
  right: 0 !important;
}
.tner-container .tner-filter-tab:not(.open) > .tner-filter-dropdown {
  display: none !important;
}
.tner-container .tner-filter-tab.open > .tner-filter-dropdown {
  display: block !important;
}
.tner-container .tner-filter-form { padding: 16px !important; }
.tner-container .tner-filter-heading {
  display: block;
  margin: 0 0 6px;
  color: #8a8a95;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.tner-container .tner-filter-options.tner-col-3 {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
  margin: 0 0 14px !important;
}
.tner-container .tner-filter-item {
  margin: 0 !important;
  color: var(--cd-muted);
  font-size: 12px !important;
  line-height: 1.4;
}
.tner-container .tner-filter-item input[type='checkbox'] {
  margin-right: 6px;
  accent-color: var(--cd-accent);
}
.tner-container .tner-solo-input {
  width: 100% !important;
  height: 36px !important;
  padding: 0 10px !important;
  border: 1px solid #ccc !important;
  border-radius: 4px !important;
  background: #fff !important;
  color: #101014 !important;
  font-size: 12px !important;
  outline: none;
}
.tner-container .tner-solo-input:focus {
  border-color: var(--cd-accent) !important;
  box-shadow: 0 0 0 3px rgba(23, 145, 199, 0.15);
}
.tner-container .tner-filter-control {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 0 !important;
  padding: 12px 0 0 !important;
  border-top: 1px solid #f0f0f0;
}
.tner-container .tner-filter-control-btn {
  width: auto !important;
  height: 34px !important;
  padding: 0 14px !important;
  border-radius: 4px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.tner-container .tner-clear-filters {
  background: #fff !important;
  border: 1px solid #ccc !important;
  color: var(--cd-ink) !important;
}
.tner-container .tner-clear-filters:hover { border-color: var(--cd-accent) !important; }
.tner-container .tner-apply-filters {
  background: var(--cd-accent) !important;
  border: 1px solid var(--cd-accent) !important;
  color: #fff !important;
}
.tner-container .tner-apply-filters:hover { background: #127794 !important; }
.tner-container .tner-filter-tags-container { margin-top: 10px !important; }
.tner-container .tner-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 !important;
}
.tner-container .tner-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px !important;
  background: #fff !important;
  border: 1px solid #d8d8dc !important;
  border-radius: 999px !important;
  color: var(--cd-muted) !important;
  font-size: 10px !important;
  font-weight: 600;
}
.tner-container .tner-list-container {
  min-height: 220px;
  padding: 0 !important;
}
.tner-container .tner-list {
  margin: 0 !important;
  border-top: 1px solid var(--cd-line);
}
.tner-container .tner-row {
  display: grid !important;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin: 0 !important;
  padding: 14px 22px !important;
  background: #fff !important;
  border: 0 !important;
  border-bottom: 1px solid #eeeeee !important;
  border-radius: 0 !important;
}
.tner-container .tner-row:hover { background: #f4fafd !important; }
.tner-container .tner-row-link { z-index: 1; }
.tner-container .tner-full-date {
  display: flex !important;
  flex-direction: column;
  align-items: flex-start;
  width: 92px !important;
  min-width: 92px !important;
  padding-left: 10px;
  border-left: 3px solid var(--cd-accent);
  color: var(--cd-ink) !important;
}
.tner-container .tner-day { display: none !important; }
.tner-container .tner-date {
  display: grid !important;
  grid-template-columns: auto auto;
  column-gap: 5px;
  align-items: baseline;
  font-size: 14px !important;
  line-height: 1.15 !important;
}
.tner-container .tner-month {
  grid-column: 1;
  color: #777783 !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.tner-container .tner-month-full,
.tner-container .tner-month-num { display: none !important; }
.tner-container .tner-month-abbr { display: inline !important; }
.tner-container .tner-date-num {
  grid-column: 2;
  color: var(--cd-ink) !important;
  font-size: 15px !important;
  font-weight: 700 !important;
}
.tner-container .tner-year {
  display: block !important;
  grid-column: 1 / -1;
  color: #777783 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em;
}
.tner-container .tner-year-full,
.tner-container .tner-year-abbr { display: inline !important; }
.tner-container .tner-time {
  display: block !important;
  margin-top: 4px;
  color: #777783 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.04em;
}
.tner-container .tner-time-period::before { content: ' '; }
.tner-container .tner-details {
  display: block !important;
  max-width: none !important;
  min-width: 0;
  padding: 0 !important;
}
.tner-container .tner-name {
  display: block;
  padding: 0 !important;
  color: var(--cd-ink) !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
}
.tner-container .tner-location {
  display: block !important;
  margin-top: 2px;
  color: var(--cd-muted) !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
}
.tner-container .tner-venue { display: block; color: var(--cd-muted) !important; }
.tner-container .tner-locale { display: block; margin-top: 2px; }
.tner-container .tner-city {
  color: var(--cd-accent) !important;
  font-weight: 600;
}
.tner-container .tner-city::after { content: ', '; color: var(--cd-muted); }
.tner-container .tner-state { color: var(--cd-muted) !important; }
.tner-container .tner-country { display: none !important; }
.tner-container .tner-cta {
  position: relative;
  z-index: 3;
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  align-self: center !important;
  width: auto !important;
  min-width: 0 !important;
  gap: 5px;
}
.tner-container .tner-cta-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  height: 36px !important;
  padding: 0 16px !important;
  margin: 0 !important;
  background: var(--cd-accent) !important;
  border: 1px solid var(--cd-accent) !important;
  border-radius: 3px !important;
  color: #fff !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tner-container .tner-cta-btn:hover { background: #127794 !important; }
.tner-container .tner-cta-btn::after { content: none !important; }
.tner-container .tner-cta-btn-text::after {
  content: 'Tickets' !important;
  display: inline !important;
}
.tner-container .tner-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.tner-container .tner-price {
  display: block !important;
  color: var(--cd-ink) !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  white-space: nowrap;
}
.tner-container .tner-price-num::before { content: '$'; }
.tner-container .tner-price-num::after { content: ''; }
.tner-container .tner-ticket-count { display: none !important; }
.tner-container .tner-more {
  display: none !important;
}
.tner-container .tner-empty,
.tner-container .tner-no-results-text {
  color: var(--cd-muted) !important;
  font-size: 13px !important;
  text-align: center;
}
@media (max-width: 760px) {
  .tner-container .tner-filters-container { padding: 14px 16px !important; }
  .tner-container .tner-filters { grid-template-columns: 1fr 1fr !important; }
  .tner-container .tner-filter-dropdown {
    width: min(440px, calc(100vw - 32px)) !important;
  }
  .tner-container .tner-filter-tab:nth-child(odd) .tner-filter-dropdown {
    left: 0 !important;
    right: auto !important;
  }
  .tner-container .tner-filter-tab:nth-child(even) .tner-filter-dropdown {
    left: auto !important;
    right: 0 !important;
  }
  .tner-container .tner-filter-options.tner-col-3 { grid-template-columns: 1fr; }
  .tner-container .tner-filter-control-btn { flex: 1; }
  .tner-container .tner-row {
    grid-template-columns: 74px minmax(0, 1fr) auto;
    gap: 10px;
    padding: 13px 16px !important;
  }
  .tner-container .tner-full-date {
    width: 74px !important;
    min-width: 74px !important;
    padding-left: 9px;
  }
  .tner-container .tner-meta { display: none !important; }
  .tner-container .tner-cta-btn {
    height: 34px !important;
    padding: 0 12px !important;
    font-size: 10px !important;
  }
}`;

function scriptString(value) {
  return JSON.stringify(String(value)).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function scheduleDateValue(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function schedulePerPageValue(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return 24;
  return Math.max(1, Math.min(100, number));
}

export function scheduleAffiliateValue(value) {
  const url = cleanText(value, 2000);
  if (!url) return DEFAULT_TICKETNETWORK_AFFILIATE_URL;
  if (/^\/\//.test(url)) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  return DEFAULT_TICKETNETWORK_AFFILIATE_URL;
}

export function buildTicketNetworkFilters(artistQuery, endDate) {
  const query = cleanText(artistQuery, 160);
  if (!query) return "";
  let filter = "_metadata/hasTickets eq true";
  const date = scheduleDateValue(endDate);
  if (date) filter += ` and date/date le ${date}`;
  return `q=${encodeURIComponent(query)}&filter=${filter}`;
}

export function ticketNetworkGuid(blogId) {
  const key = String(blogId || "widget")
    .replace(/[^a-z0-9]/gi, "")
    .slice(-20)
    .toLowerCase();
  return `_cd${key || "widget"}`;
}

export function extractTicketNetworkSettings(widgetCode) {
  if (!widgetCode || typeof widgetCode !== "string") return null;
  if (!/csctn-results-v3|tn-apis\.com|tner-container/i.test(widgetCode)) return null;

  const read = (name) => {
    const pattern = new RegExp(`params\\.${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
    const match = pattern.exec(widgetCode);
    if (!match) return "";
    return String(match[1] ?? match[2] ?? "").trim();
  };

  const filters = read("filters");
  const queryMatch = /(?:^|&)q=([^&]*)/i.exec(filters);
  let artistQuery = "";
  if (queryMatch?.[1]) {
    try {
      artistQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, " "));
    } catch {
      artistQuery = queryMatch[1];
    }
  }
  const dateMatch = /date\/date\s+le\s+(\d{4}-\d{2}-\d{2})/i.exec(filters);

  return {
    artistQuery: cleanText(artistQuery, 160),
    endDate: dateMatch?.[1] || "",
    affiliateUrl: read("url") || "",
    perPage: schedulePerPageValue(read("perPage") || 24),
  };
}

export function buildTicketNetworkWidgetCode({ blogId, artistQuery, endDate, affiliateUrl, perPage }) {
  const query = cleanText(artistQuery, 160);
  if (!query) return "";

  const guid = ticketNetworkGuid(blogId);
  const key = guid.replace(/^_/, "");
  const filters = buildTicketNetworkFilters(query, endDate);
  const url = scheduleAffiliateValue(affiliateUrl);
  const limit = schedulePerPageValue(perPage);
  const dateStartId = `tner-stored-date-start_${key}`;
  const dateEndId = `tner-stored-date-end_${key}`;
  const resultsId = `tner-results_${key}`;

  return `<div id="tner-container_${key}" class="tner-container" data-guid="${guid}">
  <div id="tner-filters-container_${key}" class="tner-filters-container">
    <input id="tner-filter-storage_${key}" class="tner-filter-storage" hidden />
    <ul id="tner-filters_${key}" class="tner-filters">
      <li id="tner-date-filter_${key}" class="tner-date-filter tner-filter-tab">
        <a class="tner-filter-title tner-block" href="#"><span class="tner-filter-title-text">Dates</span></a>
        <div class="tner-filter-dropdown">
          <form id="tner-date-filters_${key}" class="tner-date-filters tner-filter-form tner-block">
            <ul class="tner-filter-options tner-col-3">
              <li id="tner-date-filter-range_${key}" class="tner-date-filter-range">
                <span class="tner-filter-heading">Date Range</span>
                <ul>
                  <li class="tner-filter-item tner-date-option"><input id="${dateStartId}" class="tner-stored-date-start tner-date-input tner-filter-option tner-solo-input" name="tner-date-filter-start" data-filter="date-start" placeholder="From" /></li>
                  <li class="tner-filter-item tner-date-option"><input id="${dateEndId}" class="tner-stored-date-end tner-date-input tner-filter-option tner-solo-input" name="tner-date-filter-end" data-filter="date-end" placeholder="To" /></li>
                </ul>
              </li>
              <li id="tner-date-filter-day_${key}" class="tner-date-filter-day"><span class="tner-filter-heading">Day of Week</span><ul id="tner-date_weekday_${key}" data-filter="date-day" class="tner-date_weekday tner-filter-checkbox-group"></ul></li>
              <li id="date-filter-time_${key}" class="tner-date-filter-time"><span class="tner-filter-heading">Time of Day</span><ul id="tner-time_of_day_${key}" data-filter="date-time" class="tner-time_of_day tner-filter-checkbox-group"></ul></li>
            </ul>
            <div class="tner-filter-control">
              <button form="tner-date-filters_${key}" class="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
              <button form="tner-date-filters_${key}" class="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
            </div>
          </form>
        </div>
      </li>
      <li id="tner-performer-filter_${key}" class="tner-performer-filter tner-filter-tab">
        <a class="tner-filter-title tner-block" href="#"><span class="tner-filter-title-text">Performers</span></a>
        <div class="tner-filter-dropdown">
          <form id="tner-performer-filters_${key}" class="tner-performer-filters tner-filter-form tner-block">
            <ul id="tner-performer_list_${key}" data-filter="performer" class="tner-performer_list tner-filter-checkbox-group tner-filter-options tner-col-3"></ul>
            <div class="tner-filter-control">
              <button form="tner-performer-filters_${key}" class="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
              <button form="tner-performer-filters_${key}" class="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
            </div>
          </form>
        </div>
      </li>
      <li id="tner-city-filter_${key}" class="tner-city-filter tner-filter-tab">
        <a class="tner-filter-title tner-block" href="#"><span class="tner-filter-title-text">Cities</span></a>
        <div class="tner-filter-dropdown">
          <form id="tner-city-filters_${key}" class="tner-city-filters tner-filter-form tner-block">
            <ul id="tner-city_and_state_${key}" data-filter="city" class="tner-city_and_state tner-filter-checkbox-group tner-filter-options tner-col-3"></ul>
            <div class="tner-filter-control">
              <button form="tner-city-filters_${key}" class="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
              <button form="tner-city-filters_${key}" class="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
            </div>
          </form>
        </div>
      </li>
      <li id="tner-venue-filter_${key}" class="tner-venue-filter tner-filter-tab" style="display:none">
        <a href="#" class="tner-filter-title tner-block"><span>Venues</span></a>
        <div class="tner-filter-dropdown">
          <form id="tner-venue-filters_${key}" class="tner-filter-form tner-block">
            <ul id="tner-venue_name_${key}" data-filter="venue" class="tner-venue_name tner-filter-checkbox-group tner-filter-options tner-col-3"></ul>
            <div class="tner-filter-control">
              <button form="tner-venue-filters_${key}" class="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
              <button form="tner-venue-filters_${key}" class="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
            </div>
          </form>
        </div>
      </li>
    </ul>
    <div id="tner-filter-spacer_${key}" class="tner-filter-spacer"></div>
    <div id="tner-filter-tags-container_${key}" class="tner-filter-tags-container"><ul id="tner-filter-tags_${key}" class="tner-filter-tags"></ul></div>
  </div>
  <div id="${resultsId}" class="tner-list-container">
    <input id="tner-call-storage_${key}" class="tner-call-storage" hidden />
    <a class="tner-more" href="#"><span class="tner-more-text">Load More</span></a>
  </div>
  <script>
  (function () {
    if (typeof $ === "undefined") addJs("https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js", "csctn-jquery");
    function addCss(file, id) {
      if (document.getElementById(id)) return;
      var css = document.createElement("link");
      css.setAttribute("rel", "stylesheet");
      css.setAttribute("type", "text/css");
      css.setAttribute("id", id);
      css.setAttribute("href", file);
      document.getElementsByTagName("head")[0].appendChild(css);
    }
    function addJs(file, id) {
      if (document.getElementById(id)) return;
      var js = document.createElement("script");
      js.setAttribute("id", id);
      js.setAttribute("src", file);
      document.getElementsByTagName("head")[0].appendChild(js);
    }
    addCss("https://venuefiles.s3.amazonaws.com/css/csctn-results-v3.css", "csctn-results-css");
    addJs("https://venuefiles.s3.amazonaws.com/js/csctn-results-v3.js", "csctn-results-js");
    var checks = 0;
    var checkExist = setInterval(function () {
      checks += 1;
      if (typeof tnerLoaded !== "undefined" && tnerLoaded === true) {
        clearInterval(checkExist);
        initializeDatepickers(${scriptString(`#${dateStartId}`)}, ${scriptString(`#${dateEndId}`)});
        var params = {};
        params.page = 1;
        params.guid = ${scriptString(guid)};
        params.container = ${scriptString(`#${resultsId}`)};
        params.filters = ${scriptString(filters)};
        params.specialFilters = "&includeFacets=true";
        params.target = "_blank";
        params.url = ${scriptString(url)};
        params.perPage = ${scriptString(limit)};
        params.state = "abbr";
        params.country = "";
        params.pricing = "lowPrice";
        params.count = "yes";
        csctnCall(params);
      } else if (checks > 1500) {
        clearInterval(checkExist);
      }
    }, 20);
  })();
  </script>
</div>`;
}
