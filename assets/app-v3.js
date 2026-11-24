(function () {
  'use strict';

  var TONES = ['indigo', 'slate', 'mauve', 'mist'];
  var CASES = window.DEMO_CASES || [];
  var state = { current: null, picked: [] };

  var ARROW =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14.5 5.5L8 12l6.5 6.5"/>' +
    '</svg>';

  var VERIFIED =
    '<span class="verified" title="官方旗舰店">' +
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 3l2.2 1.6 2.7-.2 1 2.5 2.3 1.5-.7 2.6.7 2.6-2.3 1.5-1 2.5-2.7-.2L12 21l-2.2-1.6-2.7.2-1-2.5-2.3-1.5.7-2.6-.7-2.6 2.3-1.5 1-2.5 2.7.2z"/>' +
        '<path d="M9 12.2l2.1 2.1 4-4"/>' +
      '</svg>' +
    '</span>';

  var el = {
    hero: document.getElementById('home'),
    result: document.getElementById('result'),
    form: document.getElementById('search-form'),
    input: document.getElementById('link-input'),
    samples: document.querySelectorAll('.sample')
  };

  /* ---------- 计算 ---------- */
  function compute(l, p) {
    var hasOfficial = p.official != null && p.official > 0;
    var officialUnit = hasOfficial ? p.official / p.specVolume : null;
    var sameVol = 0;
    var otherVal = 0;
    var giftValue = 0;

    l.gifts.forEach(function (g) {
      giftValue += g.value || 0;
      if (g.kind === 'same') sameVol += g.volume || 0;
      else otherVal += g.value || 0;
    });

    var equiv = p.specVolume + sameVol + (officialUnit ? otherVal / officialUnit : 0);
    var unit = l.price / equiv;
    var ratio = hasOfficial ? l.price / p.official : null;

    return {
      raw: l,
      officialUnit: officialUnit,
      sameVol: sameVol,
      otherVal: otherVal,
      giftValue: giftValue,
      equiv: equiv,
      unit: unit,
      discount: ratio,
      giftShare: giftValue / l.price,
      saved: hasOfficial ? p.official - l.price : null
    };
  }

  function money(n) {
    return n >= 100 ? String(Math.round(n)) : n.toFixed(n % 1 === 0 ? 0 : 1);
  }
  function unitPrice(n) {
    return n >= 1 ? n.toFixed(2) : n.toFixed(3);
  }
  function pct(n) {
    return Math.round(n * 100) + '%';
  }
  function zhe(n) {
    return (n * 10).toFixed(1) + ' 折';
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var bottleSVG =
    '<svg viewBox="0 0 44 66" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="16" y="2" width="12" height="9" rx="2.6" fill="#E2C68A"/>' +
    '<rect x="18.4" y="10.5" width="7.2" height="5" fill="#D7BB80"/>' +
    '<rect x="9.5" y="14.5" width="25" height="49.5" rx="6" fill="#FBF7EA"/>' +
    '<rect x="13" y="26" width="18" height="24" rx="2" fill="#EFE6D0"/>' +
    '<path d="M15.5 32.5h13M15.5 37.5h13M15.5 42.5h9" stroke="#BCB195" stroke-width="1.1" stroke-linecap="round"/>' +
    '<rect x="9.5" y="14.5" width="5" height="49.5" rx="2.5" fill="rgba(255,255,255,.6)"/>' +
    '<rect x="9.5" y="14.5" width="25" height="49.5" rx="6" stroke="rgba(90,80,60,.12)"/>' +
    '</svg>';

  var PRODUCT_IMAGES = [
    [/海蓝之谜.*奇迹面霜/, 'assets/products/tb-t003.webp'],
    [/兰蔻.*菁纯面霜/, 'assets/products/tb-t007.webp'],
    [/兰蔻.*菁纯眼霜/, 'assets/products/tb-t008.webp'],
    [/卡诗.*黑钻.*精油/, 'assets/products/tb-t031.webp'],
    [/花知晓.*雪精灵/, 'assets/products/dy-t05.webp'],
    [/彩棠.*双生气垫/, 'assets/products/tb-t136.webp'],
    [/彩棠.*妆前乳/, 'assets/products/tb-t132.webp'],
    [/YSL.*(Libre|自由之水)/i, 'assets/products/tb-t104.webp'],
    [/花西子.*散粉/, 'assets/products/tb-t021.webp']
  ];

  function productArt(p) {
    var label = String(p.brand) + ' ' + String(p.name);
    for (var i = 0; i < PRODUCT_IMAGES.length; i++) {
      if (PRODUCT_IMAGES[i][0].test(label)) {
        return '<img src="' + PRODUCT_IMAGES[i][1] + '" alt="">';
      }
    }
    return bottleSVG;
  }

  /* ---------- 卡片 ---------- */
  function card(r, i, total, p) {
    var l = r.raw;
    var tone = TONES[i % TONES.length];
    var isBest = i === 0 && total > 1;

    var bundle = l.bundle
      .map(function (s) { return '<li>' + esc(s) + '</li>'; })
      .join('');

    return '' +
      '<article class="lcard" data-tone="' + tone + '">' +
        '<div class="top-row">' +
          '<span class="pill">' + esc(l.platform) + '</span>' +
          '<span class="rank-pill ' + (isBest ? 'best' : '') + '">' +
            (isBest ? '机制最优' : '第 ' + (i + 1) + ' 名') +
          '</span>' +
        '</div>' +
        '<div class="main">' +
          '<div class="thumb">' + productArt(p) + '</div>' +
          '<div class="main-text">' +
            '<div class="channel">' +
              '<span class="dot"></span>' + esc(l.channel) +
              (l.official ? VERIFIED : '') +
            '</div>' +
            '<div class="price-row">' +
              '<span class="price"><span class="cur">¥</span>' + money(l.price) + '</span>' +
              (r.discount == null
                ? '<span class="off-tag">官方价待核</span>'
                : (r.discount < 0.995
                  ? '<span class="was">¥' + money(r.officialPrice) + '</span>' +
                    '<span class="off-tag">' + zhe(r.discount) + '</span>'
                  : '<span class="off-tag">官方原价</span>')) +
            '</div>' +
          '</div>' +
        '</div>' +
        '<ul class="bundle">' + bundle + '</ul>' +
        '<div class="foot">' +
          '<div class="unit-block">' +
            '<div class="k">折算单价</div>' +
            '<div class="v">¥' + unitPrice(r.unit) + '<small>/' + esc(r.unitName) + '</small></div>' +
          '</div>' +
          '<div class="share">' +
            '<div class="k"><span>赠品占实付</span><span>' + pct(r.giftShare) + '</span></div>' +
            '<div class="bar"><i style="--w:' + Math.min(100, Math.round(r.giftShare * 100)) + '%"></i></div>' +
          '</div>' +
        '</div>' +
        (l.note ? '<p class="note">' + esc(l.note) + '</p>' : '') +
      '</article>';
  }

  /* ---------- 对比表 ---------- */
  function table(rows, p) {
    var best = {
      unit: Math.min.apply(null, rows.map(function (r) { return r.unit; })),
      giftValue: Math.max.apply(null, rows.map(function (r) { return r.giftValue; })),
      discount: Math.min.apply(null, rows.filter(function (r) { return r.discount != null; }).map(function (r) { return r.discount; })),
      giftShare: Math.max.apply(null, rows.map(function (r) { return r.giftShare; }))
    };

    var head = '<div class="row head">' +
      '<div class="cell label"></div>' +
      rows.map(function (r) {
        return '<div class="cell col-head">' +
          '<span class="p">' + esc(r.raw.platform) + '</span>' +
          '<span class="a">' + esc(r.raw.channel) + '</span>' +
          '</div>';
      }).join('') +
      '</div>';

    function cells(fn) {
      return rows.map(function (r, i) { return fn(r, i); }).join('');
    }
    function mark(isBest) {
      return isBest ? '<i class="mark"></i>' : '';
    }
    function row(label, hint, contentFn) {
      return '<div class="row">' +
        '<div class="cell label">' + label +
          (hint ? '<span style="font-size:10px;opacity:.75;margin-top:3px">' + hint + '</span>' : '') +
        '</div>' +
        cells(contentFn) +
        '</div>';
    }

    var body = '';

    body += row('折算单价', '含赠品折算', function (r) {
      var isBest = r.unit === best.unit;
      return '<div class="cell big ' + (isBest ? 'best' : '') + '">' +
        '<span><b>¥' + unitPrice(r.unit) + '</b><em>/' + esc(r.unitName) + '</em></span>' +
        mark(isBest) + '</div>';
    });

    body += row('到手价', '', function (r) {
      return '<div class="cell"><span class="strong">¥' + money(r.raw.price) + '</span></div>';
    });

    body += row('折扣力度', '折数越低越深', function (r) {
      var isBest = r.discount != null && r.discount === best.discount;
      return '<div class="cell ' + (isBest ? 'best' : '') + '">' +
        '<span>' + (r.discount == null ? '待核' : (r.discount >= 0.995 ? '官方原价' : zhe(r.discount))) + '</span>' +
        mark(isBest) + '</div>';
    });

    body += row('正装内容', '', function (r) {
      return '<div class="cell"><span class="muted">正装 ' + esc(p.spec) + '</span></div>';
    });

    body += row('赠品明细', '', function (r) {
      if (!r.raw.gifts.length) {
        return '<div class="cell"><span class="muted">无赠品</span></div>';
      }
      return '<div class="cell">' + r.raw.gifts.map(function (g) {
        return '<span class="gift-line">' + esc(g.name) + '<em>¥' + money(g.value) + '</em></span>';
      }).join('') + '</div>';
    });

    body += row('赠品估值', '按官方价折算', function (r) {
      var isBest = r.giftValue === best.giftValue;
      return '<div class="cell ' + (isBest ? 'best' : '') + '">' +
        '<span class="strong">¥' + money(r.giftValue) + '</span>' +
        mark(isBest) + '</div>';
    });

    body += row('赠品价值占比', '赠品 ÷ 实付', function (r) {
      var isBest = r.giftShare === best.giftShare;
      return '<div class="cell ' + (isBest ? 'best' : '') + '">' +
        '<span>' + pct(r.giftShare) + '</span>' +
        '<span class="mini-bar"><i style="width:' + Math.min(100, Math.round(r.giftShare * 100)) + '%"></i></span>' +
        '</div>';
    });

    body += row('适合人群', '', function (r) {
      return '<div class="cell"><span class="muted">' + esc(r.raw.crowd) + '</span></div>';
    });

    var tpl = '152px repeat(' + rows.length + ', minmax(0,1fr))';
    return '<div class="cmp" style="--tpl:' + tpl + '">' + head + body + '</div>';
  }

  /* ---------- 结论 ---------- */
  function conclusion(rows, c) {
    var best = rows[0];
    var worst = rows[rows.length - 1];
    var gap = rows.length > 1 ? Math.round((1 - best.unit / worst.unit) * 100) : 0;

    var head = rows.length > 1
      ? '<b>' + esc(best.raw.channel) + '</b>（' + esc(best.raw.platform) + '）折算单价最低：<b>¥' +
        unitPrice(best.unit) + '/' + esc(best.unitName) + '</b>，比最贵的 ' +
        esc(worst.raw.channel) + ' 低约 <b>' + gap + '%</b>。'
      : '<b>' + esc(best.raw.channel) + '</b> 折算单价 <b>¥' + unitPrice(best.unit) + '/' + esc(best.unitName) + '</b>，当前时段只有这一条在播链接，暂无横向对比。';

    return '<div class="conclusion"><span class="lead">综合来看</span>' + head +
      (c.insight ? ' ' + esc(c.insight) : '') + '</div>';
  }

  /* ---------- 空状态 ---------- */
  function emptyState(keyword) {
    var chips = CASES.slice(0, 6).map(function (c) {
      return '<span>' + esc(c.product.short || c.product.brand) + ' · ' + esc(c.product.spec) + '</span>';
    }).join('');
    if (CASES.length > 6) {
      chips += '<span>…已收录 ' + CASES.length + ' 个商品</span>';
    }

    return '' +
      '<div class="result-head">' +
        '<div class="left">' +
          '<h2>对比结果</h2>' +
          '<span class="stamp">未命中</span>' +
        '</div>' +
        '<button class="btn-ghost" data-action="restart">开始新对比</button>' +
      '</div>' +
      '<div class="empty">' +
        '<div class="empty-icon">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
            '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>' +
          '</svg>' +
        '</div>' +
        '<h3>暂未收录这条链接的对比数据</h3>' +
        '<p>' +
          (keyword ? '「' + esc(keyword) + '」不在当前数据库里。' : '') +
          '我们只对比「同一时段在播、已上架可购买」的同款商品，且要求规格完全一致。' +
          '这条链接暂时还没有可对比的在播记录，可以先看看下面的示例。' +
        '</p>' +
        '<div class="empty-meta">' + chips + '</div>' +
        '<button class="btn-ghost" data-sample="loreal">看看示例对比</button>' +
      '</div>';
  }

  /* ---------- 渲染 ---------- */
  function render(c, picked) {
    var p = c.product;
    var use = (picked && picked.length)
      ? c.listings.filter(function (l, i) { return picked.indexOf(i) > -1; })
      : c.listings;
    var rows = use
      .map(function (l) { return compute(l, p); })
      .map(function (r) {
        r.unitName = p.unit;
        r.officialPrice = p.official;
        return r;
      })
      .sort(function (a, b) { return a.unit - b.unit; });

    var cardsHTML = rows.map(function (r, i) { return card(r, i, rows.length, p); }).join('');

    el.result.innerHTML = '' +
      '<div class="result-head">' +
        '<div class="left">' +
          '<button class="btn-back" data-action="back-select">' + ARROW + '返回选择</button>' +
          '<h2>对比结果</h2>' +
        '</div>' +
        '<span class="stamp">已选 ' + rows.length + ' 个直播间 · 同款同规格</span>' +
      '</div>' +

      '<div class="product-bar">' +
        '<div class="pb-thumb">' + productArt(p) + '</div>' +
        '<div class="pb-text">' +
          '<div class="pb-brand">' + esc(p.brand) + '</div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<div class="pb-tags">' +
            '<span class="pb-tag">' + esc(p.spec) + '</span>' +
            '<span class="pb-tag">' + esc(p.category) + '</span>' +
            '<span class="pb-tag neutral">仅比对同规格同款</span>' +
          '</div>' +
        '</div>' +
        '<div class="pb-meta">' +
          '<span>' + rows.length + ' 个直播间在播</span>' +
          '<span>' + (p.official != null ? '官方价 ¥' + money(p.official) : '官方价待核') + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="cards' + (rows.length >= 4 ? ' dense' : '') + '">' + cardsHTML + '</div>' +

      '<div class="table-card"><div class="table-wrap">' + table(rows, p) + '</div></div>' +

      conclusion(rows, c) +

      '<div class="provenance">' +
        '<span>赠品价值按官方价 / 同款售价折算后计入单价</span>' +
        '<span class="warn">未计入 88VIP、会员价等平台叠加规则</span>' +
      '</div>';

    el.hero.hidden = true;
    el.result.hidden = false;
    el.result.classList.remove('appear');
    void el.result.offsetWidth;
    el.result.classList.add('appear');
  }

  function showResult() {
    el.hero.hidden = true;
    el.result.hidden = false;
    el.result.classList.remove('appear');
    void el.result.offsetWidth;
    el.result.classList.add('appear');
  }

  function showEmpty(keyword) {
    el.result.innerHTML = emptyState(keyword);
    showResult();
  }

  function showHome() {
    el.result.hidden = true;
    el.result.innerHTML = '';
    el.hero.hidden = false;
    el.input.value = '';
    setActive('');
    state.current = null;
    state.picked = [];
  }

  /* ---------- 选择直播间（热度推荐） ---------- */
  function renderSelect(c) {
    state.current = c;
    /* 只有一条在播记录时无需选择，直接给出单条结果 */
    if (c.listings.length === 1) {
      state.picked = [0];
      render(c, [0]);
      return;
    }
    var order = c.listings
      .map(function (l, i) { return { l: l, idx: i }; })
      .sort(function (a, b) { return b.l.heat - a.l.heat; });
    var maxHeat = order[0].l.heat;
    state.picked = order.slice(0, 3).map(function (o) { return o.idx; });

    var rowsHTML = order.map(function (o, i) {
      var l = o.l;
      var checked = state.picked.indexOf(o.idx) > -1;
      return '' +
        '<div class="pick-row' + (checked ? ' is-checked' : '') + (i < 3 ? ' is-top' : '') + '" data-idx="' + o.idx + '">' +
          '<span class="pick-rank">' + (i + 1) + '</span>' +
          '<div class="pick-main">' +
            '<div class="pick-name">' + esc(l.channel) +
              (l.official ? VERIFIED : '') +
              (i < 3 ? '<span class="rec-tag">热度推荐</span>' : '') +
            '</div>' +
            '<div class="pick-sub">' + esc(l.platform) + ' · 到手 ¥' + money(l.price) + ' · ' + esc(l.bundle.join(' ＋ ')) + '</div>' +
          '</div>' +
          '<div class="pick-heat">' +
            '<div class="heat-top"><span class="heat-num">' + l.heat + '</span><span class="heat-unit">热度</span></div>' +
            '<span class="heat-bar"><i style="width:' + Math.round(l.heat / maxHeat * 100) + '%"></i></span>' +
          '</div>' +
          '<span class="pick-check"></span>' +
        '</div>';
    }).join('');

    el.result.innerHTML = '' +
      '<div class="result-head">' +
        '<div class="left">' +
          '<button class="btn-back" data-action="back-home">' + ARROW + '返回</button>' +
          '<h2>选择直播间</h2>' +
        '</div>' +
        '<span class="stamp">同一时段在播 · 按热度推荐</span>' +
      '</div>' +
      '<div class="pick-card">' +
        rowsHTML +
        '<div class="pick-foot">' +
          '<span class="pick-count" id="pick-count"></span>' +
          '<button class="btn-primary" id="pick-go" data-action="compare">生成对比</button>' +
        '</div>' +
      '</div>';

    updatePickCount();
    showResult();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updatePickCount(deny) {
    var count = state.picked.length;
    var countEl = document.getElementById('pick-count');
    var go = document.getElementById('pick-go');
    if (countEl) {
      countEl.innerHTML = '已选 <b>' + count + '</b> / 3' + (count < 2 ? ' · 至少选 2 个才能对比' : '');
      countEl.classList.toggle('over', !!deny);
    }
    if (go) go.disabled = count < 2;
  }

  function isLinkKeyword(kw) {
    /* 商品链接与分享口令类关键词，须绝对优先于普通文字关键词 */
    return kw.indexOf('http') === 0 || kw.indexOf('##') === 0 || kw.indexOf('douyin.com') > -1 ||
           kw.indexOf('taobao.com') > -1 || kw.indexOf('tmall.com') > -1 || kw.indexOf('jd.com') > -1;
  }

  function findCase(text) {
    var t = String(text || '').toLowerCase();
    if (!t) return null;
    /* 第一步：链接/口令精确匹配，一票定案 */
    for (var i = 0; i < CASES.length; i++) {
      var c = CASES[i];
      for (var k = 0; k < c.keywords.length; k++) {
        var lk = String(c.keywords[k]).toLowerCase();
        if (lk && isLinkKeyword(lk) && t.indexOf(lk) > -1) return c;
      }
    }
    /* 第二步：普通文字关键词，命中最长者优先，避免同品牌多商品互相抢匹配 */
    var hit = null, hitLen = -1;
    for (var i = 0; i < CASES.length; i++) {
      var c = CASES[i];
      for (var k = 0; k < c.keywords.length; k++) {
        var kw = String(c.keywords[k]).toLowerCase();
        if (kw && !isLinkKeyword(kw) && t.indexOf(kw) > -1 && kw.length > hitLen) {
          hit = c;
          hitLen = kw.length;
        }
      }
    }
    return hit;
  }

  function setActive(id) {
    Array.prototype.forEach.call(el.samples, function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-sample') === id);
    });
  }

  function openCase(id) {
    var c = null;
    for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) c = CASES[i];
    setActive(id);
    if (!c) { showEmpty(''); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    el.input.value = 'https://haohuo.example.com/live/' + c.id + '/30215';
    renderSelect(c);
  }

  /* ---------- 事件 ---------- */
  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = el.input.value.trim();
    if (!v) {
      el.form.classList.remove('shake');
      void el.form.offsetWidth;
      el.form.classList.add('shake');
      el.input.focus();
      return;
    }
    var c = findCase(v);
    setActive(c ? c.id : '');
    if (c) renderSelect(c); else showEmpty(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  Array.prototype.forEach.call(el.samples, function (btn) {
    btn.addEventListener('click', function () {
      openCase(btn.getAttribute('data-sample'));
    });
  });

  el.result.addEventListener('click', function (e) {
    var backHome = e.target.closest('[data-action="back-home"]');
    if (backHome) {
      showHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      el.input.focus();
      return;
    }
    var backSelect = e.target.closest('[data-action="back-select"]');
    if (backSelect && state.current) {
      renderSelect(state.current);
      return;
    }
    var compare = e.target.closest('[data-action="compare"]');
    if (compare) {
      if (state.picked.length >= 2) render(state.current, state.picked.slice());
      return;
    }
    var row = e.target.closest('.pick-row');
    if (row) {
      var idx = parseInt(row.getAttribute('data-idx'), 10);
      var pos = state.picked.indexOf(idx);
      if (pos > -1) {
        state.picked.splice(pos, 1);
        row.classList.remove('is-checked');
        updatePickCount();
      } else if (state.picked.length >= 3) {
        row.classList.remove('deny');
        void row.offsetWidth;
        row.classList.add('deny');
        updatePickCount(true);
      } else {
        state.picked.push(idx);
        row.classList.add('is-checked');
        updatePickCount();
      }
      return;
    }
    var sample = e.target.closest('[data-sample]');
    if (sample) openCase(sample.getAttribute('data-sample'));
  });

  document.querySelector('.brand').addEventListener('click', function () {
    showHome();
  });

  var navRules = document.querySelector('a[href="#rules"]');
  if (navRules) {
    navRules.addEventListener('click', function (e) {
      e.preventDefault();
      showHome();
      var rules = document.getElementById('rules');
      if (rules) rules.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  var navResult = document.getElementById('nav-result');
  if (navResult) {
    navResult.addEventListener('click', function (e) {
      e.preventDefault();
      openCase('loreal');
    });
  }

  /* 首页：近期性价比之王轮番显隐 */
  var winners = Array.prototype.slice.call(document.querySelectorAll('.vcard.winner'));
  var vdots = Array.prototype.slice.call(document.querySelectorAll('.vdots i'));
  if (winners.length > 1) {
    var wIdx = 0;
    var showWinner = function (i) {
      winners.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
      vdots.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
    };
    showWinner(0);
    setInterval(function () {
      winners[wIdx].classList.remove('is-on');
      if (vdots[wIdx]) vdots[wIdx].classList.remove('is-on');
      var next = (wIdx + 1) % winners.length;
      setTimeout(function () {
        wIdx = next;
        showWinner(next);
      }, 340);
    }, 2800);
  }

  /* 支持 ?demo=loreal / ?demo=dove / ?demo=empty 直接预览；加 &go=1 直接看对比结果 */
  var params = new URLSearchParams(location.search);
  var demo = params.get('demo');
  if (demo) {
    openCase(demo);
    if (params.get('go') && state.current) render(state.current, state.picked.slice());
  }
})();
