require("dotenv").config({
  // path: `process.env.NODE_ENV`,
})
const axios = require('axios').default;

// logs to confirmation to console that plugin loaded
exports.onPreInit = () => console.log("Loaded guesty-plugin")

// basic auth for guesty 
const username = process.env.GATSBY_GUESTY_API_KEY;
const password = process.env.GATSBY_GUESTY_API_SECRET;
const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')

// axios defaults for all requests
axios.defaults.baseURL = 'https://api.guesty.com/api/v2/';
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.headers['Authorization'] = `Basic ${token}`;

// graphQL contants
const LISTINGS_NODE_TYPE = `Listing`;
const REVIEWS_NODE_TYPE = `Review`;


exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId,
  getNodesByType,
}) => {
    const { createNode } = actions

    // get all listings data
    axios.get('/listings', {
      params: {
          fields: "_id accommodates bedrooms beds bathrooms title occupancyStats calendarRules prices amenities pictures picture address"
      }
    })
      .then(response => {
        response.data.results.forEach(listing => {
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
        })
      })
      .catch(function (error) {
        console.log(error);
      })
      .then(function () {
        // always executed
      }); 


    // get all account reviews with respective listingIds,
    await axios.get('reviews-service/api/reviews')
      .then(response => {
        response.data.data.forEach(review => {
          createNode({
            ...review,
            id: createNodeId(`${REVIEWS_NODE_TYPE}-${review._id}`),
            parent: null,
            children: [],
            internal: {
              type: REVIEWS_NODE_TYPE,
              content: JSON.stringify(review),
              contentDigest: createContentDigest(review),
            },
          })
        })
      })
      .catch(function (error) {
        console.log(error);
      })
      .then(function () {
        // always executed
      }); 

    return
}
