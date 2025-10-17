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
    const customColorPickerContainer = document.getElementById('custom-color-picker-container');
    const customColorInput = document.getElementById('custom-color-input');
    const applyCustomColorBtn = document.getElementById('apply-custom-color-btn');

    const applyGradientBtn = document.getElementById('apply-gradient-btn');
    const gradientToggleBtn = document.getElementById('custom-gradient-toggle');
    const gradientBiasSlider = document.getElementById('gradient-bias-slider');
    const gradientStrengthSlider = document.getElementById('gradient-strength-slider');
    const gradientCharCounter = document.getElementById('gradient-char-counter');
    const gradientPreviewBar = document.getElementById('gradient-preview-bar');
    const gradientColor1 = document.getElementById('gradient-color-1');
    const gradientColor2 = document.getElementById('gradient-color-2');

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
    
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // New custom size modal elements
    const customSizeModal = document.getElementById('custom-size-modal');
    const customSizeInput = document.getElementById('custom-size-input');
    const customSizeApplyBtn = document.getElementById('custom-size-apply-btn');
    const customSizeCancelBtn = document.getElementById('custom-size-cancel-btn');

    let templates = [];
    let selectedTemplate = null;
    let hoveredTemplate = null;
    let isGalleryPopulated = false;

    let isLivePreviewingGradient = false;
    let gradientSelection = { start: 0, end: 0 };
    let isLivePreviewingColor = false;
    let colorSelection = { start: 0, end: 0 };

    let historyStack = [];
    let historyIndex = -1;
    let inputTimeout = null;

    if (gradientToggleBtn) {
        gradientToggleBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });
    }

    function saveState(replace = false) {
        const currentState = {
            value: mailInput.value,
            start: mailInput.selectionStart,
            end: mailInput.selectionEnd,
        };

        if (replace) {
            historyStack[historyIndex] = currentState;
        } else {
            if (historyIndex < historyStack.length - 1) {
                historyStack = historyStack.slice(0, historyIndex + 1);
            }
            historyStack.push(currentState);
            historyIndex++;
        }
        updateUndoRedoButtons();
    }

    function changeState(newIndex) {
        if (newIndex >= 0 && newIndex < historyStack.length) {
            historyIndex = newIndex;
            const state = historyStack[historyIndex];
            mailInput.value = state.value;
            mailInput.setSelectionRange(state.start, state.end);
            updatePreview();
            updateUndoRedoButtons();
        }
    }

    function undo() {
        if (historyIndex > 0) {
            changeState(historyIndex - 1);
        }
    }

    function redo() {
        if (historyIndex < historyStack.length - 1) {
            changeState(historyIndex + 1);
        }
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyIndex <= 0;
    }

    const cachedContent = localStorage.getItem(CACHE_KEY);
    if (cachedContent) {
        mailInput.value = cachedContent;
    }
    
    function applyTag(tag, value = null) {
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        let selectedText = mailInput.value.substring(start, end);
        if (!selectedText && value === null) return;
    
        saveState();
    
        let replacement;
    
        if (value !== null) {
            const openingTag = `<${tag}=${value}>`;
            const closingTag = `</${tag}>`;
            const exactTagRegex = new RegExp(`^\\s*${openingTag.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}([\\s\\S]*?)${closingTag}\\s*$`, 'i');
    
            if (selectedText.trim().match(exactTagRegex)) {
                replacement = selectedText.replace(exactTagRegex, '$1');
            } else {
                const anyOpeningTagRegex = new RegExp(`<${tag}=[^>]+>`, 'gi');
                const anyClosingTagRegex = new RegExp(`</${tag}>`, 'gi');
                
                const textToWrap = selectedText.replace(anyOpeningTagRegex, '').replace(anyClosingTagRegex, '');
                replacement = `${openingTag}${textToWrap}${closingTag}`;
            }
        } else {
            const openTag = `<${tag}>`;
            const closeTag = `</${tag}>`;
            const fullTagRegex = new RegExp(`^\\s*${openTag.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}([\\s\\S]*?)${closeTag}\\s*$`, 'i');
            const openTagRegex = new RegExp(openTag, 'gi');
            const closeTagRegex = new RegExp(closeTag, 'gi');
    
            if (selectedText.trim().startsWith(`<${tag}`) && selectedText.trim().endsWith(closeTag)) {
                 replacement = selectedText.replace(fullTagRegex, '$1');
            } else if (selectedText.includes(`<${tag}`)) {
                replacement = selectedText.replace(openTagRegex, '').replace(closeTagRegex, '');
            } else {
                replacement = `${openTag}${selectedText}${closeTag}`;
            }
        }
    
        mailInput.setRangeText(replacement, start, end, 'select');
        updatePreview();
        saveState(true);
    }
    
    function applyDoubleTag(tag1, tag2) {
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        let selectedText = mailInput.value.substring(start, end);
        if (!selectedText) return;
    
        saveState();
    
        const tag1Open = `<${tag1}>`;
        const tag1Close = `</${tag1}>`;
        const tag2Open = `<${tag2}>`;
        const tag2Close = `</${tag2}>`;
    
        const hasTag1 = selectedText.includes(tag1Open) && selectedText.includes(tag1Close);
        const hasTag2 = selectedText.includes(tag2Open) && selectedText.includes(tag2Close);
    
        let processedText = selectedText;
    
        if (hasTag1) {
            processedText = processedText.replace(new RegExp(tag1Open, 'g'), '').replace(new RegExp(tag1Close, 'g'), '');
        }
        if (hasTag2) {
            processedText = processedText.replace(new RegExp(tag2Open, 'g'), '').replace(new RegExp(tag2Close, 'g'), '');
        }
    
        if (!hasTag1 || !hasTag2) {
            processedText = `${tag1Open}${tag2Open}${processedText}${tag2Close}${tag1Close}`;
        }
        
        mailInput.setRangeText(processedText, start, end, 'select');
        updatePreview();
        saveState(true);
    }

    function updatePreview(overrideText = null) {
        const text = overrideText !== null ? overrideText : mailInput.value;
        if (overrideText === null) {
            localStorage.setItem(CACHE_KEY, text);
        }

        const newlines = (text.match(/\n/g) || []).length;
        const charCount = text.length + newlines;

        charCounter.textContent = `${charCount}/${currentCharLimit}`;
        charCounter.style.color = charCount > currentCharLimit ? '#ff4d4d' : 'var(--text-secondary)';
        
        let previewText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        previewText = previewText.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gis, '<strong>$1</strong>');
        previewText = previewText.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gis, '<em>$1</em>');
        
        previewText = previewText.replace(/&lt;size=(\d+)&gt;(.*?)&lt;\/size&gt;/gis, (match, size, content) => {
            const scaledSize = parseFloat(size) * 0.55;
            return `<span style="font-size: ${scaledSize}px;">${content}</span>`;
        });

        previewText = previewText.replace(/&lt;color=([a-zA-Z0-9#]+)&gt;(.*?)&lt;\/color&gt;/gis, (match, colorValue, content) => {
            return `<span style="color: ${colorValue};">${content}</span>`;
        });
        mailPreview.innerHTML = previewText.replace(/\n/g, '<br>');
    }

    function closeAllDropdowns() {
        if (isLivePreviewingGradient || isLivePreviewingColor) {
            isLivePreviewingGradient = false;
            isLivePreviewingColor = false;
            updatePreview();
        }
        document.querySelectorAll('.custom-dropdown-options.visible').forEach(d => d.classList.remove('visible'));
        customColorPickerContainer.style.display = 'none';
    }
    
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.toolbar-btn');
        const options = dropdown.querySelector('.custom-dropdown-options');
        if (toggle && options) {
            toggle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const isVisible = options.classList.contains('visible');
                closeAllDropdowns();
                if (!isVisible) {
                    options.classList.add('visible');
                    const selectionStart = mailInput.selectionStart;
                    const selectionEnd = mailInput.selectionEnd;
                    const hasSelection = selectionStart !== selectionEnd;

                    if (dropdown.id === 'custom-gradient-dropdown') {
                        gradientSelection = { start: selectionStart, end: selectionEnd };
                        isLivePreviewingGradient = hasSelection;
                        updateGradientUI();
                    }
                    if (dropdown.id === 'custom-color-dropdown') {
                        colorSelection = { start: selectionStart, end: selectionEnd };
                        isLivePreviewingColor = hasSelection;
                    }
                }
            });
        }
    });

    customColorOptions.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const target = e.target.closest('.custom-option');
        if (!target) return;
        
        const value = target.dataset.value;
        
        if (value === 'custom-toggle') {
            customColorPickerContainer.style.display = customColorPickerContainer.style.display === 'flex' ? 'none' : 'flex';
        } else {
            applyTag('color', value);
            closeAllDropdowns();
        }
    });

    function livePreviewColor(color) {
        if (!isLivePreviewingColor) return;
        
        const fullText = mailInput.value;
        const preSelection = fullText.substring(0, colorSelection.start);
        const postSelection = fullText.substring(colorSelection.end);
        
        let selectedText = fullText.substring(colorSelection.start, colorSelection.end);
        const anyOpeningTagRegex = /<color=[^>]+>/gi;
        const anyClosingTagRegex = /<\/color>/gi;
        selectedText = selectedText.replace(anyOpeningTagRegex, '').replace(anyClosingTagRegex, '');

        const coloredText = `<color=${color}>${selectedText}</color>`;
        updatePreview(preSelection + coloredText + postSelection);
    }
    
    customColorInput.addEventListener('input', () => livePreviewColor(customColorInput.value));
    
    applyCustomColorBtn.addEventListener('click', () => {
        applyTag('color', customColorInput.value);
        closeAllDropdowns();
    });

    function applyGradient() {
        const startColor = gradientColor1.value;
        const endColor = gradientColor2.value;
        const bias = parseFloat(gradientBiasSlider.value);
        
        const strengthValue = parseInt(gradientStrengthSlider.value, 10);
        const strengthMin = parseInt(gradientStrengthSlider.min, 10);
        const strengthMax = parseInt(gradientStrengthSlider.max, 10);
        const grouping = (strengthMax + strengthMin) - strengthValue;

        const startPos = mailInput.selectionStart;
        const endPos = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(startPos, endPos);
        if (!selectedText) {
            closeAllDropdowns();
            return;
        }
        saveState();
        const gradientTags = generateGradientTags(selectedText, startColor, endColor, bias, grouping);
        mailInput.setRangeText(gradientTags, startPos, endPos, 'select');
        isLivePreviewingGradient = false;
        updatePreview();
        saveState(true);
        closeAllDropdowns();
    }

    function generateGradientTags(text, color1, color2, bias = 1, grouping = 10) {
        const cleanText = text.replace(/<[^>]*>/g, "");
        const len = cleanText.length;
        if (len === 0) return "";
        
        const chunkSize = grouping;
        const start = hexToRgb(color1);
        const end = hexToRgb(color2);
        let output = '';
    
        for (let i = 0; i < len; i += chunkSize) {
            const chunk = cleanText.substring(i, Math.min(i + chunkSize, len));
            if (!chunk) continue;
    
            const midpointIndex = i + (chunk.length / 2);
            const linearRatio = len > 1 ? midpointIndex / (len - 1) : 0;
            const biasedRatio = Math.pow(linearRatio, bias);
    
            let r = Math.round(start.r + biasedRatio * (end.r - start.r));
            let g = Math.round(start.g + biasedRatio * (end.g - start.g));
            let b = Math.round(start.b + biasedRatio * (end.b - start.b));
            
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            
            output += `<color=${rgbToHex(r, g, b)}>${chunk}</color>`;
        }
        return output;
    }

    function updateGradientUI() {
        const startColor = gradientColor1.value;
        const endColor = gradientColor2.value;
        const bias = parseFloat(gradientBiasSlider.value);
        
        const strengthValue = parseInt(gradientStrengthSlider.value, 10);
        const strengthMin = parseInt(gradientStrengthSlider.min, 10);
        const strengthMax = parseInt(gradientStrengthSlider.max, 10);
        const grouping = (strengthMax + strengthMin) - strengthValue;

        gradientPreviewBar.style.background = `linear-gradient(to right, ${startColor}, ${endColor})`;
    
        const selectedText = mailInput.value.substring(gradientSelection.start, gradientSelection.end);
    
        if (selectedText) {
            const cleanSelectedText = selectedText.replace(/<[^>]*>/g, "");
            const generatedTags = generateGradientTags(cleanSelectedText, startColor, endColor, bias, grouping);
            const charCost = generatedTags.length - cleanSelectedText.length;
            gradientCharCounter.textContent = `+${charCost} chars`;
    
            if (isLivePreviewingGradient) {
                const fullText = mailInput.value;
                const preSelection = fullText.substring(0, gradientSelection.start);
                const postSelection = fullText.substring(gradientSelection.end);
                updatePreview(preSelection + generatedTags + postSelection);
            }
        } else {
            gradientCharCounter.textContent = `+0 chars`;
        }
    }

    async function setupTemplatesAndFilters() {
        try {
            const response = await fetch('templates.json');
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
                        hoveredTemplate = null;
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
        customConfirmModal.style.display = 'flex';
    });

    confirmActionBtn.addEventListener('click', () => {
        saveState();
        mailInput.value = '';
        updatePreview();
        saveState();
        customConfirmModal.style.display = 'none';
    });
    
    confirmCancelBtn.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
    });
    
    mailInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    });
    
    mailInput.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => saveState(true), 500);
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

    function addFormattingListener(button, callback) {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            callback();
        });
    }

    addFormattingListener(boldBtn, () => applyTag('b'));
    addFormattingListener(italicBtn, () => applyTag('i'));
    addFormattingListener(boldItalicBtn, () => applyDoubleTag('b', 'i'));


    customSizeOptions.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const target = e.target.closest('.custom-option');
        if (!target) return;
        
        const value = target.dataset.value;
        if (value === 'custom') {
            customSizeModal.style.display = 'flex';
            customSizeInput.focus();
            customSizeInput.value = '';
        } else {
            applyTag('size', value);
        }
        closeAllDropdowns();
    });

    // Custom size modal logic
    function applyCustomSize() {
        const customSize = customSizeInput.value;
        if (customSize && !isNaN(customSize) && customSize > 0) {
            applyTag('size', customSize);
        }
        customSizeModal.style.display = 'none';
    }

    customSizeApplyBtn.addEventListener('click', applyCustomSize);
    customSizeCancelBtn.addEventListener('click', () => {
        customSizeModal.style.display = 'none';
    });
    customSizeModal.addEventListener('click', (e) => {
        if (e.target === customSizeModal) {
            customSizeModal.style.display = 'none';
        }
    });
    customSizeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCustomSize();
        } else if (e.key === 'Escape') {
            customSizeModal.style.display = 'none';
        }
    });

    addFormattingListener(applyGradientBtn, applyGradient);
    
    gradientColor1.addEventListener('input', updateGradientUI);
    gradientColor2.addEventListener('input', updateGradientUI);
    gradientBiasSlider.addEventListener('input', updateGradientUI);
    gradientStrengthSlider.addEventListener('input', updateGradientUI);

    copyBtn.addEventListener('click', () => {
        const copyBtnText = copyBtn.querySelector('span');
        if (!copyBtnText) return;
    
        navigator.clipboard.writeText(mailInput.value).then(() => {
            const originalText = copyBtnText.textContent;
            copyBtnText.textContent = 'Copied!';
            setTimeout(() => { 
                copyBtnText.textContent = originalText; 
            }, 2000);
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

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });

    document.addEventListener('click', (e) => {
        if (!filterPanel.contains(e.target) && !filterToggleBtn.contains(e.target)) {
            filterPanel.classList.remove('visible');
        }
    });

    updatePreview();
    setupTemplatesAndFilters();
    saveState();
    updateUndoRedoButtons();
    updateGradientUI();
});