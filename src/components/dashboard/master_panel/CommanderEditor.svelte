<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { fly } from 'svelte/transition';
    import DiscordEmbedPreview from './DiscordEmbedPreview.svelte';

    export let commanderId;
    export let commanderData;
    export let aliasData;
    export let emojiData;
    export let user;

    const dispatch = createEventDispatcher();

    const SEPARATOR = '\u3021';
    const BULLET_POINT = '<:bullet_point:1362669097321627809>';
    const FIXED_MAIN_COLOR = "#004cff";
    const FIXED_SUB_COLOR = "#313338";
    const AUTHOR_ICON = "https://i.postimg.cc/Jn4zn7sy/Kings-Codex-Logo-No-URL-No-Glow.png";
    const AUTHOR_NAME = "The King's Codex";
    const MAIN_FOOTER = "Check out talents & gear recommendations by clicking the buttons below!";

    let initialJSON = "";
    let originalCommanderDataJSON = "";
    let saveState = 'idle';
    let showDiscardModal = false;
    let dropdownSearch = "";
    
    let currentSuffixLabel = "";
    let displayName = "";
    let aliases = "";
    let imageUrl = "";

    let pairingGroups = [];
    let activeButtons = [];
    let sub_recAccessories = [null, null];
    let sub_optAccessories = [];
    let sub_formations = [];

    let activeTemplateIdx = 0;
    let sortedTemplates = [];
    let isMainTemplate = true;
    
    let openDropdownId = null;
    let showAddBuildModal = false;
    let newBuildButtonKey = "";
    let newBuildLabel = "";

    $: currentSnapshot = JSON.stringify({
        displayName,
        aliases,
        imageUrl,
        pairingGroups,
        activeButtons,
        sub_recAccessories,
        sub_optAccessories,
        sub_formations,
        isMainTemplate
    });
    $: isLocalDirty = initialJSON && currentSnapshot && initialJSON !== currentSnapshot;
    $: isGlobalDirty = originalCommanderDataJSON && JSON.stringify(commanderData) !== originalCommanderDataJSON;
    $: hasUnsavedChanges = isLocalDirty || isGlobalDirty;

    $: accessoriesList = emojiData.accessories || [];
    $: formationsList = emojiData.formations || [];
    $: buttonsList = emojiData.buttons || [];
    $: sortedCommanders = (emojiData.commanders || []).sort((a,b) => a.name.localeCompare(b.name));

    function portal(node) {
        let owner = document.body;
        owner.appendChild(node);
        return {
            destroy() { if (node.parentNode) node.parentNode.removeChild(node);
            }
        };
    }

    onMount(async () => {
        originalCommanderDataJSON = JSON.stringify(commanderData);
        sortAndLoad();
    });

    function sortAndLoad() {
        const safeData = Array.isArray(commanderData) ? commanderData : [];
        sortedTemplates = [...safeData].sort((a, b) => {
            if (a.name === commanderId) return -1;
            if (b.name === commanderId) return 1;
            return a.name.localeCompare(b.name);
        });
        if (aliasData) {
            displayName = aliasData.display_name || "";
            aliases = (aliasData.aliases || []).join(", ");
        }
        
        if (activeTemplateIdx >= sortedTemplates.length) activeTemplateIdx = 0;
        loadTemplate(activeTemplateIdx);
    }

    async function loadTemplate(idx) {
        activeTemplateIdx = idx;
        const template = sortedTemplates[idx];
        isMainTemplate = template.name === commanderId;

        if (!template?.json?.embeds?.[0]) return;
        const embed = template.json.embeds[0];

        imageUrl = embed.image?.url || "";

        if (isMainTemplate) {
            currentSuffixLabel = "";
            parseMainTemplate(template.json);
        } else {
            if (embed.title && embed.title.startsWith(displayName)) {
                currentSuffixLabel = embed.title.replace(displayName, '').trim();
            } else {
                currentSuffixLabel = embed.title || "";
            }
            parseSubTemplate(embed);
        }

        await tick();
        initialJSON = currentSnapshot;
    }

    function parseMainTemplate(json) {
        const embed = json.embeds[0];
        if (embed.fields) {
            pairingGroups = embed.fields.map((field, fIdx) => {
                const title = field.name.replace(/^`|`$/g, '');
                const lines = Array.isArray(field.value) ? field.value : field.value.split('\n');
                const rows = lines.map((line, rIdx) => {
                    const parsed = parseDiscordLine(line);
                    return { ...parsed, id: `row-${fIdx}-${rIdx}-${Date.now()}` };
                });
                return { id: `group-${fIdx}-${Date.now()}`, title, rows };
            });
        } else {
            pairingGroups = [];
        }
        if (pairingGroups.length === 0) {
            pairingGroups = [{ id: `new-group-${Date.now()}`, title: "Field Pairings", rows: [] }];
        }

        activeButtons = [];
        if (json.components && json.components[0] && json.components[0].components) {
            activeButtons = json.components[0].components.map((btn, idx) => {
                const match = buttonsList.find(b => b.emoji === btn.emoji?.id);
                return {
                    id: Date.now() + idx,
                    typeKey: match ? match.key : '', 
                    label: btn.label,
                    emoji: btn.emoji,
                    custom_id: btn.custom_id,
                    original_custom_id: btn.custom_id
                };
            });
        }
    }

    function parseSubTemplate(embed) {
        sub_recAccessories = [null, null];
        sub_optAccessories = [];
        sub_formations = [];

        if (!embed.fields) return;

        const recField = embed.fields.find(f => f.name.includes("Recommended Accessories"));
        if (recField) {
            const val = Array.isArray(recField.value) ? recField.value[0] : recField.value;
            const matches = [...val.matchAll(/<:[^:]+:(\d+)>/g)];
            if (matches.length >= 2) {
                 sub_recAccessories[0] = findKeyByEmojiId(matches[1]?.[1], accessoriesList);
                 sub_recAccessories[1] = findKeyByEmojiId(matches[2]?.[1], accessoriesList);
            }
        }

        const optField = embed.fields.find(f => f.name.includes("Optional Accessories"));
        if (optField && Array.isArray(optField.value)) {
            sub_optAccessories = optField.value.map(line => {
                const match = line.match(/<:[^:]+:(\d+)>/g);
                if (match && match[1]) {
                    const id = match[1].split(':')[2].replace('>', '');
                    return findKeyByEmojiId(id, accessoriesList);
                }
                return null;
            }).filter(k => k);
        }

        const formField = embed.fields.find(f => f.name.includes("Recommended Formations"));
        if (formField && Array.isArray(formField.value)) {
             sub_formations = formField.value.map(line => {
                const match = line.match(/<:[^:]+:(\d+)>/g);
                if (match && match[1]) {
                    const id = match[1].split(':')[2].replace('>', '');
                    return findKeyByEmojiId(id, formationsList);
                }
                return null;
            }).filter(k => k);
        }
    }

    function findKeyByEmojiId(id, list) {
        const found = list.find(x => x.emoji === id);
        return found ? found.key : null;
    }

    function parseDiscordLine(line) {
        let cleanLine = line.replace(BULLET_POINT, '').trim();
        if (cleanLine.includes(SEPARATOR)) {
            const [part1, part2] = cleanLine.split(SEPARATOR);
            return { type: 'pair', cmd1: findCommanderId(part1), cmd2: findCommanderId(part2), customText: '' };
        } 
        const singleId = findCommanderId(cleanLine);
        if (singleId) return { type: 'pair', cmd1: singleId, cmd2: null, customText: '' };
        return { type: 'custom', cmd1: null, cmd2: null, customText: cleanLine };
    }

    function findCommanderId(str) {
        if (!str) return null;
        const emojiMatch = str.match(/:(\d+)>/);
        if (emojiMatch) {
            const entry = emojiData?.commanders?.find(e => e.emoji === emojiMatch[1]);
            if (entry) return entry.key;
        }
        return null;
    }

    function formatRow(row) {
        if (row.type === 'custom') return `${BULLET_POINT} ${row.customText}`;
        let text = `${BULLET_POINT} `;
        if (row.cmd1) {
            const c1 = emojiData.commanders.find(e => e.key === row.cmd1);
            if (c1) text += `${c1.name} <:${c1.key}:${c1.emoji}>`;
        }
        if (row.cmd2) {
            const c2 = emojiData.commanders.find(e => e.key === row.cmd2);
            if (c2) text += `${SEPARATOR}${c2.name} <:${c2.key}:${c2.emoji}>`;
        }
        return text;
    }

    function formatItemString(key, list) {
        const item = list.find(i => i.key === key);
        if (!item) return "Unknown";
        return `${item.name} <:${item.key}:${item.emoji}>`;
    }

    function handleButtonTypeChange(btnIdx, newTypeKey) {
        const btnConfig = buttonsList.find(b => b.key === newTypeKey);
        if (!btnConfig) return;

        const btn = activeButtons[btnIdx];
        const newSuffix = newTypeKey.replace('btn_', '');
        
        btn.typeKey = newTypeKey;
        btn.emoji = { id: btnConfig.emoji, name: btnConfig.name };
        
        let baseId = `${commanderId}_${newSuffix}`;
        let finalId = baseId;
        let counter = 2;
        while(commanderData.some(c => c.name === finalId && c.name !== btn.custom_id)) {
             finalId = `${baseId}_${counter}`;
             counter++;
        }
        btn.custom_id = finalId;

        if (!btn.label || btn.label === "New Build") btn.label = btnConfig.name;
        activeButtons = [...activeButtons];
    }

    function deleteButton(btnIdx) {
        if(confirm("Deleting this button will unlink the build, but the sub-template data may remain until manually removed. Continue?")) {
            activeButtons = activeButtons.filter((_, i) => i !== btnIdx);
        }
    }

    function commitCurrentState() {
        if (!sortedTemplates[activeTemplateIdx]) return;
        const currentTmplName = sortedTemplates[activeTemplateIdx].name;
        
        let dataIndex = commanderData.findIndex(t => t.name === currentTmplName);
        if (dataIndex === -1) return;
        
        let tmpl = commanderData[dataIndex];
        const embed = tmpl.json.embeds[0];
        embed.image = { url: imageUrl };

        if (isMainTemplate) {
            embed.title = displayName;
            embed.color = parseInt(FIXED_MAIN_COLOR.replace('#', ''), 16);
            embed.author = { name: AUTHOR_NAME, icon_url: AUTHOR_ICON };
            embed.footer = { text: MAIN_FOOTER, icon_url: AUTHOR_ICON };
            
            embed.fields = pairingGroups.map(group => ({
                name: `\`${group.title}\``,
                value: group.rows.map(row => formatRow(row)),
                inline: false
            }));

            const newComponents = activeButtons.map(btn => ({
                type: 2,
                style: 2,
                label: btn.label,
                custom_id: btn.custom_id,
                emoji: btn.emoji
            }));

            if (newComponents.length > 0) {
                tmpl.json.components = [{ type: 1, components: newComponents }];
            } else {
                delete tmpl.json.components;
            }
        } else {
            embed.title = `${displayName} ${currentSuffixLabel}`;
            embed.color = parseInt(FIXED_SUB_COLOR.replace('#', ''), 16);
            delete embed.footer; 
            delete embed.author;

            const fields = [];
            if (sub_recAccessories[0] || sub_recAccessories[1]) {
                const acc1 = sub_recAccessories[0] ? formatItemString(sub_recAccessories[0], accessoriesList) : "None";
                const acc2 = sub_recAccessories[1] ? formatItemString(sub_recAccessories[1], accessoriesList) : "None";
                fields.push({
                    name: "`Recommended Accessories`",
                    value: `${BULLET_POINT} ${acc1} + ${acc2}`,
                    inline: false
                });
            }
            if (sub_optAccessories.length > 0) {
                fields.push({
                    name: "`Optional Accessories`",
                    value: sub_optAccessories.map(k => `${BULLET_POINT} ${formatItemString(k, accessoriesList)}`),
                    inline: false
                });
            }
            if (sub_formations.length > 0) {
                fields.push({
                    name: "`Recommended Formations`",
                    value: sub_formations.map(k => `${BULLET_POINT} ${formatItemString(k, formationsList)}`),
                    inline: false
                });
            }
            embed.fields = fields;
        }

        if (aliasData) {
            aliasData.display_name = displayName;
            aliasData.aliases = aliases.split(',').map(s => s.trim()).filter(s => s);
        }
    }

    function save() {
        commitCurrentState();
        saveState = 'saving';
        
        dispatch('save', { 
            commanderId, 
            data: commanderData,
            aliasData: aliasData,
            callback: (success) => {
                if (success) {
                    saveState = 'success';
                    initialJSON = currentSnapshot; 
                    setTimeout(() => {
                        saveState = 'idle';
                    }, 2000);
                } else {
                    saveState = 'idle';
                    alert("Save failed. Please check console.");
                }
            }
        });
    }

    function handleAddBuild() {
        if (!newBuildButtonKey) return;
        const btnConfig = buttonsList.find(b => b.key === newBuildButtonKey);
        if (!btnConfig) return;

        commitCurrentState();

        const suffix = newBuildButtonKey.replace('btn_', '');
        let baseName = `${commanderId}_${suffix}`;
        let newTemplateName = baseName;
        
        let counter = 2;
        while(commanderData.some(t => t.name === newTemplateName)) {
            newTemplateName = `${baseName}_${counter}`;
            counter++;
        }

        const newTemplate = {
            name: newTemplateName,
            json: {
                embeds: [{
                    title: `${displayName} ${newBuildLabel || btnConfig.name}`,
                    color: FIXED_SUB_COLOR,
                    image: { url: "" },
                    fields: []
                }]
            }
        };

        activeButtons = [...activeButtons, {
            id: Date.now(),
            typeKey: newBuildButtonKey,
            label: newBuildLabel || btnConfig.name,
            emoji: { id: btnConfig.emoji, name: btnConfig.name },
            custom_id: newTemplateName,
            original_custom_id: newTemplateName
        }];

        commanderData = [...commanderData, newTemplate];

        commitCurrentState();
        
        showAddBuildModal = false;
        newBuildButtonKey = "";
        newBuildLabel = "";
        sortAndLoad();
        alert("Build added! Configure the button below or switch tabs to edit the build details.");
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = "";
        openDropdownId = openDropdownId === id ? null : id;
        
        if (openDropdownId) {
             setTimeout(() => {
                 const input = document.querySelector('.dropdown-search-input');
                 if (input) input.focus();
             }, 50);
        }
    }

    function handleWindowClick() {
        openDropdownId = null;
    }
    
    function handleSearchClick(event) {
        event.stopPropagation();
    }

    function handleKeyEnter(event, callback) {
        if (event.key === 'Enter') {
            event.preventDefault();
            callback(event);
        }
    }

    function attemptClose() {
        if (hasUnsavedChanges) {
            showDiscardModal = true;
        } else {
            dispatch('close');
        }
    }

    function getCmdIcon(key) {
        const c = emojiData.commanders.find(e => e.key === key);
        return c ? `https://cdn.discordapp.com/emojis/${c.emoji}.png` : null;
    }
    function getCmdName(key) {
        const c = emojiData.commanders.find(e => e.key === key);
        return c ? c.name : 'Select...';
    }

    function getAccessoryIcon(key) {
        const a = accessoriesList.find(i => i.key === key);
        return a ? `https://cdn.discordapp.com/emojis/${a.emoji}.png` : '';
    }
    function getAccessoryName(key) {
        const a = accessoriesList.find(i => i.key === key);
        return a ? a.name : 'Select Accessory';
    }
    function getFormationIcon(key) {
        const f = formationsList.find(i => i.key === key);
        return f ? `https://cdn.discordapp.com/emojis/${f.emoji}.png` : '';
    }
    function getFormationName(key) {
        const f = formationsList.find(i => i.key === key);
        return f ? f.name : 'Select Formation';
    }

    let previewPairingGroups = [];
    $: if (isMainTemplate) {
        previewPairingGroups = pairingGroups;
    } else {
        const groups = [];
        if (sub_recAccessories[0] || sub_recAccessories[1]) {
            const acc1 = sub_recAccessories[0] ? `${getAccessoryName(sub_recAccessories[0])} <img src="${getAccessoryIcon(sub_recAccessories[0])}" class="emoji inline">` : "None";
            const acc2 = sub_recAccessories[1] ? `${getAccessoryName(sub_recAccessories[1])} <img src="${getAccessoryIcon(sub_recAccessories[1])}" class="emoji inline">` : "None";
            groups.push({
                title: "Recommended Accessories",
                rows: [{ type: 'custom', customText: `${acc1} + ${acc2}` }]
            });
        }
        if (sub_optAccessories.length > 0) {
            const rows = sub_optAccessories.map(k => ({
                type: 'custom',
                customText: `${getAccessoryName(k)} <img src="${getAccessoryIcon(k)}" class="emoji inline">`
            }));
            groups.push({ title: "Optional Accessories", rows });
        }
        if (sub_formations.length > 0) {
            const rows = sub_formations.map(k => ({
                type: 'custom',
                customText: `${getFormationName(k)} <img src="${getFormationIcon(k)}" class="emoji inline">`
            }));
            groups.push({ title: "Recommended Formations", rows });
        }
        previewPairingGroups = groups;
    }

