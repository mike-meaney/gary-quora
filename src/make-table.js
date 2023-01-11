const fs = require('fs'); 
const csv = require('csv-parser');

const GARY_QUORA_CSV = 'data/gary-quora-categories.csv';
const GARY_QUORA_HTML = 'dist/GaryBookTable.html';
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
const ANSWER_SUFFIX = '/answer/Gary-Meaney';
const HEADINGS = ['', 'Chapter', 'Upvotes', 'Comments', 'When' ];
const NO_CSS = '*,*:after,*:before{border:0;margin:0;padding:0;box-sizing:inherit;color:inherit}html,body{max-width:100vw;overflow-x:hidden;box-sizing:border-box}body{font-family:"Roboto",Helvetica,Arial,sans-serif;line-height:1.8em}p{text-align:justify}b,label,strong{font-weight:bold}ul{list-style-type:none;padding-left:20px}a{text-decoration:none;color:#0074d9;white-space:nowrap}a:hover{cursor:pointer}h1,h2,h3,h4,h5,h6{font-weight:bold;line-height:1em}h1{font-size:4em;margin:1.0em 0 .25em 0}h2{font-size:2.4em;margin:.9em 0 .25em 0}h3{font-size:1.8em;margin:.8em 0 .25em 0}h4{font-size:1.6em;margin:.7em 0 .30em 0}h5{font-size:1.4em;margin:.6em 0 .40em 0}h6{font-size:1.2em;margin:.5em 0 .50em 0}header,footer{display:block;width:100%}code{background:#f4f5f6;border-radius:.4rem;font-size:90;margin:0 .2rem;padding:.2rem .5rem;white-space:nowrap}p,li,button,fieldset,input,select,textarea,blockquote,table{margin-bottom:1.0rem}table{border-collapse:collapse;width:100%}tbody tr:hover{background-color:#fbf6d9}thead tr{background-color:#f1f1f1}tbody tr{border-bottom:2px solid #f1f1f1}td,th{padding:4px 8px;text-align:left;vertical-align:top}thead th{vertical-align:bottom}@media(min-width:40rem){table{display:table;overflow-x:initial}}[role="button"],button,input[type=\'button\'],input[type=\'reset\'],input[type=\'submit\']{background-color:#0074d9;border-radius:5px;color:#fff;cursor:pointer;display:inline-block;font-size:1.1rem;font-weight:300;height:1.8rem;line-height:1.8rem;padding:0 1.0rem;text-align:center;text-decoration:none;white-space:nowrap;min-width:100px}[role="button"]:focus,[role="button"]:hover,button:focus,button:hover,input[type=\'button\']:focus,input[type=\'button\']:hover,input[type=\'reset\']:focus,input[type=\'reset\']:hover,input[type=\'submit\']:focus,input[type=\'submit\']:hover{box-shadow:0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19)}input[type=\'color\'],input[type=\'date\'],input[type=\'datetime\'],input[type=\'time\'],input[type=\'datetime-local\'],input[type=\'email\'],input[type=\'month\'],input[type=\'number\'],input[type=\'password\'],input[type=\'search\'],input[type=\'tel\'],input[type=\'text\'],input[type=\'url\'],input[type=\'week\'],input:not([type]),textarea,select{-webkit-appearance:none;background-color:transparent;border:.1rem solid #d1d1d1;border-radius:5px;box-shadow:none;box-sizing:inherit;font-family:monospace;font-size:1.2em;padding:.5em 1.0em .5em;width:100%}input[type=\'color\']:focus,input[type=\'date\']:focus,input[type=\'time\']:focus,input[type=\'datetime\']:focus,input[type=\'datetime-local\']:focus,input[type=\'email\']:focus,input[type=\'month\']:focus,input[type=\'number\']:focus,input[type=\'password\']:focus,input[type=\'search\']:focus,input[type=\'tel\']:focus,input[type=\'text\']:focus,input[type=\'url\']:focus,input[type=\'week\']:focus,input:not([type]):focus,textarea:focus,select:focus{border-color:#0074d9;outline:0}select{background:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 8" width="30"><path fill="%23d1d1d1" d="M0,0l6,8l6-8"/></svg>\') center right no-repeat}select[multiple]{background:none;height:auto}textarea{min-height:6.5rem}fieldset{border-width:0;padding:0}input[type=\'checkbox\'],input[type=\'radio\']{display:inline}[disabled]{cursor:default;opacity:.5}body>div{max-width:960;margin-left:auto;margin-right:auto}.columns{display:table;width:100%}.columns .columns{margin:0 -1.5em}@media(min-width:600px){.col,.c25,.c33,.c50,.c66,.c75{padding:1.5em;display:table-cell;vertical-align:top}.c25{width:24.9%}.c33{width:33.3%}.c50{width:49.9%}.c66{width:66.6%}.c75{width:74.9%}}@media(max-width:600px){.col,.c25,.c33,.c50,.c66,.c75{padding:20px;display:block;vertical-align:top}}.columns:after{content:"";clear:both;display:table}.transparent{background-color:transparent;color:#111}.default{background-color:#0074d9;color:white}.success{background-color:#2ecc40;color:white}.warning{background-color:#ffdc00;color:#111}.error{background-color:#cc1f00;color:white}.info{background-color:#f1f1f1;color:#111}.white{background-color:white;color:#111}.black{background-color:#111;color:white}nav{position:relative;padding:0 1.5em;display:table;width:100vw;height:40px}nav ul{list-style:none;position:relative;padding:0}nav>input[type=checkbox],nav>label{display:none}@media(min-width:600px){nav>*{display:table-cell;vertical-align:middle}nav>ul:last-child{float:right}nav>ul>li{padding:1.5em .5em}}@media(max-width:600px){nav>ul{display:table-column;vertical-align:middle}nav>label{position:absolute;display:inline-block;top:5px;right:20px;font-size:2em}nav>a{display:inline-block;padding-top:8px!important}nav>ul{display:block}nav>input[type=checkbox]:not(:checked) ~ ul{display:none}nav>ul>li{display:block;text-align:center;padding:.5em .2em}}nav li:hover{background-color:#0074d9}nav li:hover>a{color:white}nav a{padding:0 5px;text-decoration:none;text-align:left;color:black}nav.black ul ul a{color:black}nav.black a,nav.black>label{color:white}nav li{position:relative;margin:0;padding:0;display:inline-block}nav ul ul{border:1px solid #e1e1e1;visibility:hidden;opacity:0;position:absolute;top:90%;left:-20px;padding:0;z-index:1000;transition:all .2s ease-out;list-style-type:none;box-shadow:5px 5px 10px #666;background-color:white}nav ul ul li{width:100%}nav ul ul a{padding:10px 15px;color:#333;font-weight:700;font-size:12px;line-height:16px;display:block;color:#111}nav ul ul ul{top:0;left:80%;z-index:1100}nav li:hover>ul{visibility:visible;opacity:1}nav>li>ul>li:first-child:before{content:\'\';position:absolute;width:1px;height:1px;border:10px solid transparent;left:50px;top:-20px;margin-left:-10px;border-bottom-color:white}[role="dialog"]>div{position:fixed;z-index:9999;top:0;bottom:0;left:0;right:0;background-color:rgba(0,0,0,0.8);padding-top:20vh;transition:opacity 500ms;visibility:hidden;opacity:0}[role="dialog"]>input[type=checkbox]{display:none!important}input[type=checkbox]:checked ~ div{visibility:visible;opacity:1}[role="dialog"]>div>*:not(.close){width:66%;margin-left:auto;margin-right:auto;border-radius:5px}[role="dialog"]>div>.close,[role="alert"]>.close{background:url(\'data:image/svg+xml;utf8,<svg fill="%23000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 8.7070312 7.2929688 L 7.2929688 8.7070312 L 10.585938 12 L 7.2929688 15.292969 L 8.7070312 16.707031 L 12 13.414062 L 15.292969 16.707031 L 16.707031 15.292969 L 13.414062 12 L 16.707031 8.7070312 L 15.292969 7.2929688 L 12 10.585938 L 8.7070312 7.2929688 z"/></svg>\') center right no-repeat;width:24px;height:24px;cursor:pointer;position:absolute;top:15px;right:15px;cursor:pointer}.accordion>label{cursor:pointer}.accordion>input ~ label:before{content:"\25b2";color:#ddd}.accordion>input:checked ~ label:before{content:"\25bc";color:#ddd}.accordion>input{display:none}.accordion>input:checked ~ *:not(label){max-height:1000px!important;overflow:hidden!important;-webkit-transition:max-height .3s ease-in;transition:max-height .3s ease-in}.accordion>*:not(label){max-height:0;overflow:hidden;margin:0;padding:0;-webkit-transition:max-height .3s ease-out;transition:max-height .3s ease-out}[role="alert"]{margin:20px 25px 0 25px;padding:20px 50px 20px 20px;position:relative;border-radius:5px;color:black}[role="alert"]>.close{position:absolute;top:10px;right:10px}.padded{padding:1.5em}.fill{width:100%}';
const CSS = `
.question {
    display: inline-block;
    width: 500px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.answer {
    display: inline-block;
    width: 500px;
    height: 55px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
.photo {
    width: 100px;
}
`;

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
        const aScore = a.Chapter ? 1000000000 - parseInt(a.Num) : parseInt(a.Upvotes);
        const bScore = b.Chapter ? 1000000000 - parseInt(b.Num) : parseInt(b.Upvotes);
        return aScore < bScore ? 1: -1;
    });
    return answers
};

const main = async () => {
    let html = `<style>${NO_CSS}${CSS}</style>
            <table><tr><th>${HEADINGS.join('</th><th>')}</th></tr>
    `;
    const answers = await getAnswers();

    answers.forEach((answer, i) => {
        if (answer.Title != '') {
            const cells = [];
            const title = answer.Title == '' ? answer.Question : `${answer.Chapter}: ${answer.Title}`;
            cells.push(answer.Image == '?' ? '': `<img class="photo" src="${answer.Image}">`);
            cells.push(`<a class="question" href="${answer.Link}${ANSWER_SUFFIX}" target=_blank>${i+1}. ${title}</a><br>
            <span class="answer">${answer.Answer}</span>
            `);
            cells.push(answer.Upvotes);
            cells.push(answer.Comments);
            cells.push(answer.Timestamp);
            html += `<tr><td>${cells.join('</td><td>')}</td></tr>`;
        }
    });

    html += '</table>';
    fs.writeFile(GARY_QUORA_HTML, html, function (err) {
        if (err) return console.log(err);
        console.log(`Wrote ${GARY_QUORA_HTML}`);
    });
};

main()
    .then(() => {})
    .catch(console.error);