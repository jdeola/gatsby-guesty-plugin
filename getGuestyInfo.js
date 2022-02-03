
const axios = require('axios').default;

// basic auth for guesty 
const GUESTY_ACCOUNT_ID = process.env.GATSBY_GUESTY_ACCOUNT_ID;
const username = process.env.GATSBY_GUESTY_API_KEY;
const password = process.env.GATSBY_GUESTY_API_SECRET;

// axios defaults for all requests
axios.defaults.baseURL = 'https://api.guesty.com/api/v2/';
axios.defaults.headers['Content-Type'] = 'application/json';


module.exports = (guestyObject) => {

  const token = Buffer.from(`${username}:${password}`, 'utf8')
  .toString('base64')

  // pull data from some remote source using cached data as an option in the request
  const {data} = axios.get(`/${guestyObject}`, {
    params: {
      accountId: GUESTY_ACCOUNT_ID
    },
    headers: {
      'Authorization': `Basic ${token}`
    }
  })
  .then(function (response) {
    console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  })
  // .then(function () {
  //   // always executed
  // }); 
}