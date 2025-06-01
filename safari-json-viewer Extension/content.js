function isValidJSON(str) {
    try { JSON.parse(str); return true; } catch { return false; }
}

const THEMES = {
    dark: {
        bg: '#1e1e1e', text: '#d4d4d4', header: '#252526', border: '#333',
        key: '#9cdcfe', string: '#ce9178', number: '#b5cea8', boolean: '#569cd6', null: '#569cd6',
        btn: '#0e639c', btnHover: '#1177bb', copySuccess: '#4caf50', search: '#222',
    },
    light: {
        bg: '#fff', text: '#333', header: '#f5f5f5', border: '#ddd',
        key: '#0000ff', string: '#008000', number: '#0000ff', boolean: '#0000ff', null: '#0000ff',
        btn: '#0078d4', btnHover: '#106ebe', copySuccess: '#4caf50', search: '#fff',
    }
};
let currentTheme = 'dark';

function applyTheme(container, theme) {
    const t = THEMES[theme];
    container.style.background = t.bg;
    container.style.color = t.text;
    const header = container.querySelector('.json-viewer-header');
    if (header) {
        header.style.background = t.header;
        header.style.borderBottom = `1px solid ${t.border}`;
    }
    container.querySelectorAll('.json-viewer-btn').forEach(btn => {
        btn.style.background = t.btn;
        btn.style.color = '#fff';
        btn.onmouseover = () => btn.style.background = t.btnHover;
        btn.onmouseout = () => btn.style.background = t.btn;
    });
    container.querySelectorAll('.json-viewer-search').forEach(input => {
        input.style.background = t.search;
        input.style.color = t.text;
        input.style.border = `1px solid ${t.border}`;
    });

    container.querySelectorAll('.json-key').forEach(e => e.style.color = t.key);
    container.querySelectorAll('.json-string').forEach(e => e.style.color = t.string);
    container.querySelectorAll('.json-number').forEach(e => e.style.color = t.number);
    container.querySelectorAll('.json-boolean').forEach(e => e.style.color = t.boolean);
    container.querySelectorAll('.json-null').forEach(e => e.style.color = t.null);
}

