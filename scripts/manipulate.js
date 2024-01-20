require("dotenv").config()

const hre = require("hardhat")

// -- IMPORT HELPER FUNCTIONS & CONFIG -- //
const { getTokenAndContract, getPairContract, calculatePrice } = require('../helpers/helpers')
const { provider, uFactory, uRouter, sFactory, sRouter } = require('../helpers/initialization.js')

// -- CONFIGURE VALUES HERE -- //
const V2_FACTORY_TO_USE = uFactory
const V2_ROUTER_TO_USE = uRouter



const UNLOCKED_ACCOUNT = '0xdEAD000000000000000042069420694206942069' // SHIB account to impersonate 
// const UNLOCKED_ACCOUNT = '0x9Bb75183646e2A0DC855498bacD72b769AE6ceD3' // LDO account to impersonate 
// const UNLOCKED_ACCOUNT = '0x976A66BD0AA955924Ae47769Ab13B00004d3b8d6' // DYDX account to impersonate 
// const AMOUNT = '43500000000000' // 40,500,000,000,000 SHIB -- Tokens will automatically be converted to wei
// const AMOUNT = '1600000' // 7000000 LDO -- Tokens will automatically be converted to wei
// const AMOUNT = '700000' // 7000000 DYDX -- Tokens will automatically be converted to wei
const AMOUNT = '19000' // 7000000 ape -- Tokens will automatically be converted to wei

async function main() {
  // Fetch contracts
  const {
    token0Contract,
    token1Contract,
    token0: ARB_AGAINST,
    token1: ARB_FOR
  } = await getTokenAndContract(process.env.ARB_AGAINST, process.env.ARB_FOR, provider)

  const pair = await getPairContract(V2_FACTORY_TO_USE, ARB_AGAINST.address, ARB_FOR.address, provider)

  // Fetch price of SHIB/WETH before we execute the swap
  const priceBefore = await calculatePrice(pair)

  await manipulatePrice([ARB_AGAINST, ARB_FOR], token0Contract)

  // Fetch price of SHIB/WETH after the swap
  const priceAfter = await calculatePrice(pair)

  const symbol = await token0Contract.symbol()

  const data = {
    'Price Before': `1 WETH = ${Number(priceBefore).toFixed(0)} ${symbol}`,
    'Price After': `1 WETH = ${Number(priceAfter).toFixed(0)} ${symbol}`,
  }

  console.table(data)
}

async function manipulatePrice(_path, _token0Contract) {
  console.log(`\nBeginning Swap...\n`)

  console.log(`Input Token: ${_path[0].symbol}`)
  console.log(`Output Token: ${_path[1].symbol}\n`)

  const amount = hre.ethers.parseUnits(AMOUNT, 'ether')
  const path = [_path[0].address, _path[1].address]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [UNLOCKED_ACCOUNT],
  })

  const signer = await hre.ethers.getSigner(UNLOCKED_ACCOUNT)

  
  const approval = await _token0Contract.connect(signer).approve(await V2_ROUTER_TO_USE.getAddress(), amount, { gasLimit: 50000 })
  await approval.wait()
  console.log("APPROVED")

  console.log(await _token0Contract.allowance(signer.address, await V2_ROUTER_TO_USE.getAddress()))
  console.log(await _token0Contract.balanceOf(signer.address))
  console.log(await _token0Contract.getAddress())

  const swap = await V2_ROUTER_TO_USE.connect(signer).swapExactTokensForTokens(amount, 0, path, UNLOCKED_ACCOUNT, deadline, { gasLimit: 250000 })
  await swap.wait()

  console.log(`Swap Complete!\n`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
