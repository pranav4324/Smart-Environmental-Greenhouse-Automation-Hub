/* ============================================================
   CodeCheck AI — Report Generator
   Report generation, health scoring, and PDF export
   ============================================================ */

const ReportGenerator = {

    /* ---------- Calculate Health Metrics ---------- */
    calculateHealth(projectInfo, errors, testResults = null) {
        const critical = errors.filter(e => e.severity === 'CRITICAL' && !e.fixed).length;
        const high = errors.filter(e => e.severity === 'HIGH' && !e.fixed).length;
        const medium = errors.filter(e => e.severity === 'MEDIUM' && !e.fixed).length;
        const low = errors.filter(e => e.severity === 'LOW' && !e.fixed).length;
        const info = errors.filter(e => e.severity === 'INFO' && !e.fixed).length;
        const warnings = medium + low + info;
        const totalErrors = critical + high;
        const fixed = errors.filter(e => e.fixed).length;

        const syntaxErrors = errors.filter(e => (e.type === 'SYNTAX_ERROR' || e.type === 'COMPILE_ERROR') && !e.fixed).length;
        const buildPass = syntaxErrors === 0;

        const testsPassed = testResults ? testResults.passed : 0;
        const testsTotal = testResults ? testResults.total : 0;
        const testsFailed = testResults ? testResults.failed : 0;
        const testPassRate = testsTotal > 0 ? Math.round((testsPassed / testsTotal) * 100) : null;

        const securityIssues = errors.filter(e => e.type === 'SECURITY_WARNING' && !e.fixed).length;
        const performanceIssues = errors.filter(e => e.type === 'PERFORMANCE_WARNING' && !e.fixed).length;
        const codeQualityIssues = errors.filter(e => (e.type === 'STYLE_WARNING' || e.type === 'LOGIC_ERROR') && !e.fixed).length;

        /* Calculate overall status */
        let status;
        if (critical > 0 || (testsTotal > 0 && testsFailed > testsTotal / 2)) {
            status = 'CRITICAL';
        } else if (high > 0 || securityIssues > 0 || !buildPass) {
            status = 'NEEDS ATTENTION';
        } else if (medium > 0 || testsFailed > 0) {
            status = 'GOOD';
        } else {
            status = 'EXCELLENT';
        }

        /* Calculate score (0-100) */
        let score = 100;
        score -= critical * 20;
        score -= high * 10;
        score -= medium * 3;
        score -= low * 1;
        score -= securityIssues * 15;
        if (!buildPass) score -= 30;
        if (testsTotal > 0) {
            score -= (testsFailed / testsTotal) * 20;
        }
        if (projectInfo.testFiles.length === 0 && projectInfo.sourceFiles.length > 3) {
            score -= 10;
        }
        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            status, score, buildPass,
            testsPassed, testsTotal, testsFailed, testPassRate,
            critical, high, medium, low, info, warnings,
            totalErrors, fixed,
            securityIssues, performanceIssues, codeQualityIssues,
        };
    },

    /* ---------- Generate Full Report ---------- */
    generateReport(project) {
        const { info, files, errors, fixes, testResults, analysisDate, health } = project;
        const allErrors = errors || [];
        const openErrors = allErrors.filter(e => !e.fixed);
        const fixedErrors = allErrors.filter(e => e.fixed);

        const errorsByType = {};
        const errorsBySeverity = {};
        const errorsByLanguage = {};
        const errorsByFile = {};

        for (const e of allErrors) {
            errorsByType[e.type] = (errorsByType[e.type] || 0) + 1;
            errorsBySeverity[e.severity] = (errorsBySeverity[e.severity] || 0) + 1;
            errorsByLanguage[e.language] = (errorsByLanguage[e.language] || 0) + 1;
            errorsByFile[e.file] = (errorsByFile[e.file] || 0) + 1;
        }

        /* Sort files by error count */
        const topFiles = Object.entries(errorsByFile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return `
        <div class="report" id="report-content">
            <div class="report-header">
                <div class="report-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M16 18l2-2-2-2M8 18l-2-2 2-2M14.5 4l-5 16"/></svg>
                    <h1>CodeCheck AI — Analysis Report</h1>
                </div>
                <div class="report-meta">
                    <span>Generated: ${new Date(analysisDate || Date.now()).toLocaleString()}</span>
                    <span>Project: ${info.projectName}</span>
                </div>
            </div>

            <!-- Executive Summary -->
            <section class="report-section">
                <h2>📊 Executive Summary</h2>
                <div class="report-summary-grid">
                    <div class="report-summary-card">
                        <div class="summary-status" style="color: ${health.status === 'EXCELLENT' ? 'var(--success)' : health.status === 'GOOD' ? 'var(--accent)' : health.status === 'NEEDS ATTENTION' ? 'var(--warning)' : 'var(--error)'}">
                            <span class="summary-score">${health.score}</span>/100
                        </div>
                        <div class="summary-label">Health Score</div>
                        <div class="summary-status-text">${health.status}</div>
                    </div>
                    <div class="report-summary-card">
                        <div class="summary-big-num ${health.buildPass ? 'text-success' : 'text-error'}">${health.buildPass ? 'PASS' : 'FAIL'}</div>
                        <div class="summary-label">Build Status</div>
                    </div>
                    <div class="report-summary-card">
                        <div class="summary-big-num">${health.testsTotal > 0 ? health.testsPassed + '/' + health.testsTotal : 'N/A'}</div>
                        <div class="summary-label">Tests Passed</div>
                    </div>
                    <div class="report-summary-card">
                        <div class="summary-big-num ${health.totalErrors > 0 ? 'text-error' : 'text-success'}">${health.totalErrors}</div>
                        <div class="summary-label">Errors</div>
                    </div>
                    <div class="report-summary-card">
                        <div class="summary-big-num text-warning">${health.warnings}</div>
                        <div class="summary-label">Warnings</div>
                    </div>
                    <div class="report-summary-card">
                        <div class="summary-big-num text-success">${health.fixed}</div>
                        <div class="summary-label">Fixed</div>
                    </div>
                </div>
            </section>

            <!-- Project Information -->
            <section class="report-section">
                <h2>📁 Project Information</h2>
                <table class="report-table">
                    <tr><td>Project Name</td><td>${info.projectName}</td></tr>
                    <tr><td>Project Type</td><td>${info.projectType}</td></tr>
                    <tr><td>Languages</td><td>${info.languages.join(', ') || 'None detected'}</td></tr>
                    <tr><td>Frameworks</td><td>${info.frameworks.join(', ') || 'None detected'}</td></tr>
                    <tr><td>Source Files</td><td>${info.sourceFiles.length}</td></tr>
                    <tr><td>Test Files</td><td>${info.testFiles.length}</td></tr>
                    <tr><td>Config Files</td><td>${info.configFiles.length}</td></tr>
                    <tr><td>Package Manager</td><td>${info.packageManagers.join(', ') || 'N/A'}</td></tr>
                    <tr><td>Build System</td><td>${info.buildSystems.join(', ') || 'N/A'}</td></tr>
                    <tr><td>Test Framework</td><td>${info.testFrameworks.join(', ') || 'None detected'}</td></tr>
                    <tr><td>Entry Point</td><td>${info.entryPoint || 'Not detected'}</td></tr>
                </table>
            </section>

            <!-- Error Analysis -->
            <section class="report-section">
                <h2>🐛 Error Analysis</h2>
                
                <h3>By Severity</h3>
                <div class="report-bar-chart">
                    ${['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(s => {
                        const count = errorsBySeverity[s] || 0;
                        const max = Math.max(...Object.values(errorsBySeverity), 1);
                        return `<div class="bar-row">
                            <span class="bar-label">${s}</span>
                            <div class="bar-track"><div class="bar-fill severity-bg-${s.toLowerCase()}" style="width: ${(count / max) * 100}%"></div></div>
                            <span class="bar-value">${count}</span>
                        </div>`;
                    }).join('')}
                </div>

                <h3>By Type</h3>
                <div class="report-bar-chart">
                    ${Object.entries(errorsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                        const max = Math.max(...Object.values(errorsByType), 1);
                        return `<div class="bar-row">
                            <span class="bar-label">${type.replace(/_/g, ' ')}</span>
                            <div class="bar-track"><div class="bar-fill" style="width: ${(count / max) * 100}%"></div></div>
                            <span class="bar-value">${count}</span>
                        </div>`;
                    }).join('')}
                </div>

                <h3>By Language</h3>
                <div class="report-bar-chart">
                    ${Object.entries(errorsByLanguage).sort((a, b) => b[1] - a[1]).map(([lang, count]) => {
                        const max = Math.max(...Object.values(errorsByLanguage), 1);
                        const analyzer = AnalyzerRegistry.get(lang);
                        return `<div class="bar-row">
                            <span class="bar-label">${analyzer ? analyzer.icon + ' ' + analyzer.name : lang}</span>
                            <div class="bar-track"><div class="bar-fill" style="width: ${(count / max) * 100}%; background: ${analyzer ? analyzer.color : 'var(--accent)'}"></div></div>
                            <span class="bar-value">${count}</span>
                        </div>`;
                    }).join('')}
                </div>

                ${topFiles.length > 0 ? `
                <h3>Most Problematic Files</h3>
                <table class="report-table">
                    <tr><th>File</th><th>Issues</th></tr>
                    ${topFiles.map(([file, count]) => `<tr><td>${file}</td><td>${count}</td></tr>`).join('')}
                </table>` : ''}
            </section>

            <!-- Security Findings -->
            ${health.securityIssues > 0 ? `
            <section class="report-section report-section-warning">
                <h2>🔒 Security Findings</h2>
                <p>${health.securityIssues} security issue(s) detected.</p>
                ${allErrors.filter(e => e.type === 'SECURITY_WARNING').map(e => `
                    <div class="report-finding">
                        <span class="finding-severity severity-${e.severity.toLowerCase()}">${e.severity}</span>
                        <span class="finding-file">${e.file}:${e.line}</span>
                        <span class="finding-message">${e.message}</span>
                    </div>
                `).join('')}
            </section>` : `
            <section class="report-section">
                <h2>🔒 Security Findings</h2>
                <p class="text-success">✅ No security issues detected.</p>
            </section>`}

            <!-- Performance Findings -->
            <section class="report-section">
                <h2>⚡ Performance Findings</h2>
                ${health.performanceIssues > 0 ? `
                <p>${health.performanceIssues} performance issue(s) detected.</p>
                ${allErrors.filter(e => e.type === 'PERFORMANCE_WARNING').map(e => `
                    <div class="report-finding">
                        <span class="finding-file">${e.file}:${e.line}</span>
                        <span class="finding-message">${e.message}</span>
                    </div>
                `).join('')}` : '<p class="text-success">✅ No performance issues detected.</p>'}
            </section>

            <!-- Code Quality -->
            <section class="report-section">
                <h2>📐 Code Quality</h2>
                <p>${health.codeQualityIssues > 0 ? `${health.codeQualityIssues} code quality issue(s) found.` : '✅ Code quality looks good.'}</p>
                ${info.testFiles.length === 0 && info.sourceFiles.length > 3 ? '<p class="text-warning">⚠️ No automated tests detected. Adding tests is strongly recommended.</p>' : ''}
            </section>

            <!-- Applied Fixes -->
            ${fixedErrors.length > 0 ? `
            <section class="report-section">
                <h2>✅ Applied Fixes</h2>
                <p>${fixedErrors.length} issue(s) were fixed during this analysis session.</p>
                <table class="report-table">
                    <tr><th>ID</th><th>File</th><th>Issue</th><th>Status</th></tr>
                    ${fixedErrors.map(e => `
                        <tr>
                            <td>${e.id}</td>
                            <td>${e.file}:${e.line}</td>
                            <td>${e.message}</td>
                            <td><span class="badge badge-success">FIXED</span></td>
                        </tr>
                    `).join('')}
                </table>
            </section>` : ''}

            <!-- Remaining Issues -->
            ${openErrors.length > 0 ? `
            <section class="report-section">
                <h2>📋 Remaining Issues (${openErrors.length})</h2>
                <table class="report-table">
                    <tr><th>ID</th><th>Severity</th><th>Type</th><th>File</th><th>Message</th></tr>
                    ${openErrors.slice(0, 50).map(e => `
                        <tr>
                            <td>${e.id}</td>
                            <td><span class="badge badge-${e.severity.toLowerCase()}">${e.severity}</span></td>
                            <td>${e.type.replace(/_/g, ' ')}</td>
                            <td>${e.file}:${e.line}</td>
                            <td>${e.message}</td>
                        </tr>
                    `).join('')}
                    ${openErrors.length > 50 ? `<tr><td colspan="5">... and ${openErrors.length - 50} more</td></tr>` : ''}
                </table>
            </section>` : ''}

            <!-- Recommendations -->
            <section class="report-section">
                <h2>💡 Recommendations</h2>
                <ul class="report-recommendations">
                    ${health.critical > 0 ? '<li class="rec-critical">Fix all critical errors immediately — these prevent the code from functioning.</li>' : ''}
                    ${health.securityIssues > 0 ? '<li class="rec-high">Address security warnings before deploying to production.</li>' : ''}
                    ${health.high > 0 ? '<li class="rec-high">Resolve high-severity issues to improve code reliability.</li>' : ''}
                    ${info.testFiles.length === 0 ? '<li class="rec-medium">Add automated tests to catch regressions early.</li>' : ''}
                    ${health.codeQualityIssues > 5 ? '<li class="rec-medium">Consider integrating a linter into your development workflow.</li>' : ''}
                    ${health.totalErrors === 0 && health.warnings < 3 ? '<li class="rec-success">Project is in excellent shape! Continue maintaining code quality.</li>' : ''}
                </ul>
            </section>

            <!-- Final Status -->
            <section class="report-section report-final-status">
                <h2>🏁 Final Project Status</h2>
                <div class="final-status-card" style="--status-color: ${health.status === 'EXCELLENT' ? 'var(--success)' : health.status === 'GOOD' ? 'var(--accent)' : health.status === 'NEEDS ATTENTION' ? 'var(--warning)' : 'var(--error)'}">
                    <div class="final-score">${health.score}<span>/100</span></div>
                    <div class="final-status">${health.status}</div>
                    <div class="final-details">
                        Build: ${health.buildPass ? '✅ PASS' : '❌ FAIL'} · 
                        Tests: ${health.testsTotal > 0 ? health.testsPassed + '/' + health.testsTotal + ' PASS' : 'N/A'} · 
                        Errors: ${health.totalErrors} · 
                        Warnings: ${health.warnings} · 
                        Fixed: ${health.fixed}
                    </div>
                </div>
            </section>

            <div class="report-footer">
                <p>Generated by CodeCheck AI · Multi-Language Analysis Platform</p>
                <p>${new Date().toLocaleString()}</p>
            </div>
        </div>`;
    },

    /* ---------- Export to PDF ---------- */
    async exportPDF(projectName) {
        const reportEl = document.getElementById('report-content');
        if (!reportEl) {
            UIComponents.showToast('No report to export', 'error');
            return;
        }

        UIComponents.showToast('Generating PDF...', 'info', 6000);

        try {
            if (typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
                const canvas = await html2canvas(reportEl, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#0d1117',
                    logging: false
                });

                const { jsPDF } = jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth - 20;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let position = 10;
                let remainingHeight = imgHeight;

                while (remainingHeight > 0) {
                    if (position > 10) pdf.addPage();
                    pdf.addImage(
                        canvas.toDataURL('image/png'),
                        'PNG', 10, position > 10 ? 10 : position,
                        imgWidth, imgHeight,
                        '', 'FAST',
                        0
                    );
                    remainingHeight -= (pdfHeight - 20);
                    position -= (pdfHeight - 20);
                }

                pdf.save(`CodeCheck-AI-Report-${projectName || 'project'}.pdf`);
                UIComponents.showToast('PDF exported successfully!', 'success');
            } else {
                /* Fallback: Print */
                window.print();
            }
        } catch (e) {
            console.error('PDF export error:', e);
            UIComponents.showToast('PDF export failed — using print fallback', 'warning');
            window.print();
        }
    }
};