function renderJSONElement(value, level = 0, collapse = false, alwaysExpand = false, highlightTerm = null, keyName = null, addComma = false, isFiltering = false) {
    function highlight(text) {
        if (!highlightTerm) return text;
        const idx = text.toLowerCase().indexOf(highlightTerm);
        if (idx === -1) return text;
        return text.substring(0, idx) + '<span class="search-highlight">' + text.substring(idx, idx + highlightTerm.length) + '</span>' + text.substring(idx + highlightTerm.length);
    }
    const container = document.createElement('div');
    container.className = 'json-line';
    container.style.marginLeft = (level * 20) + 'px';
    container.style.whiteSpace = 'pre';

    function appendCommaIfNeeded(elem) {
        if (addComma) {
            const comma = document.createElement('span');
            comma.textContent = ',';
            elem.appendChild(comma);
        }
    }

    if (keyName !== null) {
        const keySpan = document.createElement('span');
        keySpan.className = 'json-key';
        keySpan.innerHTML = '"' + highlight(keyName) + '"';
        container.appendChild(keySpan);
        container.appendChild(document.createTextNode(': '));
    }

    if (value === null) {
        const valSpan = document.createElement('span');
        valSpan.className = 'json-null';
        valSpan.innerHTML = highlight('null');
        container.appendChild(valSpan);
        appendCommaIfNeeded(container);
        return container;
    }
    if (typeof value === 'boolean') {
        const valSpan = document.createElement('span');
        valSpan.className = 'json-boolean';
        valSpan.innerHTML = highlight(String(value));
        container.appendChild(valSpan);
        appendCommaIfNeeded(container);
        return container;
    }
    if (typeof value === 'number') {
        const valSpan = document.createElement('span');
        valSpan.className = 'json-number';
        valSpan.innerHTML = highlight(String(value));
        container.appendChild(valSpan);
        appendCommaIfNeeded(container);
        return container;
    }
    if (typeof value === 'string') {
        const valSpan = document.createElement('span');
        valSpan.className = 'json-string';
        valSpan.innerHTML = '"' + highlight(value) + '"';
        container.appendChild(valSpan);
        appendCommaIfNeeded(container);
        return container;
    }

    if (Array.isArray(value)) {
        const shouldCollapse = value.length === 0 || (!isFiltering && !alwaysExpand && (value.length > 10 || collapse));
        const collapsed = value.__collapsed !== undefined ? value.__collapsed : shouldCollapse;
        
        const line = document.createElement('div');
        line.className = 'json-line';
        line.style.marginLeft = (level * 20) + 'px';
        line.style.whiteSpace = 'pre';

        if (keyName !== null) {
            const keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.innerHTML = '"' + highlight(keyName) + '"';
            line.appendChild(keySpan);
            line.appendChild(document.createTextNode(': '));
        }
        const arrow = document.createElement('span');
        arrow.className = value.length === 0 ? 'json-arrow json-arrow-empty' : 'json-arrow';
        arrow.textContent = value.length === 0 ? '' : collapsed ? '▶' : '▼';
        arrow.style.cursor = value.length === 0 ? 'default' : 'pointer';
        arrow.style.marginRight = value.length === 0 ? '0px' : '4px';
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = value.length === 0 ? '[]' : collapsed ? `[${value.length} items]` : '[';
        toggle.setAttribute('data-collapsed', collapsed);
        toggle.style.cursor = value.length === 0 ? 'default' : 'pointer';
        line.appendChild(arrow);
        line.appendChild(toggle);
        container.appendChild(line);
        const arrayBlock = document.createElement('div');
        arrayBlock.className = 'json-array';
        arrayBlock.style.display = value.length === 0 ? 'none' : collapsed ? 'none' : 'block';
        value.forEach((v, i) => {
            const item = renderJSONElement(v, level + 1, false, alwaysExpand, highlightTerm, null, i < value.length - 1, isFiltering);
            arrayBlock.appendChild(item);
        });
        if (!collapsed) {
            const close = document.createElement('div');
            close.style.marginLeft = ((level) * 20) + 'px';
            close.textContent = ']';
            arrayBlock.appendChild(close);
        }
        container.appendChild(arrayBlock);
        arrow.onclick = toggle.onclick = function(e) {
            if (value.length === 0) {
                return;
            }
            e.stopPropagation();
            const isCollapsed = toggle.getAttribute('data-collapsed') === 'true';
            toggle.setAttribute('data-collapsed', !isCollapsed);
            arrayBlock.style.display = isCollapsed ? 'block' : 'none';
            arrow.textContent = isCollapsed ? '▼' : '▶';
            toggle.textContent = value.length === 0 ? '[]' : isCollapsed ? '[' : `[${value.length} items]`;

            value.__collapsed = !isCollapsed;
        };
        appendCommaIfNeeded(container);
        return container;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        const shouldCollapse = keys.length === 0 || (!isFiltering && !alwaysExpand && (keys.length > 10 || collapse));
        const collapsed = value.__collapsed !== undefined ? value.__collapsed : shouldCollapse;
        
        const line = document.createElement('div');
        line.className = 'json-line';
        line.style.marginLeft = (level * 20) + 'px';
        line.style.whiteSpace = 'pre';

        if (keyName !== null) {
            const keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.innerHTML = '"' + highlight(keyName) + '"';
            line.appendChild(keySpan);
            line.appendChild(document.createTextNode(': '));
        }
        const arrow = document.createElement('span');
        arrow.className = keys.length === 0 ? 'json-arrow json-arrow-empty' : 'json-arrow';
        arrow.textContent = keys.length === 0 ? '' : collapsed ? '▶' : '▼';
        arrow.style.cursor = keys.length === 0 ? 'default' : 'pointer';
        arrow.style.marginRight = keys.length === 0 ? '0px' : '4px';
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = keys.length === 0 ? '{}' : collapsed ? `{${keys.length} properties}` : '{';
        toggle.setAttribute('data-collapsed', collapsed);
        toggle.style.cursor = keys.length === 0 ? 'default' : 'pointer';
        line.appendChild(arrow);
        line.appendChild(toggle);
        container.appendChild(line);
        const objBlock = document.createElement('div');
        objBlock.className = 'json-object';
        objBlock.style.display = keys.length === 0 ? 'none' : collapsed ? 'none' : 'block';
        keys.forEach((k, i) => {
            const v = value[k];
            const isPrimitive = v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
            if (isPrimitive) {
                const propLine = renderJSONElement(v, level + 1, false, alwaysExpand, highlightTerm, k, i < keys.length - 1, isFiltering);
                objBlock.appendChild(propLine);
            } else {

                const propLine = renderJSONElement(v, level + 1, false, alwaysExpand, highlightTerm, null, i < keys.length - 1, isFiltering);

                const keyBracketLine = document.createElement('div');
                keyBracketLine.className = 'json-line';
                keyBracketLine.style.marginLeft = ((level + 1) * 20) + 'px';
                keyBracketLine.style.whiteSpace = 'pre';
                const keySpan = document.createElement('span');
                keySpan.className = 'json-key';
                keySpan.innerHTML = '"' + highlight(k) + '"';
                keyBracketLine.appendChild(keySpan);
                keyBracketLine.appendChild(document.createTextNode(': '));

                const arrow = propLine.querySelector('.json-arrow');
                const toggle = propLine.querySelector('.json-toggle');
                if (arrow && toggle) {
                    keyBracketLine.appendChild(arrow);
                    keyBracketLine.appendChild(toggle);
                }
                objBlock.appendChild(keyBracketLine);

                const block = propLine.querySelector('.json-object, .json-array');
                if (block) {
                    objBlock.appendChild(block);
                }
            }
        });
        if (!collapsed) {
            const close = document.createElement('div');
            close.style.marginLeft = ((level) * 20) + 'px';
            close.textContent = '}';
            objBlock.appendChild(close);
        }
        container.appendChild(objBlock);
        arrow.onclick = toggle.onclick = function(e) {
            if (keys.length === 0) {
                return;
            }
            e.stopPropagation();
            const isCollapsed = toggle.getAttribute('data-collapsed') === 'true';
            toggle.setAttribute('data-collapsed', !isCollapsed);
            objBlock.style.display = isCollapsed ? 'block' : 'none';
            arrow.textContent = isCollapsed ? '▼' : '▶';
            toggle.textContent = keys.length === 0 ? '{}' : isCollapsed ? '{' : `{${keys.length} properties}`;

            value.__collapsed = !isCollapsed;
        };
        appendCommaIfNeeded(container);
        return container;
    }
    return container;
}

