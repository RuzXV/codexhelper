document.addEventListener('DOMContentLoaded', function() {
    const mailInput = document.getElementById('mail-input');
    const mailPreview = document.getElementById('mail-preview');
    const copyBtn = document.getElementById('copy-btn');
    const previewContainer = document.getElementById('mail-preview-container');

    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const sizeSelect = document.getElementById('size-select');
    const colorSelect = document.getElementById('color-select');
    const gradientBtn = document.getElementById('gradient-btn');

    const hiddenColorPicker = document.createElement('input');
    hiddenColorPicker.type = 'color';
    hiddenColorPicker.style.display = 'none';
    document.body.appendChild(hiddenColorPicker);

    const gradientModal = document.getElementById('gradient-modal');
    const applyGradientBtn = document.getElementById('apply-gradient-btn');
    const cancelGradientBtn = document.getElementById('cancel-gradient-btn');

    const templateGallery = document.getElementById('template-gallery');
    const loadTemplateBtn = document.getElementById('load-template-btn');
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('filter-panel');
    const filterOptionsContainer = document.getElementById('filter-options');
    const filterResetBtn = document.getElementById('filter-reset-btn');

    let templates = [];
    let selectedTemplate = null;

    function applyTag(tag, value = null) {
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(start, end);

        if (!selectedText) return;

        let replacement;
        if (value) {
            replacement = `<${tag}=${value}>${selectedText}</${tag}>`;
        } else {
            replacement = `<${tag}>${selectedText}</${tag}>`;
        }
        mailInput.value = mailInput.value.substring(0, start) + replacement + mailInput.value.substring(end);
        updatePreview();
    }

    function updatePreview() {
        let text = mailInput.value;
        text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        text = text.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gis, '<strong>$1</strong>');
        text = text.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gis, '<em></em>');
        text = text.replace(/&lt;size=(\d+)&gt;(.*?)&lt;\/size&gt;/gis, '<span style="font-size: $1px;">$2</span>');
        
        text = text.replace(/&lt;color=([a-zA-Z0-9#]+)&gt;(.*?)&lt;\/color&gt;/gis, (match, colorValue, content) => {
            return `<span style="color: ${colorValue};">${content}</span>`;
        });
        
        mailPreview.innerHTML = text.replace(/\n/g, '<br>');
    }

    function openGradientModal() { gradientModal.classList.add('visible'); }
    function closeGradientModal() { gradientModal.classList.remove('visible'); }

    function applyGradient() {
        const startColor = document.getElementById('gradient-color-1').value;
        const endColor = document.getElementById('gradient-color-2').value;
        const startPos = mailInput.selectionStart;
        const endPos = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(startPos, endPos);

        if (!selectedText) {
            closeGradientModal();
            return;
        }

        const gradientTags = generateGradientTags(selectedText, startColor, endColor);
        mailInput.value = mailInput.value.substring(0, startPos) + gradientTags + mailInput.value.substring(endPos);
        updatePreview();
        closeGradientModal();
    }

    function generateGradientTags(text, color1, color2) {
        const cleanText = text.replace(/<[^>]*>/g, "");
        const len = cleanText.length;
        if (len <= 1) return `<color=${color1}>${cleanText}</color>`;
        
        const start = hexToRgb(color1);
        const end = hexToRgb(color2);
        let output = '';

        for (let i = 0; i < len; i++) {
            const ratio = len === 1 ? 0 : i / (len - 1);
            const r = Math.round(start.r + ratio * (end.r - start.r));
            const g = Math.round(start.g + ratio * (end.g - start.g));
            const b = Math.round(start.b + ratio * (end.b - start.b));
            const char = cleanText[i];
            
            if (char === ' ' || char === '\n') {
                output += char;
            } else {
                output += `<color=${rgbToHex(r, g, b)}>${char}</color>`;
            }
        }
        return output;
    }

    async function setupTemplatesAndFilters() {
        try {
            const response = await fetch('/tools/templates.json');
            if (!response.ok) throw new Error('Network response was not ok');
            templates = await response.json();
            populateFilters();
            renderTemplates();
        } catch (error) {
            templateGallery.innerHTML = '<p class="error-message">Could not load templates.</p>';
            console.error('Failed to load templates:', error);
        }
    }

    function populateFilters() {
        const filters = templates.reduce((acc, t) => {
            (t.tags || []).forEach(tag => {
                const [category, value] = tag.split(':');
                if (!category || !value) return;
                const catKey = category.toLowerCase();
                if (!acc[catKey]) acc[catKey] = new Set();
                acc[catKey].add(value);
            });
            return acc;
        }, {});

        Object.keys(filters).sort().forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'filter-category';
            categoryDiv.innerHTML = `<h5>${category.replace('_', ' ')}</h5>`;
            
            Array.from(filters[category]).sort().forEach(value => {
                 const label = document.createElement('label');
                 label.className = 'filter-option';
                 label.innerHTML = `<input type="checkbox" data-category="${category}" value="${value}"> ${value}`;
                 categoryDiv.appendChild(label);
            });
            filterOptionsContainer.appendChild(categoryDiv);
        });

        filterOptionsContainer.addEventListener('change', () => renderTemplates());
    }

    function renderTemplates() {
        const activeFilters = getActiveFilters();
        
        templates.forEach((template, index) => {
            let item = templateGallery.querySelector(`[data-index='${index}']`);
            const isVisible = checkVisibility(template.tags, activeFilters);

            if (!item) {
                item = document.createElement('div');
                item.className = 'template-item';
                item.dataset.index = index;
                item.innerHTML = `
                    <img src="${template.image}" alt="${template.title} preview" onerror="this.style.display='none'">
                    <h4>${template.title}</h4>
                `;
                item.addEventListener('click', () => {
                    document.querySelectorAll('.template-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedTemplate = template;
                    loadTemplateBtn.disabled = false;
                });
                templateGallery.appendChild(item);
            }

            setTimeout(() => {
                item.classList.toggle('hidden', !isVisible);
            }, 0);
        });
    }

    function getActiveFilters() {
        const active = {};
        filterOptionsContainer.querySelectorAll('input:checked').forEach(input => {
            const category = input.dataset.category;
            if (!active[category]) active[category] = [];
            active[category].push(input.value);
        });
        return active;
    }

    function checkVisibility(templateTags, activeFilters) {
        if (Object.keys(activeFilters).length === 0) return true;
        
        return Object.keys(activeFilters).every(category => {
            const requiredTags = activeFilters[category];
            const templateTagsInCategory = (templateTags || [])
                .filter(t => t.startsWith(category + ':'))
                .map(t => t.split(':')[1]);
            
            return requiredTags.some(reqTag => templateTagsInCategory.includes(reqTag));
        });
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    boldBtn.addEventListener('click', () => applyTag('b'));
    italicBtn.addEventListener('click', () => applyTag('i'));
    sizeSelect.addEventListener('change', () => {
        if (sizeSelect.value) applyTag('size', sizeSelect.value);
        sizeSelect.selectedIndex = 0;
    });

    colorSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value === 'custom') {
            hiddenColorPicker.click();
        } else if (value) {
            applyTag('color', value);
        }
        e.target.selectedIndex = 0;
    });

    hiddenColorPicker.addEventListener('change', (e) => {
        applyTag('color', e.target.value);
    });

    gradientBtn.addEventListener('click', openGradientModal);

    applyGradientBtn.addEventListener('click', applyGradient);
    cancelGradientBtn.addEventListener('click', closeGradientModal);
    gradientModal.addEventListener('click', (e) => {
        if (e.target === gradientModal) closeGradientModal();
    });

    mailInput.addEventListener('input', updatePreview);
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(mailInput.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
        });
    });

    loadTemplateBtn.addEventListener('click', () => {
        if (selectedTemplate) {
            mailInput.value = selectedTemplate.content;
            updatePreview();
        }
    });

    filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterPanel.classList.toggle('visible');
    });

    filterResetBtn.addEventListener('click', () => {
        filterOptionsContainer.querySelectorAll('input:checked').forEach(i => i.checked = false);
        renderTemplates();
    });

    document.addEventListener('click', (e) => {
        if (!filterPanel.contains(e.target) && e.target !== filterToggleBtn) {
            filterPanel.classList.remove('visible');
        }
    });

    updatePreview();
    setupTemplatesAndFilters();
});