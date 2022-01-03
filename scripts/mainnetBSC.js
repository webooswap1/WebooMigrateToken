const { MaxUint256 } = require('@ethersproject/constants');
const { web3, ethers } = require('hardhat');

const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const MIGRATION_ADDRESS = "0xF90Fa4B72a29b7d511b25d9994c8FB0F5f5C716F";
const TOKEN_ADDRESS_ORIGIN = "0x9A093ddcaE05496a05aC76D96d49890b528C8CE0";
const TOKEN_ADDRESS_DESTINATION = "0x30e81acB53d1516E5daFf05422a6Ee1A72f3B93e";

const toHex = (addr) => {
  return web3.utils.toHex(addr);
}
const toWei = (ether)=>{
  return web3.utils.toWei(ether);
}
async function main(){
  const [deployer] = await ethers.getSigners();

  console.log("> Start Deploying...");
  const WebooMigrateFactory = await ethers.getContractFactory("WebooMigrate");
  // const WebooMigrate = await WebooMigrateFactory.deploy(toHex(ROUTER_ADDRESS));
  const WebooMigrate = await ethers.getContractAt("WebooMigrate",toHex(MIGRATION_ADDRESS));
  console.log("> Address:",WebooMigrate.address);
  console.log("> Finish Deploying");

  console.log("> Set Holder")
  const holder = require('../holder.json')
  const amount = require('../amount.json')
  let newAmount = [];

  let tmpAmount = [];
  let tmpAddress = [];
  let tmpNo = 1;
  let noLoop = 1;
  for(let i=0;i<amount.length;i++){
    let a = (toWei((amount[i]).replace(/,/g, '.')));
    let addr = holder[i];
    tmpAmount.push(a);
    tmpAddress.push(addr);
    tmpNo++;
    if(tmpNo == 10){
      console.log("Deploy ",noLoop)
      tmpNo = 1;
      await WebooMigrate.setHolderAmount(toHex(TOKEN_ADDRESS_ORIGIN),tmpAddress, tmpAmount).then(res=>{
        console.log(res)
      }).catch(e=>{
        console.error(e)
      });
      tmpAmount = [];
      tmpAddress = [];
      noLoop++;
    }
  }
  if(tmpAmount.length > 0) {
    console.log("Deploy ",(noLoop+1))
    await WebooMigrate.setHolderAmount(toHex(TOKEN_ADDRESS_ORIGIN),tmpAddress, tmpAmount).then(res=>{
      console.log(res)
    }).catch(e=>{
      console.error(e)
    });
  }
}


main()
    .then(()=>process.exit(0))
    .catch((error)=>{
        console.error(error)
        process.exit(1)
    })