
// This is an example using Jest (https://jestjs.io/)
import { testPluginOptionsSchema } from "gatsby-plugin-utils"
import { pluginOptionsSchema } from "../gatsby-node"

// check if pluginOptions are of type string 
describe(`pluginOptionsSchema`, () => {
  it(`should invalidate incorrect options based on data type`, async () => {
    const options = {
      GUESTY_API_KEY: true, // Should be a string
      GUESTY_API_SECRET: null // Should be a string
    }
    const { isValid, errors } = await testPluginOptionsSchema(
      pluginOptionsSchema,
      options
    )
    expect(isValid).toBe(false)
    expect(errors).toEqual([
      `"GUESTY_API_KEY" is required`,
      `"GUESTY_API_SECRET" is required`,
    ])
  })
  it(`should validate correct options based on value type`, async () => {
    const options = {
        GUESTY_API_KEY: "user API key",
        GUESTY_API_SECRET: "user API secret"
    }
    const { isValid, errors } = await testPluginOptionsSchema(
      pluginOptionsSchema,
      options
    )
    expect(isValid).toBe(true)
    expect(errors).toEqual([])
  })
})

// check if response from Guesty API is status: 200 OK 
// when credentials are checked on preInit?

