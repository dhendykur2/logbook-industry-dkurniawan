const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const Promise = require('bluebird');

const { BASE_URL } = process.env;

const post = Promise.promisify(request.post);
const get = Promise.promisify(request.get);


module.exports.login = async (req, reply) => {
  const loginUri = `${BASE_URL}auth/login`;
  try {
    const jar = request.jar();
    const { username, password } = req.body;
    const form = {};
    const response = await get(loginUri, { jar });
    const $ = cheerio.load(response.body);
    const formInput = $('form').serializeArray();
    console.log('Get Form Input Name');
    await formInput.map((obj) => {
      if (obj.name !== '_token') {
        obj.name === 'username' ?
        form[obj.name] = username :
        form[obj.name] = password;
      } else {
        form[obj.name] = obj.value;
      }
    });
    console.log('Try to Login');
    const doLogin = await post(loginUri, { form, jar, followAllRedirects: true });
    await fs.writeFile('cookie.json', JSON.stringify({ setCookie: doLogin.headers['set-cookie']}));
    const valid =
      doLogin.request.uri.href === BASE_URL ? true : false;
    return valid ?
      Promise.resolve(reply.send({ status: true, message: 'login success' })) :
      Promise.resolve(reply.send({ status: false, message: 'wrong username/password' }));
  } catch (err) {
    console.error(err);
    return Promise.reject(err);
  }
};

module.exports.profile = async (req, reply) => {
  const jar = request.jar();
  jar.getCookies(BASE_URL);
  let setCookie = JSON.parse(fs.readFileSync('cookie.json', 'utf-8')).setCookie;
  if (!(setCookie instanceof Array)) setCookie = [setCookie];
  setCookie.forEach((sc) => {
    jar.setCookie(sc, BASE_URL);
  });
  const response = await get(`${BASE_URL}profile`, { jar });
  const $ = cheerio.load(response.body);
  const data = $('.twelve.wide.column.profile').find('.row').find('.ui.header');
  const img = $('.four.wide.column img')['0'].attribs.src;
  console.log(img);
  const nim = data[0].children[0].data.trim(' ');
  const name = data[1].children[0].data.trim(' ');
  return reply.send({ img, nim, name });
};

module.exports.insert = async (req, reply) => {
  const insertUri = `${BASE_URL}student/log-book/insert`;
  // check cookie
  const jar = request.jar();
  jar.getCookies(BASE_URL);
  let setCookie = JSON.parse(fs.readFileSync('cookie.json', 'utf-8')).setCookie;
  if (!(setCookie instanceof Array)) setCookie = [setCookie];
  setCookie.forEach((sc) => {
    jar.setCookie(sc, BASE_URL);
  });
  const { clock_in, clock_out, activity, descriptions } = req.body;
  if (clock_in.length == 0 ||
    clock_out.length == 0 ||
    activity.length == 0 ||
    descriptions.length == 0
  ) return reply.send({ status: false, message: 'All field should be filled' });

  const response = await get(insertUri, { jar });
  const $ = cheerio.load(response.body);
  // Check Filled Activity
  const message = $('div.ui.segment div.ui.header').text();
  if (message.length) return reply.send({ status: false, message });
  const form = {};
  const formInput = $('form').serializeArray();
  console.log('Get Form Input Name');
  await formInput.map((obj) => {
    if (obj.name === '_token') {
      form[obj.name] = obj.value;
    } else if (obj.name === 'clock-in' || obj.name === 'clock-out') {
      obj.name === 'clock-in' ? form[obj.name] = clock_in : form[obj.name] = clock_out;
    } else {
      obj.name === 'activity' ? form[obj.name] = activity : form[obj.name] = descriptions;
    }
  });
  console.log('Try to Insert Logbook');
  await post(insertUri, { form, jar, followAllRedirects: true });
  console.log('Logbook Inserted');
  return reply.send({ status: true, message: `Activity filled` });
};
