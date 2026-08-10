/* ============================================================
   CodeCheck AI — Language Analyzers
   Multi-language code analysis engine with adapter pattern
   ============================================================ */

/* ---------- Constants ---------- */
const ErrorType = {
    SYNTAX_ERROR: 'SYNTAX_ERROR',
    COMPILE_ERROR: 'COMPILE_ERROR',
    TYPE_ERROR: 'TYPE_ERROR',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    LOGIC_ERROR: 'LOGIC_ERROR',
    TEST_FAILURE: 'TEST_FAILURE',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    STYLE_WARNING: 'STYLE_WARNING',
    SECURITY_WARNING: 'SECURITY_WARNING',
    PERFORMANCE_WARNING: 'PERFORMANCE_WARNING',
    UNKNOWN: 'UNKNOWN'
};

const Severity = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    INFO: 'INFO'
};

const SeverityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

let _errorIdCounter = 0;
function nextErrorId() { return 'ERR-' + String(++_errorIdCounter).padStart(4, '0'); }
function resetErrorIds() { _errorIdCounter = 0; }

/* ---------- Analyzer Registry ---------- */
const AnalyzerRegistry = {
    _analyzers: {},

    register(a) { this._analyzers[a.id] = a; },
    get(id) { return this._analyzers[id] || null; },
    getAll() { return Object.values(this._analyzers); },
    getAvailable() { return this.getAll().filter(a => a.available); },

    getForExtension(ext) {
        ext = ext.toLowerCase();
        return this.getAll().find(a => a.extensions.includes(ext)) || null;
    },

    getForFile(fileName) {
        const ext = '.' + fileName.split('.').pop().toLowerCase();
        return this.getForExtension(ext);
    },

    detectLanguages(files) {
        const found = new Map();
        for (const f of files) {
            const a = this.getForFile(f.name);
            if (a && !found.has(a.id)) found.set(a.id, { analyzer: a, files: [] });
            if (a) found.get(a.id).files.push(f);
        }
        return found;
    }
};

