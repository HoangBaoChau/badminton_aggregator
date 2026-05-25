const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('post-debug.html'));
$('a').each((i, el) => {
    console.log(el.attribs);
    console.log($(el).text());
});
