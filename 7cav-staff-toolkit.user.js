// ==UserScript==
// @name         7Cav Staff Response Toolkit
// @namespace    https://github.com/bellers82/7cav-staff-toolkit
// @version      0.3.1
// @description  LOI reply templates for direct messages only.
// @match        https://7cav.us/direct-messages/*
// @updateURL    https://raw.githubusercontent.com/bellers82/7cav-staff-toolkit/main/7cav-staff-toolkit.user.js
// @downloadURL  https://raw.githubusercontent.com/bellers82/7cav-staff-toolkit/main/7cav-staff-toolkit.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  const isDM = /^\/direct-messages\/\d+\/?$/.test(location.pathname);
  if (!isDM) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clean = value => (value || '').trim();
  const userName = () => clean($('.p-navgroup-link--user .p-navgroup-linkText')?.textContent)
    || clean($('.p-navgroup-link--user')?.getAttribute('title'));
  const userId = () => $('.p-navgroup-link--user [data-user-id]')?.getAttribute('data-user-id');
  const author = message => clean($('.message-user .message-name .username', message)?.textContent);
  const positions = root => $$('.message-user .userBanner--cav-pos strong', root).map(el => clean(el.textContent));
  const hqPositions = items => [...new Set(items.filter(item => /\bHQ\b/i.test(item)))];
  const messages = () => $$('.message').filter(message => $('.message-user .message-name .username', message));
  const staffPositionsOnPage = () => {
    const name = userName();
    const mine = messages().filter(message => author(message) === name);
    return hqPositions(mine.flatMap(positions));
  };
  const firstPage = () => {
    const currentPage = $('.pageNav-page--current')?.textContent?.trim();
    return (!currentPage || currentPage === '1') && !/[?&]page=(?:[2-9]|[1-9]\d+)/.test(location.search) && !/\/page-(?:[2-9]|[1-9]\d+)\/?$/.test(location.pathname);
  };
  const applicantOnPage = () => firstPage() ? author(messages()[0]) : '';
  const roleNames = { ASL:'Assistant Section Leader', SL:'Section Leader', PSG:'Platoon Sergeant', PL:'Platoon Leader', '1SG':'First Sergeant', XO:'Executive Officer', CO:'Commanding Officer' };
  const templates = {
    first: (person, role, staff, staffPosition, interviewTimes) => `Dear $${person},\n\nThank you for submitting your Letter of Interest for the position of [B]${role}[/B].\n\nAs part of the selection process, we will be reviewing your application and conducting interviews to discuss your interest in the position, your experience, your leadership approach, and what you would bring to the unit.\n\nInterviews can be held at the following times:\n${interviewTimes || '[Enter interview availability]'}\n\nPlease get back to us with a time within the windows listed above that works best for you, and we will confirm the interview time once received.\n\nRegards,\n$${staff}\n${staffPosition}`,
    accepted: (person, role, staff, staffPosition) => `Dear $${person},\n\nThank you for submitting your Letter of Interest for the position of [B]${role}[/B] and for taking the time to participate in the selection process.\n\nAfter careful consideration, we are pleased to inform you that your application has been [B]successful[/B], and you have been selected for the position of [B]${role}[/B].\n\nWe appreciate your willingness to take on additional responsibilities and look forward to working with you in your new leadership role.\n\nFurther information regarding your appointment and the next steps will be communicated to you shortly.\n\nCongratulations!\n\nRegards,\n$${staff}\n${staffPosition}`,
    declined: (person, role, staff, staffPosition) => `Dear $${person},\n\nThank you for submitting your Letter of Interest for the position of [B]${role}[/B] and for taking the time to participate in the selection process.\n\nAfter careful consideration, we regret to inform you that your application has been [B]unsuccessful[/B] on this occasion.\n\nWe appreciate the time and effort you have put into your application and your willingness to take on additional responsibilities within the unit.\n\nWe encourage you to continue developing your leadership skills and to consider applying for future leadership opportunities.\n\nShould you wish to receive feedback regarding your application, please do not hesitate to reach out.\n\nRegards,\n$${staff}\n${staffPosition}`
  };
  const key = '7cav-toolkit-preferred-hq';
  const getSaved = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
  const save = (id, position) => { if (!id || !position) return; const obj = getSaved(); obj[id] = position; localStorage.setItem(key, JSON.stringify(obj)); };
  const make = (tag, attrs = {}, text = '') => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.textContent = text;
    return el;
  };
  const css = `#cav-loi-button{margin-left:6px;cursor:pointer}#cav-loi-panel{position:fixed;z-index:100000;top:12%;left:50%;transform:translateX(-50%);width:min(560px,92vw);max-height:80vh;overflow:auto;padding:18px;background:#252525;color:#f7f7f7;border:1px solid #777;border-radius:8px;box-shadow:0 10px 35px #0009;font:14px Arial,sans-serif}#cav-loi-panel label{display:block;margin-top:12px;font-weight:bold}#cav-loi-panel input,#cav-loi-panel select,#cav-loi-panel textarea{box-sizing:border-box;width:100%;padding:9px;margin-top:5px;background:#fff;color:#222;border:1px solid #aaa;border-radius:4px}#cav-loi-panel textarea{min-height:210px;resize:vertical}#cav-loi-panel button{padding:9px 13px;margin:10px 8px 0 0;cursor:pointer;border:1px solid #aaa;border-radius:4px}#cav-loi-panel .cav-warning{color:#ffd27b;font-size:12px;margin-top:8px}#cav-loi-shade{position:fixed;inset:0;background:#0008;z-index:99999}`;
  document.head.append(make('style', {}, css));
  async function profileHQ() {
    const id = userId();
    if (!id) return [];
    try {
      const response = await fetch(`/members/${encodeURIComponent(id)}/`, { credentials: 'same-origin' });
      if (!response.ok) return [];
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      // Only read position banners associated with the profile's member header, not other users' posts.
      const blocks = $$('.memberHeader .userBanner--cav-pos strong, .memberHeader-content .userBanner--cav-pos strong', doc);
      return hqPositions(blocks.map(node => clean(node.textContent)));
    } catch { return []; }
  }
  function insertEditor(text) {
    const plain = $('textarea[name="message"]');
    if (plain && plain.offsetParent !== null) {
      plain.value = text;
      plain.dispatchEvent(new Event('input', { bubbles: true }));
      plain.dispatchEvent(new Event('change', { bubbles: true }));
      plain.focus();
      return true;
    }
    const editor = $('.fr-element[contenteditable="true"], .fr-view[contenteditable="true"], [contenteditable="true"][role="textbox"]');
    if (!editor) return false;
    editor.focus();
    // Use the editor's own text insertion path, rather than overwriting its DOM/HTML.
    const inserted = document.execCommand('insertText', false, text);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return Boolean(inserted);
  }
  async function openPanel() {
    if ($('#cav-loi-panel')) return;
    const shade = make('div', { id: 'cav-loi-shade' });
    const panel = make('div', { id: 'cav-loi-panel', role: 'dialog', 'aria-label': 'LOI reply' });
    const heading = make('h3', {}, 'LOI Reply'); panel.append(heading);
    const field = (label, node) => { const wrapper = make('label', {}, label); wrapper.append(node); panel.append(wrapper); return node; };
    const applicant = field('Applicant (confirm against original LOI)', make('input', { type: 'text', placeholder: 'Applicant username' }));
    applicant.value = applicantOnPage();
    const staff = field('Staff name', make('input', { type: 'text', placeholder: 'Your username' })); staff.value = userName();
    const billet = field('HQ signature', make('select'));
    const manual = field('Manual HQ signature (if not detected)', make('input', { type: 'text', placeholder: 'e.g. 1/A/3-7 HQ' }));
    const position = field('Position applied for', make('select'));
    Object.entries(roleNames).forEach(([code, name]) => position.append(make('option', {value: code}, `${code} — ${name}`)));
    const interviewTimes = field('Interview availability (first response only)', make('textarea', { placeholder: '1500z-2100z during the week\n0800z-2359z during the weekend' }));
    interviewTimes.style.minHeight = '75px';
    const kind = field('Response', make('select'));
    [['first','First Response'],['accepted','Position Accepted'],['declined','Position Declined']].forEach(([value,label]) => { const opt=make('option',{value},label);kind.append(opt); });
    const preview = field('Editable message preview', make('textarea'));
    const warning = make('p', { class: 'cav-warning' }, 'Check the applicant and signature before inserting. Nothing is sent automatically.'); panel.append(warning);
    const close = () => { panel.remove(); shade.remove(); };
    const cancel = make('button', { type: 'button' }, 'Cancel'); cancel.addEventListener('click', close);
    const copy = make('button', { type: 'button' }, 'Copy message');
    copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(preview.value); copy.textContent='Copied!'; } catch { preview.select(); alert('Copy failed; select and copy the preview manually.'); } });
    const insert = make('button', { type: 'button' }, 'Insert into reply');
    insert.addEventListener('click', () => {
      if (!clean(applicant.value) || !clean(staff.value) || !clean(billet.value || manual.value)) { alert('Confirm the applicant, staff name and HQ signature first.'); return; }
      const position = billet.value || clean(manual.value);
      save(userId(), position);
      if (!insertEditor(preview.value)) { alert('Could not detect a compatible reply editor. Use Copy message and paste it manually.'); return; }
      close();
    });
    panel.append(insert, copy, cancel); shade.addEventListener('click', close);
    document.body.append(shade, panel);
    const found = hqPositions([...staffPositionsOnPage(), ...(await profileHQ())]);
    billet.append(make('option', { value: '' }, found.length ? 'Select HQ billet' : 'No HQ billet detected — enter manually'));
    found.forEach(position => billet.append(make('option', { value: position }, position)));
    const saved = getSaved()[userId()];
    if (found.includes(saved)) billet.value = saved;
    else if (found.length === 1) billet.value = found[0];
    else if (saved && !found.length) manual.value = saved;
    const refresh = () => {
      const name = clean(applicant.value) || '{Trooper}';
      const signature = billet.value || clean(manual.value) || '{HQ Position}';
      const staffName = clean(staff.value) || '{Staff Name}';
      const role = roleNames[position.value];
      interviewTimes.parentElement.style.display = kind.value === 'first' ? '' : 'none';
      preview.value = kind.value === 'first'
        ? templates.first(name, role, staffName, signature, clean(interviewTimes.value))
        : templates[kind.value](name, role, staffName, signature);
    };
    [applicant, staff, billet, manual, kind, position, interviewTimes].forEach(el => el.addEventListener('input', refresh));
    billet.addEventListener('change', () => { if (billet.value) manual.value = ''; refresh(); });
    manual.addEventListener('input', () => { if (clean(manual.value)) billet.value = ''; refresh(); });
    refresh();
    if (!applicant.value) warning.textContent = 'Applicant not confidently identified (possibly a later conversation page). Check the original LOI and enter the applicant manually.';
  }
  function mount() {
    if ($('#cav-loi-button')) return;
    const move = $('a.button--icon--move[href*="/direct-messages/"]');
    if (!move) return;
    const button = make('button', { id: 'cav-loi-button', type: 'button', class: 'button button--link' }, 'LOI Reply ▾');
    button.addEventListener('click', openPanel);
    move.insertAdjacentElement('afterend', button);
  }
  if (isDM) mount();
  const observer = new MutationObserver(() => { if (isDM && !$('#cav-loi-button')) mount(); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