/* ---------- Project Detector ---------- */
const ProjectDetector = {
    CONFIG_MAP: {
        'package.json': { languages: ['javascript', 'typescript'], packageManager: 'npm' },
        'yarn.lock': { packageManager: 'yarn' },
        'pnpm-lock.yaml': { packageManager: 'pnpm' },
        'tsconfig.json': { languages: ['typescript'], framework: 'TypeScript' },
        '.eslintrc': { tools: ['eslint'] },
        '.eslintrc.json': { tools: ['eslint'] },
        '.eslintrc.js': { tools: ['eslint'] },
        'jest.config.js': { testFramework: 'jest' },
        'jest.config.ts': { testFramework: 'jest' },
        'vitest.config.js': { testFramework: 'vitest' },
        'vitest.config.ts': { testFramework: 'vitest' },
        '.mocharc.yml': { testFramework: 'mocha' },
        'karma.conf.js': { testFramework: 'karma' },
        'requirements.txt': { languages: ['python'], packageManager: 'pip' },
        'setup.py': { languages: ['python'] },
        'setup.cfg': { languages: ['python'] },
        'pyproject.toml': { languages: ['python'], packageManager: 'pip/poetry' },
        'Pipfile': { languages: ['python'], packageManager: 'pipenv' },
        'pytest.ini': { testFramework: 'pytest' },
        'tox.ini': { testFramework: 'tox/pytest' },
        '.flake8': { tools: ['flake8'] },
        'mypy.ini': { tools: ['mypy'] },
        'pom.xml': { languages: ['java'], buildSystem: 'Maven', packageManager: 'maven' },
        'build.gradle': { languages: ['java', 'kotlin'], buildSystem: 'Gradle', packageManager: 'gradle' },
        'build.gradle.kts': { languages: ['kotlin', 'java'], buildSystem: 'Gradle (Kotlin DSL)' },
        'settings.gradle': { buildSystem: 'Gradle' },
        'Cargo.toml': { languages: ['rust'], buildSystem: 'Cargo', packageManager: 'cargo' },
        'go.mod': { languages: ['go'], buildSystem: 'Go Modules', packageManager: 'go mod' },
        'go.sum': { languages: ['go'] },
        'composer.json': { languages: ['php'], packageManager: 'composer' },
        'CMakeLists.txt': { languages: ['c', 'cpp'], buildSystem: 'CMake' },
        'Makefile': { buildSystem: 'Make' },
        'meson.build': { buildSystem: 'Meson' },
        'webpack.config.js': { bundler: 'webpack' },
        'vite.config.js': { bundler: 'vite' },
        'vite.config.ts': { bundler: 'vite' },
        'rollup.config.js': { bundler: 'rollup' },
        'Dockerfile': { containerized: true },
        'docker-compose.yml': { containerized: true },
        '.github': { ci: 'GitHub Actions' },
        '.gitlab-ci.yml': { ci: 'GitLab CI' },
        'Jenkinsfile': { ci: 'Jenkins' },
    },

    FRAMEWORK_DETECTORS: {
        'package.json': (content) => {
            try {
                const pkg = JSON.parse(content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps.react) return 'React';
                if (deps.vue) return 'Vue.js';
                if (deps['@angular/core']) return 'Angular';
                if (deps.svelte) return 'Svelte';
                if (deps.next) return 'Next.js';
                if (deps.nuxt) return 'Nuxt.js';
                if (deps.express) return 'Express.js';
                if (deps.fastify) return 'Fastify';
                if (deps.koa) return 'Koa';
                if (deps.nestjs || deps['@nestjs/core']) return 'NestJS';
                if (deps.electron) return 'Electron';
            } catch (e) { /* ignore */ }
            return null;
        },
        'requirements.txt': (content) => {
            const lower = content.toLowerCase();
            if (lower.includes('django')) return 'Django';
            if (lower.includes('flask')) return 'Flask';
            if (lower.includes('fastapi')) return 'FastAPI';
            if (lower.includes('tornado')) return 'Tornado';
            if (lower.includes('pyramid')) return 'Pyramid';
            return null;
        },
        'pyproject.toml': (content) => {
            const lower = content.toLowerCase();
            if (lower.includes('django')) return 'Django';
            if (lower.includes('flask')) return 'Flask';
            if (lower.includes('fastapi')) return 'FastAPI';
            return null;
        },
        'Cargo.toml': (content) => {
            const lower = content.toLowerCase();
            if (lower.includes('actix')) return 'Actix';
            if (lower.includes('rocket')) return 'Rocket';
            if (lower.includes('tokio')) return 'Tokio';
            if (lower.includes('warp')) return 'Warp';
            return null;
        },
        'go.mod': (content) => {
            if (content.includes('gin-gonic')) return 'Gin';
            if (content.includes('gorilla/mux')) return 'Gorilla';
            if (content.includes('echo')) return 'Echo';
            if (content.includes('fiber')) return 'Fiber';
            return null;
        },
        'composer.json': (content) => {
            try {
                const c = JSON.parse(content);
                const deps = { ...c.require, ...c['require-dev'] };
                if (deps['laravel/framework']) return 'Laravel';
                if (deps['symfony/framework-bundle']) return 'Symfony';
                if (deps['slim/slim']) return 'Slim';
            } catch (e) { /* ignore */ }
            return null;
        }
    },

    detect(files) {
        const result = {
            languages: new Set(),
            frameworks: new Set(),
            packageManagers: new Set(),
            buildSystems: new Set(),
            testFrameworks: new Set(),
            tools: new Set(),
            bundlers: new Set(),
            ci: null,
            containerized: false,
            configFiles: [],
            dependencyFiles: [],
            sourceFiles: [],
            testFiles: [],
            entryPoint: null,
            projectType: 'Unknown',
            projectName: 'Unnamed Project',
        };

        const fileMap = new Map();
        for (const f of files) {
            fileMap.set(f.name, f);
            const baseName = f.name.split('/').pop();
            const dirPath = f.name.includes('/') ? f.name.substring(0, f.name.lastIndexOf('/')) : '';

            /* Detect from config file names */
            for (const [configName, info] of Object.entries(this.CONFIG_MAP)) {
                if (baseName === configName || f.name.endsWith('/' + configName)) {
                    result.configFiles.push(f.name);
                    if (info.languages) info.languages.forEach(l => result.languages.add(l));
                    if (info.packageManager) result.packageManagers.add(info.packageManager);
                    if (info.buildSystem) result.buildSystems.add(info.buildSystem);
                    if (info.testFramework) result.testFrameworks.add(info.testFramework);
                    if (info.tools) info.tools.forEach(t => result.tools.add(t));
                    if (info.bundler) result.bundlers.add(info.bundler);
                    if (info.ci) result.ci = info.ci;
                    if (info.containerized) result.containerized = true;
                }
            }

            /* Classify as test or source file */
            const lower = f.name.toLowerCase();
            const isTest = lower.includes('/test/') || lower.includes('/tests/') ||
                lower.includes('/__tests__/') || lower.includes('/spec/') ||
                lower.includes('.test.') || lower.includes('.spec.') ||
                lower.includes('_test.') || lower.includes('_spec.') ||
                baseName.startsWith('test_');
            const isConfig = result.configFiles.includes(f.name) ||
                baseName.startsWith('.') || baseName === 'LICENSE' ||
                baseName === 'README.md' || baseName === 'CHANGELOG.md';
            const isDep = baseName === 'package-lock.json' || baseName === 'yarn.lock' ||
                baseName === 'Pipfile.lock' || baseName === 'pnpm-lock.yaml' ||
                baseName === 'go.sum' || baseName === 'composer.lock' ||
                baseName === 'Cargo.lock' || baseName === 'Gemfile.lock';

            if (isDep) {
                result.dependencyFiles.push(f.name);
            } else if (isTest) {
                result.testFiles.push(f.name);
            } else if (!isConfig) {
                const analyzer = AnalyzerRegistry.getForFile(f.name);
                if (analyzer) result.sourceFiles.push(f.name);
            }

            /* Detect language from file extension */
            const analyzer = AnalyzerRegistry.getForFile(f.name);
            if (analyzer) result.languages.add(analyzer.id);
        }

        /* Framework detection from file contents */
        for (const [configName, detector] of Object.entries(this.FRAMEWORK_DETECTORS)) {
            for (const f of files) {
                const baseName = f.name.split('/').pop();
                if (baseName === configName && f.content) {
                    const fw = detector(f.content);
                    if (fw) result.frameworks.add(fw);
                }
            }
        }

        /* Project name from package.json or directory */
        const pkgFile = files.find(f => f.name.split('/').pop() === 'package.json');
        if (pkgFile && pkgFile.content) {
            try { result.projectName = JSON.parse(pkgFile.content).name || result.projectName; } catch (e) {}
        }
        const cargoFile = files.find(f => f.name.split('/').pop() === 'Cargo.toml');
        if (cargoFile && cargoFile.content) {
            const m = cargoFile.content.match(/name\s*=\s*"([^"]+)"/);
            if (m) result.projectName = m[1];
        }

        /* Entry point detection */
        const entryPriority = ['index.js', 'main.js', 'app.js', 'index.ts', 'main.ts', 'app.ts',
            'main.py', 'app.py', 'manage.py', '__main__.py',
            'Main.java', 'App.java', 'main.go', 'main.rs', 'main.c', 'main.cpp',
            'Program.cs', 'index.php', 'main.kt'];
        for (const entry of entryPriority) {
            const found = files.find(f => f.name.split('/').pop() === entry);
            if (found) { result.entryPoint = found.name; break; }
        }
        if (!result.entryPoint && pkgFile && pkgFile.content) {
            try { result.entryPoint = JSON.parse(pkgFile.content).main || null; } catch (e) {}
        }

        /* Project type detection */
        if (result.frameworks.size > 0) {
            const fws = [...result.frameworks];
            if (fws.some(f => ['React', 'Vue.js', 'Angular', 'Svelte'].includes(f))) result.projectType = 'Web Frontend';
            else if (fws.some(f => ['Express.js', 'Fastify', 'Koa', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Laravel', 'Gin', 'Actix', 'Rocket'].includes(f))) result.projectType = 'Web Backend';
            else if (fws.some(f => ['Next.js', 'Nuxt.js'].includes(f))) result.projectType = 'Full-Stack Web';
            else if (fws.some(f => ['Electron'].includes(f))) result.projectType = 'Desktop Application';
        } else if (result.languages.has('python')) result.projectType = 'Python Application';
        else if (result.languages.has('javascript') || result.languages.has('typescript')) result.projectType = 'JavaScript Application';
        else if (result.languages.has('java') || result.languages.has('kotlin')) result.projectType = 'Java/Kotlin Application';
        else if (result.languages.has('c') || result.languages.has('cpp')) result.projectType = 'C/C++ Application';
        else if (result.languages.has('rust')) result.projectType = 'Rust Application';
        else if (result.languages.has('go')) result.projectType = 'Go Application';

        /* Test framework from package.json scripts */
        if (pkgFile && pkgFile.content) {
            try {
                const pkg = JSON.parse(pkgFile.content);
                if (pkg.scripts && pkg.scripts.test) {
                    const testCmd = pkg.scripts.test;
                    if (testCmd.includes('jest')) result.testFrameworks.add('jest');
                    if (testCmd.includes('mocha')) result.testFrameworks.add('mocha');
                    if (testCmd.includes('vitest')) result.testFrameworks.add('vitest');
                    if (testCmd.includes('ava')) result.testFrameworks.add('ava');
                }
            } catch (e) {}
        }

        /* Serialize sets */
        return {
            ...result,
            languages: [...result.languages],
            frameworks: [...result.frameworks],
            packageManagers: [...result.packageManagers],
            buildSystems: [...result.buildSystems],
            testFrameworks: [...result.testFrameworks],
            tools: [...result.tools],
            bundlers: [...result.bundlers],
        };
    }
};

/* ---------- Helper: Bracket Matching ---------- */
function checkBrackets(code, openChars = '({[', closeChars = ')}]') {
    const errors = [];
    const stack = [];
    let inString = false, stringChar = '', escaped = false;
    let inLineComment = false, inBlockComment = false;
    let line = 1, col = 0;

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const next = code[i + 1] || '';
        col++;
        if (ch === '\n') { line++; col = 0; inLineComment = false; continue; }
        if (escaped) { escaped = false; continue; }
        if (ch === '\\' && inString) { escaped = true; continue; }
        if (inLineComment) continue;
        if (inBlockComment) { if (ch === '*' && next === '/') { inBlockComment = false; i++; } continue; }
        if (!inString && ch === '/' && next === '/') { inLineComment = true; continue; }
        if (!inString && ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
        if (!inString && (ch === '"' || ch === "'" || ch === '`')) { inString = true; stringChar = ch; continue; }
        if (inString && ch === stringChar) { inString = false; continue; }
        if (inString) continue;

        const openIdx = openChars.indexOf(ch);
        const closeIdx = closeChars.indexOf(ch);
        if (openIdx !== -1) {
            stack.push({ char: ch, line, col, idx: openIdx });
        } else if (closeIdx !== -1) {
            if (stack.length === 0) {
                errors.push({ line, col, message: `Unexpected closing '${ch}' without matching opening bracket`, char: ch });
            } else {
                const top = stack.pop();
                if (top.idx !== closeIdx) {
                    errors.push({ line: top.line, col: top.col, message: `Mismatched bracket: '${top.char}' opened on line ${top.line} but closed with '${ch}' on line ${line}`, char: top.char });
                }
            }
        }
    }
    for (const item of stack) {
        errors.push({ line: item.line, col: item.col, message: `Unclosed '${item.char}' opened on line ${item.line}`, char: item.char });
    }
    return errors;
}

/* ---------- Helper: Get code context ---------- */
function getCodeContext(code, line, contextLines = 3) {
    const lines = code.split('\n');
    const start = Math.max(0, line - 1 - contextLines);
    const end = Math.min(lines.length, line + contextLines);
    return lines.slice(start, end).join('\n');
}

function getLineContent(code, line) {
    const lines = code.split('\n');
    return (lines[line - 1] || '').trim();
}

/* ============================================================
   JAVASCRIPT ANALYZER (Full — Acorn-based)
   ============================================================ */
const JavaScriptAnalyzer = {
    id: 'javascript',
    name: 'JavaScript',
    icon: '🟨',
    color: '#f7df1e',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    available: true,
    capabilities: { syntax: 'full', lint: 'full', compile: 'none', test: 'detect' },
    description: 'Full syntax and lint analysis using Acorn AST parser',

    detect(files) {
        return files.some(f => this.extensions.includes('.' + f.name.split('.').pop().toLowerCase()));
    },

    analyze(content, fileName) {
        const errors = [];
        /* 1. Try Acorn parse */
        if (typeof acorn !== 'undefined') {
            try {
                const ast = acorn.parse(content, {
                    ecmaVersion: 2022,
                    sourceType: 'module',
                    locations: true,
                    allowImportExportEverywhere: true,
                    allowAwaitOutsideFunction: true,
                    allowReturnOutsideFunction: true,
                    allowHashBang: true,
                });
                /* Walk AST for lint issues */
                this._walkAST(ast, content, fileName, errors);
            } catch (e) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: e.loc ? e.loc.line : 1,
                    column: e.loc ? e.loc.column + 1 : 1, language: 'javascript',
                    type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                    message: e.message.replace(/\(\d+:\d+\)/, '').trim(),
                    explanation: 'The JavaScript parser encountered invalid syntax and could not parse this file.',
                    cause: `Syntax error at line ${e.loc ? e.loc.line : '?'}: ${e.message.replace(/\(\d+:\d+\)/, '').trim()}`,
                    suggestion: 'Check the syntax around the indicated location. Common causes include missing brackets, parentheses, or semicolons.',
                    code: getLineContent(content, e.loc ? e.loc.line : 1),
                    correctedCode: null, rule: 'parse-error'
                });
            }
        } else {
            /* Fallback: bracket checking */
            const bracketErrors = checkBrackets(content);
            for (const be of bracketErrors) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: be.line, column: be.col,
                    language: 'javascript', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                    message: be.message,
                    explanation: 'A bracket mismatch was detected.',
                    cause: be.message, suggestion: 'Ensure all brackets are properly matched.',
                    code: getLineContent(content, be.line), correctedCode: null, rule: 'bracket-mismatch'
                });
            }
        }
        /* 2. Pattern-based checks (always run) */
        this._patternChecks(content, fileName, errors);
        return errors;
    },

    _walkAST(ast, code, fileName, errors) {
        const declared = new Map();
        const used = new Set();
        const lines = code.split('\n');

        function walk(node, depth) {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) { node.forEach(n => walk(n, depth)); return; }

            /* Track variable declarations */
            if (node.type === 'VariableDeclaration') {
                for (const decl of node.declarations) {
                    if (decl.id && decl.id.type === 'Identifier') {
                        declared.set(decl.id.name, { line: decl.id.loc.start.line, kind: node.kind });
                    }
                }
                /* var usage warning */
                if (node.kind === 'var') {
                    const line = node.loc.start.line;
                    errors.push({
                        id: nextErrorId(), file: fileName, line, column: node.loc.start.column + 1,
                        language: 'javascript', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                        message: 'Use of "var" — prefer "let" or "const"',
                        explanation: '"var" has function scope and can lead to unexpected behavior due to hoisting. "let" and "const" use block scope, which is more predictable.',
                        cause: 'Legacy "var" keyword used for variable declaration.',
                        suggestion: `Replace "var" with "const" (if never reassigned) or "let" (if reassigned).`,
                        code: lines[line - 1] ? lines[line - 1].trim() : '',
                        correctedCode: lines[line - 1] ? lines[line - 1].replace(/\bvar\b/, 'const').trim() : null,
                        rule: 'no-var'
                    });
                }
            }

            /* Track identifier usage */
            if (node.type === 'Identifier' && node.name) {
                used.add(node.name);
            }

            /* Loose equality */
            if (node.type === 'BinaryExpression' && (node.operator === '==' || node.operator === '!=')) {
                const line = node.loc.start.line;
                const op = node.operator;
                const strict = op === '==' ? '===' : '!==';
                errors.push({
                    id: nextErrorId(), file: fileName, line, column: node.loc.start.column + 1,
                    language: 'javascript', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM,
                    message: `Use "${strict}" instead of "${op}"`,
                    explanation: `The "${op}" operator performs type coercion before comparison, which can lead to unexpected results (e.g., "0 == false" is true). The "${strict}" operator compares both value and type.`,
                    cause: `Loose equality "${op}" used instead of strict equality "${strict}".`,
                    suggestion: `Replace "${op}" with "${strict}" for type-safe comparison.`,
                    code: lines[line - 1] ? lines[line - 1].trim() : '',
                    correctedCode: lines[line - 1] ? lines[line - 1].replace(op === '==' ? /([^=!])={2}([^=])/ : /!={1}([^=])/, op === '==' ? '$1===$2' : '!==$1').trim() : null,
                    rule: 'eqeqeq'
                });
            }

            /* Empty catch block */
            if (node.type === 'CatchClause' && node.body && node.body.body && node.body.body.length === 0) {
                const line = node.loc.start.line;
                errors.push({
                    id: nextErrorId(), file: fileName, line, column: node.loc.start.column + 1,
                    language: 'javascript', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM,
                    message: 'Empty catch block — errors will be silently ignored',
                    explanation: 'An empty catch block catches exceptions but does nothing with them. This can hide bugs and make debugging difficult.',
                    cause: 'The catch block has no statements inside it.',
                    suggestion: 'At minimum, log the error. Example: console.error(e);',
                    code: 'catch (' + (node.param ? node.param.name : '') + ') {}',
                    correctedCode: 'catch (' + (node.param ? node.param.name : 'e') + ') {\n  console.error(' + (node.param ? node.param.name : 'e') + ');\n}',
                    rule: 'no-empty-catch'
                });
            }

            /* Unreachable code after return/throw */
            if (node.type === 'BlockStatement' && node.body) {
                for (let i = 0; i < node.body.length - 1; i++) {
                    const stmt = node.body[i];
                    if (stmt.type === 'ReturnStatement' || stmt.type === 'ThrowStatement') {
                        const next = node.body[i + 1];
                        if (next && next.loc) {
                            errors.push({
                                id: nextErrorId(), file: fileName, line: next.loc.start.line,
                                column: next.loc.start.column + 1, language: 'javascript',
                                type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM,
                                message: `Unreachable code after ${stmt.type === 'ReturnStatement' ? 'return' : 'throw'} statement`,
                                explanation: `Code after a ${stmt.type === 'ReturnStatement' ? 'return' : 'throw'} statement in the same block will never execute.`,
                                cause: `A ${stmt.type === 'ReturnStatement' ? 'return' : 'throw'} statement on line ${stmt.loc.start.line} exits the function before this code is reached.`,
                                suggestion: 'Remove the unreachable code or restructure the logic.',
                                code: lines[next.loc.start.line - 1] ? lines[next.loc.start.line - 1].trim() : '',
                                correctedCode: null, rule: 'no-unreachable'
                            });
                        }
                    }
                }
            }

            /* Assignment in condition */
            if ((node.type === 'IfStatement' || node.type === 'WhileStatement' || node.type === 'ForStatement') && node.test) {
                if (node.test.type === 'AssignmentExpression') {
                    const line = node.test.loc.start.line;
                    errors.push({
                        id: nextErrorId(), file: fileName, line, column: node.test.loc.start.column + 1,
                        language: 'javascript', type: ErrorType.LOGIC_ERROR, severity: Severity.HIGH,
                        message: 'Assignment "=" in condition — did you mean "==="?',
                        explanation: 'Using "=" in a condition performs an assignment, not a comparison. This is almost always a mistake.',
                        cause: 'An assignment operator "=" was used inside a conditional expression instead of a comparison operator.',
                        suggestion: 'Replace "=" with "===" for comparison.',
                        code: lines[line - 1] ? lines[line - 1].trim() : '',
                        correctedCode: lines[line - 1] ? lines[line - 1].replace(/([^=!<>])=([^=])/, '$1===$2').trim() : null,
                        rule: 'no-cond-assign'
                    });
                }
            }

            /* Recurse into child nodes */
            for (const key of Object.keys(node)) {
                if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
                const child = node[key];
                if (child && typeof child === 'object') walk(child, depth + 1);
            }
        }

        walk(ast, 0);

        /* Check unused declarations (only top-level, skip imports) */
        for (const [name, info] of declared) {
            if (!used.has(name) && !name.startsWith('_')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: info.line, column: 1,
                    language: 'javascript', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                    message: `Variable "${name}" is declared but never used`,
                    explanation: `The variable "${name}" is declared but no reference to it was found in this file. Unused variables clutter code and may indicate incomplete logic.`,
                    cause: 'Likely cause: The variable was declared for future use or its usage was removed.',
                    suggestion: `Remove the declaration if it is not needed, or use the variable where intended.`,
                    code: lines[info.line - 1] ? lines[info.line - 1].trim() : '',
                    correctedCode: null, rule: 'no-unused-vars'
                });
            }
        }
    },

    _patternChecks(content, fileName, errors) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const lineNum = i + 1;

            /* console.log in source (not test files) */
            if (/\bconsole\.(log|debug|info)\s*\(/.test(trimmed) && !fileName.includes('test') && !fileName.includes('spec')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: line.indexOf('console') + 1,
                    language: 'javascript', type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                    message: 'console.log() found — consider removing for production',
                    explanation: 'console.log() statements are useful for debugging but should typically be removed from production code.',
                    cause: 'Debug logging left in source code.',
                    suggestion: 'Remove the console.log() call or replace with a proper logging framework.',
                    code: trimmed, correctedCode: '// ' + trimmed, rule: 'no-console'
                });
            }

            /* TODO/FIXME/HACK/XXX comments */
            const todoMatch = trimmed.match(/\/\/\s*(TODO|FIXME|HACK|XXX)[\s:](.*)/i);
            if (todoMatch) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'javascript', type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                    message: `${todoMatch[1].toUpperCase()} comment: ${todoMatch[2].trim().substring(0, 80)}`,
                    explanation: `A ${todoMatch[1].toUpperCase()} comment indicates unfinished work or a known issue.`,
                    cause: 'Developer left a note about work that needs to be done.',
                    suggestion: 'Address the TODO item or create a tracking issue.',
                    code: trimmed, correctedCode: null, rule: 'todo-comment'
                });
            }

            /* alert() usage */
            if (/\balert\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: line.indexOf('alert') + 1,
                    language: 'javascript', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                    message: 'alert() found — avoid in production code',
                    explanation: 'alert() blocks the UI thread and provides a poor user experience.',
                    cause: 'Browser alert dialog used for notifications.',
                    suggestion: 'Replace with a proper UI notification component.',
                    code: trimmed, correctedCode: null, rule: 'no-alert'
                });
            }

            /* eval() usage */
            if (/\beval\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: line.indexOf('eval') + 1,
                    language: 'javascript', type: ErrorType.SECURITY_WARNING, severity: Severity.HIGH,
                    message: 'eval() usage detected — security risk',
                    explanation: 'eval() executes arbitrary strings as code, which creates security vulnerabilities (especially with user input) and makes code harder to debug and optimize.',
                    cause: 'Dynamic code execution via eval().',
                    suggestion: 'Avoid eval(). Use JSON.parse() for JSON data, Function constructor for dynamic functions, or restructure the code.',
                    code: trimmed, correctedCode: null, rule: 'no-eval'
                });
            }
        }
    },

    canCompile: false, compile() { return { success: true, output: '', errors: [] }; },
    canTest: false, test() { return { detected: false, results: [] }; },
    parseErrors(raw) { return []; }
};

