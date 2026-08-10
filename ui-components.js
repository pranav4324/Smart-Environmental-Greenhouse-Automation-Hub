/* ============================================================
   CodeCheck AI — UI Components
   Reusable rendering functions for the application
   ============================================================ */

const UIComponents = {

    /* ---------- Error Card ---------- */
    renderErrorCard(error, options = {}) {
        const severityClasses = {
            CRITICAL: 'severity-critical', HIGH: 'severity-high',
            MEDIUM: 'severity-medium', LOW: 'severity-low', INFO: 'severity-info'
        };
        const severityIcons = {
            CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵', INFO: 'ℹ️'
        };
        const typeLabels = {
            SYNTAX_ERROR: 'Syntax Error', COMPILE_ERROR: 'Compile Error',
            TYPE_ERROR: 'Type Error', RUNTIME_ERROR: 'Runtime Error',
            LOGIC_ERROR: 'Logic Error', TEST_FAILURE: 'Test Failure',
            DEPENDENCY_ERROR: 'Dependency', CONFIGURATION_ERROR: 'Config',
            STYLE_WARNING: 'Style', SECURITY_WARNING: 'Security',
            PERFORMANCE_WARNING: 'Performance', UNKNOWN: 'Unknown'
        };

        const isFixed = error.fixed || false;
        const expanded = options.expanded || false;

        return `
        <div class="error-card ${severityClasses[error.severity]} ${isFixed ? 'error-fixed' : ''} ${expanded ? 'expanded' : ''}" data-error-id="${error.id}" data-severity="${error.severity}" data-type="${error.type}" data-language="${error.language}" data-file="${error.file}">
            <div class="error-card-header" onclick="toggleErrorCard('${error.id}')">
                <div class="error-card-left">
                    <span class="error-severity-badge ${severityClasses[error.severity]}">${severityIcons[error.severity]} ${error.severity}</span>
                    <span class="error-type-badge">${typeLabels[error.type] || error.type}</span>
                    ${isFixed ? '<span class="error-fixed-badge">✅ FIXED</span>' : ''}
                </div>
                <div class="error-card-id">${error.id}</div>
            </div>
            <div class="error-card-message">${this._escapeHtml(error.message)}</div>
            <div class="error-card-location">
                <span class="error-file" onclick="openCodeViewer('${error.file}', ${error.line})">📄 ${error.file}</span>
                <span class="error-line">Line ${error.line}${error.column ? ':' + error.column : ''}</span>
                <span class="error-lang-badge" style="--lang-color: ${this._getLangColor(error.language)}">${error.language}</span>
            </div>
            <div class="error-card-details" id="error-details-${error.id}">
                <div class="error-section">
                    <h4>📋 Explanation</h4>
                    <p>${this._escapeHtml(error.aiExplanation || error.explanation)}</p>
                </div>
                <div class="error-section">
                    <h4>🔍 Possible Cause</h4>
                    <p>${this._escapeHtml(error.aiCause || error.cause)}</p>
                </div>
                <div class="error-section">
                    <h4>💡 Suggested Solution</h4>
                    <p>${this._escapeHtml(error.suggestion)}</p>
                </div>
                ${error.code ? `
                <div class="error-section">
                    <h4>📝 Relevant Code</h4>
                    <pre class="code-block"><code>${this._escapeHtml(error.code)}</code></pre>
                </div>` : ''}
                ${error.correctedCode ? `
                <div class="error-section">
                    <h4>✅ Corrected Code</h4>
                    <pre class="code-block code-corrected"><code>${this._escapeHtml(error.correctedCode)}</code></pre>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary btn-sm" onclick="showFixDiff('${error.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        View Diff & Apply Fix
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="openCodeViewer('${error.file}', ${error.line})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View in Code
                    </button>
                </div>` : `
                <div class="error-actions">
                    <button class="btn btn-ghost btn-sm" onclick="openCodeViewer('${error.file}', ${error.line})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View in Code
                    </button>
                </div>`}
                ${error.aiAdditionalTests && error.aiAdditionalTests.length > 0 ? `
                <div class="error-section">
                    <h4>🧪 Additional Tests Suggested</h4>
                    <ul class="test-suggestions">${error.aiAdditionalTests.map(t => `<li>${this._escapeHtml(t)}</li>`).join('')}</ul>
                </div>` : ''}
            </div>
        </div>`;
    },

    /* ---------- Code Viewer ---------- */
    renderCodeViewer(code, fileName, errors = [], highlightLine = null) {
        const lines = code.split('\n');
        const lang = fileName.split('.').pop();
        const errorLines = new Map();
        for (const e of errors) {
            if (e.file === fileName) {
                if (!errorLines.has(e.line)) errorLines.set(e.line, []);
                errorLines.get(e.line).push(e);
            }
        }

        let html = `<div class="code-viewer" data-filename="${fileName}">
            <div class="code-viewer-header">
                <span class="code-viewer-filename">📄 ${fileName}</span>
                <span class="code-viewer-lang">${lang.toUpperCase()}</span>
                <span class="code-viewer-lines">${lines.length} lines</span>
            </div>
            <div class="code-viewer-body">`;

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const hasError = errorLines.has(lineNum);
            const isHighlighted = highlightLine === lineNum;
            const lineErrors = errorLines.get(lineNum) || [];
            const worstSeverity = lineErrors.length > 0
                ? lineErrors.reduce((w, e) => SeverityOrder[e.severity] < SeverityOrder[w] ? e.severity : w, lineErrors[0].severity)
                : null;

            html += `<div class="code-line ${hasError ? 'code-line-error severity-bg-' + (worstSeverity || '').toLowerCase() : ''} ${isHighlighted ? 'code-line-highlighted' : ''}" id="code-line-${lineNum}">
                <span class="code-line-number">${lineNum}</span>
                <span class="code-line-content">${this._escapeHtml(lines[i]) || '&nbsp;'}</span>
                ${hasError ? `<span class="code-line-marker" title="${lineErrors.map(e => e.message).join('; ')}">●</span>` : ''}
            </div>`;

            if (hasError) {
                for (const err of lineErrors) {
                    html += `<div class="code-line-error-inline">
                        <span class="code-error-icon">${err.severity === 'CRITICAL' ? '🔴' : err.severity === 'HIGH' ? '🟠' : '🟡'}</span>
                        <span class="code-error-msg">${this._escapeHtml(err.message)}</span>
                        ${err.correctedCode ? `<button class="btn btn-xs btn-primary" onclick="showFixDiff('${err.id}')">Fix</button>` : ''}
                    </div>`;
                }
            }
        }

        html += '</div></div>';
        return html;
    },

    /* ---------- Diff Viewer ---------- */
    renderDiffView(original, modified, fileName) {
        const diff = DiffEngine.computeDiff(original, modified);
        let html = `<div class="diff-viewer">
            <div class="diff-header">
                <span class="diff-filename">📄 ${fileName}</span>
                <div class="diff-stats">
                    <span class="diff-additions">+${diff.filter(d => d.type === 'add').length}</span>
                    <span class="diff-deletions">-${diff.filter(d => d.type === 'remove').length}</span>
                </div>
            </div>
            <div class="diff-body">`;

        for (const d of diff) {
            const cls = d.type === 'add' ? 'diff-line-add' : d.type === 'remove' ? 'diff-line-remove' : 'diff-line-unchanged';
            const prefix = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' ';
            html += `<div class="diff-line ${cls}">
                <span class="diff-line-prefix">${prefix}</span>
                <span class="diff-line-number">${d.line}</span>
                <span class="diff-line-content">${this._escapeHtml(d.content)}</span>
            </div>`;
        }

        html += '</div></div>';
        return html;
    },

    /* ---------- File Tree ---------- */
    renderFileTree(files, errors = []) {
        const tree = {};
        for (const f of files) {
            const parts = f.name.split('/');
            let current = tree;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = f;
        }

        const errorsByFile = {};
        for (const e of errors) {
            errorsByFile[e.file] = (errorsByFile[e.file] || 0) + 1;
        }

        return `<div class="file-tree">${this._renderTreeNode(tree, '', errorsByFile)}</div>`;
    },

    _renderTreeNode(node, path, errorsByFile) {
        let html = '';
        const entries = Object.entries(node).sort(([a, av], [b, bv]) => {
            const aIsDir = typeof av === 'object' && !av.content && !av.name;
            const bIsDir = typeof bv === 'object' && !bv.content && !bv.name;
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        for (const [name, value] of entries) {
            const fullPath = path ? path + '/' + name : name;
            if (typeof value === 'object' && !value.content && !value.name) {
                html += `<div class="tree-folder">
                    <div class="tree-folder-header" onclick="this.parentElement.classList.toggle('collapsed')">
                        <svg class="tree-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                        <span class="tree-folder-icon">📁</span>
                        <span class="tree-folder-name">${name}</span>
                    </div>
                    <div class="tree-folder-children">${this._renderTreeNode(value, fullPath, errorsByFile)}</div>
                </div>`;
            } else {
                const ext = name.split('.').pop().toLowerCase();
                const fileIcon = this._getFileIcon(ext);
                const errorCount = errorsByFile[fullPath] || errorsByFile[name] || 0;
                html += `<div class="tree-file" onclick="openCodeViewer('${fullPath}')">
                    <span class="tree-file-icon">${fileIcon}</span>
                    <span class="tree-file-name">${name}</span>
                    ${errorCount > 0 ? `<span class="tree-file-errors">${errorCount}</span>` : ''}
                </div>`;
            }
        }
        return html;
    },

    /* ---------- Health Score ---------- */
    renderHealthScore(metrics) {
        const statusColors = { EXCELLENT: '#3fb950', GOOD: '#58a6ff', 'NEEDS ATTENTION': '#d29922', CRITICAL: '#f85149' };
        const statusColor = statusColors[metrics.status] || '#8b949e';

        return `
        <div class="health-dashboard">
            <div class="health-status" style="--status-color: ${statusColor}">
                <div class="health-status-icon">${metrics.status === 'EXCELLENT' ? '✅' : metrics.status === 'GOOD' ? '👍' : metrics.status === 'NEEDS ATTENTION' ? '⚠️' : '🚨'}</div>
                <div class="health-status-label">${metrics.status}</div>
            </div>
            <div class="health-grid">
                <div class="health-item">
                    <span class="health-item-label">Build</span>
                    <span class="health-item-value ${metrics.buildPass ? 'text-success' : 'text-error'}">${metrics.buildPass ? 'PASS' : 'FAIL'}</span>
                </div>
                <div class="health-item">
                    <span class="health-item-label">Tests</span>
                    <span class="health-item-value">${metrics.testsPassed}/${metrics.testsTotal} ${metrics.testsTotal > 0 ? 'PASS' : 'N/A'}</span>
                </div>
                <div class="health-item">
                    <span class="health-item-label">Critical</span>
                    <span class="health-item-value ${metrics.critical > 0 ? 'text-error' : 'text-success'}">${metrics.critical}</span>
                </div>
                <div class="health-item">
                    <span class="health-item-label">High</span>
                    <span class="health-item-value ${metrics.high > 0 ? 'text-warning' : 'text-success'}">${metrics.high}</span>
                </div>
                <div class="health-item">
                    <span class="health-item-label">Warnings</span>
                    <span class="health-item-value">${metrics.warnings}</span>
                </div>
                <div class="health-item">
                    <span class="health-item-label">Info</span>
                    <span class="health-item-value">${metrics.info}</span>
                </div>
            </div>
        </div>`;
    },

    /* ---------- Before/After Comparison ---------- */
    renderBeforeAfter(before, after) {
        return `
        <div class="before-after">
            <div class="before-after-card before-card">
                <div class="ba-header">
                    <span class="ba-label">BEFORE</span>
                </div>
                <div class="ba-stats">
                    <div class="ba-stat"><span class="ba-stat-num ${before.errors > 0 ? 'text-error' : 'text-success'}">${before.errors}</span><span class="ba-stat-label">Errors</span></div>
                    <div class="ba-stat"><span class="ba-stat-num text-warning">${before.warnings}</span><span class="ba-stat-label">Warnings</span></div>
                    <div class="ba-stat"><span class="ba-stat-num ${before.testsFailed > 0 ? 'text-error' : 'text-success'}">${before.testsFailed}</span><span class="ba-stat-label">Failed Tests</span></div>
                </div>
            </div>
            <div class="before-after-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
            <div class="before-after-card after-card">
                <div class="ba-header">
                    <span class="ba-label">AFTER</span>
                </div>
                <div class="ba-stats">
                    <div class="ba-stat"><span class="ba-stat-num ${after.errors > 0 ? 'text-error' : 'text-success'}">${after.errors}</span><span class="ba-stat-label">Errors</span></div>
                    <div class="ba-stat"><span class="ba-stat-num text-warning">${after.warnings}</span><span class="ba-stat-label">Warnings</span></div>
                    <div class="ba-stat"><span class="ba-stat-num ${after.testsFailed > 0 ? 'text-error' : 'text-success'}">${after.testsFailed}</span><span class="ba-stat-label">Failed Tests</span></div>
                </div>
            </div>
        </div>`;
    },

    /* ---------- Filter Bar ---------- */
    renderFilterBar(activeFilters, counts = {}) {
        const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
        const statuses = ['OPEN', 'FIXED'];

        return `
        <div class="filter-bar">
            <div class="filter-group">
                <label class="filter-label">Severity</label>
                <div class="filter-chips">
                    ${severities.map(s => `
                        <button class="filter-chip ${activeFilters.severity === s ? 'active' : ''}" onclick="setFilter('severity', '${s}')">
                            ${s} ${counts[s.toLowerCase()] !== undefined ? `<span class="filter-count">${counts[s.toLowerCase()]}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="filter-group">
                <label class="filter-label">Status</label>
                <div class="filter-chips">
                    ${statuses.map(s => `
                        <button class="filter-chip ${activeFilters.status === s ? 'active' : ''}" onclick="setFilter('status', '${s}')">
                            ${s}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="filter-group">
                <label class="filter-label">Language</label>
                <select class="filter-select" onchange="setFilter('language', this.value)">
                    <option value="ALL">All Languages</option>
                    ${(activeFilters.availableLanguages || []).map(l => `<option value="${l}" ${activeFilters.language === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Type</label>
                <select class="filter-select" onchange="setFilter('type', this.value)">
                    <option value="ALL">All Types</option>
                    ${Object.keys(ErrorType).map(t => `<option value="${t}" ${activeFilters.type === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
                </select>
            </div>
        </div>`;
    },

    /* ---------- Progress Bar ---------- */
    renderProgressBar(current, total, label = '') {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        return `
        <div class="progress-container">
            <div class="progress-header">
                <span class="progress-label">${label}</span>
                <span class="progress-value">${current}/${total} (${pct}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${pct}%"></div>
            </div>
        </div>`;
    },

    /* ---------- Modal ---------- */
    renderModal(id, title, content, actions = []) {
        return `
        <div class="modal-overlay" id="${id}" onclick="if(event.target===this)closeModal('${id}')">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                ${actions.length > 0 ? `<div class="modal-footer">${actions.map(a =>
                    `<button class="btn ${a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'}" onclick="${a.onclick}">${a.label}</button>`
                ).join('')}</div>` : ''}
            </div>
        </div>`;
    },

    /* ---------- Toast ---------- */
    showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span>`;
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /* ---------- Empty State ---------- */
    renderEmptyState(icon, title, description, action = null) {
        return `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-desc">${description}</p>
            ${action ? `<button class="btn btn-primary" onclick="${action.onclick}">${action.label}</button>` : ''}
        </div>`;
    },

    /* ---------- Loading State ---------- */
    renderLoadingState(message = 'Analyzing...') {
        return `
        <div class="loading-state">
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
            <p class="loading-message">${message}</p>
        </div>`;
    },

    /* ---------- Badge ---------- */
    renderBadge(text, type = 'default') {
        return `<span class="badge badge-${type}">${text}</span>`;
    },

    /* ---------- Stats Card ---------- */
    renderStatCard(icon, label, value, change = null, type = 'default') {
        return `
        <div class="stat-card stat-${type}">
            <div class="stat-icon">${icon}</div>
            <div class="stat-info">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
            ${change !== null ? `<div class="stat-change ${change >= 0 ? 'stat-change-up' : 'stat-change-down'}">${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}</div>` : ''}
        </div>`;
    },

    /* ---------- Language Badge ---------- */
    renderLanguageBadge(langId) {
        const analyzer = AnalyzerRegistry.get(langId);
        if (!analyzer) return `<span class="lang-badge">${langId}</span>`;
        return `<span class="lang-badge" style="--lang-color: ${analyzer.color}">
            <span class="lang-icon">${analyzer.icon}</span> ${analyzer.name}
            <span class="lang-capability">${analyzer.capabilities.syntax}</span>
        </span>`;
    },

    /* ---------- Project Info Card ---------- */
    renderProjectInfo(info) {
        return `
        <div class="project-info-grid">
            <div class="info-item"><span class="info-label">Project Name</span><span class="info-value">${info.projectName}</span></div>
            <div class="info-item"><span class="info-label">Project Type</span><span class="info-value">${info.projectType}</span></div>
            <div class="info-item"><span class="info-label">Languages</span><span class="info-value">${info.languages.map(l => this.renderLanguageBadge(l)).join(' ')}</span></div>
            <div class="info-item"><span class="info-label">Frameworks</span><span class="info-value">${info.frameworks.length > 0 ? info.frameworks.join(', ') : 'None detected'}</span></div>
            <div class="info-item"><span class="info-label">Total Files</span><span class="info-value">${info.sourceFiles.length + info.testFiles.length + info.configFiles.length}</span></div>
            <div class="info-item"><span class="info-label">Source Files</span><span class="info-value">${info.sourceFiles.length}</span></div>
            <div class="info-item"><span class="info-label">Test Files</span><span class="info-value">${info.testFiles.length}</span></div>
            <div class="info-item"><span class="info-label">Config Files</span><span class="info-value">${info.configFiles.length}</span></div>
            <div class="info-item"><span class="info-label">Package Manager</span><span class="info-value">${info.packageManagers.length > 0 ? info.packageManagers.join(', ') : 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Build System</span><span class="info-value">${info.buildSystems.length > 0 ? info.buildSystems.join(', ') : 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Test Framework</span><span class="info-value">${info.testFrameworks.length > 0 ? info.testFrameworks.join(', ') : 'None detected'}</span></div>
            <div class="info-item"><span class="info-label">Entry Point</span><span class="info-value">${info.entryPoint || 'Not detected'}</span></div>
        </div>`;
    },

    /* ---------- Analysis Progress ---------- */
    renderAnalysisProgress(steps) {
        return `
        <div class="analysis-progress">
            ${steps.map((step, i) => `
                <div class="progress-step ${step.status}">
                    <div class="progress-step-indicator">
                        ${step.status === 'done' ? '✅' : step.status === 'active' ? '<div class="step-spinner"></div>' : step.status === 'error' ? '❌' : '○'}
                    </div>
                    <div class="progress-step-info">
                        <span class="progress-step-label">${step.label}</span>
                        ${step.detail ? `<span class="progress-step-detail">${step.detail}</span>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    /* ---------- Helpers ---------- */
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    _getLangColor(lang) {
        const analyzer = AnalyzerRegistry.get(lang);
        return analyzer ? analyzer.color : '#8b949e';
    },

    _getFileIcon(ext) {
        const icons = {
            js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
            py: '🐍', pyw: '🐍', java: '☕', kt: '🟣', kts: '🟣',
            c: '⚙️', h: '⚙️', cpp: '⚡', cc: '⚡', hpp: '⚡',
            cs: '💜', go: '🐹', rs: '🦀', php: '🐘',
            html: '🌐', htm: '🌐', css: '🎨', scss: '🎨',
            sql: '🗃️', json: '📋', xml: '📋', yaml: '📋', yml: '📋',
            md: '📝', txt: '📄', toml: '⚙️', cfg: '⚙️', ini: '⚙️',
            sh: '🐚', bash: '🐚', bat: '🖥️', ps1: '🖥️',
            lock: '🔒', gitignore: '🔒',
        };
        return icons[ext] || '📄';
    }
};
