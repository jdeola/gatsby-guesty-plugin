const {createNodeHelpers} = require('gatsby-node-helpers');

const {
  createNodeFactory,
  generateNodeId,
} = createNodeHelpers({
  typePrefix: `Guesty`,
})

const LISTINGS_TYPE = `Listings`
const FINANCIALS_TYPE = `Reviews`

module.exports.listingNode = createNodeFactory(LISTINGS_TYPE, listing => {
  if (listing.fiancials) {
    const financials = listing.financials.map(financial => financial)
    listing.children = financials.map(financials =>
      generateNodeId(FINANCIALS_TYPE, `financials_${listing._id}`),
    )
  }
  return listing 
})

module.exports.financialsNode = createNodeFactory(FINANCIALS_TYPE, node => {
  return node
})