/* ============================================================
   TYPESCRIPT ANALYZER (Full — extends JavaScript)
   ============================================================ */
const TypeScriptAnalyzer = {
    ...JavaScriptAnalyzer,
    id: 'typescript',
    name: 'TypeScript',
    icon: '🔷',
    color: '#3178c6',
    extensions: ['.ts', '.tsx'],
    description: 'Full syntax analysis with TypeScript-specific pattern checks',

    analyze(content, fileName) {
        /* Run JS analysis first */
        const errors = JavaScriptAnalyzer.analyze.call(this, content, fileName);
        /* Fix language field */
        errors.forEach(e => e.language = 'typescript');
        /* TS-specific checks */
        this._tsPatternChecks(content, fileName, errors);
        return errors;
    },

    _tsPatternChecks(content, fileName, errors) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;

            /* any type usage */
            if (/:\s*any\b/.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: lines[i].indexOf('any') + 1,
                    language: 'typescript', type: ErrorType.TYPE_ERROR, severity: Severity.LOW,
                    message: 'Type "any" used — this disables type checking',
                    explanation: 'Using "any" type bypasses TypeScript\'s type system, removing the safety benefits of static typing.',
                    cause: 'Explicit use of "any" type annotation.',
                    suggestion: 'Replace "any" with a specific type, or use "unknown" if the type is truly unknown.',
                    code: trimmed, correctedCode: trimmed.replace(/:\s*any\b/, ': unknown'), rule: 'no-explicit-any'
                });
            }

            /* @ts-ignore */
            if (trimmed.includes('@ts-ignore')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'typescript', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM,
                    message: '@ts-ignore suppresses type errors — use @ts-expect-error instead',
                    explanation: '@ts-ignore suppresses the next line\'s type errors silently. @ts-expect-error is safer because it errors if there\'s no type error to suppress.',
                    cause: 'Type error suppression directive.',
                    suggestion: 'Replace @ts-ignore with @ts-expect-error, or fix the underlying type issue.',
                    code: trimmed, correctedCode: trimmed.replace('@ts-ignore', '@ts-expect-error'), rule: 'ts-expect-error'
                });
            }

            /* Non-null assertion overuse */
            if (/\w+!\.\w+/.test(trimmed) || /\w+!\[/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'typescript', type: ErrorType.TYPE_ERROR, severity: Severity.LOW,
                    message: 'Non-null assertion operator (!) — may cause runtime errors',
                    explanation: 'The non-null assertion operator (!) tells TypeScript to trust that a value is not null/undefined. If it actually is, a runtime error will occur.',
                    cause: 'Non-null assertion used to bypass nullability check.',
                    suggestion: 'Use optional chaining (?.) or add a proper null check instead.',
                    code: trimmed, correctedCode: null, rule: 'no-non-null-assertion'
                });
            }
        }
    }
};

/* ============================================================
   PYTHON ANALYZER (Full — custom parser)
   ============================================================ */
