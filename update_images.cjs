const fs = require('fs');
const https = require('https');

const API_KEY = '8504480ca280fefe7b2f444a114effcb526a9662';

async function searchImage(query) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            q: query,
            num: 1
        });

        const req = https.request({
            hostname: 'google.serper.dev',
            path: '/images',
            method: 'POST',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.images && parsed.images.length > 0) {
                        resolve(parsed.images[0].imageUrl);
                    } else {
                        resolve('/ayna_placeholder.png');
                    }
                } catch (e) {
                    resolve('/ayna_placeholder.png');
                }
            });
        });

        req.on('error', (e) => resolve('/ayna_placeholder.png'));
        req.write(data);
        req.end();
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const records = [];
    const regex = /name:\s*['"]((?:\\.|[^'"\\])*)['"][\s\S]*?image:\s*['"](\/(?:ayna_placeholder|startup_placeholder)\.png)['"]/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        records.push({
            name: match[1],
            placeholder: match[2],
            matchStr: match[0]
        });
    }

    if (records.length === 0) return;

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        console.log(`Fetching image for ${record.name}...`);
        const url = await searchImage(record.name + " product photo white background");
        console.log(`Found: ${url}`);

        let newMatchStr = record.matchStr.replace(
            new RegExp(`image:\\s*['"]${record.placeholder}['"]`),
            `image: '${url}'`
        );
        content = content.replace(record.matchStr, newMatchStr);
        await delay(100);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

(async () => {
    const files = [
        'src/data/products.js',
        'src/data/productsExtended.js',
        'src/data/productsExtended2.js',
        'src/data/startups.js'
    ];
    for (const f of files) {
        if (!fs.existsSync(f)) continue;
        console.log(`Processing ${f}...`);
        await processFile(f);
    }
    console.log('All done!');
})();
