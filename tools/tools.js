document.addEventListener('DOMContentLoaded', function() {
    const mailInput = document.getElementById('mail-input');
    const mailPreview = document.getElementById('mail-preview');
    const copyBtn = document.getElementById('copy-btn');
    const previewContainer = document.getElementById('mail-preview-container');

    const undoBtn = document.getElementById('undo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const boldItalicBtn = document.getElementById('bold-italic-btn');
    
    const customSizeOptions = document.getElementById('custom-size-options');
    const customColorOptions = document.getElementById('custom-color-options');

    const applyGradientBtn = document.getElementById('apply-gradient-btn');
    const gradientBiasSlider = document.getElementById('gradient-bias-slider');
    const gradientPreviewBar = document.getElementById('gradient-preview-bar');
    const gradientColor1 = document.getElementById('gradient-color-1');
    const gradientColor2 = document.getElementById('gradient-color-2');

    const hiddenColorPicker = document.createElement('input');
    hiddenColorPicker.type = 'color';
    hiddenColorPicker.style.display = 'none';
    document.body.appendChild(hiddenColorPicker);

    const generatorTabBtn = document.querySelector('.generator-tab-btn[data-tab="generator"]');
    const templatesTabBtn = document.querySelector('.generator-tab-btn[data-tab="templates"]');
    const generatorView = document.getElementById('generator-view');
    const templatesView = document.getElementById('templates-view');
    const previewTabBtns = document.querySelectorAll('.preview-tab-btn');

    const templateGallery = document.getElementById('template-gallery');
    const loadTemplateBtn = document.getElementById('load-template-btn');
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('filter-panel');
    const filterOptionsContainer = document.getElementById('filter-options');
    const filterResetBtn = document.getElementById('filter-reset-btn');

    const charCounter = document.getElementById('char-counter');
    let currentCharLimit = 2000;
    const CACHE_KEY = 'mailGeneratorCache';

    const magnifiedPreviewContainer = document.getElementById('magnified-preview-container');
    const magnifiedImage = document.getElementById('magnified-image');
    const magnifiedPlaceholder = document.getElementById('magnified-placeholder');
    const magnifiedTitle = document.getElementById('magnified-title');

    let templates = [];
    let selectedTemplate = null;
    let hoveredTemplate = null;
    let isLivePreviewingGradient = false;
    let gradientSelection = { start: 0, end: 0 };

    let historyStack = [];
    let historyIndex = -1;
    let inputTimeout = null;

    function saveState() {
        if (historyIndex < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyIndex + 1);
        }
        historyStack.push(mailInput.value);
        historyIndex++;
        updateUndoButton();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            mailInput.value = historyStack[historyIndex];
            updatePreview();
            updateUndoButton();
        }
    }

    function updateUndoButton() {
        undoBtn.disabled = historyIndex <= 0;
    }

    const cachedContent = localStorage.getItem(CACHE_KEY);
    if (cachedContent) {
        mailInput.value = cachedContent;
    }
    
    function applyTag(tag, value = null, closingTag = null) {
        saveState();
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(start, end);
        if (!selectedText) return;
        closingTag = closingTag || tag;
        let replacement = value ? `<${tag}=${value}>${selectedText}</${closingTag}>` : `<${tag}>${selectedText}</${closingTag}>`;
        mailInput.value = mailInput.value.substring(0, start) + replacement + mailInput.value.substring(end);
        updatePreview();
        saveState();
    }
    
    function applyDoubleTag(tag1, tag2) {
        saveState();
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(start, end);
        if (!selectedText) return;
        let replacement = `<${tag1}><${tag2}>${selectedText}</${tag2}></${tag1}>`;
        mailInput.value = mailInput.value.substring(0, start) + replacement + mailInput.value.substring(end);
        updatePreview();
        saveState();
    }

    function updatePreview(overrideText = null) {
        const text = overrideText !== null ? overrideText : mailInput.value;
        if (overrideText === null) {
            localStorage.setItem(CACHE_KEY, text);
        }
        const charCount = mailInput.value.length;
        charCounter.textContent = `${charCount}/${currentCharLimit}`;
        charCounter.style.color = charCount > currentCharLimit ? '#ff4d4d' : 'var(--text-secondary)';
        let previewText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        previewText = previewText.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gis, '<strong>$1</strong>');
        previewText = previewText.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gis, '<em>$1</em>');
        previewText = previewText.replace(/&lt;size=(\d+)&gt;(.*?)&lt;\/size&gt;/gis, '<span style="font-size: $1px;">$2</span>');
        previewText = previewText.replace(/&lt;color=([a-zA-Z0-9#]+)&gt;(.*?)&lt;\/color&gt;/gis, (match, colorValue, content) => {
            return `<span style="color: ${colorValue};">${content}</span>`;
        });
        mailPreview.innerHTML = previewText.replace(/\n/g, '<br>');
    }

    function closeAllDropdowns() {
        if (isLivePreviewingGradient) {
            isLivePreviewingGradient = false;
            updatePreview();
        }
        document.querySelectorAll('.custom-dropdown-options.visible').forEach(d => d.classList.remove('visible'));
    }
    
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.toolbar-btn');
        const options = dropdown.querySelector('.custom-dropdown-options');
        if (toggle && options) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = options.classList.contains('visible');
                closeAllDropdowns();
                if (!isVisible) {
                    options.classList.add('visible');
                    if (dropdown.id === 'custom-gradient-dropdown') {
                        gradientSelection.start = mailInput.selectionStart;
                        gradientSelection.end = mailInput.selectionEnd;
                        if (gradientSelection.start !== gradientSelection.end) {
                            isLivePreviewingGradient = true;
                            updateGradientUI();
                        }
                    }
                }
            });
            options.addEventListener('click', (e) => e.stopPropagation());
        }
    });

    customColorOptions.addEventListener('click', (e) => {
        const target = e.target.closest('.custom-option');
        if (!target) return;
        const value = target.dataset.value;
        if (value === 'custom') {
            hiddenColorPicker.click();
        } else {
            applyTag('color', value);
            closeAllDropdowns();
        }
    });

    hiddenColorPicker.addEventListener('change', (e) => {
        applyTag('color', e.target.value);
        closeAllDropdowns();
    });

    document.addEventListener('click', () => closeAllDropdowns());

    function applyGradient() {
        saveState();
        const startColor = gradientColor1.value;
        const endColor = gradientColor2.value;
        const bias = parseFloat(gradientBiasSlider.value);
        const startPos = mailInput.selectionStart;
        const endPos = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(startPos, endPos);
        if (!selectedText) {
            closeAllDropdowns();
            return;
        }
        const gradientTags = generateGradientTags(selectedText, startColor, endColor, bias);
        mailInput.value = mailInput.value.substring(0, startPos) + gradientTags + mailInput.value.substring(endPos);
        isLivePreviewingGradient = false;
        updatePreview();
        saveState();
        closeAllDropdowns();
    }

    function generateGradientTags(text, color1, color2, bias = 1) {
        const cleanText = text.replace(/<[^>]*>/g, "");
        const len = cleanText.length;
        if (len === 0) return "";
        if (len === 1) return `<color=${color1}>${cleanText}</color>`;
        const start = hexToRgb(color1);
        const end = hexToRgb(color2);
        let output = '';
        for (let i = 0; i < len; i++) {
            const linearRatio = i / (len - 1);
            const biasedRatio = Math.pow(linearRatio, bias);
            const r = Math.round(start.r + biasedRatio * (end.r - start.r));
            const g = Math.round(start.g + biasedRatio * (end.g - start.g));
            const b = Math.round(start.b + biasedRatio * (end.b - start.b));
            const char = cleanText[i];
            if (char === ' ' || char === '\n') {
                output += char;
            } else {
                output += `<color=${rgbToHex(r, g, b)}>${char}</color>`;
            }
        }
        return output;
    }

    function updateGradientUI() {
        const startColor = gradientColor1.value;
        const endColor = gradientColor2.value;
        gradientPreviewBar.style.background = `linear-gradient(to right, ${startColor}, ${endColor})`;

        if (isLivePreviewingGradient && gradientSelection.start !== gradientSelection.end) {
            const bias = parseFloat(gradientBiasSlider.value);
            const fullText = mailInput.value;
            const preSelection = fullText.substring(0, gradientSelection.start);
            const selection = fullText.substring(gradientSelection.start, gradientSelection.end);
            const postSelection = fullText.substring(gradientSelection.end);
            const gradientText = generateGradientTags(selection, startColor, endColor, bias);
            updatePreview(preSelection + gradientText + postSelection);
        }
    }

    async function setupTemplatesAndFilters() {
        try {
            const response = await fetch('/tools/templates.json');
            if (!response.ok) throw new Error('Network response was not ok');
            templates = await response.json();
            populateFilters();
            renderTemplates();
        } catch (error) {
            templateGallery.innerHTML = '<p class="error-message" style="color: var(--text-muted);">Could not load templates.</p>';
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
        filterOptionsContainer.innerHTML = '';
        
        const categoryOrder = ['format', 'type'];

        categoryOrder.forEach(category => {
            if (filters[category]) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'filter-category';
                
                if (category === 'format') {
                    categoryDiv.classList.add('has-divider');
                }

                categoryDiv.innerHTML = `<h5>${category.replace(/_/g, ' ')}</h5>`;
                Array.from(filters[category]).sort().forEach(value => {
                     const label = document.createElement('label');
                     label.className = 'filter-option';
                     label.innerHTML = `<input type="checkbox" data-category="${category}" value="${value}"> ${value}`;
                     categoryDiv.appendChild(label);
                });
                filterOptionsContainer.appendChild(categoryDiv);
            }
        });
        filterOptionsContainer.addEventListener('change', () => renderTemplates());
    }

    function renderTemplates() {
        const activeFilters = getActiveFilters();
        if (!isGalleryPopulated) {
            templateGallery.innerHTML = '';
            templates.forEach((template, index) => {
                const item = document.createElement('div');
                item.className = 'template-item';
                item.dataset.index = index;
                item.innerHTML = `<img src="${template.image}" alt="${template.title} preview"><h4>${template.title}</h4>`;
    
                item.addEventListener('click', () => {
                    const isAlreadySelected = item.classList.contains('selected');
                    
                    document.querySelectorAll('.template-item.selected').forEach(el => el.classList.remove('selected'));
    
                    if (isAlreadySelected) {
                        selectedTemplate = null;
                        loadTemplateBtn.disabled = true;
                    } else {
                        item.classList.add('selected');
                        selectedTemplate = templates[index];
                        loadTemplateBtn.disabled = false;
                    }
                    updateMagnifiedPreview();
                });
    
                templateGallery.appendChild(item);
            });
            isGalleryPopulated = true;
        }
    
        const items = templateGallery.children;
        for (const item of items) {
            const index = parseInt(item.dataset.index, 10);
            const template = templates[index];
            const shouldBeVisible = checkVisibility(template.tags, activeFilters);
            const isFadingOut = item.dataset.isFadingOut === 'true';
    
            if (shouldBeVisible) {
                item.style.display = 'block';
                delete item.dataset.isFadingOut;
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                }, 10);
            } else if (!isFadingOut) {
                item.dataset.isFadingOut = 'true';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    if (item.dataset.isFadingOut === 'true') {
                        item.style.display = 'none';
                    }
                }, 300); 
            }
        }
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
            if (requiredTags.length === 0) return true;
            const templateTagsInCategory = (templateTags || []).filter(t => t.startsWith(category + ':')).map(t => t.split(':')[1]);
            return requiredTags.some(reqTag => templateTagsInCategory.includes(reqTag));
        });
    }
    
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 255, b: 255 };
    }

    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function switchView(tabName) {
        generatorView.classList.toggle('active', tabName === 'generator');
        templatesView.classList.toggle('active', tabName === 'templates');
        generatorTabBtn.classList.toggle('active', tabName === 'generator');
        templatesTabBtn.classList.toggle('active', tabName === 'templates');
    }
    
    function updateMagnifiedPreview() {
        const templateToShow = hoveredTemplate || selectedTemplate;
        if (templateToShow) {
            magnifiedImage.src = templateToShow.image;
            magnifiedTitle.textContent = templateToShow.title;
            magnifiedPreviewContainer.classList.add('has-image');
            magnifiedTitle.classList.add('visible');
        } else {
            magnifiedPreviewContainer.classList.remove('has-image');
            magnifiedTitle.classList.remove('visible');
        }
    }

    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the editor?')) {
            saveState();
            mailInput.value = '';
            updatePreview();
            saveState();
        }
    });
    
    mailInput.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(saveState, 500);
        updatePreview();
    });

    generatorTabBtn.addEventListener('click', () => switchView('generator'));
    templatesTabBtn.addEventListener('click', () => switchView('templates'));

    previewTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            previewTabBtns.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            previewContainer.className = 'mail-preview-container';
            previewContainer.classList.add(btn.dataset.bg === 'mail' ? 'mail-bg' : 'board-bg');
            currentCharLimit = (btn.dataset.bg === 'mail') ? 2000 : 1000;
            updatePreview();
        });
    });

    boldBtn.addEventListener('click', () => applyTag('b'));
    italicBtn.addEventListener('click', () => applyTag('i'));
    boldItalicBtn.addEventListener('click', () => applyDoubleTag('b', 'i'));

    customSizeOptions.addEventListener('click', (e) => {
        const target = e.target.closest('.custom-option');
        if (!target) return;
        const value = target.dataset.value;
        if (value === 'custom') {
            const customSize = prompt("Enter a custom font size (e.g., 22):");
            if (customSize && !isNaN(customSize)) {
                applyTag('size', customSize);
            }
        } else {
            applyTag('size', value);
        }
        closeAllDropdowns();
    });

    applyGradientBtn.addEventListener('click', applyGradient);
    gradientColor1.addEventListener('input', updateGradientUI);
    gradientColor2.addEventListener('input', updateGradientUI);
    gradientBiasSlider.addEventListener('input', updateGradientUI);

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
            historyStack = [];
            historyIndex = -1;
            saveState();
            updatePreview();
            switchView('generator');
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

    templateGallery.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.template-item');
        if (item) {
            const index = parseInt(item.dataset.index, 10);
            hoveredTemplate = templates[index];
            updateMagnifiedPreview();
        }
    });
    
    templateGallery.addEventListener('mouseleave', () => {
        hoveredTemplate = null;
        updateMagnifiedPreview();
    });

    document.addEventListener('click', (e) => {
        if (!filterPanel.contains(e.target) && !filterToggleBtn.contains(e.target)) {
            filterPanel.classList.remove('visible');
        }
    });

    updatePreview();
    setupTemplatesAndFilters();
    saveState();
    updateUndoButton();
    updateGradientUI();
});