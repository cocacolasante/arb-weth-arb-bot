require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      forking: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ABRITRUM_API_KEY}`,
      }
    },
    arbitrum:{
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ABRITRUM_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
