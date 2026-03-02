const fs = require('fs');
const contentAbout = fs.readFileSync('about.html', 'utf8');
const contentIndex = fs.readFileSync('index.html', 'utf8');

const regex = /data-i18n(?!-placeholder|-aria)="([^"]+)"/g;
let match;
const keysInHtml = new Set();

while ((match = regex.exec(contentAbout)) !== null) {
    keysInHtml.add(match[1]);
}
while ((match = regex.exec(contentIndex)) !== null) {
    keysInHtml.add(match[1]);
}

// simulate reading translations
const lines = fs.readFileSync('translations.js', 'utf8');
const langs = ['en', 'so', 'ar', 'fr', 'sw'];
const missing = {};

langs.forEach(lang => {
    missing[lang] = [];
    keysInHtml.forEach(key => {
        // Simple search: does `key: ` exist near `lang: {` block?
        // Actually, we can eval the file if we mock window
        // Let's just do that for robust checking
    });
});

let transObj;
try {
    const code = lines.replace('window.TRANSLATIONS = TRANSLATIONS;', 'module.exports = TRANSLATIONS;');
    fs.writeFileSync('temp_trans.js', code);
    transObj = require('./temp_trans.js');
} catch (e) {
    console.log("Error loading translations:", e);
    process.exit(1);
}

langs.forEach(lang => {
    keysInHtml.forEach(key => {
        if (!transObj[lang][key]) {
            missing[lang].push(key);
        }
    });
});

console.log("Missing keys:");
console.log(missing);
