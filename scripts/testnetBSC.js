const { MaxUint256 } = require('@ethersproject/constants');
const { web3, ethers } = require('hardhat');

const ROUTER_ADDRESS = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
const MIGRATION_ADDRESS = "0x7aC70e50E623ae9f3ABfaACDA5972332f57f766E";
const TOKEN_ADDRESS_ORIGIN = "0x44fD60dCA137eB0Df60221Eb971349f76166106b";
const TOKEN_ADDRESS_DESTINATION = "0x30e81acB53d1516E5daFf05422a6Ee1A72f3B93e";

const toHex = (addr) => {
  return web3.utils.toHex(addr);
}
const toWei = (ether)=>{
  return web3.utils.toWei(ether);
}
async function main(){
  const [deployer,deployer2,buyer1,buyer2,buyer3,buyer4] = await ethers.getSigners();

  console.log("> Start Deploying...");
  const WebooMigrateFactory = await ethers.getContractFactory("WebooMigrate");
  // const WebooMigrate = await WebooMigrateFactory.deploy(toHex(ROUTER_ADDRESS));
  const WebooMigrate = await ethers.getContractAt("WebooMigrate",toHex(MIGRATION_ADDRESS));
  console.log("> Address:",WebooMigrate.address);
  console.log("> Finish Deploying");

  console.log("> Set Owner Token...")
  await WebooMigrate.setTokenOwnerSwap(toHex(TOKEN_ADDRESS_DESTINATION),toHex(deployer2.address));
  console.log("Owner Token Destination:",await WebooMigrate.tokenOwnerSwap(toHex(TOKEN_ADDRESS_DESTINATION)))
  console.log("> Finish Set Owner Token")

  console.log("> Set Pair Token...")
  await WebooMigrate.connect(deployer2).setPairForSwap(toHex(TOKEN_ADDRESS_ORIGIN),toHex(TOKEN_ADDRESS_DESTINATION));
  console.log("> Finish Set Pair")

  console.log("> Set Address For Receive Swap")
  await WebooMigrate.connect(deployer2).setAddressForReceiveSwap(toHex(TOKEN_ADDRESS_DESTINATION),toHex(buyer1.address));
  console.log("> Finish Set Address")

  console.log("> Deposit For Swap")
  await WebooMigrate.connect(deployer2).depositForSwapToken(toHex(TOKEN_ADDRESS_DESTINATION),toWei("100000000"))
  console.log("> Finish Deposit For Swap")
}


main()
    .then(()=>process.exit(0))
    .catch((error)=>{
        console.error(error)
        process.exit(1)
    })