</script>

<svelte:window on:click={handleWindowClick} />

<div 
    class="editor-overlay" 
    use:portal 
    role="button"
    tabindex="0"
    on:click|self={attemptClose}
    on:keydown={(e) => handleKeyEnter(e, attemptClose)}
>
    <div class="editor-modal" role="dialog" aria-modal="true">
        <div class="editor-header">
            <h2>Edit: {displayName || commanderId}</h2>
            <div class="header-actions">
                <button class="close-btn" aria-label="Close Editor" on:click={attemptClose}><i class="fas fa-times"></i></button>
            </div>
        </div>

        <div class="editor-body">
            <div class="form-column">
                
                <div class="section-box">
                    <h3><i class="fas fa-id-card"></i> Commander Details</h3>
                    <div class="row">
                        <div class="form-group">
                            <label for="disp-name">Display Name</label>
                            <input id="disp-name" type="text" bind:value={displayName} />
                        </div>
                        <div class="form-group">
                            <label for="aliases">Aliases</label>
                            <input id="aliases" type="text" bind:value={aliases} />
                        </div>
                    </div>
                </div>

                <div class="template-selector-container">
                    <div class="template-selector">
                        {#each sortedTemplates as t, idx}
                            <label>
                                <input type="radio" name="template" checked={activeTemplateIdx === idx} on:change={() => {
                                    commitCurrentState();
                                    loadTemplate(idx);
                                }}>
                                <span class="template-btn" class:is-main={t.name === commanderId}>
                                    {t.name === commanderId ? 'Main' : t.name.replace(commanderId + '_', '').toUpperCase()}
                                </span>
                            </label>
                        {/each}
                    </div>
                    {#if isMainTemplate}
                        <button class="add-build-btn" on:click={() => { showAddBuildModal = true; newBuildButtonKey = ""; newBuildLabel = ""; }}>
                            <i class="fas fa-plus-circle"></i> Add Build
                        </button>
                    {/if}
                </div>

                <div class="section-box" style="flex:1;">
                    <h3>
                        <i class="fas {isMainTemplate ? 'fa-star' : 'fa-puzzle-piece'}"></i> 
                        {isMainTemplate ? 'Main Template Config' : 'Sub-Template Config'}
                    </h3>

                    <div class="form-group">
                        <label for="img-url">Embed Image URL</label>
                        <input id="img-url" type="text" 
                        bind:value={imageUrl} placeholder="https://..." />
                    </div>

                    <div class="spacer"></div>

                    {#if isMainTemplate}
                        <div class="groups-container">
                             {#each pairingGroups as group, gIdx (group.id)}
                                <div class="pairing-group">
                                     <div class="group-header">
                                         <input type="text" aria-label="Group Title" class="group-title-input" bind:value={group.title} />
                                         <button class="btn-icon danger" aria-label="Delete Group" on:click={() => pairingGroups = pairingGroups.filter((_, i) => i !== gIdx)}><i class="fas fa-trash"></i></button>
                                     </div>
                                    <div class="rows-container">
                                        
                                        {#each group.rows as row, rIdx (row.id)}
                                             <div class="pairing-row">
                                             
                                                <div class="row-type-toggle">
                                                    <button aria-label="Pair Mode" class:active={row.type === 'pair'} on:click={() => row.type = 'pair'}><i class="fas fa-user-friends"></i></button>
                                                    <button aria-label="Custom Text Mode" class:active={row.type === 'custom'} on:click={() => row.type = 'custom'}><i class="fas fa-quote-right"></i></button>
                                                </div>

                                                <div class="row-content">
                                                    {#if row.type === 'pair'}
               
                                                       <div class="custom-select">
                                                             <div class="select-trigger" 
                                                                 role="button" 
                                                                 tabindex="0"
                                                                 on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`g${gIdx}r${rIdx}s1`, ev))}
                                                                on:click={(e) => toggleDropdown(`g${gIdx}r${rIdx}s1`, e)}>
                                                                {#if row.cmd1}
                                                                    <div class="trigger-content">
                                                                        <img src={getCmdIcon(row.cmd1)} alt="" class="select-icon">
                                                                        <span>{getCmdName(row.cmd1)}</span>
                                                                    </div>
                                                                 {:else}
                                                                    <span class="placeholder">Select...</span>
                                                                 {/if}
                                                             </div>
                        
                                                            {#if openDropdownId === `g${gIdx}r${rIdx}s1`}
                                                              <div class="select-options">
                                                                     <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                                        <input type="text" class="dropdown-search-input" placeholder="Search Commander..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                                    </div>
                                                                     
                                                                     {#each sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as c}
                                                                        <div class="option" 
                                                                            role="button" 
                                                                             tabindex="0"
                                                                             on:keydown={(e) => handleKeyEnter(e, () => { 
                                                                                row.cmd1 = c.key;
                                                                                openDropdownId = null;
                                                                                pairingGroups = pairingGroups; 
                                                                            })}
                                                                            on:click={() => { 
                                                                                row.cmd1 = c.key;
                                                                                openDropdownId = null; 
                                                                                pairingGroups = pairingGroups; 
                                                                            }}>
                                                                            <img src={`https://cdn.discordapp.com/emojis/${c.emoji}.png`} alt="" class="select-icon"> {c.name}
                                                                         </div>
                                                                     {/each}
                                                                    {#if sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0}
                                                                        <div class="option disabled" style="opacity: 0.6; cursor: default;">No results</div>
                                                                     {/if}
                                                              </div>
                                                            {/if}
                                                        </div>
  
                                                    <span class="sep">|</span>
                                                    
                                                    <div class="custom-select">
                                                         <div class="select-trigger" 
                                                                 role="button" 
                                                                 tabindex="0"
                                                                  on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`g${gIdx}r${rIdx}s2`, ev))}
                                                                 on:click={(e) => toggleDropdown(`g${gIdx}r${rIdx}s2`, e)}>
                                                                {#if row.cmd2}
                                                                    <div class="trigger-content">
                                                                        <img src={getCmdIcon(row.cmd2)} alt="" class="select-icon">
                                                                        <span>{getCmdName(row.cmd2)}</span>
                                                                    </div>
                                                                 {:else}
                                                                   <span class="placeholder">Select...</span>
                                                                 {/if}
                                                             </div>
              
                                                        {#if openDropdownId === `g${gIdx}r${rIdx}s2`}
                                                            <div class="select-options">
                                                                <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                                    <input type="text" class="dropdown-search-input" placeholder="Search Commander..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                                </div>

                                                                {#each sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as c}
                                                                    <div class="option" 
                                                                        role="button" 
                                                                         tabindex="0"
                                                                         on:keydown={(e) => handleKeyEnter(e, () => { 
                                                                                row.cmd2 = c.key;
                                                                                openDropdownId = null; 
                                                                                pairingGroups = pairingGroups;
                                                                            })}
                                                                            on:click={() => { 
                                                                                row.cmd2 = c.key;
                                                                                openDropdownId = null; 
                                                                                pairingGroups = pairingGroups;
                                                                            }}>
                                                                            <img src={`https://cdn.discordapp.com/emojis/${c.emoji}.png`} alt="" class="select-icon"> {c.name}
                                                                     </div>
                                                                 {/each}
                                                                {#if sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0}
                                                                    <div class="option disabled" style="opacity: 0.6; cursor: default;">No results</div>
                                                                 {/if}
                                                            </div>
                                                           {/if}
                                                    </div>
                                                      {:else}
                                                        <input type="text" aria-label="Custom text" class="custom-text-input" bind:value={row.customText} />
                                                    {/if}
                                                </div>
                                                <button class="btn-icon" aria-label="Remove Row" on:click={() => { 
                                                    group.rows = group.rows.filter((_, i) => i !== rIdx);
                                                    pairingGroups = pairingGroups;
                                                }}><i class="fas fa-minus"></i></button>
                                            </div>
                                        {/each}
                                     
                                    <button class="add-btn-modern" on:click={() => { 
                                       group.rows = [...group.rows, { id: Date.now(), type: 'pair', cmd1: null, cmd2: null }];
                                       pairingGroups = pairingGroups;
                                    }}>+ Add Row</button>
                                    </div>
                                </div>
                             {/each}
                            <button class="add-btn-modern group-add" on:click={() => pairingGroups = [...pairingGroups, { id: Date.now(), title: "New Group", rows: [] }]}>+ Add Group</button>
                        </div>
               
                        <div class="spacer"></div>
                        <h3><i class="fas fa-gamepad"></i> Button Configuration</h3>
                        <div class="buttons-config">
                             {#each activeButtons as btn, idx (btn.id)}
                                <div class="pairing-row">
                                     <div class="custom-select" style="flex: 0 0 160px;">
                                         <div class="select-trigger" 
                                             role="button" 
                                              tabindex="0"
                                             on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`btnType${idx}`, ev))}
                                              on:click={(e) => toggleDropdown(`btnType${idx}`, e)}>
                                            <div class="trigger-content">
                                                {#if btn.emoji}
                                                    <img src={`https://cdn.discordapp.com/emojis/${btn.emoji.id}.png`} alt="" class="select-icon">
                                                {/if}
                                                <span>{buttonsList.find(b => b.key === btn.typeKey)?.name || 'Select Type'}</span>
                                            </div>
                                        </div>
               
                                        {#if openDropdownId === `btnType${idx}`}
                                            <div class="select-options">
                                                 {#each buttonsList as b}
                                                    <div class="option" 
                                                          role="button" 
                                                          tabindex="0"
                                                         on:keydown={(e) => handleKeyEnter(e, () => { handleButtonTypeChange(idx, b.key); openDropdownId = null; })}
                                                         on:click={() => { handleButtonTypeChange(idx, b.key); openDropdownId = null; }}>
                                                        <img src={`https://cdn.discordapp.com/emojis/${b.emoji}.png`} alt="" class="select-icon"> {b.name}
                                                     </div>
                                                {/each}
                                             </div>
                                        {/if}
                                    </div>

                                     <div class="form-group" style="flex:1;">
                                        <input type="text" aria-label="Button Label" class="custom-text-input" placeholder="Label" bind:value={btn.label} />
                                     </div>

                                    <button class="btn-icon danger" aria-label="Delete Button" on:click={() => deleteButton(idx)}><i class="fas fa-trash"></i></button>
                                </div>
                                {/each}
                            {#if activeButtons.length === 0}
                                <div style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem; padding: 10px;">No buttons configured. Add a build above.</div>
                            {/if}
                        </div>

                    {:else}
                 
                        <div class="sub-field-group">
                            <div class="group-label">Recommended Accessories</div>
                            <div class="row">
                                 <div class="custom-select">
                                    <div class="select-trigger" 
                                         role="button" 
                                          tabindex="0"
                                         on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown('recAcc1', ev))}
                                          on:click={(e) => toggleDropdown('recAcc1', e)}>
                                          <div class="trigger-content">
                                             {#if sub_recAccessories[0]}
                                                 {getAccessoryName(sub_recAccessories[0])} <img src={getAccessoryIcon(sub_recAccessories[0])} alt="" class="select-icon">
                                             {:else}
                                                <span class="placeholder">Accessory 1</span>
                                            {/if}
                                        </div>
                                         <i class="fas fa-chevron-down"></i>
                                     </div>
                                     {#if openDropdownId === 'recAcc1'}
                                         <div class="select-options">
                                            <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                  <input type="text" class="dropdown-search-input" placeholder="Search Accessory..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                            </div>

                                           <div class="option" 
                                                 role="button" 
                                                  tabindex="0"
                                                 on:keydown={(e) => handleKeyEnter(e, () => { 
                                                      sub_recAccessories[0] = null; 
                                                     openDropdownId = null; 
                                                     sub_recAccessories = sub_recAccessories;
                                                 })}
                                                 on:click={() => { 
                                                     sub_recAccessories[0] = null;
                                                     openDropdownId = null; 
                                                     sub_recAccessories = sub_recAccessories;
                                                }}>None</div>
                                            {#each accessoriesList.filter(a => a.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as a}
                                                <div class="option" 
                                                   role="button" 
                                                   tabindex="0"
                                                   on:keydown={(e) => handleKeyEnter(e, () => { 
                                                          sub_recAccessories[0] = a.key; 
                                                          openDropdownId = null; 
                                                          sub_recAccessories = sub_recAccessories;
                                                    })}
                                                    on:click={() => { 
                                                          sub_recAccessories[0] = a.key;
                                                         openDropdownId = null; 
                                                         sub_recAccessories = sub_recAccessories;
                                                    }}>
                                                    <img src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`} alt="" class="select-icon"> {a.name}
                                                 </div>
                                            {/each}
                                        </div>
                                     {/if}
                                </div>
                                <span class="sep">+</span>
  
                                 <div class="custom-select">
                                      <div class="select-trigger" 
                                          role="button" 
                                         tabindex="0"
                                         on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown('recAcc2', ev))}
                                          on:click={(e) => toggleDropdown('recAcc2', e)}>
                                         <div class="trigger-content">
                                             {#if sub_recAccessories[1]}
                                                {getAccessoryName(sub_recAccessories[1])} <img src={getAccessoryIcon(sub_recAccessories[1])} alt="" class="select-icon">
                                             {:else}
                                                 <span class="placeholder">Accessory 2</span>
                                             {/if}
                                         </div>
                                        <i class="fas fa-chevron-down"></i>
                                     </div>
                                  
                                     {#if openDropdownId === 'recAcc2'}
                                        <div class="select-options">
                                            <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                <input type="text" class="dropdown-search-input" placeholder="Search Accessory..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                            </div>
  
                                           <div class="option" 
                                                 role="button" 
                                                  tabindex="0"
                                                 on:keydown={(e) => handleKeyEnter(e, () => { 
                                                      sub_recAccessories[1] = null;
                                                     openDropdownId = null; 
                                                     sub_recAccessories = sub_recAccessories;
                                                 })}
                                                 on:click={() => { 
                                                      sub_recAccessories[1] = null;
                                                     openDropdownId = null; 
                                                     sub_recAccessories = sub_recAccessories;
                                                }}>None</div>
                                            {#each accessoriesList.filter(a => a.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as a}
                                                <div class="option" 
                                                   role="button" 
                                                   tabindex="0"
                                                   on:keydown={(e) => handleKeyEnter(e, () => { 
                                                          sub_recAccessories[1] = a.key; 
                                                          openDropdownId = null; 
                                                          sub_recAccessories = sub_recAccessories;
                                                    })}
                                                    on:click={() => { 
                                                          sub_recAccessories[1] = a.key;
                                                         openDropdownId = null; 
                                                         sub_recAccessories = sub_recAccessories;
                                                    }}>
                                                    <img src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`} alt="" class="select-icon"> {a.name}
                                                 </div>
                                            {/each}
                                        </div>
                                     {/if}
                                </div>
                            </div>
                         </div>

                         <div class="sub-field-group">
                            <div class="group-label">Optional Accessories</div>
                            {#each sub_optAccessories as accKey, idx}
                                 <div class="pairing-row">
                                     <div class="custom-select">
                                          <div class="select-trigger" 
                                              role="button" 
                                              tabindex="0"
                                             on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`optAcc${idx}`, ev))}
                                             on:click={(e) => toggleDropdown(`optAcc${idx}`, e)}>
                                              <div class="trigger-content">
                                                {getAccessoryName(accKey)} <img src={getAccessoryIcon(accKey)} alt="" class="select-icon">
                                              </div>
                                        </div>
               
                                        {#if openDropdownId === `optAcc${idx}`}
                                            <div class="select-options">
                                                 <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                    <input type="text" class="dropdown-search-input" placeholder="Search Accessory..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                </div>

                                                {#each accessoriesList.filter(a => a.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as a}
                                                    <div class="option" 
                                                          role="button" 
                                                         tabindex="0"
                                                          on:keydown={(e) => handleKeyEnter(e, () => { 
                                                             sub_optAccessories[idx] = a.key;
                                                             openDropdownId = null; 
                                                             sub_optAccessories = sub_optAccessories;
                                                         })}
                                                         on:click={() => { 
                                                              sub_optAccessories[idx] = a.key;
                                                             openDropdownId = null; 
                                                             sub_optAccessories = sub_optAccessories;
                                                         }}>
                                                        <img src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`} alt="" class="select-icon"> {a.name}
                                                     </div>
                                                {/each}
                                             </div>
                                        {/if}
                                    </div>
              
                                     <button class="btn-icon" aria-label="Delete Accessory" on:click={() => { 
                                        sub_optAccessories = sub_optAccessories.filter((_, i) => i !== idx);
                                    }}><i class="fas fa-trash"></i></button>
                                </div>
                            {/each}
      
                             <button class="add-btn-modern" on:click={() => sub_optAccessories = [...sub_optAccessories, accessoriesList[0].key]}>+ Add Accessory</button>
                        </div>

                        <div class="sub-field-group">
                             <div class="group-label">Recommended Formations</div>
                             {#each sub_formations as formKey, idx}
                                <div class="pairing-row">
                                     <div class="custom-select">
                                         <div class="select-trigger" 
                                             role="button" 
                                              tabindex="0"
                                             on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`form${idx}`, ev))}
                                              on:click={(e) => toggleDropdown(`form${idx}`, e)}>
                                              <div class="trigger-content">
                                                 {getFormationName(formKey)} <img src={getFormationIcon(formKey)} alt="" class="select-icon">
                                              </div>
                                         </div>
                        
                                     {#if openDropdownId === `form${idx}`}
                                             <div class="select-options">
                                                <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                     <input type="text" class="dropdown-search-input" placeholder="Search Formation..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                </div>

                                                 {#each formationsList.filter(f => f.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as f}
                                                   <div class="option" 
                                                          role="button" 
                                                         tabindex="0"
                                                           on:keydown={(e) => handleKeyEnter(e, () => { 
                                                              sub_formations[idx] = f.key;
                                                             openDropdownId = null; 
                                                             sub_formations = sub_formations;
                                                         })}
                                                         on:click={() => { 
                                                              sub_formations[idx] = f.key;
                                                             openDropdownId = null; 
                                                             sub_formations = sub_formations;
                                                         }}>
                                                        <img src={`https://cdn.discordapp.com/emojis/${f.emoji}.png`} alt="" class="select-icon"> {f.name}
                                                     </div>
                                                {/each}
                                             </div>
                                        {/if}
                                    </div>
              
                                     <button class="btn-icon" aria-label="Delete Formation" on:click={() => { 
                                        sub_formations = sub_formations.filter((_, i) => i !== idx);
                                    }}><i class="fas fa-trash"></i></button>
                                </div>
                            {/each}
      
                             <button class="add-btn-modern" on:click={() => sub_formations = [...sub_formations, formationsList[0].key]}>+ Add Formation</button>
                        </div>
                    {/if}
                </div>
         
            </div>

            <div class="preview-column">
                <h3>Live Discord Preview</h3>
                <div class="preview-container">
                    <DiscordEmbedPreview 
                        {displayName}
                        embedColor={isMainTemplate ? FIXED_MAIN_COLOR : FIXED_SUB_COLOR}
                        {imageUrl}
                        pairingGroups={previewPairingGroups}
                        {isMainTemplate}
                        {emojiData}
                        {user}
                        suffixLabel={currentSuffixLabel} 
                        buttons={activeButtons} 
                    />
                </div>
             </div>
        </div>
    </div>
    
    {#if hasUnsavedChanges || saveState === 'saving' || saveState === 'success'}
        <div class="save-bar" transition:fly={{ y: 50, duration: 300 }}>
            <div class="save-bar-content">
                {#if saveState === 'success'}
                    <span style="color: #4ade80;"><i class="fas fa-check-circle"></i> Saved Successfully!</span>
                {:else}
                     <span>You have unsaved changes.</span>
                    <div class="save-actions">
                        <button class="btn-discard" on:click={attemptClose} disabled={saveState === 'saving'}>Discard</button>
                        <button class="btn-calculate" on:click={save} disabled={saveState === 'saving'}>
                             {#if saveState === 'saving'}
                                <i class="fas fa-spinner fa-spin"></i>
                            {:else}
                                 Save Changes
                            {/if}
                        </button>
                    </div>
                 {/if}
            </div>
        </div>
    {/if}

    {#if showDiscardModal}
        <div class="modal-backdrop" 
            role="button" 
            tabindex="0" 
            on:click|self={() => showDiscardModal = false} 
             on:keydown={(e) => { if (e.key === 'Escape') showDiscardModal = false; }}
        >
            <div class="modal" role="dialog" aria-modal="true">
                <h3>Discard Changes?</h3>
                <p>You have unsaved changes. Are you sure you want to discard them?</p>
                <div class="modal-actions">
                    <button class="btn-cancel" on:click={() => showDiscardModal = false}>Cancel</button>
                    <button class="btn-danger" on:click={() => dispatch('close')}>Discard</button>
                </div>
             </div>
        </div>
    {/if}

    {#if showAddBuildModal}
        <div class="modal-backdrop" 
            role="button" 
            tabindex="0" 
            on:click|self={() => showAddBuildModal = false} 
            on:keydown={(e) => handleKeyEnter(e, () => showAddBuildModal = false)}
        >
             <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
                <h3>Add New Build Template</h3>
                <div class="form-group">
                    <label>
                        Select Button Type
                         <select bind:value={newBuildButtonKey}>
                             <option value="" disabled>Select a button...</option>
                             {#each buttonsList as btn}
                                 <option value={btn.key}>{btn.name}</option>
                            {/each}
                        </select>
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        Button Label (Optional)
                        <input type="text" bind:value={newBuildLabel} placeholder="e.g. OpenField" />
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" on:click={() => showAddBuildModal = false}>Cancel</button>
                    <button class="btn-save" disabled={!newBuildButtonKey} on:click={handleAddBuild}>Create</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .editor-modal { 
        background: var(--bg-secondary); width: 95%; max-width: 1100px; height: 90vh; 
        border-radius: 12px; display: flex; flex-direction: column; 
        overflow: hidden; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid var(--border-color); 
        position: relative;
    }
    .editor-header { 
        padding: 15px 20px; border-bottom: 1px solid var(--border-color);
        display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary);
    }
    .editor-header h2 { margin: 0; font-size: 1.25rem; color: var(--text-primary); }
    .close-btn { background: none; border: none; color: var(--text-secondary); font-size: 1.25rem; cursor: pointer; }
    .editor-body { display: flex; flex: 1; overflow: hidden; }
    .form-column { flex: 1; padding: 20px; overflow-y: auto; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px; min-width: 500px; }
    .preview-column { flex: 0 0 480px; padding: 20px; background: #313338; display: flex; flex-direction: column; border-left: 1px solid #000; }
    .section-box { background: var(--bg-primary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 15px; }
    .section-box h3 { margin: 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
    .row { display: flex; gap: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .form-group label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; }
    input[type="text"] { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px; color: var(--text-primary); }
    .template-selector-container { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;}
    .template-selector { display: flex; gap: 5px; flex-wrap: wrap; }
    .template-selector label { position: relative; cursor: pointer; }
    .template-selector input { position: absolute; opacity: 0; width: 0; height: 0; }
    .template-btn { display: flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-hover); background-color: var(--bg-tertiary); font-weight: 600; color: #aaa; transition: all 0.2s ease; font-size: 0.8rem; }
    .template-selector input:checked + .template-btn { background-color: var(--accent-blue-light); border-color: var(--accent-blue); color: white; }
    .template-btn.is-main { border-color: #004cff; }
    .template-selector-container .add-build-btn {
        background: var(--accent-green); color: black; border: none;
        padding: 2px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; 
        display: flex; align-items: center; gap: 6px; font-size: 0.8rem; 
        height: 24px; line-height: 1.2; transition: all 0.2s ease;
    }
    .template-selector-container .add-build-btn i { font-size: 0.75rem; line-height: 1; }
    .custom-select { position: relative; flex: 1; min-width: 0; }
    .select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 4px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; }
    .select-options { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-top: 4px; }
    .option { display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; color: var(--text-secondary); font-size: 0.9rem; }
    .option:hover { background: var(--accent-blue-light); color: white; }
    .select-icon { width: 20px; height: 20px; object-fit: contain; }
    .trigger-content { display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; }
    .placeholder { color: var(--text-muted); font-size: 0.85rem; }
    .pairing-group { background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; margin-bottom: 10px; }
    .group-header { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .group-title-input { flex: 1; font-weight: bold; background: transparent; border: none; border-bottom: 1px dashed var(--border-color); border-radius: 0; padding-left: 0; }
    .pairing-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: var(--bg-primary); padding: 5px; border-radius: 4px; border: 1px solid var(--border-color); }
    .row-type-toggle { display: flex; background: var(--bg-tertiary); border-radius: 4px; border: 1px solid var(--border-color); }
    .row-type-toggle button { background: none; border: none; color: var(--text-secondary); padding: 5px 8px; cursor: pointer; opacity: 0.5; }
    .row-type-toggle button.active { background: var(--accent-blue); color: white; opacity: 1; }
    .row-content { flex: 1; display: flex; align-items: center; gap: 5px; min-width: 0; }
    .custom-text-input { width: 100%; }
    .sep { color: var(--text-secondary); opacity: 0.5; }
    .add-btn-modern { width: 100%; background: var(--bg-tertiary); border: 1px dashed var(--border-color); color: var(--text-secondary); padding: 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .add-btn-modern:hover { background: var(--bg-secondary); color: var(--accent-blue); border-color: var(--accent-blue); }
    .btn-icon { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; }
    .btn-icon:hover { color: var(--text-primary); }
    .btn-icon.danger:hover { color: #ff4444; }
    .sub-field-group { margin-bottom: 20px; }
    .sub-field-group .group-label { display: block; margin-bottom: 8px; font-weight: 600; color: var(--accent-blue); border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 4px; }
    .spacer { height: 10px; }
    .save-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 50px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); z-index: 1000; min-width: 350px; }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; width: 100%; }
    .save-bar span { font-weight: 500; color: white; }
    .save-actions { display: flex; gap: 10px; }
    .btn-calculate { background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); color: white; border: 2px solid #60a5fa; padding: 8px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    .btn-calculate:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
    .btn-calculate:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }
    .btn-discard { background: transparent; color: #ef4444; border: 2px solid #ef4444; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-discard:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-cancel:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
    
    .btn-save {
        background: linear-gradient(135deg, var(--accent-green), #10b981); 
        color: white; 
        border: none; 
        padding: 8px 20px; 
        border-radius: 4px; 
        font-weight: 600; 
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .btn-save:hover {
        transform: translateY(-1px);
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    }
    .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .modal { background: var(--bg-card); padding: 25px; border-radius: 8px; width: 400px; border: 1px solid var(--border-color); box-shadow: 0 4px 25px rgba(0,0,0,0.5); }
    .modal h3 { margin-top: 0; margin-bottom: 20px; color: var(--text-primary); }
    .modal select { width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .search-container { padding: 8px; background: var(--bg-secondary); position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border-color); }
    .dropdown-search-input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 6px 8px; border-radius: 4px; color: var(--text-primary); font-size: 0.85rem; }
    .dropdown-search-input:focus { outline: none; border-color: var(--accent-blue); }
</style>