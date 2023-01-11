const fs = require('fs'); 
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

// const GARY_QUORA_CSV = 'data/gary-followers.csv';
const GARY_QUORA_CSV = 'data/followers/all-errors.csv';
const QUORA_COOKIES = 'data/quora-cookies.json';

// 
// exampleCsvEntry = {
//     Name: 'Santander Mytochondria',
//     Description: 'Professor emeritus',
//     Link: 'https://www.quora.com/profile/Santander-Mytochondria',
//     Followers: 3
// }
// 

const ACTION_MENU = '.puppeteer_test_overflow_menu';
const ACTION_MENU_ITEMS = '.puppeteer_test_popover_item';
const MESSAGE_OPTION = "//div[contains(@class, 'puppeteer_test_popover_item') and contains(., 'Message')]";
const NOTIFY_ME_BUTTON = "//div[contains(@class, 'puppeteer_test_button_text') and contains(., 'Notify me')]";
const SEND_MESSAGE_BUTTON = '.puppeteer_test_modal_submit';
const MESSAGE_INPUT_BOX = '.doc';

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

const getFollowers = async () => {
    let followers = await readCsv(GARY_QUORA_CSV);
    followers.sort((a, b) => {
        const aScore = parseInt(a.Followers);
        const bScore = parseInt(b.Followers);
        if (aScore != bScore) {
            return aScore < bScore ? 1: -1;
        }
        return a.Name > b.Name ? 1 : -1;
    });
    return followers;
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const filename = (follower) => {
    const filename = follower.Name
                        .replace(/['"]/g, '')
                        .replace(/[^A-Za-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/-$/, '')
                        .replace(/^-/, '');
    return filename;
};

const firstName = (name) => {
    return name.replace(/ .*/, '');
};

const messageFollower = async (page, follower, index) => {
    let status = 'ERROR';
    const url = follower.Link;
    const filenameBase = `data/followers/${filename(follower)}`;
try {
        console.log(`Loading ${index} ... ${url}`);
        await page.goto(url);
        await page.waitForSelector(ACTION_MENU);
        await page.screenshot({path: `${filenameBase}-profile.png`});

        const [ firstImage ] = await page.$x('//*[@id="mainContent"]/div[1]//img');
        await firstImage.click();
        const [ notifyMeButton ] = await page.$x(NOTIFY_ME_BUTTON);
        const [ actionRow ] = await notifyMeButton.$x('../../..');
        let [ actionButton ] = await actionRow.$$(ACTION_MENU);

        const inner_html = await actionButton.$eval('div', element => element.innerHTML);

        await actionButton.click();
        await page.waitForSelector(ACTION_MENU_ITEMS, {visible: true});
        // await page.screenshot({path: `${filenameBase}-actionMenu.png`});
        const numMenuOptions = (await page.$$(ACTION_MENU_ITEMS)).length;
        console.log(`Found ${numMenuOptions} menu items`);
        if (numMenuOptions == 0) {
            [ actionButton ] = await page.$$(ACTION_MENU);
            await actionButton.click();
            await page.waitForSelector(ACTION_MENU_ITEMS, {visible: true});
            await page.screenshot({path: `${filenameBase}-actionMenu.png`});
            const numMenuOptions = (await page.$$(ACTION_MENU_ITEMS)).length;
            console.log(`Found ${numMenuOptions} menu items`);
        }

        if (numMenuOptions >= 4) {
            let [ messageOption ] = await page.$x(MESSAGE_OPTION);
            if (messageOption) {
                console.log('Clicking Message option ...');
                await messageOption.click();
                await page.waitForSelector(SEND_MESSAGE_BUTTON);
                await page.waitForSelector(MESSAGE_INPUT_BOX);
                const name = firstName(follower.Name);
                const message = `Hi ${name},
    
    As a follower of mine, I thought you might like to know that I have just published a book based on many of my Quora answers - you can read all about it here: https://www.quora.com/Has-Gary-Meaney-ever-written-a-book/answer/Gary-Meaney 
    
    No worries at all if it's not of interest to you. Have a great day anyways ${name}!
    
    All the best,
    Gary
    `;
                await page.type(MESSAGE_INPUT_BOX, message);
                await page.screenshot({path: `${filenameBase}-messagePopup.png`});
                await page.click(SEND_MESSAGE_BUTTON);
                await page.screenshot({path: `${filenameBase}-messageSent.png`});
                status = 'SENT';
            } else {
                await page.screenshot({path: `${filenameBase}-fourMenuItemsButNoMessagePopup.png`});
            }
        } else {
            status = 'NO_MESSAGE_OPTION';
            await page.screenshot({path: `${filenameBase}-tooFewMenuItems.png`});
        }
    } catch (err) {
        console.log(err);
        await page.screenshot({path: `${filenameBase}-error.png`});
    }
    return status;
};

const main = async (args) => {
    const followers = await getFollowers();
    const cookies = getCookies();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 4500 });
    await page.goto('https://quora.com');
    await page.setCookie(...cookies);
    const matchName = args.length == 1 ? args[0] : null;

    //for (let i = followers.length - 1; i > 207; i--) {
    for (let i = 0; i < followers.length; i++) {
        const follower = followers[i];
        let status = 'ERROR';
        if (matchName) {
            if (follower.Name == matchName) {
                await messageFollower(page, follower, i);
            }
        } else {
            status = await messageFollower(page, follower, i);
            console.error(`"${follower.Name}","${follower.Description}",${follower.Link},${follower.Followers},${status}`);
        }
    }
    await browser.close();
};

const args = process.argv.slice(2);
main(args)
    .then(() => {})
    .catch(console.error);
