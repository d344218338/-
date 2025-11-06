(() => {
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const templateSelect = document.getElementById('templateSelect');
  const dynamicFields = document.getElementById('dynamicFields');
  const contentInput = document.getElementById('contentInput');
  const pasteButton = document.getElementById('pasteButton');
  const refreshButton = document.getElementById('refreshButton');
  const downloadButton = document.getElementById('downloadButton');
  const canvasInfo = document.getElementById('canvasInfo');

  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;

  const defaultState = () => ({
    templateId: 'news_daily',
    fields: {},
    content: '',
  });

  const formatDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  };

  const templates = {
    news_daily: {
      name: '今日新闻速递',
      description: '适合资讯快报、热点总结，顶部渐变搭配重点摘要。',
      fields: [
        { id: 'headline', label: '主标题', type: 'text', default: '今日新闻速览' },
        { id: 'tagline', label: '导语', type: 'text', default: '一手掌握今日资讯亮点' },
        { id: 'date', label: '日期', type: 'text', default: formatDate() },
      ],
      render: ({ ctx, canvas, fields, contentLines }) => {
        const { width, height } = canvas;
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // Background layers
        ctx.fillStyle = '#f6f8ff';
        ctx.fillRect(0, 0, width, height);

        const headerHeight = height * 0.4;
        const gradient = ctx.createLinearGradient(0, 0, width, headerHeight);
        gradient.addColorStop(0, '#3143d0');
        gradient.addColorStop(1, '#7080ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, headerHeight);

        // Decorative overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const overlayWidth = width * 0.8;
        ctx.beginPath();
        ctx.moveTo(width - overlayWidth, headerHeight * 0.25);
        ctx.lineTo(width - overlayWidth * 0.2, headerHeight * 0.05);
        ctx.lineTo(width - overlayWidth * 0.05, headerHeight * 0.8);
        ctx.lineTo(width - overlayWidth * 0.85, headerHeight);
        ctx.closePath();
        ctx.fill();

        // Headline
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 96px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        let cursorY = 190;
        cursorY = wrapText(ctx, fields.headline, width * 0.12, cursorY, width * 0.76, 108);

        // Tagline
        ctx.font = '500 48px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        cursorY += 32;
        cursorY = wrapText(ctx, fields.tagline, width * 0.12, cursorY, width * 0.7, 64);

        // Date pill
        const dateText = fields.date || formatDate();
        ctx.font = '600 40px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        const metrics = ctx.measureText(dateText);
        const pillWidth = metrics.width + 80;
        const pillHeight = 70;
        const pillX = width * 0.12;
        const pillY = headerHeight - pillHeight - 40;
        drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 35, 'rgba(255,255,255,0.18)');
        ctx.fillStyle = '#ffffff';
        ctx.fillText(dateText, pillX + 40, pillY + pillHeight / 2 + 14);

        // Body container
        const bodyTop = headerHeight - 20;
        const bodyHeight = height - bodyTop - 140;
        drawRoundedRect(ctx, 80, bodyTop, width - 160, bodyHeight, 42, '#ffffff');

        // Accent bar
        drawRoundedRect(ctx, 80, bodyTop, 24, bodyHeight, 18, '#ff6b6b');

        // Content
        let bodyY = bodyTop + 120;
        const bodyX = 140;
        const lineHeight = 64;
        ctx.font = '600 54px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#1f2430';

        if (contentLines.length === 0) {
          ctx.fillStyle = '#9aa0b4';
          ctx.font = '500 48px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          wrapText(ctx, '在上方粘贴内容，我们会自动为你分段生成资讯要点。', bodyX, bodyY, width - 240, lineHeight);
        } else {
          contentLines.forEach((line, index) => {
            const bulletY = bodyY - 40;
            const bulletText = String(index + 1).padStart(2, '0');
            drawRoundedRect(ctx, bodyX - 100, bulletY - 18, 72, 60, 28, '#4053fc');
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 40px "Noto Sans SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(bulletText, bodyX - 82, bulletY + 20);

            ctx.fillStyle = '#1f2430';
            ctx.font = '600 48px "Noto Sans SC", "Microsoft YaHei", sans-serif';
            bodyY = wrapText(ctx, line, bodyX, bodyY, width - 260, lineHeight) + 28;
          });
        }

        ctx.restore();
      },
    },
    industry_share: {
      name: '行业文献分享',
      description: '深色底图，适合报告摘要、文献笔记与行业洞察。',
      fields: [
        { id: 'title', label: '主题', type: 'text', default: '行业深度精选' },
        { id: 'source', label: '来源/作者', type: 'text', default: '来源：XX研究院' },
        { id: 'cta', label: '行动号召', type: 'text', default: '扫码查看更多洞察' },
      ],
      render: ({ ctx, canvas, fields, contentLines }) => {
        const { width, height } = canvas;
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#2f3e5c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Accent polygon
        ctx.fillStyle = 'rgba(20, 184, 166, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.28);
        ctx.lineTo(width * 0.6, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, height * 0.18);
        ctx.closePath();
        ctx.fill();

        // Title block
        ctx.fillStyle = '#ecfeff';
        ctx.font = '800 90px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        let cursorY = 180;
        cursorY = wrapText(ctx, fields.title, width * 0.1, cursorY, width * 0.72, 110);

        ctx.font = '500 42px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
        cursorY += 30;
        cursorY = wrapText(ctx, fields.source, width * 0.1, cursorY, width * 0.65, 60);

        // Body panel
        const panelX = width * 0.08;
        const panelY = cursorY + 40;
        const panelWidth = width * 0.84;
        const panelHeight = height - panelY - 240;
        drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 36, 'rgba(15, 23, 42, 0.85)');
        drawRoundedRect(ctx, panelX, panelY, 10, panelHeight, 20, '#14b8a6');

        let bodyY = panelY + 120;
        const lineHeight = 58;
        const bodyX = panelX + 60;
        if (contentLines.length === 0) {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
          ctx.font = '500 46px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          wrapText(ctx, '粘贴段落或要点，我们会自动按照条目编号展示，适合行业分享与读书笔记。', bodyX, bodyY, panelWidth - 120, lineHeight);
        } else {
          contentLines.forEach((line, index) => {
            const number = index + 1;
            const badge = String(number).padStart(2, '0');
            ctx.fillStyle = 'rgba(20, 184, 166, 0.18)';
            drawRoundedRect(ctx, bodyX - 40, bodyY - 52, 120, 70, 28, 'rgba(20,184,166,0.18)');
            ctx.fillStyle = '#5eead4';
            ctx.font = '700 40px "Noto Sans SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(badge, bodyX - 10, bodyY - 10);

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '500 46px "Noto Sans SC", "Microsoft YaHei", sans-serif';
            bodyY = wrapText(ctx, line, bodyX + 90, bodyY, panelWidth - 200, lineHeight) + 36;
          });
        }

        // CTA pill
        const ctaText = fields.cta || '';
        if (ctaText) {
          ctx.font = '600 46px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          const textWidth = ctx.measureText(ctaText).width;
          const pillWidth = Math.min(panelWidth - 80, textWidth + 120);
          const pillX = panelX + (panelWidth - pillWidth) / 2;
          const pillY = panelY + panelHeight - 120;
          drawRoundedRect(ctx, pillX, pillY, pillWidth, 90, 45, 'rgba(14, 165, 233, 0.28)');
          ctx.fillStyle = '#bae6fd';
          ctx.fillText(ctaText, pillX + (pillWidth - textWidth) / 2, pillY + 58);
        }

        ctx.restore();
      },
    },
    memo_card: {
      name: '灵感便签海报',
      description: '柔和莫兰迪配色，适合金句分享、心得总结与待办清单。',
      fields: [
        { id: 'title', label: '标题', type: 'text', default: '灵感手记' },
        { id: 'highlight', label: '高亮提示', type: 'text', default: 'Keep Curiosity Alive' },
        { id: 'footer', label: '署名/日期', type: 'text', default: formatDate() },
      ],
      render: ({ ctx, canvas, fields, contentLines }) => {
        const { width, height } = canvas;
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // Background with soft gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f7ede2');
        gradient.addColorStop(0.5, '#f6f1f1');
        gradient.addColorStop(1, '#e8f1f5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Shadowed card
        const cardX = width * 0.08;
        const cardY = height * 0.12;
        const cardWidth = width * 0.84;
        const cardHeight = height * 0.76;
        drawCardWithShadow(ctx, cardX, cardY, cardWidth, cardHeight, 46, '#ffffff', 'rgba(31, 41, 55, 0.12)');

        // Title tag
        const title = fields.title || '灵感手记';
        ctx.fillStyle = '#525252';
        ctx.font = '700 72px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        let cursorY = cardY + 160;
        cursorY = wrapText(ctx, title, cardX + 80, cursorY, cardWidth - 160, 86);

        // Highlight ribbon
        const highlight = fields.highlight || '';
        if (highlight) {
          ctx.font = '600 40px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          const highlightWidth = ctx.measureText(highlight).width + 160;
          const ribbonWidth = Math.min(cardWidth - 160, highlightWidth);
          const ribbonX = cardX + 80;
          const ribbonY = cursorY + 24;
          drawRibbon(ctx, ribbonX, ribbonY, ribbonWidth, 70, '#ffb4a2');
          ctx.fillStyle = '#4a2511';
          ctx.fillText(highlight, ribbonX + 80, ribbonY + 50);
          cursorY = ribbonY + 120;
        }

        // Content lines as checklist
        const startX = cardX + 120;
        let lineY = cursorY + 20;
        const lineHeight = 60;
        if (contentLines.length === 0) {
          ctx.fillStyle = '#8b8f99';
          ctx.font = '500 44px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          wrapText(ctx, '将重点或待办事项逐条粘贴，这里会自动生成勾选风格的清单。', startX, lineY, cardWidth - 240, lineHeight);
        } else {
          contentLines.forEach((line) => {
            ctx.fillStyle = '#c5dedd';
            drawRoundedRect(ctx, startX - 80, lineY - 44, 48, 48, 12, '#c5dedd');
            ctx.strokeStyle = '#2a9d8f';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(startX - 62, lineY - 18);
            ctx.lineTo(startX - 44, lineY + 2);
            ctx.lineTo(startX - 20, lineY - 36);
            ctx.stroke();

            ctx.fillStyle = '#4a4a4a';
            ctx.font = '500 46px "Noto Sans SC", "Microsoft YaHei", sans-serif';
            lineY = wrapText(ctx, line, startX, lineY, cardWidth - 220, lineHeight) + 32;
          });
        }

        // Footer note
        const footer = fields.footer || '';
        if (footer) {
          ctx.fillStyle = '#8d99ae';
          ctx.font = '500 40px "Noto Sans SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(footer, cardX + 80, cardY + cardHeight - 80);
        }

        ctx.restore();
      },
    },
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    const paragraphs = String(text).split(/\n+/);
    paragraphs.forEach((paragraph, index) => {
      let line = '';
      for (const char of paragraph) {
        const testLine = line + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, x, y);
          line = char.trim() ? char : '';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
      }
      if (index !== paragraphs.length - 1) {
        y += lineHeight * 0.4;
      }
    });
    return y;
  }

  function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  function drawCardWithShadow(ctx, x, y, width, height, radius, fill, shadowColor) {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 30;
    drawRoundedRect(ctx, x, y, width, height, radius, fill);
    ctx.restore();
  }

  function drawRibbon(ctx, x, y, width, height, color) {
    const ribbonHeight = height;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - 50, y + ribbonHeight);
    ctx.lineTo(x - 50, y + ribbonHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function getContentLines(rawText) {
    return rawText
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function persistState(state) {
    if (!storage) return;
    storage.set({ textPosterState: state }).catch?.(() => {});
  }

  function loadState() {
    return new Promise((resolve) => {
      if (!storage) {
        resolve(defaultState());
        return;
      }
      storage.get(['textPosterState'], (data) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(defaultState());
          return;
        }
        resolve({ ...defaultState(), ...data.textPosterState });
      });
    });
  }

  function populateTemplates(currentId) {
    templateSelect.innerHTML = '';
    Object.entries(templates).forEach(([id, tpl]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${tpl.name} · ${tpl.description}`;
      if (id === currentId) option.selected = true;
      templateSelect.appendChild(option);
    });
  }

  function renderDynamicFields(state) {
    dynamicFields.innerHTML = '';
    const tpl = templates[state.templateId];
    if (!tpl) return;
    const group = document.createElement('div');
    group.className = 'dynamic-group';
    tpl.fields.forEach((field) => {
      const value = state.fields[field.id] ?? field.default ?? '';
      state.fields[field.id] = value;
      const wrapper = document.createElement('label');
      wrapper.className = 'field';

      const title = document.createElement('span');
      title.textContent = field.label;
      wrapper.appendChild(title);

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }
      input.value = value;
      input.dataset.fieldId = field.id;
      input.addEventListener('input', () => {
        state.fields[field.id] = input.value;
        persistState(state);
        renderCanvas(state);
      });
      wrapper.appendChild(input);
      group.appendChild(wrapper);
    });
    dynamicFields.appendChild(group);
  }

  function renderCanvas(state) {
    const tpl = templates[state.templateId] || templates.news_daily;
    const contentLines = getContentLines(state.content);
    tpl.render({ ctx, canvas, fields: state.fields, contentLines });
  }

  function attachEvents(state) {
    templateSelect.addEventListener('change', () => {
      state.templateId = templateSelect.value;
      renderDynamicFields(state);
      persistState(state);
      renderCanvas(state);
    });

    contentInput.addEventListener('input', () => {
      state.content = contentInput.value;
      persistState(state);
      renderCanvas(state);
    });

    refreshButton.addEventListener('click', () => {
      renderCanvas(state);
    });

    pasteButton.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          contentInput.value = text;
          state.content = text;
          persistState(state);
          renderCanvas(state);
        }
      } catch (error) {
        alert('无法访问剪贴板，请确认已授权或手动粘贴。');
      }
    });

    downloadButton.addEventListener('click', () => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const tpl = templates[state.templateId];
        const headline = state.fields.headline || state.fields.title || 'poster';
        const fileName = `${headline.replace(/[^\u4e00-\u9fa5\w]+/g, '_')}.png`;
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    });
  }

  canvasInfo.textContent = `${canvas.width} × ${canvas.height}`;

  loadState().then((state) => {
    if (!state.content) {
      state.content = '要点一：结构化整理资讯亮点。\n要点二：支持多种主题模板。\n要点三：生成高清 PNG，方便分享。';
    }
    populateTemplates(state.templateId);
    renderDynamicFields(state);
    contentInput.value = state.content;
    attachEvents(state);
    renderCanvas(state);
  });
})();