const PythonAnalyzer = {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    color: '#3776ab',
    extensions: ['.py', '.pyw', '.pyi'],
    available: true,
    capabilities: { syntax: 'full', lint: 'full', compile: 'none', test: 'detect' },
    description: 'Full syntax and lint analysis with custom Python parser',

    detect(files) {
        return files.some(f => this.extensions.includes('.' + f.name.split('.').pop().toLowerCase()));
    },

    analyze(content, fileName) {
        const errors = [];
        const lines = content.split('\n');

        this._checkIndentation(lines, fileName, errors);
        this._checkBrackets(content, fileName, errors);
        this._checkSyntaxPatterns(lines, fileName, errors);
        this._checkStylePatterns(lines, fileName, errors);
        this._checkImports(lines, fileName, errors);
        this._checkCommonBugs(lines, content, fileName, errors);

        return errors;
    },

    _checkIndentation(lines, fileName, errors) {
        let useTabs = null;
        let indentSize = null;
        let prevIndent = 0;
        let expectIndent = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            if (line.trim() === '' || line.trim().startsWith('#')) continue;

            /* Mixed tabs and spaces */
            if (/^\t+ /.test(line) || /^ +\t/.test(line)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                    message: 'Mixed tabs and spaces in indentation',
                    explanation: 'Python does not allow mixing tabs and spaces for indentation. This will cause an IndentationError.',
                    cause: 'The indentation on this line uses both tab and space characters.',
                    suggestion: 'Use consistent indentation — either all spaces (recommended: 4 spaces) or all tabs.',
                    code: line, correctedCode: line.replace(/\t/g, '    '), rule: 'mixed-indentation'
                });
            }

            /* Track indentation style */
            const leadingWhitespace = line.match(/^(\s*)/)[1];
            if (leadingWhitespace.length > 0) {
                if (useTabs === null) useTabs = leadingWhitespace[0] === '\t';
                if (indentSize === null && !useTabs) indentSize = leadingWhitespace.length;
            }

            /* Check for expected indent after colon */
            if (expectIndent) {
                const currentIndent = leadingWhitespace.length;
                if (currentIndent <= prevIndent && line.trim() !== '') {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                        message: 'Expected an indented block',
                        explanation: 'After a statement ending with ":", Python expects the next line to be indented to form a code block.',
                        cause: `The previous line (line ${lineNum - 1}) ends with ":" but this line is not indented.`,
                        suggestion: 'Indent this line by 4 spaces, or add a "pass" statement if the block should be empty.',
                        code: line.trim(), correctedCode: '    ' + line.trim(), rule: 'expected-indent'
                    });
                }
                expectIndent = false;
            }

            const trimmed = line.trim();
            if (trimmed.endsWith(':') && !trimmed.startsWith('#') && !trimmed.includes("'") &&
                (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else:') ||
                trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('def ') ||
                trimmed.startsWith('class ') || trimmed.startsWith('try:') || trimmed.startsWith('except') ||
                trimmed.startsWith('finally:') || trimmed.startsWith('with '))) {
                prevIndent = leadingWhitespace.length;
                expectIndent = true;
            }
        }
    },

    _checkBrackets(content, fileName, errors) {
        const bracketErrors = checkBrackets(content);
        for (const be of bracketErrors) {
            errors.push({
                id: nextErrorId(), file: fileName, line: be.line, column: be.col,
                language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                message: be.message,
                explanation: 'Unmatched brackets/parentheses will cause a SyntaxError in Python.',
                cause: be.message,
                suggestion: 'Ensure all opening brackets have a corresponding closing bracket.',
                code: getLineContent(content, be.line), correctedCode: null, rule: 'bracket-mismatch'
            });
        }
    },

    _checkSyntaxPatterns(lines, fileName, errors) {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;
            if (trimmed === '' || trimmed.startsWith('#')) continue;

            /* Missing colon after control statements */
            const controlPattern = /^(if|elif|else|for|while|def|class|try|except|finally|with)\b(.*)$/;
            const match = trimmed.match(controlPattern);
            if (match) {
                const keyword = match[1];
                const rest = match[2];
                /* Check if line continues (backslash or open bracket) */
                const continues = trimmed.endsWith('\\') || /[\(\[\{]$/.test(trimmed);
                if (!continues && !rest.trimEnd().endsWith(':') && !rest.includes('#')) {
                    /* Special case: single-line if with colon in middle */
                    if (!rest.includes(':')) {
                        errors.push({
                            id: nextErrorId(), file: fileName, line: lineNum, column: trimmed.length,
                            language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                            message: `Missing colon ":" after "${keyword}" statement`,
                            explanation: `Python requires a colon at the end of "${keyword}" statements to indicate the start of a code block.`,
                            cause: `The "${keyword}" statement on line ${lineNum} is missing the required colon.`,
                            suggestion: `Add ":" at the end of the "${keyword}" statement.`,
                            code: trimmed, correctedCode: trimmed + ':', rule: 'missing-colon'
                        });
                    }
                }
            }

            /* print without parentheses (Python 2 style) */
            if (/^print\s+[^(]/.test(trimmed) && !trimmed.startsWith('print(')) {
                const printContent = trimmed.replace(/^print\s+/, '');
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                    message: 'print is a function in Python 3 — use print()',
                    explanation: 'In Python 3, "print" is a function and must be called with parentheses. The Python 2 "print" statement syntax is not valid.',
                    cause: 'Python 2 print syntax used without parentheses.',
                    suggestion: 'Wrap the print argument in parentheses.',
                    code: trimmed, correctedCode: `print(${printContent})`, rule: 'print-function'
                });
            }

            /* return outside function (simple check) */
            if (/^return\b/.test(trimmed)) {
                let inFunction = false;
                for (let j = i - 1; j >= 0; j--) {
                    if (/^\s*(def|async\s+def)\s+/.test(lines[j])) { inFunction = true; break; }
                    if (/^(class|if|for|while)\s+/.test(lines[j].trim()) && lines[j].search(/\S/) === 0) break;
                }
                if (!inFunction) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                        message: '"return" outside function',
                        explanation: 'A return statement can only be used inside a function. Using it at the module level is a SyntaxError.',
                        cause: 'Possible cause: The return statement is not properly indented inside a function, or a function definition is missing.',
                        suggestion: 'Ensure the return statement is inside a function definition.',
                        code: trimmed, correctedCode: null, rule: 'return-outside-function'
                    });
                }
            }
        }
    },

    _checkStylePatterns(lines, fileName, errors) {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;
            if (trimmed === '' || trimmed.startsWith('#')) continue;

            /* Bare except */
            if (/^except\s*:/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM,
                    message: 'Bare "except:" catches all exceptions including SystemExit and KeyboardInterrupt',
                    explanation: 'A bare "except:" clause catches every exception, including system exceptions that should typically be allowed to propagate (like KeyboardInterrupt and SystemExit).',
                    cause: 'The except clause does not specify which exception types to catch.',
                    suggestion: 'Specify the exception type(s) to catch. Use "except Exception:" to catch most errors while allowing system exits.',
                    code: trimmed, correctedCode: trimmed.replace('except:', 'except Exception:'), rule: 'bare-except'
                });
            }

            /* Mutable default arguments */
            const defMatch = trimmed.match(/^def\s+\w+\s*\((.*)\)\s*(->\s*\w+)?\s*:/);
            if (defMatch) {
                const params = defMatch[1];
                if (/=\s*(\[\]|\{\}|\[.+\]|\{.+\})/.test(params)) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'python', type: ErrorType.LOGIC_ERROR, severity: Severity.HIGH,
                        message: 'Mutable default argument — this is a common Python bug',
                        explanation: 'Default mutable arguments (like lists or dicts) are shared between all calls to the function. Modifying them in one call affects subsequent calls.',
                        cause: 'A mutable object (list or dict) is used as a default parameter value.',
                        suggestion: 'Use None as the default and create the mutable object inside the function body.',
                        code: trimmed, correctedCode: null, rule: 'mutable-default'
                    });
                }
            }

            /* Line too long (PEP 8: 79, commonly 120) */
            if (lines[i].length > 120 && !trimmed.startsWith('#') && !trimmed.startsWith('"""') && !trimmed.startsWith("'''")) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 121,
                    language: 'python', type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                    message: `Line too long (${lines[i].length} > 120 characters)`,
                    explanation: 'Long lines reduce readability and may not display well in all editors and code review tools.',
                    cause: `This line has ${lines[i].length} characters, exceeding the 120-character limit.`,
                    suggestion: 'Break the line into multiple shorter lines.',
                    code: trimmed.substring(0, 80) + '...', correctedCode: null, rule: 'line-too-long'
                });
            }

            /* Global variable */
            if (/^global\s+/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                    message: 'Use of "global" keyword — consider refactoring',
                    explanation: 'The "global" keyword makes code harder to reason about and test. It creates hidden dependencies between functions.',
                    cause: 'Function uses a global variable instead of parameters and return values.',
                    suggestion: 'Pass the value as a function parameter and return the modified value instead.',
                    code: trimmed, correctedCode: null, rule: 'no-global'
                });
            }

            /* == None instead of is None */
            if (/==\s*None\b/.test(trimmed) || /!=\s*None\b/.test(trimmed)) {
                const isEq = /==\s*None\b/.test(trimmed);
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                    message: `Use "${isEq ? 'is' : 'is not'}" instead of "${isEq ? '==' : '!='}" for None comparison`,
                    explanation: 'None is a singleton in Python. Identity comparison (is/is not) is more appropriate and faster than equality comparison (==/!=).',
                    cause: `Equality operator used for None comparison instead of identity operator.`,
                    suggestion: `Replace "${isEq ? '==' : '!='} None" with "${isEq ? 'is' : 'is not'} None".`,
                    code: trimmed,
                    correctedCode: isEq ? trimmed.replace(/==\s*None/, 'is None') : trimmed.replace(/!=\s*None/, 'is not None'),
                    rule: 'none-comparison'
                });
            }
        }
    },

    _checkImports(lines, fileName, errors) {
        const imports = [];
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const importMatch = trimmed.match(/^import\s+(\S+)/);
            const fromMatch = trimmed.match(/^from\s+\S+\s+import\s+(.+)/);
            if (importMatch) {
                imports.push({ name: importMatch[1], line: i + 1, full: trimmed });
            } else if (fromMatch) {
                const names = fromMatch[1].split(',').map(n => n.trim().split(' as ').pop().trim());
                names.forEach(n => {
                    if (n !== '*') imports.push({ name: n, line: i + 1, full: trimmed });
                });
            }

            /* import * */
            if (/^from\s+\S+\s+import\s+\*/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: i + 1, column: 1,
                    language: 'python', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM,
                    message: 'Wildcard import "from X import *" — pollutes namespace',
                    explanation: 'Wildcard imports bring all names from a module into the current namespace, making it unclear where names come from and potentially causing name conflicts.',
                    cause: 'Wildcard import used instead of explicit imports.',
                    suggestion: 'Import specific names that you need: "from module import name1, name2".',
                    code: trimmed, correctedCode: null, rule: 'no-wildcard-import'
                });
            }
        }

        /* Check for unused imports (simple: check if name appears in non-import lines) */
        const codeWithoutImports = lines.filter((l, i) => {
            const t = l.trim();
            return !t.startsWith('import ') && !t.startsWith('from ') && !t.startsWith('#');
        }).join('\n');

        for (const imp of imports) {
            if (imp.name && imp.name !== '*' && !imp.name.includes('.')) {
                const nameRegex = new RegExp('\\b' + imp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
                if (!nameRegex.test(codeWithoutImports)) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: imp.line, column: 1,
                        language: 'python', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                        message: `Import "${imp.name}" appears unused`,
                        explanation: `The module/name "${imp.name}" is imported but does not appear to be used in the rest of the file.`,
                        cause: 'Likely cause: The import was added for code that was later removed or refactored.',
                        suggestion: 'Remove the unused import to keep the code clean.',
                        code: imp.full, correctedCode: '# ' + imp.full, rule: 'unused-import'
                    });
                }
            }
        }
    },

    _checkCommonBugs(lines, content, fileName, errors) {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;

            /* except with comma (Python 2 style) */
            if (/^except\s+\w+\s*,\s*\w+\s*:/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                    message: 'Python 2 except syntax — use "as" instead of comma',
                    explanation: 'In Python 3, the syntax for catching an exception and binding it to a name uses "as" instead of a comma.',
                    cause: 'Python 2 exception handling syntax used.',
                    suggestion: 'Replace "except ErrorType, e:" with "except ErrorType as e:".',
                    code: trimmed,
                    correctedCode: trimmed.replace(/^(except\s+\w+)\s*,\s*(\w+)\s*:/, '$1 as $2:'),
                    rule: 'except-comma'
                });
            }

            /* String concatenation in loop */
            if (/\+\s*=\s*["']/.test(trimmed) || /\+\s*=\s*str\b/.test(trimmed)) {
                /* Check if inside a for/while loop */
                let inLoop = false;
                for (let j = i - 1; j >= 0; j--) {
                    if (/^\s*(for|while)\b/.test(lines[j])) { inLoop = true; break; }
                    if (lines[j].trim() !== '' && lines[j].search(/\S/) === 0) break;
                }
                if (inLoop) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'python', type: ErrorType.PERFORMANCE_WARNING, severity: Severity.LOW,
                        message: 'String concatenation in loop — use str.join() or list append',
                        explanation: 'String concatenation with "+=" in a loop creates a new string object each iteration, leading to O(n²) performance.',
                        cause: 'String building via concatenation inside a loop.',
                        suggestion: 'Collect parts in a list and use "".join(parts) after the loop.',
                        code: trimmed, correctedCode: null, rule: 'string-concat-loop'
                    });
                }
            }

            /* open() without with statement */
            if (/\w+\s*=\s*open\s*\(/.test(trimmed) && !trimmed.startsWith('with ')) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'python', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM,
                    message: 'File opened without "with" statement — resource may not be properly closed',
                    explanation: 'Opening a file without a "with" statement means the file handle may not be properly closed if an exception occurs, leading to resource leaks.',
                    cause: 'File opened with assignment instead of using a context manager.',
                    suggestion: 'Use "with open(...) as f:" to ensure the file is automatically closed.',
                    code: trimmed, correctedCode: null, rule: 'no-bare-open'
                });
            }
        }
    },

    canCompile: false, compile() { return { success: true, output: '', errors: [] }; },
    canTest: false, test() { return { detected: false, results: [] }; },
    parseErrors(raw) { return []; }
};

