const fs = require('fs'); 
const csv = require('csv-parser');
const puppeteer = require('puppeteer');
const turndown = new require('turndown')();

const QUORA_COOKIES = 'data/quora-cookies.json';
const GARY_QUORA_CSV = 'data/gary-quora-categories.csv';
// 
// exampleCsvEntry = {
//     Question: 'Are there any real life "lost world" ecosystems?',
//     Link: 'https://www.quora.com/Are-there-any-real-life-lost-world-ecosystems',
//     Upvotes: 14194,
//     Comments: 527,
//     Timestamp: '9mo',
//     Image: 'https://qph.fs.quoracdn.net/main-qimg-feb9260fc47006cd457409c95355b82d-lq',
//     Answer: 'In the northeast of South America, ...'
// }
// 
// Remove photos from webpage:
//  [].forEach.call(document.querySelectorAll('img'), (img) => {img.parentNode.removeChild(img)});
//
const ANSWER_SUFFIX = '/answer/Gary-Meaney';
const ANSWER_SELECTOR = '#mainContent > div > div.q-box.qu-borderAll.qu-borderRadius--small.qu-borderColor--raised.qu-boxShadow--small.qu-bg--raised > div.q-box.qu-pt--medium.qu-px--medium.qu-pb--tiny > div:nth-child(3)';
const ANSWER_SELECTOR_2 = '#mainContent > div > div.q-box.qu-borderAll.qu-borderRadius--small.qu-borderColor--raised.qu-boxShadow--small.qu-bg--raised > div.q-box.qu-pt--medium.qu-px--medium.qu-pb--tiny > div:nth-child(4)';
const ADD_COMMENT_SELECTOR = '#mainContent > div > div.q-box.qu-borderAll.qu-borderRadius--small.qu-borderColor--raised.qu-boxShadow--small.qu-bg--raised > div:nth-child(2) > div > div > div.q-flex.qu-bg--gray_ultralight.qu-px--medium.qu-py--small.qu-alignItems--center > div.q-box.qu-ml--tiny > div > button > div > div > div';
const ALL_COMMENTS_SELECTOR = '#mainContent > div > div.q-box.qu-borderAll.qu-borderRadius--small.qu-borderColor--raised.qu-boxShadow--small.qu-bg--raised > div:nth-child(2)';
const VIEW_MORE_COMMENTS_XPATH = "//button[contains(., 'View more comments')]";
const CHAPTER_ORDER = { 
    MAMMALS: 1, 
    BIRDS: 2, 
    'REPTILES and AMPHIBIANS': 3, 
    FISH: 4, 
    INSECTS: 5, 
    'Other INVERTEBRATES': 6,
    'PLANTS and FUNGI': 7,
    'ECOSYSTEM SPOTLIGHT': 8 
};
const readCsv = async (csvFile) => {
    const  records = []
    const parser = fs
        .createReadStream(csvFile)
        .pipe(csv());

    for await (const record of parser) {
      records.push(record)
    }
    return records
};

const getAnswers = async () => {
    let answers = await readCsv(GARY_QUORA_CSV);
    answers.sort((a, b) => {
        const aCat = 10 - (CHAPTER_ORDER[a.Chapter] || 10);
        const bCat = 10 - (CHAPTER_ORDER[b.Chapter] || 10);
        const aScore = aCat * 1000000 + parseInt(a.Upvotes);
        const bScore = bCat * 1000000 + parseInt(b.Upvotes);
        return aScore < bScore ? 1: -1;
    });
    return answers
};

const getCookies = () => {
    let rawdata = fs.readFileSync(QUORA_COOKIES);
    return JSON.parse(rawdata);
};

const getPageText = async (page) => {
    return await page.$eval('body', element => element.textContent)
};

const getElement = async (page, element) => {
    return await page.evaluate((element) => {
        let el = document.querySelector(element)
        return el ? el.innerText : undefined;
    }, element);
};

