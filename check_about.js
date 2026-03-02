const fs = require('fs');
const contentAbout = fs.readFileSync('about.html', 'utf8');
const regex = /data-i18n(?!-placeholder|-aria)="([^"]+)"/g;
let match;
const keysInHtml = new Set();
while ((match = regex.exec(contentAbout)) !== null) {
    keysInHtml.add(match[1]);
}

const lines = fs.readFileSync('translations.js', 'utf8');
const langs = ['en', 'so', 'ar', 'fr', 'sw'];
const missing = {};
let transObj;
try {
    const code = lines.replace('window.TRANSLATIONS = TRANSLATIONS;', 'module.exports = TRANSLATIONS;');
    fs.writeFileSync('temp_trans.js', code);
    transObj = require('./temp_trans.js');
} catch (e) { }

langs.forEach(lang => {
    missing[lang] = [];
    keysInHtml.forEach(key => {
        if (!transObj[lang][key]) {
            missing[lang].push(key);
        }
    });
});

console.log("Missing keys in ABOUT:", missing);
