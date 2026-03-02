const fs = require('fs');
let content = fs.readFileSync('c:/Users/hp/Downloads/nasiiba/translations.js', 'utf8');

// For EN, SO, AR, FR, SW: add footer_contact
const addFooterContactToLang = (content, langTag, transStr) => {
    const searchString = `footer_contact_us: `;
    // find the lang block start roughly
    const regex = new RegExp(`(${langTag}:[\\s\\S]*?)(footer_contact_us: "[^"]+",)`);
    return content.replace(regex, `$1$2\n        footer_contact: "${transStr}",`);
};

content = addFooterContactToLang(content, 'en', 'CONTACT US');
content = addFooterContactToLang(content, 'so', 'NALA SOO XIRIIR');
content = addFooterContactToLang(content, 'ar', 'اتصل بنا');
content = addFooterContactToLang(content, 'fr', 'NOUS CONTACTER');
content = addFooterContactToLang(content, 'sw', 'WASILIANA NASI');

// Add missing SW keys
const swMissing = `        course1_desc: "Mkakati mkuu wa kukuza uongozi kupitia ukocha na usimamizi wa kisasa.",
        course2_desc: "Mchoro wa kina wa kukuza shughuli, mifumo na mifumo madhubuti ya ukuaji.",
        trust_item1_title: "Mchoro wa Kimkakati wa Kibinafsi",
        trust_item1_text: "— michoro inayolengwa mahususi kwa nafasi yako na malengo yako.",
        trust_item2_title: "Lengo Linalopimika la ROI",
        trust_item2_text: "— vipimo wazi vinavyoonyesha mapato halisi ya biashara.",
        trust_item3_title: "Mtandao Maalum wa Wataalamu",
        trust_item3_text: "— ufikiaji maalum kwa jamii ya viongozi wenye utendaji wa juu.",
        testimonial2_text: '\\"Al Ustaad Abu Hamza amebadilisha maisha yangu kweli. Kabla ya kufanya kazi naye, nilikuwa na digrii lakini sikuwa na kipato halisi. Leo, ninaishi kwa utulivu, furaha, na ustawi wa kweli.\\"',
        testimonial3_text: '\\"Ninashukuru kwa Kocha Abu Hamza. Katika chini ya saa 24, mwongozo wake uliinua ufahamu wangu na kurekebisha maisha yangu, ukinitoa kwenye huzuni na kuchanganyikiwa hadi kwenye furaha, uwazi, na kusudi linalofanywa upya.\\"',`;

const swRegex = /(sw:[\s\S]*?course2_title: "Kukuza Biashara Kimkakati",)/;
content = content.replace(swRegex, `$1\n${swMissing.split('\\n').slice(0, 2).join('\n')}`);

const swRegexTrust = /(sw:[\s\S]*?trust_stat_label: "Miaka ya Ubora wa Biashara",)/;
content = content.replace(swRegexTrust, `$1\n${swMissing.split('\\n').slice(2, 8).join('\n')}`);

const swRegexTest = /(sw:[\s\S]*?testimonial1_text: "[^"]+",)/;
content = content.replace(swRegexTest, `$1\n${swMissing.split('\\n').slice(8, 10).join('\n')}`);

fs.writeFileSync('c:/Users/hp/Downloads/nasiiba/translations.js', content, 'utf8');
console.log("Injected missing SW keys and footer_contact.");
