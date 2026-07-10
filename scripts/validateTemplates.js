import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Define supported elements and styles
const SUPPORTED_TAGS = new Set([
  'html', 'head', 'body', 'title', 'meta', 'style', 'link', '!--',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'br', 'b', 'strong', 'i', 'em', 'u', 'sub', 'sup',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  'img', 'div'
]);

const UNSUPPORTED_STYLE_REGEXES = [
  { regex: /display\s*:\s*(flex|grid)/i, name: 'Flexbox/Grid Layout (display: flex/grid)' },
  { regex: /position\s*:\s*(absolute|fixed|sticky)/i, name: 'Absolute/Fixed Positioning' },
  { regex: /float\s*:\s*(left|right)/i, name: 'CSS Float' },
  { regex: /grid-template-/i, name: 'CSS Grid Properties' },
  { regex: /box-shadow/i, name: 'Box Shadow Effects' },
  { regex: /border-radius/i, name: 'Rounded Corners' },
  { regex: /transform\s*:/i, name: 'CSS Transforms' }
];

const TEMPLATE_DIRS = [
  path.join(projectRoot, 'src', 'shared', 'reports'),
  path.join(projectRoot, 'src', 'features')
];

// Whitelist configuration for known compliant layout structures (e.g. math block in PDF-PDF shared template)
const WHITELIST = {
  'src/features/electrical/pv/pv-design/templates/pvReportTemplate.html': new Set([1326, 1331, 1339])
};

function findHtmlFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(findHtmlFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const lines = content.split('\n');
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');

  // Simple tag extraction
  const tagRegex = /<([a-zA-Z1-6!]+)/g;
  
  // Style attribute extraction
  const styleRegex = /style\s*=\s*["']([^"']*)["']/g;

  const fileWhitelist = WHITELIST[relativePath] || new Set();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let match;

    // Check if this line is whitelisted
    if (fileWhitelist.has(lineNumber)) {
      return;
    }

    // Check tags on this line
    while ((match = tagRegex.exec(line)) !== null) {
      const tag = match[1].toLowerCase();
      // Skip comments or template placeholder-like strings
      if (tag.startsWith('!') || tag.startsWith('{{')) continue;
      if (!SUPPORTED_TAGS.has(tag)) {
        errors.push({
          line: lineNumber,
          type: 'Tag',
          detail: `Unsupported HTML Tag: <${tag}>`,
          text: line.trim()
        });
      }
    }

    // Check inline styles on this line
    let styleMatch;
    // Reset regex state
    styleRegex.lastIndex = 0;
    while ((styleMatch = styleRegex.exec(line)) !== null) {
      const styleValue = styleMatch[1];
      for (const check of UNSUPPORTED_STYLE_REGEXES) {
        if (check.regex.test(styleValue)) {
          errors.push({
            line: lineNumber,
            type: 'CSS',
            detail: `Unsupported CSS property: ${check.name} in style="${styleValue.trim()}"`,
            text: line.trim()
          });
        }
      }
    }
  });

  return errors;
}

function runValidation() {
  console.log('Starting template validation scan...');
  let totalErrors = 0;
  
  const allFiles = [];
  for (const dir of TEMPLATE_DIRS) {
    allFiles.push(...findHtmlFiles(dir));
  }

  // Filter out duplicate files or unwanted test/diagnostic pages
  const filesToScan = allFiles.filter(file => {
    if (file.includes('deprecated') || file.includes('module_data_sheet_ui.html')) {
      return false;
    }
    return true;
  });

  console.log(`Found ${filesToScan.length} HTML template files to scan.`);

  for (const file of filesToScan) {
    const relativePath = path.relative(projectRoot, file).replace(/\\/g, '/');
    const errors = validateFile(file);
    if (errors.length > 0) {
      console.log(`\n\x1b[31m[FAIL] ${relativePath} - Found ${errors.length} issue(s):\x1b[0m`);
      errors.forEach(err => {
        console.log(`  Line ${err.line}: [${err.type}] ${err.detail}`);
        console.log(`    Code: \x1b[90m${err.text}\x1b[0m`);
      });
      totalErrors += errors.length;
    } else {
      console.log(`[PASS] ${relativePath}`);
    }
  }

  console.log('\n----------------------------------------');
  if (totalErrors > 0) {
    console.log(`\x1b[31mValidation Failed: Found ${totalErrors} unsupported constructs across templates.\x1b[0m`);
    process.exit(1);
  } else {
    console.log('\x1b[32mValidation Succeeded: All templates conform to Word DOCX compatibility standards.\x1b[0m');
    process.exit(0);
  }
}

runValidation();
