const { MaxUint256 } = require('@ethersproject/constants');
const { web3, ethers } = require('hardhat');
const toHex = (addr) => {
  return web3.utils.toHex(addr);
}
const toWei = (ether)=>{
  return web3.utils.toWei(ether);
}
const MIGRATE_ADDRESS = "0xAea694Ba5b955d418B55d6B93aDD7CBD95F8FA6A";
async function main(){
  const [deployer] = await ethers.getSigners();
  console.log("> Deployer Address",deployer.address);
  console.log("> Deployer Balance",web3.utils.fromWei(await web3.eth.getBalance(deployer.address)).toString());
  const WebooMigrate = await ethers.getContractAt("WebooMigrateWithSwapV1",MIGRATE_ADDRESS);
  console.log("> Setting Holder");

  console.log("> Start Set Holder");
  const holder = require('../holderSwap.json')
  const amount = require('../amountSwap.json')

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
      await WebooMigrate.setHolderAmount(tmpAddress, tmpAmount).then(res=>{
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
    await WebooMigrate.setHolderAmount(tmpAddress, tmpAmount).then(res=>{
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