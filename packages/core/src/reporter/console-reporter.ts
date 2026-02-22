import type { Reporter, DetectedIssue, Severity, IssueCategory } from '../types';

const CATEGORY_ICONS: Record<IssueCategory, string> = {
  'network': '\u{1F310}',
  'null-access': '\u{1F480}',
  'undefined-data': '\u{1F47B}',
  'render-data': '\u{1F3A8}',
  'unhandled-error': '\u{1F4A5}',
  'unhandled-rejection': '\u26A1',
  'type-mismatch': '\u{1F500}',
};

const SEVERITY_COLORS: Record<Severity, string> = {
  error: '#ff4444',
  warn: '#ffaa00',
  info: '#4488ff',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
};

function formatDetails(issue: DetectedIssue): string[] {
  const lines: string[] = [];

  if (issue.path) {
    lines.push(`  \u251C\u2500 Path: ${issue.path}`);
  }

  if (issue.foundValue !== undefined) {
    lines.push(
      `  \u251C\u2500 Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`,
    );
  }

  if (issue.details) {
    const entries = Object.entries(issue.details);
    for (const [key, value] of entries) {
      lines.push(`  \u251C\u2500 ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
  }

  if (issue.source) {
    lines.push(`  \u251C\u2500 Source: ${issue.source}`);
  }

  if (issue.suggestion) {
    lines.push(`  \u251C\u2500 Suggestion: ${issue.suggestion}`);
  }

  if (issue.stack) {
    const stackPreview = issue.stack.split('\n').slice(0, 3).join('\n');
    lines.push(`  \u2514\u2500 Stack:\n${stackPreview}`);
  } else if (lines.length > 0) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx].replace('\u251C\u2500', '\u2514\u2500');
  }

  return lines;
}

export function createConsoleReporter(): Reporter {
  function report(issue: DetectedIssue): void {
    const icon = CATEGORY_ICONS[issue.category] ?? '\u{1F50D}';
    const color = SEVERITY_COLORS[issue.severity];
    const label = SEVERITY_LABELS[issue.severity];

    const header = `${icon} DevLens [${label}] ${issue.category}: ${issue.message}`;
    const details = formatDetails(issue);

    const consoleFn =
      issue.severity === 'error'
        ? console.error
        : issue.severity === 'warn'
          ? console.warn
          : console.log;

    console.groupCollapsed(
      `%c${header}`,
      `color: ${color}; font-weight: bold;`,
    );

    for (const line of details) {
      consoleFn(line);
    }

    consoleFn(
      `%cTimestamp: ${new Date(issue.timestamp).toISOString()}`,
      'color: #888;',
    );

    console.groupEnd();
  }

  function reportBatch(issues: DetectedIssue[]): void {
    if (issues.length === 0) return;

    console.groupCollapsed(
      `%c\u{1F50D} DevLens — ${issues.length} issue(s) detected`,
      'color: #ff4444; font-weight: bold; font-size: 12px;',
    );

    for (const issue of issues) {
      report(issue);
    }

    console.groupEnd();
  }

  function clear(): void {
    console.clear();
  }

  return { report, reportBatch, clear };
}
