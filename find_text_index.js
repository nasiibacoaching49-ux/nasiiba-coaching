const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const lines = content.split('\n');
const untranslated = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('<!--')) continue;
    if (!/[a-zA-Z]{3,}/.test(line)) continue;

    // Ignore lines with data-i18n
    if (line.includes('data-i18n="')) continue;

    // Ignore script, style blocks loosely
    if (line.includes('<script') || line.includes('</script') || line.includes('window.') || line.includes('document.')) continue;

    if (/>[^<A-Z]+[a-zA-Z]+[^<]*</.test(line)) {
        untranslated.push(i + 1 + ": " + line); // Print 1-indexed line
    }
}

console.log(untranslated.join('\n'));
