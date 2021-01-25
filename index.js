//
// 自动化截取刷卡资料
//

'use strict'; // Whole-script strict mode applied.

const http = require('http'); // NOTE: import default module
const fs = require('fs'); // NOTE: import default module 文件系统
const querystring = require('querystring'); // NOTE: import default module
const moment = require('moment') // Note: 日期

// Step 1: Open login page to get cookie 'ASP.NET_SessionId' and hidden input '_ASPNetRecycleSession'.
//
var _ASPNET_SessionId;
var _ASPNetRecycleSession;
var Department = '';
var EID = '';
var Name = '';
var Arr = [];
var startTime = '';
var endTime = '';

function openLoginPage() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode === 200) {
                let fo = fs.createWriteStream('tmp/step1-LoginPage.html');
                fo.write(html);
                fo.end();
                let cookie = response.headers['set-cookie'][0];
                let patc = new RegExp('ASP.NET_SessionId=(.*?);');
                let mc = patc.exec(cookie);
                if (mc) {
                    _ASPNET_SessionId = mc[1];
                    console.log(`Cookie ASP.NET_SessionId: ${_ASPNET_SessionId}`);
                }
                let patm = new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                let mm = patm.exec(html);
                if (mm) {
                    _ASPNetRecycleSession = mm[1];
                    console.log(`Element _ASPNetRecycleSession: ${_ASPNetRecycleSession}`);
                }
                console.log('Step1 login page got.\n');
                login();
            } else {
                let msg = `Step1 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let req = http.request("http://twhratsql.whq.wistron/OGWeb/LoginForm.aspx", callback);

    req.on('error', e => {
        let msg = `Step1 Problem: ${e.message}`;
        console.error(msg);
    });

    req.end();
}

//
// Step 2: POST data to login to get cookie 'OGWeb'.
//
var OGWeb;

function login() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode === 302) {
                let fo = fs.createWriteStream('tmp/step2-login.html');
                fo.write(html);
                fo.end();
                let cookie = response.headers['set-cookie'][0];
                let patc = new RegExp('OGWeb=(.*?);');
                let mc = patc.exec(cookie);
                if (mc) {
                    OGWeb = mc[1];
                    console.log('Cookie OGWeb got.');
                }
                console.log('Step2 done.\n');
                step3();
            } else {
                let msg = `Step2 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let postData = querystring.stringify({
        '__ctl07_Scroll': '0,0',
        '__VIEWSTATE': '/wEPDwULLTEyMTM0NTM5MDcPFCsAAmQUKwABZBYCAgMPFgIeBXN0eWxlBTFiZWhhdmlvcjp1cmwoL09HV2ViL3RxdWFya19jbGllbnQvZm9ybS9mb3JtLmh0Yyk7FhACCA8UKwAEZGRnaGQCCg8PFgIeDEVycm9yTWVzc2FnZQUZQWNjb3VudCBjYW4gbm90IGJlIGVtcHR5LmRkAgwPDxYCHwEFGlBhc3N3b3JkIGNhbiBub3QgYmUgZW1wdHkuZGQCDQ8PFgIeB1Zpc2libGVoZGQCDg8UKwAEZGRnaGQCEg8UKwADDxYCHgRUZXh0BSlXZWxjb21lIFRvIOe3r+WJteizh+mAmuiCoeS7veaciemZkOWFrOWPuGRkZ2QCFA8UKwADDxYCHwMFK0Jlc3QgUmVzb2x1dGlvbjoxMDI0IHggNzY4OyBJRSA2LjAgb3IgYWJvdmVkZGdkAhsPFCsAAmQoKWdTeXN0ZW0uRHJhd2luZy5Qb2ludCwgU3lzdGVtLkRyYXdpbmcsIFZlcnNpb249Mi4wLjAuMCwgQ3VsdHVyZT1uZXV0cmFsLCBQdWJsaWNLZXlUb2tlbj1iMDNmNWY3ZjExZDUwYTNhBDAsIDBkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYCBQVjdGwwNwUITG9naW5CdG6vo0TFNrmm9RKH7uSQ+NY2OXccyA==',
        '__VIEWSTATEGENERATOR': 'F163E3A2',
        '_PageInstance': '1',
        '__EVENTVALIDATION': '/wEWBAK20LBAAsiTss0OArOuiN0CArmtoJkDPmmwqug37xjPhGglEwK8JU9zleg=',
        'UserPassword': 'S0808001',
        'UserAccount': 'S0808001',
        'LoginBtn.x': '74',
        'LoginBtn.y': '10',
        '_ASPNetRecycleSession': _ASPNetRecycleSession
    });
    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/LoginForm.aspx",
        method: "POST",
        headers: {
            'Cookie': 'ASP.NET_SessionId=' + _ASPNET_SessionId, // NOTED.
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, callback);

    req.on('error', e => {
        let msg = `Step2 Problem: ${e.message}`;
        console.error(msg);
    });

    req.write(postData);
    req.end();
}