/* ============================================================
   HTML ANALYZER (Full — DOMParser)
   ============================================================ */
const HTMLAnalyzer = {
    id: 'html',
    name: 'HTML',
    icon: '🌐',
    color: '#e34f26',
    extensions: ['.html', '.htm', '.xhtml'],
    available: true,
    capabilities: { syntax: 'full', lint: 'full', compile: 'none', test: 'none' },
    description: 'Full HTML validation using DOMParser and pattern analysis',

    detect(files) {
        return files.some(f => this.extensions.includes('.' + f.name.split('.').pop().toLowerCase()));
    },

    analyze(content, fileName) {
        const errors = [];
        const lines = content.split('\n');

        /* DOMParser check */
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const parseErrors = doc.querySelectorAll('parsererror');
            parseErrors.forEach(pe => {
                errors.push({
                    id: nextErrorId(), file: fileName, line: 1, column: 1,
                    language: 'html', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                    message: 'HTML parsing error: ' + pe.textContent.substring(0, 100),
                    explanation: 'The HTML parser encountered malformed markup.',
                    cause: 'Invalid HTML structure.',
                    suggestion: 'Check for unclosed tags, missing quotes around attributes, or invalid nesting.',
                    code: '', correctedCode: null, rule: 'parse-error'
                });
            });
        } catch (e) { /* ignore */ }

        /* Missing doctype */
        if (!content.trim().toLowerCase().startsWith('<!doctype')) {
            errors.push({
                id: nextErrorId(), file: fileName, line: 1, column: 1,
                language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM,
                message: 'Missing <!DOCTYPE html> declaration',
                explanation: 'Without a DOCTYPE declaration, browsers may render the page in "quirks mode", which can cause inconsistent rendering.',
                cause: 'No DOCTYPE declaration at the start of the document.',
                suggestion: 'Add <!DOCTYPE html> as the first line of the file.',
                code: lines[0] || '', correctedCode: '<!DOCTYPE html>\n' + (lines[0] || ''), rule: 'doctype'
            });
        }

        /* Missing charset */
        if (!/<meta\s[^>]*charset/i.test(content)) {
            errors.push({
                id: nextErrorId(), file: fileName, line: 1, column: 1,
                language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM,
                message: 'Missing charset meta tag',
                explanation: 'Without a charset declaration, the browser may not correctly interpret special characters.',
                cause: 'No <meta charset="UTF-8"> found in the document.',
                suggestion: 'Add <meta charset="UTF-8"> inside the <head> section.',
                code: '', correctedCode: '<meta charset="UTF-8">', rule: 'charset'
            });
        }

        /* Missing viewport */
        if (!/<meta\s[^>]*viewport/i.test(content)) {
            errors.push({
                id: nextErrorId(), file: fileName, line: 1, column: 1,
                language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                message: 'Missing viewport meta tag — page may not be mobile-friendly',
                explanation: 'Without a viewport meta tag, mobile browsers will render the page at desktop width and scale it down.',
                cause: 'No viewport meta tag found.',
                suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside <head>.',
                code: '', correctedCode: '<meta name="viewport" content="width=device-width, initial-scale=1.0">', rule: 'viewport'
            });
        }

        /* Missing lang attribute */
        if (/<html\b/i.test(content) && !/<html\s[^>]*lang/i.test(content)) {
            errors.push({
                id: nextErrorId(), file: fileName, line: 1, column: 1,
                language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                message: 'Missing "lang" attribute on <html> element',
                explanation: 'The lang attribute helps screen readers pronounce content correctly and assists search engines.',
                cause: 'No lang attribute on the <html> element.',
                suggestion: 'Add a lang attribute: <html lang="en">.',
                code: '', correctedCode: null, rule: 'html-lang'
            });
        }

        /* Line-by-line checks */
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const lineNum = i + 1;

            /* Images without alt */
            const imgMatch = trimmed.match(/<img\s([^>]*)>/gi);
            if (imgMatch) {
                for (const img of imgMatch) {
                    if (!/\balt\s*=/i.test(img)) {
                        errors.push({
                            id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                            language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM,
                            message: 'Image missing "alt" attribute — accessibility issue',
                            explanation: 'The alt attribute provides alternative text for screen readers and when images fail to load. It is required for accessibility.',
                            cause: 'An <img> element without an alt attribute.',
                            suggestion: 'Add an alt attribute with descriptive text, or alt="" for decorative images.',
                            code: img, correctedCode: img.replace(/<img/, '<img alt=""'), rule: 'img-alt'
                        });
                    }
                }
            }

            /* Empty href */
            if (/href\s*=\s*["']\s*["']/i.test(trimmed) || /href\s*=\s*["']#["']/i.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                    message: 'Empty or "#" href attribute',
                    explanation: 'Links with empty href or "#" create confusing navigation and may cause unexpected page behavior.',
                    cause: 'Placeholder link without a real destination.',
                    suggestion: 'Add a valid URL or use a button element if this is a click handler.',
                    code: trimmed, correctedCode: null, rule: 'no-empty-href'
                });
            }

            /* Inline styles */
            if (/\bstyle\s*=\s*["']/i.test(trimmed) && /<\w/.test(trimmed)) {
                errors.push({
                    id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                    language: 'html', type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                    message: 'Inline style found — prefer external CSS',
                    explanation: 'Inline styles reduce maintainability and cannot be cached or reused across elements.',
                    cause: 'Style attribute used directly on an HTML element.',
                    suggestion: 'Move the styles to an external CSS file and use a class instead.',
                    code: trimmed.substring(0, 80), correctedCode: null, rule: 'no-inline-style'
                });
            }

            /* Duplicate IDs (collect all) */
            const idMatches = [...trimmed.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)];
            for (const m of idMatches) {
                const id = m[1];
                const firstOccurrence = content.indexOf(`id="${id}"`);
                const lastOccurrence = content.lastIndexOf(`id="${id}"`);
                if (firstOccurrence !== lastOccurrence && content.indexOf(`id="${id}"`) < content.indexOf(trimmed)) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'html', type: ErrorType.LOGIC_ERROR, severity: Severity.HIGH,
                        message: `Duplicate ID "${id}" — IDs must be unique`,
                        explanation: 'HTML element IDs must be unique within a document. Duplicate IDs cause unpredictable behavior with JavaScript and CSS selectors.',
                        cause: `The ID "${id}" is used on multiple elements.`,
                        suggestion: 'Rename one of the duplicate IDs to be unique.',
                        code: trimmed, correctedCode: null, rule: 'duplicate-id'
                    });
                }
            }
        }

        return errors;
    },

    canCompile: false, compile() { return { success: true, output: '', errors: [] }; },
    canTest: false, test() { return { detected: false, results: [] }; },
    parseErrors(raw) { return []; }
};

/* ============================================================
   CSS ANALYZER (Full — pattern-based)
   ============================================================ */
