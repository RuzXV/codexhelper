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
    const charCounter = document.getElementById('char-counter');
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const customSizeModal = document.getElementById('custom-size-modal');
    const customSizeInput = document.getElementById('custom-size-input');
    const customSizeApplyBtn = document.getElementById('custom-size-apply-btn');
    const customSizeCancelBtn = document.getElementById('custom-size-cancel-btn');
    const customAlertModal = document.getElementById('custom-alert-modal');
    const customAlertTitle = document.getElementById('custom-alert-title');
    const customAlertMessage = document.getElementById('custom-alert-message');
    const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');

    const generatorTabBtn = document.querySelector('.generator-tab-btn[data-tab="generator"]');
    const templatesTabBtn = document.querySelector('.generator-tab-btn[data-tab="templates"]');
    const savedTemplatesTabBtn = document.querySelector('.generator-tab-btn[data-tab="saved"]');
    const generatorView = document.getElementById('generator-view');
    const templatesView = document.getElementById('templates-view');
    const savedTemplatesView = document.getElementById('saved-templates-view');
    const previewTabBtns = document.querySelectorAll('.preview-tab-btn');

    const templateGallery = document.getElementById('template-gallery');
    const loadTemplateBtn = document.getElementById('load-template-btn');
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('filter-panel');
    const filterOptionsContainer = document.getElementById('filter-options');
    const filterResetBtn = document.getElementById('filter-reset-btn');
    const magnifiedImage = document.getElementById('magnified-image');
    const magnifiedTitle = document.getElementById('magnified-title');
    const magnifiedPreviewContainer = document.getElementById('magnified-preview-container');

    const saveBtn = document.getElementById('save-btn');
    const saveTemplateModal = document.getElementById('save-template-modal');
    const saveTemplateNameInput = document.getElementById('save-template-name-input');
    const saveTemplateConfirmBtn = document.getElementById('save-template-confirm-btn');
    const saveTemplateCancelBtn = document.getElementById('save-template-cancel-btn');
    const savedTemplatesContent = document.getElementById('saved-templates-content');
    const loggedOutOverlay = document.getElementById('logged-out-overlay');
    const savedTemplatesAuthContainer = document.getElementById('saved-templates-auth-container');

    let templates = window.templatesData;
    let selectedTemplate = null;
    let hoveredTemplate = null;
    let isGalleryPopulated = false;
    let currentCharLimit = 2000;
    const CACHE_KEY = 'mailGeneratorContent';
    let isLivePreviewingGradient = false;
    let gradientSelection = { start: 0, end: 0 };
    let isLivePreviewingColor = false;
    let colorSelection = { start: 0, end: 0 };
    let historyStack = [];
    let historyIndex = -1;
    let inputTimeout = null;
    const API_BASE_URL = 'https://api.codexhelper.com';

    function populateFilters() {
        if (!filterOptionsContainer) return;

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
            if (filters[category] && filters[category].size > 0) {
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
        if (!templateGallery) return;
        const activeFilters = getActiveFilters();
    
        if (!isGalleryPopulated) {
            templateGallery.innerHTML = '';
            templates.forEach((template, index) => {
                const item = document.createElement('div');
                item.className = 'template-item';
                item.dataset.index = index;

                item.innerHTML = `<img src="${template.image}" alt="${template.title} preview" loading="lazy" width="200" height="125"><h4>${template.title}</h4>`;
    
                item.addEventListener('click', () => {
                    const isAlreadySelected = item.classList.contains('selected');
                    
                    document.querySelectorAll('.template-item.selected').forEach(el => el.classList.remove('selected'));
    
                    if (isAlreadySelected) {
                        selectedTemplate = null;
                        hoveredTemplate = null;
                        if(loadTemplateBtn) loadTemplateBtn.disabled = true;
                    } else {
                        item.classList.add('selected');
                        selectedTemplate = templates[index];
                        if(loadTemplateBtn) loadTemplateBtn.disabled = false;
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

    function showCustomAlert(message, title = "Notice") {
        if (customAlertModal && customAlertMessage && customAlertTitle) {
            customAlertTitle.textContent = title;
            customAlertMessage.textContent = message;
            customAlertModal.style.display = 'flex';
        } else {
            alert(message);
        }
    }

    if (customAlertOkBtn) {
        customAlertOkBtn.addEventListener('click', () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
        });
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
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

    window.getPreLoginState = function() {
        const mailInput = document.getElementById('mail-input');
        if (mailInput && mailInput.value) {
            return { mailContent: mailInput.value };
        }
        return null;
    };

    function changeState(newIndex) {
        if (newIndex >= 0 && newIndex < historyStack.length) {
            historyIndex = newIndex;
            const state = historyStack[historyIndex];
            mailInput.value = state.value;
            mailInput.setSelectionRange(state.start, state.end);
            updatePreview();
            updateUndoRedoButtons();
            
            if (document.activeElement !== mailInput) {
                mailInput.focus();
            }
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
        if(undoBtn) undoBtn.disabled = historyIndex <= 0;
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
        if (!mailInput || !mailPreview || !charCounter) return;

        const text = overrideText !== null ? overrideText : mailInput.value;
        if (overrideText === null) {
            window.saveUserData(CACHE_KEY, { mailContent: text });
        }
    
        const newlines = (text.match(/\n/g) || []).length;
        const charCount = text.length + newlines;
    
        charCounter.textContent = `${charCount}/${currentCharLimit}`;
        charCounter.style.color = charCount > currentCharLimit ? '#ff4d4d' : 'var(--text-secondary)';
        
        const parsedHtml = parseGameTagsToHtml(text);
        mailPreview.innerHTML = parsedHtml.replace(/\n/g, '<br>');
    }
    
    function parseGameTagsToHtml(text) {
        let html = '';
        const stack = [];
        let i = 0;
    
        const knownTags = ['b', 'i', 'size', 'color'];
    
        while (i < text.length) {
            const openTagIndex = text.indexOf('<', i);
            if (openTagIndex === -1) {
                html += escapeHtml(text.substring(i));
                break;
            }
    
            html += escapeHtml(text.substring(i, openTagIndex));
    
            const nextChar = text[openTagIndex + 1];
            if (nextChar === undefined || (nextChar !== '/' && !/[a-zA-Z]/.test(nextChar))) {
                html += escapeHtml(text.substring(openTagIndex, openTagIndex + 1));
                i = openTagIndex + 1;
                continue;
            }
    
            const closeTagIndex = text.indexOf('>', openTagIndex);
            if (closeTagIndex === -1) {
                return escapeHtml(text);
            }
    
            const tagStr = text.substring(openTagIndex + 1, closeTagIndex);
            const isClosingTag = tagStr.startsWith('/');
            
            if (isClosingTag) {
                const tagName = tagStr.substring(1).toLowerCase();
    
                if (!knownTags.includes(tagName)) {
                    html += escapeHtml(text.substring(openTagIndex, closeTagIndex + 1));
                    i = closeTagIndex + 1;
                    continue;
                }
    
                let tagPositionInStack = -1;
                for (let j = stack.length - 1; j >= 0; j--) {
                    if (stack[j].name === tagName) {
                        tagPositionInStack = j;
                        break;
                    }
                }
    
                if (tagPositionInStack === -1) {
                    return escapeHtml(text);
                }
    
                for (let j = stack.length - 1; j >= tagPositionInStack; j--) {
                    const tagToClose = stack.pop();
                    switch (tagToClose.name) {
                        case 'b': html += '</strong>'; break;
                        case 'i': html += '</em>'; break;
                        case 'size': case 'color': html += '</span>'; break;
                    }
                }
            } else {
                const parts = tagStr.match(/([a-zA-Z]+)(?:[=\s](?:"([^"]*)"|([^> ]*)))?/);
                
                if (!parts) {
                    html += escapeHtml(text.substring(openTagIndex, closeTagIndex + 1));
                    i = closeTagIndex + 1;
                    continue;
                }
                
                const tagName = parts[1].toLowerCase();
                const tagValue = parts[2] || parts[3] || null;
    
                if (!knownTags.includes(tagName)) {
                    html += escapeHtml(text.substring(openTagIndex, closeTagIndex + 1));
                    i = closeTagIndex + 1;
                    continue;
                }
    
                stack.push({ name: tagName, value: tagValue });
    
                switch (tagName) {
                    case 'b': html += '<strong>'; break;
                    case 'i': html += '<em>'; break;
                    case 'size':
                        if (tagValue) {
                            const scaledSize = Math.max(parseFloat(tagValue) * 0.55, 1);
                            html += `<span style="font-size: ${scaledSize}px;">`;
                        } else { html += '<span>'; }
                        break;
                    case 'color':
                        if (tagValue) {
                            let finalColor = tagValue.replace(/"/g, '');
                            if (!finalColor.startsWith('#') && /^[a-fA-F0-9]{6}$/.test(finalColor)) {
                                finalColor = '#' + finalColor;
                            }
                            html += `<span style="color: ${finalColor};">`;
                        } else { html += '<span>'; }
                        break;
                }
            }
            
            i = closeTagIndex + 1;
        }
    
        if (stack.length > 0) {
            return escapeHtml(text);
        }
    
        return html;
    }
    
    function closeAllDropdowns() {
        if (isLivePreviewingGradient || isLivePreviewingColor) {
            isLivePreviewingGradient = false;
            isLivePreviewingColor = false;
            updatePreview();
        }
        document.querySelectorAll('.custom-dropdown-options.visible').forEach(d => d.classList.remove('visible'));
        if(customColorPickerContainer) customColorPickerContainer.style.display = 'none';
    }

    function applyCustomSize() {
        if(!customSizeInput) return;
        const customSize = customSizeInput.value;
        if (customSize && !isNaN(customSize) && customSize > 0) {
            applyTag('size', customSize);
        }
        if(customSizeModal) customSizeModal.style.display = 'none';
    }

    function applyGradient() {
        if (!mailInput || !gradientColor1 || !gradientColor2 || !gradientBiasSlider || !gradientStrengthSlider) return;

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
        if (!gradientPreviewBar || !mailInput || !gradientCharCounter) return;

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
        const views = {
            generator: generatorView,
            templates: templatesView,
            saved: savedTemplatesView
        };
        const tabs = {
            generator: generatorTabBtn,
            templates: templatesTabBtn,
            saved: savedTemplatesTabBtn
        };

        for (const key in views) {
            const isActive = key === tabName;
            if (views[key]) views[key].classList.toggle('active', isActive);
            if (tabs[key]) tabs[key].classList.toggle('active', isActive);
        }

        if (tabName === 'saved') {
            renderSavedTemplatesView();
        }
    }

    async function setupTemplatesAndFilters() {
        if (!templateGallery) return;
        try {
            if (templates && Array.isArray(templates)) {
                templates.sort((a, b) => a.title.localeCompare(b.title));
            }
            populateFilters();
            renderTemplates();
        } catch (error) {
            templateGallery.innerHTML = '<p class="error-message" style="color: var(--text-muted);">Could not load templates.</p>';
            console.error("Error setting up templates:", error);
        }
    }

    function getActiveFilters() {
        if (!filterOptionsContainer) return {};
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
    
    function updateMagnifiedPreview() {
        if(!magnifiedImage || !magnifiedTitle || !magnifiedPreviewContainer) return;
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

    async function fetchWithAuth(endpoint, options = {}) {
        const token = getAuthToken();
        if (!token) {
            throw new Error('User not authenticated');
        }

        const headers = {
            ...options.headers,
            'Authorization': token,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('codexUser');
                renderSavedTemplatesView(); 
            }
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        return response.json();
    }

    async function renderSavedTemplatesView() {
        const user = getLoggedInUser();

        if (user && getAuthToken()) {
            loggedOutOverlay.style.display = 'none';
            savedTemplatesContent.innerHTML = `<p>Loading your templates...</p>`;
            try {
                const templates = await fetchWithAuth('/api/templates');
                populateSavedTemplatesTable(templates);
            } catch (error) {
                console.error('Failed to fetch saved templates:', error);
                savedTemplatesContent.innerHTML = `<p class="error-message">Could not load your templates. Please try logging in again.</p>`;
            }
        } else {
            savedTemplatesContent.innerHTML = '';
            loggedOutOverlay.style.display = 'flex';
            if (savedTemplatesAuthContainer && !savedTemplatesAuthContainer.hasChildNodes()) {
                initAuth(savedTemplatesAuthContainer);
            }
        }
    }

    function populateSavedTemplatesTable(templates) {
        if (templates.length === 0) {
            savedTemplatesContent.innerHTML = `<p>You have no saved templates. Use the "Save" button in the generator to add one!</p>`;
            return;
        }

        let tableHtml = `
            <div class="saved-templates-grid">
                <div class="grid-header">Template Name</div>
                <div class="grid-header">Date Saved</div>
                <div class="grid-header">Last Loaded</div>
                <div class="grid-header">Actions</div>
        `;

        templates.forEach(t => {
            tableHtml += `
                <div class="grid-row" data-template-id="${t.template_id}">
                    <div class="template-name">${escapeHtml(t.template_name)}</div>
                    <div class="template-date grid-date-saved">${new Date(t.date_saved * 1000).toLocaleDateString('en-GB')}</div>
                    <div class="template-date grid-last-loaded">${t.last_loaded ? new Date(t.last_loaded * 1000).toLocaleString('en-GB') : 'Never'}</div>
                    <div class="template-actions">
                        <button class="btn-secondary copy-saved-btn" title="Copy Code"><i class="fas fa-copy"></i></button>
                        <button class="btn-primary load-saved-btn" title="Load into Editor"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger delete-saved-btn" title="Delete Template"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        tableHtml += '</div>';
        savedTemplatesContent.innerHTML = tableHtml;

        document.querySelectorAll('.copy-saved-btn').forEach(btn => btn.addEventListener('click', handleCopySavedTemplate));
        document.querySelectorAll('.load-saved-btn').forEach(btn => btn.addEventListener('click', handleLoadSavedTemplate));
        document.querySelectorAll('.delete-saved-btn').forEach(btn => btn.addEventListener('click', handleDeleteSavedTemplate));
    }
    
    async function handleCopySavedTemplate(e) {
        const row = e.target.closest('.grid-row');
        const templateId = row.dataset.templateId;
        const button = e.target.closest('button');
        const originalIcon = button.innerHTML;

        try {
            const templates = await fetchWithAuth('/api/templates');
            const template = templates.find(t => t.template_id == templateId);
            if (template) {
                await navigator.clipboard.writeText(template.content);
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => button.innerHTML = originalIcon, 2000);
            }
        } catch (error) {
            console.error('Failed to copy template:', error);
            button.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => button.innerHTML = originalIcon, 2000);
        }
    }

    async function handleLoadSavedTemplate(e) {
        const row = e.target.closest('.grid-row');
        const templateId = row.dataset.templateId;

        try {
            const templates = await fetchWithAuth('/api/templates');
            const template = templates.find(t => t.template_id == templateId);
            if (template) {
                mailInput.value = template.content;
                updatePreview();
                saveState();
                switchView('generator');
                await fetchWithAuth(`/api/templates/${templateId}/load`, { method: 'PUT' });
            }
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Could not load the template.');
        }
    }

    async function handleDeleteSavedTemplate(e) {
        const row = e.target.closest('.grid-row');
        const templateId = row.dataset.templateId;
        const templateName = row.querySelector('.template-name').textContent;

        if (confirm(`Are you sure you want to delete the template "${templateName}"? This cannot be undone.`)) {
            try {
                await fetchWithAuth(`/api/templates/${templateId}`, { method: 'DELETE' });
                renderSavedTemplatesView();
            } catch (error) {
                console.error('Failed to delete template:', error);
                showCustomAlert('Could not delete the template.', "Delete Error");
            }
        }
    }
    
    async function handleSaveTemplate() {
        const name = saveTemplateNameInput.value.trim();
        const content = mailInput.value;
        const charCount = content.length + (content.match(/\n/g) || []).length;

        if (!name) {
            alert('Please enter a name for your template.');
            return;
        }

        const button = saveTemplateConfirmBtn;
        button.disabled = true;
        button.textContent = 'Saving...';

        try {
            await fetchWithAuth('/api/templates', {
                method: 'POST',
                body: JSON.stringify({
                    template_name: name,
                    content: content,
                    char_count: charCount
                })
            });
            saveTemplateModal.style.display = 'none';
            switchView('saved');
        } catch (error) {
            console.error('Failed to save template:', error);
            showCustomAlert(`Could not save template: ${error.message}`, "Save Error");
        } finally {
            button.disabled = false;
            button.textContent = 'Save';
        }
    }

    const preLoginPath = sessionStorage.getItem('preLoginToolPath');
    if (preLoginPath === window.location.pathname) {
        const preLoginState = JSON.parse(sessionStorage.getItem('preLoginState'));
        if (mailInput && preLoginState && preLoginState.mailContent) {
            mailInput.value = preLoginState.mailContent;
        }
        sessionStorage.removeItem('preLoginState');
        sessionStorage.removeItem('preLoginToolPath');
    } else {
        const cachedData = window.loadUserData(CACHE_KEY);
        if (mailInput && cachedData && cachedData.mailContent) {
            mailInput.value = cachedData.mailContent;
        }
    }

    if(undoBtn) undoBtn.addEventListener('click', undo);
    let confirmCallback = null;

    function showCustomConfirm(message, title, onConfirm) {
        const modalTitle = document.getElementById('custom-confirm-title');
        const modalMessage = document.getElementById('custom-confirm-message');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmCallback = onConfirm;
        
        customConfirmModal.style.display = 'flex';
    }

    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            showCustomConfirm(
                'Are you sure you want to clear the editor?',
                'Confirm Clear',
                () => {
                    saveState();
                    mailInput.value = '';
                    updatePreview();
                    saveState();
                }
            );
        });
    }

    if(mailInput) {
        mailInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); } 
            else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
        });
        mailInput.addEventListener('input', () => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => saveState(), 500);
            updatePreview();
        });
    }

    if(confirmActionBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            customConfirmModal.style.display = 'none';
            confirmCallback = null;
        });
    }

    if(confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            customConfirmModal.style.display = 'none';
            confirmCallback = null;
        });
    }

    async function handleDeleteSavedTemplate(e) {
        const row = e.target.closest('.grid-row');
        const templateId = row.dataset.templateId;
        const templateName = row.querySelector('.template-name').textContent;
    
        showCustomConfirm(
            `Are you sure you want to delete the template "${templateName}"? This cannot be undone.`,
            'Confirm Deletion',
            async () => {
                try {
                    await fetchWithAuth(`/api/templates/${templateId}`, { method: 'DELETE' });
                    renderSavedTemplatesView();
                } catch (error) {
                    console.error('Failed to delete template:', error);
                    showCustomAlert('Could not delete the template.', "Delete Error");
                }
            }
        );
    }
    
    if(generatorTabBtn) generatorTabBtn.addEventListener('click', () => switchView('generator'));
    if(templatesTabBtn) templatesTabBtn.addEventListener('click', () => switchView('templates'));
    if(savedTemplatesTabBtn) savedTemplatesTabBtn.addEventListener('click', () => switchView('saved'));

    if(previewTabBtns) {
        previewTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                previewTabBtns.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                if(previewContainer) {
                    previewContainer.className = 'mail-preview-container';
                    previewContainer.classList.add(btn.dataset.bg === 'mail' ? 'mail-bg' : 'board-bg');
                }
                currentCharLimit = (btn.dataset.bg === 'mail') ? 2000 : 1000;
                updatePreview();
            });
        });
    }
    
    function addFormattingListener(button, callback) {
        if(button) {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                callback();
            });
        }
    }

    addFormattingListener(boldBtn, () => applyTag('b'));
    addFormattingListener(italicBtn, () => applyTag('i'));
    addFormattingListener(boldItalicBtn, () => applyDoubleTag('b', 'i'));
    addFormattingListener(applyGradientBtn, applyGradient);

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

    if (customSizeOptions) {
        customSizeOptions.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const target = e.target.closest('.custom-option');
            if (!target) return;
            const value = target.dataset.value;
            if (value === 'custom') {
                if(customSizeModal) customSizeModal.style.display = 'flex';
                if(customSizeInput) { customSizeInput.focus(); customSizeInput.value = ''; }
            } else {
                applyTag('size', value);
            }
            closeAllDropdowns();
        });
    }
    if(customSizeApplyBtn) customSizeApplyBtn.addEventListener('click', applyCustomSize);
    if(customSizeCancelBtn) customSizeCancelBtn.addEventListener('click', () => { if(customSizeModal) customSizeModal.style.display = 'none'; });
    if(customSizeModal) customSizeModal.addEventListener('click', (e) => { if (e.target === customSizeModal) customSizeModal.style.display = 'none'; });
    if(customSizeInput) {
        customSizeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); applyCustomSize(); } 
            else if (e.key === 'Escape') { if(customSizeModal) customSizeModal.style.display = 'none'; }
        });
    }

    if(customColorOptions) {
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
    }
    function livePreviewColor(color) {
        if (!isLivePreviewingColor) return;
        const fullText = mailInput.value;
        const preSelection = fullText.substring(0, colorSelection.start);
        const postSelection = fullText.substring(colorSelection.end);
        let selectedText = fullText.substring(colorSelection.start, colorSelection.end).replace(/<color=[^>]+>/gi, '').replace(/<\/color>/gi, '');
        const coloredText = `<color=${color}>${selectedText}</color>`;
        updatePreview(preSelection + coloredText + postSelection);
    }
    if(customColorInput) customColorInput.addEventListener('input', () => livePreviewColor(customColorInput.value));
    if(applyCustomColorBtn) applyCustomColorBtn.addEventListener('click', () => { applyTag('color', customColorInput.value); closeAllDropdowns(); });

    if(gradientColor1) gradientColor1.addEventListener('input', updateGradientUI);
    if(gradientColor2) gradientColor2.addEventListener('input', updateGradientUI);
    if(gradientBiasSlider) gradientBiasSlider.addEventListener('input', updateGradientUI);
    if(gradientStrengthSlider) gradientStrengthSlider.addEventListener('input', updateGradientUI);

    if(copyBtn) {
        copyBtn.addEventListener('click', () => {
            const copyBtnText = copyBtn.querySelector('span');
            if (!copyBtnText || !mailInput) return;
            navigator.clipboard.writeText(mailInput.value).then(() => {
                const originalText = copyBtnText.textContent;
                copyBtnText.textContent = 'Copied!';
                setTimeout(() => { copyBtnText.textContent = originalText; }, 2000);
            });
        });
    }
    if(loadTemplateBtn) {
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
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!getLoggedInUser()) {
                showCustomAlert('You must be logged in with Discord to save templates.');
                return;
            }
            saveTemplateNameInput.value = '';
            saveTemplateModal.style.display = 'flex';
            saveTemplateNameInput.focus();
        });
    }
    if (saveTemplateConfirmBtn) saveTemplateConfirmBtn.addEventListener('click', handleSaveTemplate);
    if (saveTemplateCancelBtn) saveTemplateCancelBtn.addEventListener('click', () => saveTemplateModal.style.display = 'none');


    if(filterToggleBtn) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(filterPanel) filterPanel.classList.toggle('visible');
        });
    }
    if(filterResetBtn) {
        filterResetBtn.addEventListener('click', () => {
            if(filterOptionsContainer) filterOptionsContainer.querySelectorAll('input:checked').forEach(i => i.checked = false);
            renderTemplates();
        });
    }
    if (templateGallery) {
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
    }

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });
    document.addEventListener('click', (e) => {
        if (filterPanel && filterToggleBtn && !filterPanel.contains(e.target) && !filterToggleBtn.contains(e.target)) {
            filterPanel.classList.remove('visible');
        }
    });

    updatePreview();
    setupTemplatesAndFilters();
    if(mailInput) saveState();
    updateUndoRedoButtons();
    updateGradientUI();
});