//
// Step 3: Open EntryLogQueryForm.aspx page to get hidden input '_ASPNetRecycleSession', '__VIEWSTATE' and '__EVENTVALIDATION'.
//
var __VIEWSTATE = '';
var __EVENTVALIDATION = '';

function step3() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode === 200) {
                let fo = fs.createWriteStream('tmp/step3.html');
                fo.write(html);
                fo.end();
                let patm = new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                let mm = patm.exec(html);
                if (mm) {
                    _ASPNetRecycleSession = mm[1];
                    console.log(`Element _ASPNetRecycleSession: ${_ASPNetRecycleSession}`);
                }
                let patv = new RegExp('<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="(.*?)"');
                let mv = patv.exec(html);
                if (mv) {
                    __VIEWSTATE = mv[1];
                    console.log('Element __VIEWSTATE got');
                }
                let pate = new RegExp('<input type="hidden" name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="(.*?)"');
                let me = pate.exec(html);
                if (me) {
                    __EVENTVALIDATION = me[1];
                    console.log('Element __EVENTVALIDATION got');
                }
                console.log('Step3 done.\n');
                askAll();
            } else {
                let msg = `Step3 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
        //method: "GET",    // Default can be omitted.
        headers: {
            'Cookie': `ASP.NET_SessionId=${_ASPNET_SessionId}; OGWeb=${OGWeb}` // important
        }
    }, callback);

    req.on('error', e => {
        let msg = `Step3 Problem: ${e.message}`;
        console.error(msg);
    });

    req.end();
}

//
// Step 4: POST data to inquire.
//
/**
 * 截取某人的刷卡资料。
 * @param {*} beginDate 开始日期
 * @param {*} endDate 截止日期
 * @param {*} employeeIdOrName 工号或名字
 * @param {*} nextPage if go to next page
 * @param {*} nextStep 完成后调用此function
 */
function inquire(beginDate, endDate, employeeIdOrName, nextPage, nextStep) {
    // return new Promise(function (resolve, reject) {
    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode === 200) {
                let result = parseKQ(html);
                let fo = fs.createWriteStream(`tmp/step4-inquire-${employeeIdOrName}-${result.curPage}.html`);
                fo.write(html);
                fo.end();
                if (result.curPage < result.numPages) {
                    inquire(beginDate, endDate, employeeIdOrName, true, nextStep);
                } else {
                    console.log(`Inquiry about ${employeeIdOrName} is done.`);
                    if (nextStep) { // If provided.
                        nextStep();
                    }
                }
            } else {
                console.error(`Inquiry HTTP error: ${response.statusMessage}`);
            }
        });
    }

    var beginTime = '0:00';
    var endTime = '23:59';

    let postObj = {
        'TQuarkScriptManager1': 'QueryResultUpdatePanel|QueryBtn',
        'TQuarkScriptManager1_HiddenField': ';;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:411fea1c:865923e8;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:91bd373d:d7d5263e:f8df1b50;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e7c87f07:bbfda34c:30a78ec5;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:9b7907bc:9349f837:d4245214;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e3d6b3ac;',
        '__ctl07_Scroll': '0,0',
        '__VIEWSTATEGENERATOR': 'A21EDEFC',
        '_ASPNetRecycleSession': _ASPNetRecycleSession,
        '__VIEWSTATE': __VIEWSTATE,
        '_PageInstance': 26,
        '__EVENTVALIDATION': __EVENTVALIDATION,
        'AttNoNameCtrl1$InputTB': '上海欽江路',
        'BeginDateTB$Editor': beginDate,
        'BeginDateTB$_TimeEdit': beginTime,
        'EndDateTB$Editor': endDate,
        'EndDateTB$_TimeEdit': endTime,
        'EmpNoNameCtrl1$InputTB': employeeIdOrName
    };
    if (nextPage) {
        postObj['GridPageNavigator1$NextBtn'] = 'Next Page';
    } else {
        postObj['QueryBtn'] = 'Inquire';
    }

    let postData = querystring.stringify(postObj);

    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
        method: "POST",
        headers: {
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; MAARJS)', // mimic IE 11 // important
            'X-MicrosoftAjax': 'Delta=true', // important
            'Cookie': `ASP.NET_SessionId=${_ASPNET_SessionId}; OGWeb=${OGWeb}`, // important
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, callback);

    req.on('error', e => {
        console.error(`Step4 Problem: ${e.message}`);
    });

    req.end(postData);

    // resolve();
    // })
}

/**
 * Parse the input html to get 刷卡 data.
 * @param {*} html 
 * @return number of current page and number of total pages.
 */

function parseKQ(html) {
    // Get number of pages.
    let curPage = 1;
    let numPages = 1;
    let rexTotal = new RegExp('<span id="GridPageNavigator1_CurrentPageLB">(.*?)</span>[^]*?<span id="GridPageNavigator1_TotalPageLB">(.*?)</span>');
    let match = rexTotal.exec(html);
    if (match) {
        curPage = parseInt(match[1]);
        numPages = parseInt(match[2]);
        console.log(`Page: ${curPage} / ${numPages}`);
    }

    // Update __VIEWSTATE __EVENTVALIDATION
    let rexVS = new RegExp("__VIEWSTATE[\|](.*?)[\|]");
    let matVS = rexVS.exec(html);
    if (matVS) {
        __VIEWSTATE = matVS[1];
    }
    let rexEV = new RegExp("__EVENTVALIDATION[\|](.*?)[\|]");
    let matEV = rexEV.exec(html);
    if (matEV) {
        __EVENTVALIDATION = matEV[1];
    }

    // Print 刷卡 data
    console.log(`/Department  /EID  /Name  /Clock Time`);

    while (true) {
        let rex = new RegExp('<td>(.*?)</td><td>&nbsp;</td><td><.*?>(.*?)</a></td><td>(.*?)</td><td>.*?</td><td>(.*?)</td>',
            'g'); // NOTE: 'g' is important
        let m = rex.exec(html);
        if (m) {
            console.log(`${m[1]} ${m[2]} ${m[3]} ${m[4]}`);
            let checkDatetime = moment(m[4], 'MM/DD/YYYY H:mm:ss');
            let dateArr = checkDatetime.toArray();
            //  [years, months, date, hours, minutes, seconds, milliseconds]
            let clockInDate = `${dateArr[0]}-${dateArr[1] + 1}-${dateArr[2]}`;
            let clockInTime = `${dateArr[3]}:${dateArr[4]}:${dateArr[5]}`;
            let person = `${m[2]} ${m[3]}`;
            if (!Arr[person]) {
                Arr[person] = [];
            }
            if (!Arr[person][clockInDate])
                Arr[person][clockInDate] = [];
            Arr[person][clockInDate].push(clockInTime);
            html = html.substr(rex.lastIndex);
        } else {
            break;
        }
    }
    return {
        curPage: curPage,
        numPages: numPages
    };
}

function askAll() {
    startTime = '2021-01-01';
    endTime = '2021-01-25';
    inquire(startTime, endTime, 'S2008003', false,
        () => inquire(startTime, endTime, 'Ce Xian', false,
            () => inquire(startTime, endTime, 'Carlos Jiang', false,
                () => inquire(startTime, endTime, 'Xu Qian', false,
                    () => inquire(startTime, endTime, 'Lance Li', false,
                        () => inquire(startTime, endTime, 'Anne', false,
                            () => inquire(startTime, endTime, 'Jack QP Zhang', false,
                                function () {
                                    console.log("All done.");
                                    TimeAdjust();
                                })))))));
}

function TimeAdjust() {
    const ARRIVETIME = "08:50:59";
    const LEAVETIME = "16:50:00";
    // console.log(Arr);
    let printStr = "";
    for (let item in Arr) {
        let personRecord = Arr[item];
        let startDay = moment(startTime);
        let endDay = moment(endTime);
        startDay = startDay.add(-1, 'day');
        for (let date in personRecord) {
            let m = moment(`${date} ${personRecord[date][0]}`, "YYYY-MM-DD HH:mm:ss");
            let outComeTimeStr = "";
            let inComeTimeStr = "";
            let adiustTimeincome = moment(`${date} ${ARRIVETIME}`, "YYYY-MM-DD HH:mm:ss");
            let adiustTimeleave = moment(`${date} ${LEAVETIME}`, "YYYY-MM-DD HH:mm:ss");
            let day = "";
            // 从最近的一天到最开始有记录的那一天 如果没有打卡的话
            while (!m.isSame(endDay, 'day')) {
                printStr = '';
                day = endDay.format("YYYY-M-D");
                if (endDay.weekday() === 0 || endDay.weekday() === 6) {
                    printStr += '   周末';
                }
                if (endDay.weekday() >= 1 && endDay.weekday() <= 5) {
                    printStr += '  请假';
                }
                endDay = endDay.add(-1, 'day');
                console.log(`${item} ${day} ${inComeTimeStr} ${outComeTimeStr} ${printStr}`);
            }
            printStr = '';
            if (personRecord[date].length == 1) {
                printStr += "只刷一次 ";
                inComeTimeStr = personRecord[date][0];
            }
            if (personRecord[date].length >= 2) {
                outComeTimeStr = personRecord[date][0];
                inComeTimeStr = personRecord[date].pop();
                let outComeTime = moment(date + ' ' + outComeTimeStr, "YYYY-MM-DD HH:mm:ss");
                let inComeTime = moment(date + ' ' + inComeTimeStr, "YYYY-MM-DD HH:mm:ss");
                if (inComeTime.isAfter(adiustTimeincome))
                    printStr += "迟到 ";
                if (outComeTime.isBefore(adiustTimeleave))
                    printStr += "早退 ";
                if (outComeTime.diff(inComeTime, 'hours') < 9)
                    printStr += "工时不足 ";
                if (outComeTime.diff(inComeTime, 'hours') >= 9) {
                    printStr += "nice workhours ";
                    printStr += outComeTime.diff(inComeTime, 'hours')
                }
            }
            console.log(`${item} ${date} ${inComeTimeStr} ${outComeTimeStr} ${printStr}`);
            endDay = endDay.add(-1, 'day');
        }
        // 为了判断查出有记录的最后一天是不是用户想要查询的第一天
        while (!endDay.isSame(startDay, 'day')) {
            printStr = "";
            let day = endDay.format("YYYY-M-D");
            if (endDay.weekday() === 0 || endDay.weekday() === 6) {
                printStr += '   周末';
            }
            if (endDay.weekday() >= 1 && endDay.weekday() <= 5) {
                printStr += '  请假';
            }
            endDay = endDay.add(-1, 'day');
            console.log(`${item} ${day}  ${printStr}`);
        }
    }
}
openLoginPage(); // Where it all begin