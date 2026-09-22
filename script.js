// Crypto961 — no external JS dependencies, just the browser + a public price API.

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- MOBILE NAV ---------- */
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ---------- LIVE BTC PRICE ---------- */
  const priceValueEl = document.getElementById('priceValue');
  const priceChangeEl = document.getElementById('priceChange');
  const priceUpdatedEl = document.getElementById('priceUpdated');
  const refreshBtn = document.getElementById('priceRefresh');
  const sparklinePath = document.getElementById('sparklinePath');
  const CACHE_KEY = 'c961_btc_cache';
  const CACHE_MS = 60000;

  function animateNumber(el, from, to, duration = 600) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      el.textContent = '$' + value.toLocaleString(undefined, { maximumFractionDigits: 0 });
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function drawSparkline(prices) {
    if (!prices || !prices.length) return;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 300, h = 70, pad = 4;
    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    sparklinePath.setAttribute('points', points);
    const trendUp = prices[prices.length - 1] >= prices[0];
    sparklinePath.setAttribute('stroke', trendUp ? '#7FBF8C' : '#E08A7A');
  }

  async function fetchBTC(showSpin) {
    if (showSpin && refreshBtn) refreshBtn.classList.add('spinning');
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached && !showSpin) {
        const data = JSON.parse(cached);
        if (Date.now() - data.fetchedAt < CACHE_MS) {
          renderPrice(data, true);
          return;
        }
      }

      const [priceRes, chartRes] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'),
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily')
      ]);
      if (!priceRes.ok || !chartRes.ok) throw new Error('API error');

      const priceJson = await priceRes.json();
      const chartJson = await chartRes.json();

      const data = {
        price: priceJson.bitcoin.usd,
        change24h: priceJson.bitcoin.usd_24h_change,
        sparkline: (chartJson.prices || []).map(p => p[1]),
        fetchedAt: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      renderPrice(data, false);
    } catch (err) {
      priceUpdatedEl.textContent = 'Live price unavailable right now — try refreshing.';
      priceChangeEl.textContent = '';
      priceValueEl.textContent = '$—';
    } finally {
      if (showSpin && refreshBtn) setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    }
  }

  function renderPrice(data, fromCache) {
    const prevText = priceValueEl.textContent.replace(/[^0-9.]/g, '');
    const prevVal = parseFloat(prevText) || data.price;
    animateNumber(priceValueEl, prevVal, data.price);

    const change = data.change24h;
    priceChangeEl.textContent = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change).toFixed(2) + '% (24h)';
    priceChangeEl.className = 'price-change ' + (change >= 0 ? 'up' : 'down');

    drawSparkline(data.sparkline);

    const time = new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    priceUpdatedEl.textContent = (fromCache ? 'Cached · ' : 'Updated ') + time;
  }

  if (priceValueEl) {
    fetchBTC(false);
    setInterval(() => fetchBTC(false), CACHE_MS);
    if (refreshBtn) refreshBtn.addEventListener('click', () => fetchBTC(true));
  }

  /* ---------- SAVINGS ERODER ---------- */
  const amountSlider = document.getElementById('erodeAmount');
  const yearsSlider = document.getElementById('erodeYears');
  const amountOut = document.getElementById('erodeAmountOut');
  const yearsOut = document.getElementById('erodeYearsOut');
  const resultEl = document.getElementById('erodeResult');
  const barEl = document.getElementById('erodeBar');
  const DEVALUATION_RATE = 0.40;

  function updateEroder() {
    if (!amountSlider) return;
    const amount = parseInt(amountSlider.value, 10);
    const years = parseInt(yearsSlider.value, 10);
    amountOut.textContent = '$' + amount.toLocaleString();
    yearsOut.textContent = years + (years === 1 ? ' year' : ' years');

    const remaining = amount * Math.pow(1 - DEVALUATION_RATE, years);
    resultEl.textContent = '$' + Math.round(remaining).toLocaleString();
    const pct = Math.max(2, (remaining / amount) * 100);
    barEl.style.width = pct + '%';
  }
  if (amountSlider) {
    amountSlider.addEventListener('input', updateEroder);
    yearsSlider.addEventListener('input', updateEroder);
    updateEroder();
  }

  /* ---------- HALVING COUNTDOWN ---------- */
  // Estimated next halving — update this date as the real estimate shifts closer to the event.
  const NEXT_HALVING = new Date('2028-04-20T00:00:00Z').getTime();
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tickCountdown() {
    if (!cdDays) return;
    const diff = Math.max(0, NEXT_HALVING - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    cdDays.textContent = pad(days);
    cdHours.textContent = pad(hours);
    cdMins.textContent = pad(mins);
    cdSecs.textContent = pad(secs);
  }
  if (cdDays) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

});
