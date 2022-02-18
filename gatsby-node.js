require("dotenv").config()
const axios = require('axios').default;
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)

// logs to confirmation to console that plugin loaded
exports.onPreInit = (_, pluginOptions) => console.log("Loaded guesty-source-plugin")

// basic auth for guesty 
const username = process.env.GATSBY_GUESTY_API_KEY;
const password = process.env.GATSBY_GUESTY_API_SECRET;
const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')

// axios defaults for all requests
axios.defaults.baseURL = 'https://api.guesty.com/api/v2/';
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.headers.common['Authorization'] = `Basic ${token}`;

// graphQL contants
const LISTINGS_NODE_TYPE = `Listing`;
const REVIEWS_NODE_TYPE = `Review`;

// create nodes for listings and reviews
exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId,
  getNodesByType,
}) => {
    const { createNode } = actions

    // get all listings data
    const getListings = async () => await axios.get('/listings', {
      params: {
          fields: "_id accommodates bedrooms beds bathrooms title occupancyStats active prices amenities pictures picture address tags"
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


    // get all account reviews with respective listingIds,
    const getReviews = async () => await axios.get('reviews-service/api/reviews')
      .then(response => {
        console.log(response.data);
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

    getListings();
    getReviews();
    return
}

// use onCreateNode API to assign a url and media type (file) for images everytime 
// a new Listing node is created. This allows gatsby-image-plugin to optimize image


// called each time a node is created
exports.onCreateNode = async ({
  node, // the node that was just created
  actions: { 
    createNode, 
    createNodeField 
  },
  createNodeId,
  getCache,
}) => {
  if (node.internal.type === LISTINGS_NODE_TYPE) {
    const fileNode = await createRemoteFileNode({
      url: node.picture.thumbnail, // the url of the remote image to generate a node for
      parentNodeId: node.id,
      createNode,
      createNodeId,
      getCache,
    })
    if (fileNode) {
      createNodeField({ node, name: 'thumbnail', value: fileNode.id })
    }
  }
}

// create custom resolver for slug based on nickname
const fullNameResolver = source => `${source.firstName} ${source.name}`

// Create a custom data schema for all fields imported from Guesty API

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type Listing implements Node {
      _id: String! 
      accommodates: Int
      bedrooms: Int!
      beds: Int
      bathrooms: Int 
      title: String! 
      occupancyStats: [String]
      active: Boolean 
      prices: prices
      amenities: [String] 
      pictures: [File]
      picture: picture
      address: address
      tags: [String]
      thumbnail: File @link(from: "fields.thumbnail")
      listingPics: File @link(from: "fields.listingPics")
      reviews: Review @link(by: "listingId", from: "_id")
    }
    type prices {
      basePrice: Int!
      currency: String!
      cleaningFee: Int
      securityDepositFee: Int
    }
    type picture {
      thumbnail: File
    } 
    type address {
      full: String
      lng: Int
      lat: Int
      street: String
      city: String
      country: String
    }
    type Review implements Node {
      listing: Listing @link(by: "_id", from: "listingId")
    }

    
  `)
}

// define schema for plugin options during user config
exports.pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    GUESTY_API_KEY: Joi.string()
      .required()
      .description(`Used as username for basic auth token`)
      .messages({
        // Override the error message if the .required() call fails
        "any.required": `Your API key is incorrect, check https://support.guesty.com/kb/en/article/generating-an-internal-api-token for help`
      }),
    GUESTY_API_SECRET: Joi.string()
      .required()
      .description(`Used as password for basic auth token`)
  }).external(async PluginOptions => {
    try {
      let token = Buffer
        .from(`${PluginOptions.GUESTY_API_KEY}:${PluginOptions.GUESTY_API_SECRET}`, 'utf8')
        .toString('base64');
      await axios.get("/listings", {
        headers: {
          "Authorization": `Basic ${token}`
        }
      })
    } catch (err) {
      throw new Error (
        'Cannot access Guesty API with the provided access token. Double check they are correct and try again! '
      )
    }
  })
};