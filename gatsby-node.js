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
          fields: "_id accommodates bedrooms beds bathrooms propertyType title occupancyStats customFields active prices terms amenities pictures picture address integrations isListed publicDescription"
      }
    })
      .then(response => {
        response.data.results.forEach(listing => {
          createNode({
            ...listing,
            id: listing._id,
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
    const getReviews = async () => await axios.get('reviews-service/api/reviews', {
      // params: {
      //   channelId: "airbnb2"
      // }
    })
      .then(response => {
        console.log(response.data.data);
        response.data.data.forEach(review => {
          createNode({
            ...review,
            id: review._id,
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
// exports.onCreateNode = async ({
//   node, // the node that was just created
//   actions: { 
//     createNode, 
//     createNodeField 
//   },
//   createNodeId,
//   getCache,
// }) => {
//   if (node.internal.type === LISTINGS_NODE_TYPE) {
//     const fileNode = await createRemoteFileNode({
//       url: node.picture.thumbnail, // the url of the remote image to generate a node for
//       parentNodeId: node.id,
//       createNode,
//       createNodeId,
//       getCache,
//     })
//     if (fileNode) {
//       createNodeField({ node, name: 'thumbnail', value: fileNode.id })
//     }
//   }
// }

exports.onCreateNode = async ({
    node, // the node that was just created
    actions: { 
      createNode, 
      createNodeField 
    },
    createNodeId,
    getCache,
  }) => {
    if (node.internal.type === LISTINGS_NODE_TYPE && node.pictures !== null) {
      await node.pictures.forEach(file => {
        // console.log(file);
        const fileNode =  createRemoteFileNode({
          url: file.original, // the url of the remote image to generate a node for
          parentNodeId: node.id,
          createNode,
          createNodeId,
          getCache,
        })
        // for some reason I can get gatsbyImageData from File node, 
        // but not listing.picFiles
        if (fileNode) {
          createNodeField({ node, name: 'picFiles', value: fileNode.id })
        }
      })
      
    }
  }


// Create a custom data schema for all fields imported from Guesty API

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type Listing implements Node @infer {
      _id: String! 
      accommodates: Int
      bedrooms: Int!
      beds: Int
      bathrooms: Int 
      propertyType: String
      title: String! 
      occupancyStats: [String]
      active: Boolean 
      prices: prices
      amenities: [String] 
      pictures: [pictures]
      address: address
      tags: [String]
      isListed: Boolean
      integrations: integrations
      customFields: customFields
      publicDescription: publicDescription
      picFiles: [File] @link(from: "fields.picFiles")
    }
    type prices {
      basePrice: Int!
      currency: String!
      cleaningFee: Int
      securityDepositFee: Int
    }
    type pictures {
      _id: String!
      thumbnail: String
      regular: String 
      large: String 
      caption: String
      original: String
    } 
    type address {
      full: String
      lng: Int
      lat: Int
      street: String
      city: String
      country: String
    }
    type integrations {
      platform: String
      _id: String
      airbnb: airbnb
    }
    type airbnb {
      starRating: Int
      reviewsCount: Int
      importCalendar: Boolean
      isCalendarSynced: Boolean
    }
    type customFields {
      fieldId: String
      value: String
      fullText: String
    }
    type publicDescription {
      summary:	String	
      space:	String	
      access:	String	
      neighborhood:	String	
      transit:	String	
      notes:	String	
      houseRules:	String	
      interactionWithGuests: String
    }
    type Review implements Node @infer {
      _id: String!
      channelId: String!
      createdAt: Date
      listingId: String!
      rawReview: rawReview
      listing: Listing @link(from: "listing._id" by: "listingId")
    }
    type rawReview {
      overall_rating: Int
      public_review: String!
      category_ratings_cleanliness: Int
      category_ratings_accuracy: Int
      category_ratings_communications: Int
      category_ratings_location: Int
      category_ratings_checkin: Int
      category_ratings_value: Int
    }

    
  `)
}

// define schema for plugin option validation during configuration of plugin by user
exports.pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    GUESTY_API_KEY: Joi.string()
      .required()
      .description(`Used as username for basic auth token`)
      .messages({
        // Override the error message if the .required() call fails
        "any.required": `Your API key is incorrect, try checking https://support.guesty.com/kb/en/article/generating-an-internal-api-token for help`
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