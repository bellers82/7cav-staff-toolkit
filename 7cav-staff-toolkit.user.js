// ==UserScript==
// @name         7Cav Staff Response Toolkit
// @namespace    https://github.com/bellers82/7cav-staff-toolkit
// @version      0.1.1
// @description  Quick reply templates for 7Cav direct messages. Never posts automatically.
// @match        https://7cav.us/direct-messages/*
// @updateURL    https://raw.githubusercontent.com/bellers82/7cav-staff-toolkit/main/7cav-staff-toolkit.user.js
// @downloadURL  https://raw.githubusercontent.com/bellers82/7cav-staff-toolkit/main/7cav-staff-toolkit.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  const TEMPLATES = {
    'First response': 'Thank you for submitting your Letter of Interest.\n\nWhat times would you be available for an interview? Please reply with your availability so we can arrange a suitable time.',
    'Position accepted': 'Thank you for submitting your Letter of Interest.\n\nWe are pleased to inform you that your application has been successful. Further details will follow shortly.',
    'Position declined': 'Thank you for taking the time to submit your Letter of Interest.\n\nUnfortunately, your application has not been successful on this occasion. We appreciate your interest and encourage you to apply for future opportunities.'
  };

  function insertIntoEditor(message) {
    const editor = document.querySelector('.fr-element[contenteditable="true"], .fr-view[contenteditable="true"], [contenteditable="true"][role="textbox"], textarea[name="message"], textarea[name="message_html"], textarea[name="message_body"]');
    if (!editor) {
      window.prompt('Reply editor not detected. Copy this template and paste it into the reply box:', message);
      return;
    }
    editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    editor.focus();
    if (editor.matches('textarea')) {
      editor.value = message;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Plain text only: never interpret template content as HTML.
      editor.replaceChildren();
      message.split('\n').forEach((line, index) => {
        if (index) editor.appendChild(document.createElement('br'));
        editor.appendChild(document.createTextNode(line));
      });
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function mount() {
    const move = document.querySelector('a.button--icon--move[href*="/direct-messages/"]');
    if (!move || document.getElementById('cav-loi-toolkit')) return;
    const wrap = document.createElement('span');
    wrap.id = 'cav-loi-toolkit';
    wrap.style.cssText = 'display:inline-flex;position:relative;vertical-align:middle;';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button--link';
    button.textContent = 'LOI Reply ▾';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Choose an LOI reply template');
    const menu = document.createElement('div');
    menu.hidden = true;
    menu.style.cssText = 'position:absolute;top:100%;right:0;min-width:190px;z-index:10000;background:#202020;border:1px solid #777;padding:4px;box-shadow:0 5px 15px #0008;';
    for (const [label, template] of Object.entries(TEMPLATES)) {
      const option = document.createElement('button');
      option.type = 'button';
      option.textContent = label;
      option.style.cssText = 'display:block;width:100%;text-align:left;padding:9px;color:#ffcb2b;background:transparent;border:0;cursor:pointer;';
      option.addEventListener('click', () => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        insertIntoEditor(template);
      });
      menu.appendChild(option);
    }
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      button.setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', (event) => {
      if (!wrap.contains(event.target)) {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
      }
    });
    wrap.append(button, menu);
    move.insertAdjacentElement('afterend', wrap);
  }

  mount();
  const observer = new MutationObserver(() => {
    if (!document.getElementById('cav-loi-toolkit')) mount();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