const CSSAnalyzer = {
    id: 'css',
    name: 'CSS',
    icon: '🎨',
    color: '#1572b6',
    extensions: ['.css', '.scss', '.less'],
    available: true,
    capabilities: { syntax: 'full', lint: 'full', compile: 'none', test: 'none' },
    description: 'CSS validation and best-practice analysis',

    detect(files) {
        return files.some(f => this.extensions.includes('.' + f.name.split('.').pop().toLowerCase()));
    },

    analyze(content, fileName) {
        const errors = [];
        const lines = content.split('\n');

        /* Bracket matching */
        const bracketErrors = checkBrackets(content, '{', '}');
        for (const be of bracketErrors) {
            errors.push({
                id: nextErrorId(), file: fileName, line: be.line, column: be.col,
                language: 'css', type: ErrorType.SYNTAX_ERROR, severity: Severity.CRITICAL,
                message: be.message,
                explanation: 'CSS requires all opening braces to have matching closing braces.',
                cause: be.message,
                suggestion: 'Check for missing or extra braces.',
                code: getLineContent(content, be.line), correctedCode: null, rule: 'bracket-mismatch'
            });
        }

        const properties = new Map();
        let currentSelector = '';

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;
            if (trimmed === '' || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) continue;

            /* Track current selector */
            if (trimmed.endsWith('{')) {
                currentSelector = trimmed.replace('{', '').trim();
                properties.set(currentSelector, new Map());
            }

            /* Check property declarations */
            const propMatch = trimmed.match(/^([\w-]+)\s*:\s*(.+?)(\s*!important)?\s*;?\s*$/);
            if (propMatch && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
                const prop = propMatch[1].toLowerCase();
                const value = propMatch[2].trim();

                /* Duplicate properties in same selector */
                if (currentSelector && properties.has(currentSelector)) {
                    const selectorProps = properties.get(currentSelector);
                    if (selectorProps.has(prop)) {
                        errors.push({
                            id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                            language: 'css', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                            message: `Duplicate property "${prop}" in same rule`,
                            explanation: 'Having the same property declared twice in the same rule means the first declaration will always be overridden. This is usually unintentional unless used as a fallback.',
                            cause: `Property "${prop}" already declared on line ${selectorProps.get(prop)}.`,
                            suggestion: 'Remove the duplicate declaration or combine the values.',
                            code: trimmed, correctedCode: null, rule: 'no-duplicate-properties'
                        });
                    }
                    selectorProps.set(prop, lineNum);
                }

                /* !important overuse */
                if (propMatch[3]) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'css', type: ErrorType.STYLE_WARNING, severity: Severity.LOW,
                        message: '!important used — this overrides normal specificity',
                        explanation: '!important breaks the natural cascade and makes styles harder to override and maintain.',
                        cause: '!important flag used on a CSS property.',
                        suggestion: 'Increase selector specificity instead of using !important, or restructure your CSS.',
                        code: trimmed, correctedCode: trimmed.replace(/\s*!important/, ''), rule: 'no-important'
                    });
                }

                /* Zero values with units */
                if (/:\s*0(px|em|rem|%|vh|vw|pt|cm|mm)\b/.test(trimmed)) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'css', type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                        message: 'Zero value with unit — unit is unnecessary',
                        explanation: 'Zero is zero regardless of the unit. The unit can be safely omitted for cleaner code.',
                        cause: 'A zero value has a unit attached.',
                        suggestion: 'Remove the unit from zero values.',
                        code: trimmed, correctedCode: trimmed.replace(/0(px|em|rem|%|vh|vw|pt|cm|mm)/g, '0'), rule: 'zero-units'
                    });
                }

                /* Color: transparent vs rgba */
                if (/color\s*:\s*transparent/i.test(trimmed) && prop === 'color') {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                        language: 'css', type: ErrorType.LOGIC_ERROR, severity: Severity.LOW,
                        message: 'text color set to "transparent" — text will be invisible',
                        explanation: 'Setting the text color to transparent makes text completely invisible, which is usually unintentional.',
                        cause: 'Text color set to transparent.',
                        suggestion: 'Use a visible color, or use opacity/visibility if you want to hide the element.',
                        code: trimmed, correctedCode: null, rule: 'transparent-color'
                    });
                }
            }

            /* Missing semicolon (line has property-like pattern but no semicolon and not a selector/comment) */
            if (/^[\w-]+\s*:/.test(trimmed) && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(',')) {
                const nextLine = (lines[i + 1] || '').trim();
                if (nextLine && (nextLine.endsWith('}') || /^[\w-]+\s*:/.test(nextLine))) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: lineNum, column: trimmed.length + 1,
                        language: 'css', type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                        message: 'Missing semicolon at end of property declaration',
                        explanation: 'CSS property declarations must end with a semicolon. A missing semicolon may cause the next property to be ignored.',
                        cause: 'Property declaration missing its terminating semicolon.',
                        suggestion: 'Add a semicolon at the end of the declaration.',
                        code: trimmed, correctedCode: trimmed + ';', rule: 'missing-semicolon'
                    });
                }
            }
        }

        return errors;
    },

    canCompile: false, compile() { return { success: true, output: '', errors: [] }; },
    canTest: false, test() { return { detected: false, results: [] }; },
    parseErrors(raw) { return []; }
};

/* ============================================================
   GENERIC PATTERN ANALYZER (base for compiled languages)
   ============================================================ */
function createPatternAnalyzer(config) {
    return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        color: config.color,
        extensions: config.extensions,
        available: true,
        capabilities: { syntax: 'partial', lint: 'partial', compile: 'unavailable', test: 'unavailable' },
        description: `Pattern-based analysis (client-side). Full analysis requires ${config.name} compiler/toolchain.`,

        detect(files) {
            return files.some(f => this.extensions.includes('.' + f.name.split('.').pop().toLowerCase()));
        },

        analyze(content, fileName) {
            const errors = [];
            const lines = content.split('\n');

            /* Bracket matching */
            if (config.checkBrackets !== false) {
                const bracketErrors = checkBrackets(content);
                for (const be of bracketErrors) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: be.line, column: be.col,
                        language: config.id, type: ErrorType.SYNTAX_ERROR, severity: Severity.HIGH,
                        message: be.message,
                        explanation: 'Mismatched brackets detected.',
                        cause: be.message,
                        suggestion: 'Check for missing or mismatched brackets.',
                        code: getLineContent(content, be.line), correctedCode: null, rule: 'bracket-mismatch'
                    });
                }
            }

            /* Run language-specific patterns */
            if (config.patterns) {
                for (const pattern of config.patterns) {
                    for (let i = 0; i < lines.length; i++) {
                        const trimmed = lines[i].trim();
                        const lineNum = i + 1;
                        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;

                        if (pattern.regex.test(trimmed)) {
                            errors.push({
                                id: nextErrorId(), file: fileName, line: lineNum, column: 1,
                                language: config.id,
                                type: pattern.type || ErrorType.STYLE_WARNING,
                                severity: pattern.severity || Severity.LOW,
                                message: pattern.message,
                                explanation: pattern.explanation,
                                cause: pattern.cause || pattern.message,
                                suggestion: pattern.suggestion,
                                code: trimmed,
                                correctedCode: pattern.fix ? trimmed.replace(pattern.regex, pattern.fix) : null,
                                rule: pattern.rule
                            });
                        }
                    }
                }
            }

            /* TODO/FIXME comments */
            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                const todoMatch = trimmed.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[\s:](.*)/i) ||
                    trimmed.match(/#\s*(TODO|FIXME|HACK|XXX|BUG)[\s:](.*)/i);
                if (todoMatch) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: i + 1, column: 1,
                        language: config.id, type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                        message: `${todoMatch[1].toUpperCase()} comment: ${todoMatch[2].trim().substring(0, 80)}`,
                        explanation: `A ${todoMatch[1].toUpperCase()} comment indicates unfinished work.`,
                        cause: 'Developer annotation.',
                        suggestion: 'Address the TODO item.',
                        code: trimmed, correctedCode: null, rule: 'todo-comment'
                    });
                }
            }

            /* Long lines */
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length > 120) {
                    errors.push({
                        id: nextErrorId(), file: fileName, line: i + 1, column: 121,
                        language: config.id, type: ErrorType.STYLE_WARNING, severity: Severity.INFO,
                        message: `Line too long (${lines[i].length} > 120 characters)`,
                        explanation: 'Long lines reduce readability.',
                        cause: `This line has ${lines[i].length} characters.`,
                        suggestion: 'Break the line into multiple shorter lines.',
                        code: lines[i].trim().substring(0, 80) + '...', correctedCode: null, rule: 'line-too-long'
                    });
                }
            }

            return errors;
        },

        canCompile: false,
        compile() {
            return { success: false, output: `${config.name} compiler is not available in the browser. Connect a backend with ${config.compiler || config.name + ' toolchain'} for compilation support.`, errors: [] };
        },
        canTest: false,
        test() { return { detected: false, results: [], message: `${config.name} test runner is not available in the browser.` }; },
        parseErrors(raw) { return []; }
    };
}

/* ============================================================
   COMPILED LANGUAGE ANALYZERS (Pattern-based)
   ============================================================ */

