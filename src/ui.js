export function shouldShowRotateHint(width, height) {
  return height > width;
}

export function createHud(root, { onRestart, onNext, onSelectLevel, onToggleMute = () => {} }) {
  let topBar = null;
  let overlay = null;
  let rotateHint = null;

  function clearOverlay() {
    if (overlay) overlay.remove();
    overlay = null;
  }

  function el(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text) node.textContent = text;
    return node;
  }

  function showOverlay(build) {
    clearOverlay();
    overlay = el('div', { class: 'hud-overlay' });
    build(overlay);
    root.appendChild(overlay);
  }

  return {
    renderTopBar({ birdsLeft, levelIndex, muted = false }) {
      if (!topBar) {
        topBar = el('div', { class: 'hud-topbar' });
        root.appendChild(topBar);
      }
      topBar.textContent = '';
      const info = el('span', { class: 'hud-topbar-info' }, `关卡 ${levelIndex + 1} · 小鸟 ×${birdsLeft}`);
      const mute = el(
        'button',
        { 'data-testid': 'btn-mute', class: 'hud-btn hud-mute' },
        muted ? '声音:关' : '声音:开',
      );
      mute.addEventListener('click', () => onToggleMute());
      topBar.appendChild(info);
      topBar.appendChild(mute);
      topBar.style.display = '';
    },

    hideTopBar() {
      if (topBar) topBar.style.display = 'none';
    },

    showResult({ won, stars, hasNext }) {
      showOverlay((box) => {
        box.appendChild(el('h2', { class: 'hud-title' }, won ? '过关！' : '失败'));
        if (won) {
          const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          box.appendChild(el('div', { class: 'hud-stars' }, starText));
        }
        const row = el('div', { class: 'hud-buttons' });
        const restart = el('button', { 'data-testid': 'btn-restart', class: 'hud-btn' }, '重开');
        restart.addEventListener('click', () => onRestart());
        row.appendChild(restart);
        if (won && hasNext) {
          const next = el('button', { 'data-testid': 'btn-next', class: 'hud-btn hud-btn-primary' }, '下一关');
          next.addEventListener('click', () => onNext());
          row.appendChild(next);
        }
        const menu = el('button', { 'data-testid': 'btn-menu', class: 'hud-btn' }, '选关');
        menu.addEventListener('click', () => onSelectLevel(-1));
        row.appendChild(menu);
        box.appendChild(row);
      });
    },

    showLevelSelect({ levels, stars, unlocked }) {
      showOverlay((box) => {
        box.appendChild(el('h2', { class: 'hud-title' }, '选择关卡'));
        const list = el('div', { class: 'hud-levels' });
        for (let i = 0; i < levels; i++) {
          const filled = stars[i] ?? 0;
          const label = `第${i + 1}关 ${'★'.repeat(filled)}${'☆'.repeat(3 - filled)}`;
          const btn = el(
            'button',
            {
              'data-testid': `btn-level-${i}`,
              class: 'hud-btn hud-level',
              ...(unlocked[i] ? {} : { disabled: '' }),
            },
            label,
          );
          btn.addEventListener('click', () => {
            if (unlocked[i]) onSelectLevel(i);
          });
          list.appendChild(btn);
        }
        box.appendChild(list);
      });
    },

    hideOverlays() {
      clearOverlay();
    },

    showRotateHint(show) {
      if (!rotateHint) {
        rotateHint = el('div', { 'data-testid': 'rotate-hint', class: 'rotate-hint' }, '↻ 请横屏游玩');
        root.appendChild(rotateHint);
      }
      rotateHint.style.display = show ? 'flex' : 'none';
    },
  };
}
