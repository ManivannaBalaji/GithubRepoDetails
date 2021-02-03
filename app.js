var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var url, foundData;
var cDate, curDate;
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
getCreatedDate();

app.get('/', function(req, res){
  res.render('index');
});

app.post('/commits', async function(req, res){
  var sdate = req.body.datefrom;
  var edate = req.body.dateto;
  if(sdate != '' && edate !=''){
    url = 'https://github.com/flutter/flutter/graphs/contributors?from=' + sdate + '&to=' + edate + '&type=c';
  }else if(sdate == '' && edate ==''){
    calculateDate();
    url = 'https://github.com/flutter/flutter/graphs/contributors?from=' + cDate + '&to=' + curDate + '&type=c';
  }else if(sdate == ''){
    url = 'https://github.com/flutter/flutter/graphs/contributors?from=' + cDate + '&to=' + edate + '&type=c';
  }else if(edate == ''){
    calculateDate();
    url = 'https://github.com/flutter/flutter/graphs/contributors?from=' + sdate + '&to=' + curDate + '&type=c';
  }
  console.log(url);
  try{
     await findCommits();
  }catch(err){
    console.log(err);
  }
  res.render('commits', {result: foundData});
});

app.listen(3000, function(){
  console.log("App listening at port 3000");
});

async function findCommits(){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
  const result = await page.evaluate(() => {
    let commit_auth = document.querySelector('h3 a.text-normal').innerText;
    let commits = document.querySelector('h3 a.link-gray').innerText;
    commits = commits.replace(',', '');
    let matches = commits.match(/(\d+)/);
    commits = matches[0];
    return{
      committer: commit_auth,
      commits: commits
    };
  });
  foundData = result;
  console.log('Result : ', foundData);
  await browser.close();
}

function calculateDate(){
  today = new Date();
  day = today.getDate();
  if(day<=9){
    day = '0' + day;
  }
  month = today.getMonth()+1;
  if(month<=9){
      month = '0' + month;
  }
  year = today.getFullYear();
  curDate = year + "-" + month + "-" + day;
}

async function getCreatedDate(){
  var durl = "https://api.github.com/repos/flutter/flutter";
  const res = await fetch(durl);
  const data = await res.json();
  cDate = data.created_at.substr(0,10);
  console.log("created at", cDate);
}