const JavaAnalyzer = createPatternAnalyzer({
    id: 'java', name: 'Java', icon: '☕', color: '#b07219',
    extensions: ['.java'], compiler: 'javac',
    patterns: [
        { regex: /\bSystem\.out\.println\b/, message: 'System.out.println() — use a logging framework', explanation: 'Direct stdout printing is not appropriate for production applications. Use a logging framework like SLF4J/Logback.', suggestion: 'Replace with logger.info() or similar.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'no-sysout' },
        { regex: /catch\s*\(\s*Exception\s+\w+\s*\)\s*\{\s*\}/, message: 'Empty catch block — exceptions silently ignored', explanation: 'Catching an exception and doing nothing hides errors.', suggestion: 'Log the exception or handle it appropriately.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'no-empty-catch' },
        { regex: /\bString\s+\w+\s*=\s*new\s+String\s*\(/, message: 'Unnecessary new String() — use string literal', explanation: 'Creating a String with "new String()" is unnecessary and wastes memory.', suggestion: 'Use the string literal directly.', type: ErrorType.PERFORMANCE_WARNING, severity: Severity.LOW, rule: 'no-new-string' },
        { regex: /==\s*"[^"]*"/, message: 'String comparison with == — use .equals()', explanation: '== compares references, not values. Use .equals() for string comparison.', suggestion: 'Replace == with .equals() for string comparison.', type: ErrorType.LOGIC_ERROR, severity: Severity.HIGH, rule: 'string-equals' },
        { regex: /\bnull\b\s*\.\s*\w+/, message: 'Possible NullPointerException — null dereference', explanation: 'Calling a method on null will throw NullPointerException.', suggestion: 'Add a null check before the method call.', type: ErrorType.RUNTIME_ERROR, severity: Severity.HIGH, rule: 'null-deref' },
    ]
});

const CAnalyzer = createPatternAnalyzer({
    id: 'c', name: 'C', icon: '⚙️', color: '#555555',
    extensions: ['.c', '.h'], compiler: 'gcc/clang',
    patterns: [
        { regex: /\bgets\s*\(/, message: 'gets() is unsafe — use fgets() instead', explanation: 'gets() does not check buffer bounds and can cause buffer overflow vulnerabilities.', suggestion: 'Replace gets() with fgets() which takes a size parameter.', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'no-gets' },
        { regex: /\bmalloc\s*\([^)]+\)\s*;/, message: 'malloc() return value not checked', explanation: 'malloc() can return NULL if memory allocation fails. Not checking the return can cause segfaults.', suggestion: 'Check if the returned pointer is NULL before using it.', type: ErrorType.LOGIC_ERROR, severity: Severity.HIGH, rule: 'malloc-check' },
        { regex: /\bsprintf\s*\(/, message: 'sprintf() is unsafe — use snprintf() instead', explanation: 'sprintf() does not check buffer bounds and can cause buffer overflows.', suggestion: 'Replace sprintf() with snprintf() which takes a size parameter.', type: ErrorType.SECURITY_WARNING, severity: Severity.HIGH, rule: 'no-sprintf' },
        { regex: /\bstrcpy\s*\(/, message: 'strcpy() is unsafe — use strncpy() or strlcpy()', explanation: 'strcpy() does not check destination buffer size and can overflow.', suggestion: 'Use strncpy() with a size limit.', type: ErrorType.SECURITY_WARNING, severity: Severity.HIGH, rule: 'no-strcpy' },
        { regex: /\bprintf\s*\(\s*[^"]\w+\s*\)/, message: 'printf() with non-literal format string — format string vulnerability', explanation: 'Passing a variable as the format string to printf allows format string attacks.', suggestion: 'Use printf("%s", variable) instead.', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'format-string' },
    ]
});

const CppAnalyzer = createPatternAnalyzer({
    id: 'cpp', name: 'C++', icon: '⚡', color: '#f34b7d',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'], compiler: 'g++/clang++',
    patterns: [
        ...CAnalyzer.analyze ? [] : [],
        { regex: /\bnew\s+\w+(\s*\[|\s*\()/, message: 'Raw "new" — consider using smart pointers', explanation: 'Raw new/delete is error-prone and can cause memory leaks. Modern C++ prefers smart pointers.', suggestion: 'Use std::make_unique<T>() or std::make_shared<T>() instead.', type: ErrorType.STYLE_WARNING, severity: Severity.LOW, rule: 'prefer-smart-ptr' },
        { regex: /\busing\s+namespace\s+std\s*;/, message: '"using namespace std;" in header — pollutes global namespace', explanation: 'This directive brings all std names into scope, which can cause naming conflicts.', suggestion: 'Use specific using declarations (e.g., using std::string;) or prefix with std::.', type: ErrorType.STYLE_WARNING, severity: Severity.MEDIUM, rule: 'no-using-namespace-std' },
        { regex: /\bNULL\b/, message: 'Use nullptr instead of NULL', explanation: 'nullptr is type-safe and preferred over the C-style NULL macro in C++11 and later.', suggestion: 'Replace NULL with nullptr.', type: ErrorType.STYLE_WARNING, severity: Severity.LOW, rule: 'use-nullptr', fix: 'nullptr' },
        { regex: /\bgets\s*\(/, message: 'gets() is unsafe — use std::getline() instead', explanation: 'gets() does not check buffer bounds. It was removed in C++14.', suggestion: 'Use std::getline() with std::string.', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'no-gets' },
    ]
});

const CSharpAnalyzer = createPatternAnalyzer({
    id: 'csharp', name: 'C#', icon: '💜', color: '#178600',
    extensions: ['.cs'], compiler: 'dotnet build',
    patterns: [
        { regex: /\bConsole\.WriteLine\b/, message: 'Console.WriteLine() — consider using ILogger', explanation: 'Direct console output is not suitable for production applications.', suggestion: 'Use ILogger or a logging framework.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'no-console-writeline' },
        { regex: /catch\s*\(\s*Exception\s*\)\s*\{\s*\}/, message: 'Empty catch block — exception silently ignored', explanation: 'Catching and ignoring exceptions hides bugs.', suggestion: 'Log the exception or handle it.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'no-empty-catch' },
        { regex: /\bstring\s+\w+\s*=\s*""/, message: 'Use string.Empty instead of ""', explanation: 'string.Empty is more explicit and conventional in C#.', suggestion: 'Replace "" with string.Empty.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'use-string-empty' },
    ]
});

const GoAnalyzer = createPatternAnalyzer({
    id: 'go', name: 'Go', icon: '🐹', color: '#00add8',
    extensions: ['.go'], compiler: 'go build',
    patterns: [
        { regex: /\bfmt\.Println\b/, message: 'fmt.Println() — consider using structured logging', explanation: 'fmt.Println is suitable for simple programs but production code should use structured logging.', suggestion: 'Use log.Info() or a structured logger like zerolog/zap.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'no-fmt-println' },
        { regex: /\bpanic\s*\(/, message: 'panic() used — Go prefers error returns', explanation: 'In Go, errors should be returned as values. panic() should be reserved for truly unrecoverable situations.', suggestion: 'Return an error instead of panicking.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'no-panic' },
        { regex: /\b_\s*=\s*\w+\.\w+\(/, message: 'Error value discarded with _', explanation: 'Ignoring error return values can hide failures. Go convention is to always check errors.', suggestion: 'Handle the error: if err != nil { ... }.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'check-errors' },
    ]
});

const RustAnalyzer = createPatternAnalyzer({
    id: 'rust', name: 'Rust', icon: '🦀', color: '#dea584',
    extensions: ['.rs'], compiler: 'cargo build',
    patterns: [
        { regex: /\.unwrap\s*\(\s*\)/, message: '.unwrap() can panic — handle the error', explanation: 'unwrap() will panic if the Result/Option is Err/None. Use pattern matching or .expect() with a message.', suggestion: 'Use match, if let, or the ? operator for error propagation.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'no-unwrap' },
        { regex: /\bunsafe\s*\{/, message: 'unsafe block — requires careful review', explanation: 'Unsafe blocks bypass Rust\'s safety guarantees. They should be minimal and well-documented.', suggestion: 'Ensure the unsafe code is correct and document why it is necessary.', type: ErrorType.SECURITY_WARNING, severity: Severity.MEDIUM, rule: 'unsafe-review' },
        { regex: /\bprintln!\s*\(/, message: 'println!() — consider using log crate for production', explanation: 'println! writes to stdout. Production code should use the log/tracing crate.', suggestion: 'Use log::info!() or tracing::info!() instead.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'no-println' },
        { regex: /\.clone\s*\(\s*\)/, message: '.clone() — verify this is necessary', explanation: 'Unnecessary cloning wastes memory and CPU. Rust\'s ownership system often makes cloning avoidable.', suggestion: 'Consider using references or restructuring ownership to avoid cloning.', type: ErrorType.PERFORMANCE_WARNING, severity: Severity.INFO, rule: 'unnecessary-clone' },
    ]
});

const PHPAnalyzer = createPatternAnalyzer({
    id: 'php', name: 'PHP', icon: '🐘', color: '#4f5d95',
    extensions: ['.php', '.phtml'], compiler: 'php -l',
    patterns: [
        { regex: /\beval\s*\(/, message: 'eval() is dangerous — avoid dynamic code execution', explanation: 'eval() executes arbitrary PHP code and is a major security risk.', suggestion: 'Find an alternative approach that does not require eval().', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'no-eval' },
        { regex: /\bmysql_\w+\s*\(/, message: 'mysql_* functions are removed in PHP 7', explanation: 'The mysql_* extension was removed in PHP 7. Use mysqli or PDO instead.', suggestion: 'Migrate to mysqli_* or PDO with prepared statements.', type: ErrorType.COMPILE_ERROR, severity: Severity.CRITICAL, rule: 'no-mysql-ext' },
        { regex: /\$_GET\[|(\$_POST\[|(\$_REQUEST\[)/, message: 'Direct superglobal access — sanitize input', explanation: 'Directly using user input from superglobals without sanitization can lead to XSS or SQL injection.', suggestion: 'Use filter_input() or validate/sanitize the input before use.', type: ErrorType.SECURITY_WARNING, severity: Severity.HIGH, rule: 'sanitize-input' },
        { regex: /\bvar_dump\s*\(/, message: 'var_dump() found — remove for production', explanation: 'var_dump() is a debugging function and should not appear in production code.', suggestion: 'Remove the var_dump() call.', type: ErrorType.STYLE_WARNING, severity: Severity.LOW, rule: 'no-var-dump' },
    ]
});

const KotlinAnalyzer = createPatternAnalyzer({
    id: 'kotlin', name: 'Kotlin', icon: '🟣', color: '#a97bff',
    extensions: ['.kt', '.kts'], compiler: 'kotlinc / gradle',
    patterns: [
        { regex: /\bprintln\s*\(/, message: 'println() — consider using a logging framework', explanation: 'Direct printing is not suitable for production.', suggestion: 'Use a logging framework like SLF4J.', type: ErrorType.STYLE_WARNING, severity: Severity.INFO, rule: 'no-println' },
        { regex: /!!\s*\./, message: 'Non-null assertion (!!) — can throw NullPointerException', explanation: 'The !! operator throws if the value is null.', suggestion: 'Use safe call (?.) or null check instead.', type: ErrorType.LOGIC_ERROR, severity: Severity.MEDIUM, rule: 'no-double-bang' },
        { regex: /\bvar\s+\w+\s*:\s*\w+\s*\?\s*=\s*null/, message: 'Nullable var initialized to null — consider lateinit or lazy', explanation: 'Initializing a nullable var to null is sometimes a code smell.', suggestion: 'Consider using lateinit, by lazy, or a non-nullable default.', type: ErrorType.STYLE_WARNING, severity: Severity.LOW, rule: 'nullable-var-null' },
    ]
});

const SQLAnalyzer = createPatternAnalyzer({
    id: 'sql', name: 'SQL', icon: '🗃️', color: '#e38c00',
    extensions: ['.sql'], checkBrackets: false,
    patterns: [
        { regex: /SELECT\s+\*/i, message: 'SELECT * — specify columns explicitly', explanation: 'SELECT * retrieves all columns, which is inefficient and fragile when the schema changes.', suggestion: 'List the specific columns you need.', type: ErrorType.PERFORMANCE_WARNING, severity: Severity.LOW, rule: 'no-select-star' },
        { regex: /DROP\s+TABLE/i, message: 'DROP TABLE — destructive operation', explanation: 'DROP TABLE permanently deletes a table and all its data. Ensure this is intentional.', suggestion: 'Add IF EXISTS and ensure you have backups.', type: ErrorType.SECURITY_WARNING, severity: Severity.HIGH, rule: 'drop-table-warning' },
        { regex: /DELETE\s+FROM\s+\w+\s*$/im, message: 'DELETE without WHERE — will delete all rows', explanation: 'A DELETE statement without a WHERE clause will remove every row from the table.', suggestion: 'Add a WHERE clause to limit which rows are deleted.', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'delete-without-where' },
        { regex: /'\s*\+\s*\w+\s*\+\s*'/i, message: 'String concatenation in SQL — possible SQL injection', explanation: 'Building SQL queries by concatenating strings with variables is vulnerable to SQL injection.', suggestion: 'Use parameterized queries or prepared statements.', type: ErrorType.SECURITY_WARNING, severity: Severity.CRITICAL, rule: 'sql-injection' },
    ]
});

/* ============================================================
   REGISTER ALL ANALYZERS
   ============================================================ */
AnalyzerRegistry.register(JavaScriptAnalyzer);
AnalyzerRegistry.register(TypeScriptAnalyzer);
AnalyzerRegistry.register(PythonAnalyzer);
AnalyzerRegistry.register(HTMLAnalyzer);
AnalyzerRegistry.register(CSSAnalyzer);
AnalyzerRegistry.register(JavaAnalyzer);
AnalyzerRegistry.register(CAnalyzer);
AnalyzerRegistry.register(CppAnalyzer);
AnalyzerRegistry.register(CSharpAnalyzer);
AnalyzerRegistry.register(GoAnalyzer);
AnalyzerRegistry.register(RustAnalyzer);
AnalyzerRegistry.register(PHPAnalyzer);
AnalyzerRegistry.register(KotlinAnalyzer);
AnalyzerRegistry.register(SQLAnalyzer);

/* ============================================================
   AI EXPLANATION ENGINE (Rule-based)
   ============================================================ */
const AIExplanationEngine = {

    enhanceError(error) {
        const enhanced = { ...error };
        enhanced.aiExplanation = this._generateExplanation(error);
        enhanced.aiCause = this._analyzeCause(error);
        enhanced.aiSolution = this._generateSolution(error);
        enhanced.aiConfidence = this._assessConfidence(error);
        enhanced.aiAdditionalTests = this._suggestTests(error);
        return enhanced;
    },

    _generateExplanation(error) {
        const templates = {
            SYNTAX_ERROR: `This is a syntax error in your ${error.language} code. The parser could not understand the code structure at line ${error.line}. ${error.explanation}`,
            COMPILE_ERROR: `A compilation error occurred. The ${error.language} compiler rejected this code because it violates language rules. ${error.explanation}`,
            TYPE_ERROR: `A type system violation was detected. ${error.explanation} Type errors prevent the code from being compiled or may cause unexpected behavior at runtime.`,
            RUNTIME_ERROR: `This code pattern is likely to cause an error when the program runs. ${error.explanation}`,
            LOGIC_ERROR: `A potential logic issue was found. While this code may compile and run, it likely does not behave as intended. ${error.explanation}`,
            TEST_FAILURE: `A test case failed, indicating the code does not produce the expected output. ${error.explanation}`,
            DEPENDENCY_ERROR: `There is a problem with a project dependency. ${error.explanation}`,
            CONFIGURATION_ERROR: `A project configuration issue was detected. ${error.explanation}`,
            STYLE_WARNING: `This is a code style recommendation. While the code may work correctly, following this suggestion improves readability and maintainability. ${error.explanation}`,
            SECURITY_WARNING: `⚠️ A security concern was identified. ${error.explanation} This should be reviewed and addressed before deploying to production.`,
            PERFORMANCE_WARNING: `A potential performance issue was detected. ${error.explanation} While the code is functionally correct, it may run slower than necessary.`,
        };
        return templates[error.type] || error.explanation;
    },

    _analyzeCause(error) {
        if (error.cause) return error.cause;
        const causes = {
            SYNTAX_ERROR: 'Likely cause: A typo, missing delimiter, or incorrect language syntax.',
            TYPE_ERROR: 'Possible cause: Mismatched types, incorrect function signature, or missing type conversion.',
            LOGIC_ERROR: 'Possible cause: A common coding anti-pattern or oversight in program logic.',
            SECURITY_WARNING: 'Possible cause: Unsafe coding practice that could be exploited.',
        };
        return causes[error.type] || 'Review the code around the indicated location.';
    },

    _generateSolution(error) {
        if (error.correctedCode) {
            return {
                description: error.suggestion,
                hasAutoFix: true,
                correctedCode: error.correctedCode,
                diffDescription: `Replace the code on line ${error.line} with the suggested correction.`
            };
        }
        return {
            description: error.suggestion || 'Review the code and apply the recommended changes manually.',
            hasAutoFix: false,
            correctedCode: null,
            diffDescription: null
        };
    },

    _assessConfidence(error) {
        if (error.type === ErrorType.SYNTAX_ERROR || error.type === ErrorType.COMPILE_ERROR) return 'high';
        if (error.type === ErrorType.SECURITY_WARNING || error.type === ErrorType.TYPE_ERROR) return 'high';
        if (error.type === ErrorType.LOGIC_ERROR || error.type === ErrorType.RUNTIME_ERROR) return 'medium';
        if (error.type === ErrorType.STYLE_WARNING || error.type === ErrorType.PERFORMANCE_WARNING) return 'medium';
        return 'low';
    },

    _suggestTests(error) {
        const tests = [];
        if (error.type === ErrorType.SYNTAX_ERROR) {
            tests.push('Verify the file compiles/parses without errors after the fix.');
        }
        if (error.type === ErrorType.LOGIC_ERROR) {
            tests.push(`Write a unit test for the function containing line ${error.line} to verify correct behavior.`);
            tests.push('Test edge cases including null/undefined inputs and boundary values.');
        }
        if (error.type === ErrorType.SECURITY_WARNING) {
            tests.push('Test with malicious input to verify the fix prevents the vulnerability.');
            tests.push('Perform a security review of related code paths.');
        }
        if (error.type === ErrorType.RUNTIME_ERROR) {
            tests.push(`Test the code path at line ${error.line} with various inputs including edge cases.`);
        }
        return tests;
    },

    analyzeProject(projectInfo, allErrors) {
        const summary = {
            overallAssessment: '',
            criticalIssues: allErrors.filter(e => e.severity === Severity.CRITICAL),
            recommendations: [],
            riskLevel: 'low'
        };

        if (summary.criticalIssues.length > 0) {
            summary.riskLevel = 'high';
            summary.overallAssessment = `This project has ${summary.criticalIssues.length} critical issue(s) that must be resolved before deployment.`;
        } else if (allErrors.filter(e => e.severity === Severity.HIGH).length > 0) {
            summary.riskLevel = 'medium';
            summary.overallAssessment = 'This project has high-severity issues that should be addressed.';
        } else if (allErrors.length > 0) {
            summary.riskLevel = 'low';
            summary.overallAssessment = 'This project has minor issues. No critical problems were detected.';
        } else {
            summary.riskLevel = 'none';
            summary.overallAssessment = 'No issues detected. The project appears to be in good shape.';
        }

        /* Generate recommendations */
        const errorsByType = {};
        for (const e of allErrors) {
            errorsByType[e.type] = (errorsByType[e.type] || 0) + 1;
        }

        if (errorsByType[ErrorType.SECURITY_WARNING]) {
            summary.recommendations.push(`Address ${errorsByType[ErrorType.SECURITY_WARNING]} security warning(s) before production deployment.`);
        }
        if (errorsByType[ErrorType.SYNTAX_ERROR]) {
            summary.recommendations.push(`Fix ${errorsByType[ErrorType.SYNTAX_ERROR]} syntax error(s) — the code will not run correctly with these.`);
        }
        if (errorsByType[ErrorType.LOGIC_ERROR] > 3) {
            summary.recommendations.push('Multiple logic issues detected. Consider adding comprehensive unit tests.');
        }
        if (errorsByType[ErrorType.STYLE_WARNING] > 10) {
            summary.recommendations.push('Many style issues found. Consider adding a linter to your CI/CD pipeline.');
        }
        if (projectInfo.testFiles.length === 0) {
            summary.recommendations.push('No test files detected. Adding automated tests is strongly recommended.');
        }

        return summary;
    }
};

/* ============================================================
   DIFF ENGINE
   ============================================================ */
const DiffEngine = {
    computeDiff(original, modified) {
        const origLines = original.split('\n');
        const modLines = modified.split('\n');
        const diff = [];
        const maxLen = Math.max(origLines.length, modLines.length);

        for (let i = 0; i < maxLen; i++) {
            const origLine = origLines[i];
            const modLine = modLines[i];

            if (origLine === undefined) {
                diff.push({ type: 'add', line: i + 1, content: modLine });
            } else if (modLine === undefined) {
                diff.push({ type: 'remove', line: i + 1, content: origLine });
            } else if (origLine !== modLine) {
                diff.push({ type: 'remove', line: i + 1, content: origLine });
                diff.push({ type: 'add', line: i + 1, content: modLine });
            } else {
                diff.push({ type: 'unchanged', line: i + 1, content: origLine });
            }
        }
        return diff;
    },

    applyFix(fileContent, lineNumber, originalCode, correctedCode) {
        const lines = fileContent.split('\n');
        const lineIdx = lineNumber - 1;
        if (lineIdx >= 0 && lineIdx < lines.length) {
            lines[lineIdx] = lines[lineIdx].replace(originalCode.trim(), correctedCode.trim());
        }
        return lines.join('\n');
    }
};