const sectionTitle = (answer, lastChapter) => {
    if (lastChapter != answer.Chapter) {
        if (answer.Chapter == '') {
            return '# Miscellaneous\n\n';
        } else {
            return `# ${answer.Chapter}\n\n`;
        }
    }
    return '';
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getComments = async (page) => {
    const comments = await page.evaluate((allCommentsSelector) => {
        const deleteEls = (parent, sel) => [].forEach.call(parent.querySelectorAll(sel), el => {el .parentNode.removeChild(el); });
        const allComments = document.querySelector(allCommentsSelector);
        deleteEls(allComments, '.qu-pl--medium');
        deleteEls(allComments, '.puppeteer_popper_reference');
        return [].map.call(allComments.querySelectorAll('span.q-box'), el => el.innerText);
    }, ALL_COMMENTS_SELECTOR);

    return comments.filter(e => e);
};

const filename = (answer) => {
    const title = answer.Title == '' ? answer.Question : answer.Title;
    const rawFilename = `${answer.Chapter}-${title}`;
    const filename = rawFilename
                        .replace(/['"]/g, '')
                        .replace(/[^A-Za-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/-$/, '')
                        .replace(/^-/, '');
    return filename;
};

const capturePage = async (page, answer, index, lastChapter, withComments) => {
    try {
        const title = answer.Title == '' ? answer.Question : answer.Title;
        const filenameBase = `data/markdown/${String(index + 1).padStart(3, '0')}-${filename(answer)}`;
        const mdFilename = `${filenameBase}.md`;
        const pngFilename = `${filenameBase}.png`;
        const url = answer.Link + ANSWER_SUFFIX;
        console.log(`Loading ... ${title}`);
        await page.goto(url);
        await page.waitForSelector(ADD_COMMENT_SELECTOR);
        await page.screenshot({path: pngFilename});
        let pageText = await getPageText(page);
        const html = await page.$eval(/Originally Answered/.test(pageText) ? ANSWER_SELECTOR_2 : ANSWER_SELECTOR, element => element.innerHTML);

        let markdown = sectionTitle(answer, lastChapter);
        markdown += `## ${title}
    
**Upvotes**: ${parseInt(answer.Upvotes).toLocaleString('en-US')} | **Comments**: ${answer.Comments} | **Date**: [${answer.Timestamp}](${url})

`;
        markdown += turndown.turndown(html);
        markdown += '\n\n';

        if (withComments) {
            let [ hasMoreComments ] = await page.$x(VIEW_MORE_COMMENTS_XPATH);
            while (hasMoreComments) {
                console.log('Loading more comments ...');
                await hasMoreComments.click();
                await delay(2000);
                [ hasMoreComments ] = await page.$x(VIEW_MORE_COMMENTS_XPATH);
                await page.screenshot({path: pngFilename});
            }

            const comments = await getComments(page);
            markdown += `### Comments\n\n\`\`\`\n${comments.join('\n\`\`\`\n\n\`\`\`\n')}\n\`\`\`\n\n`;
        }

        console.log(`Writing ... ${mdFilename}`);
        fs.writeFileSync(mdFilename, markdown, function (err) {
            if (err) return console.log(err);
        });
    } catch (err) {
        console.log(err);
    }
};

const main = async () => {
    const answers = await getAnswers();
    const cookies = getCookies();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 4500 });
    await page.goto('https://quora.com');
    await page.setCookie(...cookies);

    let lastChapter = '';
    for (let i = 0; i < 101; i++) { // answers.length; i++) {
    // for (let i = 0; i < 1; i++) {
        const answer = answers[i];
        // if (lastChapter != answer.Chapter) {
        //     console.log(answer.Chapter);
        // }   
        // console.log(`  ${answer.Title}`);
        if (answer.Chapter != '') {
//            await capturePage(page, answer, i, lastChapter, true);
        }
        const oldFilenameBase = `data/markdown/${String(i + 1).padStart(3, '0')}-${answer.Link.replace(/https:..www.quora.com./, '')}`;
        const newFilenameBase = `data/markdown/${String(i + 1).padStart(3, '0')}-${filename(answer)}`;
        console.log(`mv ${oldFilenameBase}.md ${newFilenameBase}.md`);
        console.log(`mv ${oldFilenameBase}.png ${newFilenameBase}.png`);
        lastChapter = answer.Chapter;
    }

    await browser.close();
};

main()
    .then(() => {})
    .catch(console.error);