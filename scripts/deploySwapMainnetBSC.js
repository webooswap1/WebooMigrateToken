const { MaxUint256 } = require('@ethersproject/constants');
const { web3, ethers } = require('hardhat');
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const TOKEN_ADDRESS_ORIGIN = "0xa4980DE6Bd874FdE42ff34e97C8A7c5cA31B25A7";
const TOKEN_ADDRESS_DESTINATION = "0x9A093ddcaE05496a05aC76D96d49890b528C8CE0";


const toHex = (addr) => {
  return web3.utils.toHex(addr);
}
const toWei = (ether)=>{
  return web3.utils.toWei(ether);
}

async function main(){
  const [deployer] = await ethers.getSigners();
  console.log("> Deployer Address",deployer.address);
  console.log("> Deployer Balance",web3.utils.fromWei(await web3.eth.getBalance(deployer.address)).toString());
  console.log("> Deploying Contract");
  const ContractFactory = await ethers.getContractFactory("WebooMigrateWithSwapV1");
  const ContractMigrate = await ContractFactory.deploy(toHex(ROUTER_ADDRESS),toHex(TOKEN_ADDRESS_ORIGIN),toHex(TOKEN_ADDRESS_DESTINATION));
  console.log("> Contract Address",ContractMigrate.address);

}

main()
    .then(()=>process.exit(0))
    .catch((error)=>{
        console.error(error)
        process.exit(1)
    })