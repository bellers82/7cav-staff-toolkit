// ==UserScript==
// @name         7Cav Staff Response Toolkit
// @namespace    https://github.com/
// @version      0.1.0
// @description  Insert reusable LOI response templates into XenForo conversation replies.
// @match        https://7cav.us/*
// @match        https://www.7cav.us/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const templates = [
    { label: 'First response', body: 'Thank you for submitting your Letter of Interest.\n\nWhat times would you be available for an interview? Please reply with your availability so we can arrange a suitable time.' },
    { label: 'Position accepted', body: 'Thank you for submitting your Letter of Interest.\n\nWe are pleased to confirm that you have been selected for the position. Further information will follow shortly.' },
    { label: 'Position declined', body: 'Thank you for submitting your Letter of Interest.\n\nUnfortunately, your application was not successful on this occasion. Thank you for your interest, and we encourage you to apply for future opportunities.' }
  ];

  const isConversation = () => /\/conversations\//i.test(location.pathname);

  function findToolbar() {
    const candidates = [...document.querySelectorAll('a, button')];
    const move = candidates.find(el => /^Move$/i.test(el.textContent.trim()));
    if (!move) return null;
    return move.closest('.buttonGroup, .block-outer-opposite, .block-outer, .pageAction, .p-title-pageAction') || move.parentElement;
  }

  function findEditor() {
    return document.querySelector('.fr-element[contenteditable="true"], .fr-view[contenteditable="true"], .tox-edit-area iframe, textarea[name="message"], textarea[name="message_html"], [contenteditable="true"][role="textbox"]');
  }

  function fillEditor(body) {
    const editor = findEditor();
    if (!editor) {
      alert('Reply editor not found. Open the reply box first, then select the template again.');
      return;
    }
    if (editor.tagName === 'IFRAME') {
      alert('This forum uses an iframe editor. Please copy the template manually until editor compatibility is added.');
      return;
    }
    if (editor.value !== undefined) {
      if (editor.value.trim() && !confirm('Replace the current reply draft?')) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(editor, body);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      if (editor.textContent.trim() && !confirm('Replace the current reply draft?')) return;
      editor.focus();
      editor.innerHTML = '';
      for (const paragraph of body.split('\n\n')) {
        const p = document.createElement('p');
        p.textContent = paragraph;
        editor.appendChild(p);
      }
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: body }));
    }
    editor.focus();
  }

  function mount() {
    if (!isConversation() || document.getElementById('cav-loi-toolkit')) return;
    const toolbar = findToolbar();
    if (!toolbar) return;
    const wrapper = document.createElement('span');
    wrapper.id = 'cav-loi-toolkit';
    wrapper.style.cssText = 'display:inline-flex;align-items:center;margin-left:8px;gap:4px;';
    const label = document.createElement('label');
    label.textContent = 'LOI Reply:';
    label.style.cssText = 'font-size:12px;font-weight:bold;';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'LOI reply template');
    select.style.cssText = 'background:#292929;color:#ffd23c;border:1px solid #777;padding:5px;max-width:210px;';
    const placeholder = new Option('Choose a response…', '');
    select.add(placeholder);
    templates.forEach((template, index) => select.add(new Option(template.label, String(index))));
    select.addEventListener('change', () => {
      if (!select.value) return;
      fillEditor(templates[Number(select.value)].body);
      select.value = '';
    });
    wrapper.append(label, select);
    toolbar.appendChild(wrapper);
  }

  mount();
  const observer = new MutationObserver(() => mount());
  observer.observe(document.body, { childList: true, subtree: true });
})();
