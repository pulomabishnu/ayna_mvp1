const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\pulom\\.gemini\\antigravity\\playground\\ethereal-apogee\\src\\components';

const replacements = [
    { regex: /'#4CAF50'/g, replacement: "'var(--color-primary)'" },
    { regex: /'#E8F5E9'/g, replacement: "'var(--color-secondary-fade)'" },
    { regex: /'#2E7D32'/g, replacement: "'var(--color-text-main)'" },
    { regex: /'#FFF3E0'/g, replacement: "'#F8F9FA'" },
    { regex: /'#FFB74D'/g, replacement: "'#D1D5DB'" },
    { regex: /'#E65100'/g, replacement: "'var(--color-text-main)'" },
    { regex: /'#FFF8E1'/g, replacement: "'#F3F4F6'" },
    { regex: /'#FFE082'/g, replacement: "'#E5E7EB'" },
    { regex: /'#795548'/g, replacement: "'var(--color-text-muted)'" },
    { regex: /'#1976D2'/g, replacement: "'var(--color-text-main)'" },
    { regex: /'#E3F2FD'/g, replacement: "'var(--color-secondary)'" },
    { regex: /'#F0F4FF'/g, replacement: "'var(--color-secondary)'" },
    { regex: /'#3F51B5'/g, replacement: "'var(--color-text-main)'" },
    { regex: /'#FFF9C4'/g, replacement: "'#F1F5F9'" },
    { regex: /'#F1F8E9'/g, replacement: "'#F8FAFC'" },
    { regex: /'#D9697B'/g, replacement: "'var(--color-primary)'" },
    // Ayna specific adjustments from hardcoded colors
    { regex: /'#81C784'/g, replacement: "'var(--color-border)'" }
];

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.jsx')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        let newContent = content;
        for (const { regex, replacement } of replacements) {
            newContent = newContent.replace(regex, replacement);
        }
        if (newContent !== content) {
            fs.writeFileSync(path.join(dir, file), newContent);
            console.log(`Updated ${file}`);
        }
    }
});
