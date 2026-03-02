const fs = require('fs');
const content = fs.readFileSync('about.html', 'utf8');

// Primitive way to strip out translated text:
let html = content;
html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

// Also remove anything with data-i18n="..."
// A regex to match tags with data-i18n and their contents: 
// This is hard to do with regex reliably. Let's just find data-i18n elements.
// Since we are in node, we don't have DOMParser.
// Let's use a quick script that outputs the lines containing words that don't have data-i18n on the same line.
const lines = html.split('\n');
const untranslated = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // skip comments
    if (line.startsWith('<!--')) continue;
    // check if it has text (letters)
    if (!/[a-zA-Z]{3,}/.test(line)) continue;

    // if it has data-i18n, skip
    if (line.includes('data-i18n="')) continue;

    // skip common html tags empty lines or structural things
    if (/^<[^>]+>$/.test(line) && !line.includes(' ')) continue;

    // Only capture things that look like actual reading text (has closing tags after text etc)
    if (/>[^<A-Z]+[a-zA-Z]+[^<]*</.test(line)) {
        untranslated.push(i + 1 + ": " + line);
    }
}

console.log(untranslated.join('\n'));
