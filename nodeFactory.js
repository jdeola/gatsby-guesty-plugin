const {createNodeHelpers} = require('gatsby-node-helpers');

const {
  createNodeFactory,
  generateNodeId,
} = createNodeHelpers({
  typePrefix: `GuestyListings`,
})


module.exports.listingNode = createNodeFactory('listing', node => {
  if (node.reviews) {
    const reviews = node.reviews.map(review => review)
    node.children = reviews.map(review =>
      generateNodeId(REVIEW_TYPE, review.time),
    )
  }
  return node 
})

module.exports.reviewNode = createNodeFactory('listing-review', node => {
  return node
})