function filterJSON(obj, term, collapsedStates = new Map()) {
    if (typeof obj !== 'object' || obj === null) return null;
    if (Array.isArray(obj)) {
        const arr = obj.map(item => filterJSON(item, term, collapsedStates)).filter(x => x !== null);
        if (arr.length) {
            const path = collapsedStates.get('currentPath') || '';
            const storedState = collapsedStates.get(path);
            if (storedState) {
                storedState.collapsed = storedState.collapsed;
            } else {
                collapsedStates.set(path, { collapsed: false });
            }
            return arr;
        }
        return null;
    }

    let matched = false;
    const result = {};
    const currentPath = collapsedStates.get('currentPath') || '';
    for (const [k, v] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${k}` : k;
        collapsedStates.set('currentPath', newPath);
        const keyMatch = k.toLowerCase().includes(term);
        let valueMatch = false;
        if (typeof v === 'string') valueMatch = v.toLowerCase().includes(term);
        if (keyMatch || valueMatch) {
            matched = true;
            result[k] = v;
        } else if (typeof v === 'object' && v !== null) {
            const filtered = filterJSON(v, term, collapsedStates);
            if (filtered !== null) {
                matched = true;
                result[k] = filtered;
            }
        }
    }
    if (matched) {
        const storedState = collapsedStates.get(currentPath);
        if (storedState) {
            storedState.collapsed = storedState.collapsed;
        } else {
            collapsedStates.set(currentPath, { collapsed: false });
        }
    }
    return matched ? result : null;
}

function renderViewer(element, json) {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.background = THEMES[currentTheme].bg;
    document.body.style.color = THEMES[currentTheme].text;

    const container = document.createElement('div');
    container.className = 'json-viewer-container';
    container.style.fontFamily = 'monospace';
    container.style.borderRadius = '0';
    container.style.margin = '0';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.boxShadow = 'none';
    container.style.overflow = 'hidden';

    const content = document.createElement('div');
    content.className = 'json-viewer-content';
    content.style.padding = '16px';
    content.style.overflow = 'auto';
    content.style.height = 'calc(100vh - 56px)';
    content.style.marginTop = '56px';

    let isHighlightMode = true;
    
    function addCollapseState(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    addCollapseState(item);
                }
            });
            if (!obj.hasOwnProperty('__collapsed')) {
                Object.defineProperty(obj, '__collapsed', {
                    value: false,
                    enumerable: false,
                    writable: true
                });
            }
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(value => {
                if (typeof value === 'object' && value !== null) {
                    addCollapseState(value);
                }
            });
            if (!obj.hasOwnProperty('__collapsed')) {
                Object.defineProperty(obj, '__collapsed', {
                    value: false,
                    enumerable: false,
                    writable: true
                });
            }
        }
    }

    addCollapseState(json);
    
    function rerender(data, collapse, highlightTerm, alwaysExpand) {
        content.innerHTML = '';
        if (!data) {
            content.innerHTML = '<span style="color:red">No results</span>';
            return;
        }
        const isFiltering = !isHighlightMode;
        const tree = renderJSONElement(data, 0, collapse, alwaysExpand, highlightTerm, null, false, isFiltering);
        content.appendChild(tree);
        applyTheme(container, currentTheme);
    }

    function createHeader(json, container, rerender) {
        const header = document.createElement('div');
        header.className = 'json-viewer-header';
        header.style.display = 'flex';
        header.style.gap = '10px';
        header.style.padding = '12px 16px 8px 16px';
        header.style.alignItems = 'center';
        header.style.borderBottom = '1px solid';
        header.style.margin = '0';
        header.style.position = 'fixed';
        header.style.top = '0';
        header.style.left = '0';
        header.style.right = '0';
        header.style.background = THEMES[currentTheme].header;
        header.style.zIndex = '1000';

        const copyFormatted = document.createElement('button');
        copyFormatted.textContent = 'Copy Formatted';
        copyFormatted.className = 'json-viewer-btn';
        copyFormatted.onclick = () => {
            navigator.clipboard.writeText(JSON.stringify(json, null, 2));
            copyFormatted.classList.add('copy-success');
            copyFormatted.textContent = 'Copied!';
            setTimeout(() => {
                copyFormatted.classList.remove('copy-success');
                copyFormatted.textContent = 'Copy Formatted';
            }, 1000);
        };

        const copyRaw = document.createElement('button');
        copyRaw.textContent = 'Copy Raw';
        copyRaw.className = 'json-viewer-btn';
        copyRaw.onclick = () => {
            navigator.clipboard.writeText(JSON.stringify(json));
            copyRaw.classList.add('copy-success');
            copyRaw.textContent = 'Copied!';
            setTimeout(() => {
                copyRaw.classList.remove('copy-success');
                copyRaw.textContent = 'Copy Raw';
            }, 1000);
        };

        const themeToggle = document.createElement('button');
        themeToggle.textContent = 'Toggle Theme';
        themeToggle.className = 'json-viewer-btn';
        themeToggle.onclick = () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(container, currentTheme);
        };

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search JSON...';
        searchInput.className = 'json-viewer-search';
        searchInput.style.flex = '1';
        searchInput.style.marginLeft = '10px';

        const searchMode = document.createElement('button');
        searchMode.textContent = 'Highlight';
        searchMode.className = 'json-viewer-btn';
        searchMode.onclick = () => {
            isHighlightMode = !isHighlightMode;
            searchMode.textContent = isHighlightMode ? 'Highlight' : 'Filter';

            const term = searchInput.value.trim().toLowerCase();
            if (term) {
                handleSearch();
            } else {
                rerender(json, false, null, isHighlightMode);
            }
        };

        function handleSearch() {
            const term = searchInput.value.trim().toLowerCase();
            if (!term) {
                rerender(json, false, null, isHighlightMode);
                return;
            }
            if (isHighlightMode) {
                rerender(json, false, term, true);
            } else {
                const filtered = filterJSON(json, term);
                rerender(filtered || {}, false, term, false);
            }
        }
        searchInput.addEventListener('input', handleSearch);
        header.append(copyFormatted, copyRaw, themeToggle, searchInput, searchMode);
        return header;
    }

    const header = createHeader(json, container, rerender);
    container.appendChild(header);
    container.appendChild(content);

    rerender(json, false, null, true);

    element.innerHTML = '';
    element.appendChild(container);
    applyTheme(container, currentTheme);
}

function findJSONContent() {
    const preTags = document.getElementsByTagName('pre');
    for (const pre of preTags) {
        if (!pre.classList.contains('json-viewer-container')) {
            const text = pre.textContent.trim();
            if (isValidJSON(text)) {
                const json = JSON.parse(text);
                renderViewer(pre, json);
            }
        }
    }
}

findJSONContent();
const observer = new MutationObserver(() => findJSONContent());
observer.observe(document.body, { childList: true, subtree: true });

const style = document.createElement('style');
style.textContent = `
.json-viewer-btn { border: none; border-radius: 4px; padding: 4px 8px; margin-right: 4px; cursor: pointer; transition: background 0.2s; }
.copy-success { background: #4caf50 !important; color: #fff !important; }
.search-highlight { background: rgba(255,255,0,0.3); }
.json-viewer-search { border-radius: 4px; border: 1px solid #333; padding: 4px 8px; }
.json-toggle { cursor: pointer; }
.json-line { font-family: inherit; font-size: 1em; white-space: pre; }
.json-arrow { display: inline-block; width: 1em; text-align: center; }
.json-arrow-empty { display: inline-block; width: 0; text-align: center; cursor: default; }
`;
document.head.appendChild(style);
