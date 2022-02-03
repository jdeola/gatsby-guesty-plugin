require("dotenv").config({
  // path: `process.env.${process.env.NODE_ENV}`,
})

const axios = require('axios').default;

// logs to confirmation to console that plugin loaded
exports.onPreInit = () => console.log("Loaded guesty-plugin")

// basic auth for guesty 
const GUESTY_ACCOUNT_ID = process.env.GATSBY_GUESTY_ACCOUNT_ID;
const username = process.env.GATSBY_GUESTY_API_KEY;
const password = process.env.GATSBY_GUESTY_API_SECRET;

// axios defaults for all requests
axios.defaults.baseURL = 'https://api.guesty.com/api/v2/';
axios.defaults.headers['Content-Type'] = 'application/json';

// graphQL contants
const LISTINGS_NODE_TYPE = `Listings`;


exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId,
  getNodesByType,
  }) => {
    const { createNode } = actions

    const token = Buffer.from(`${username}:${password}`, 'utf8')
    .toString('base64')

    // pull data from some remote source using cached data as an option in the request
    const data = await axios.get('/accounts/me', {
      // params: {
      //   accountId: GUESTY_ACCOUNT_ID
      // },
      headers: {
        'Authorization': `Basic ${token}`
      }
    })
    .then(function (response) {
      console.log(response.data);
      for (const listing of response.data) {
        createNode({
          ...listing,
          id: createNodeId(`${LISTINGS_NODE_TYPE}-${listing._id}`),
          parent: null,
          children: [],
          internal: {
            type: LISTINGS_NODE_TYPE,
            content: JSON.stringify(listing),
            contentDigest: createContentDigest(listing),
          },
        })
      }
    })
    .catch(function (error) {
      console.log(error);
    })
    .then(function () {
      // always executed
    }); 

    return
}

// exports.onPostBuild = async ({ cache }) => {
//   // set a timestamp at the end of the build
//   await cache.set(`timestamp`, Date.now())
// }