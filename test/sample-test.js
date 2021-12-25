const { expect } = require('chai');
const { MaxUint256 } = require('@ethersproject/constants')
const { BigNumber } = require('ethers');

describe("Testing WebooMigrate", async () =>{
  let webooMigrate, token1, token2, deployer, addr1, addr2, addr3, holder1, holder2, holder3;

  beforeEach(async()=>{
      [deployer, addr1,addr2,addr3,holder1,holder2,holder3,_] = await ethers.getSigners();

      const WebooMigrate = await ethers.getContractFactory("WebooMigrate");
      webooMigrate =  await WebooMigrate.deploy();

      const Token1 = await ethers.getContractFactory("Token1");
      token1 = await Token1.deploy();

      const Token2 = await ethers.getContractFactory("Token2");
      token2 = await Token1.deploy();

      await token1.transfer(addr1.address,web3.utils.toWei("1000000000"));
      await token2.transfer(addr2.address,web3.utils.toWei("1000000000"));
  });

  describe("Testing Whitelist Holder", async() => {
    const setTokenOwner = async() => {
      await webooMigrate.setTokenOwner(token1.address,addr1.address);
      await webooMigrate.setTokenOwner(token2.address,addr2.address);
    }

    const holderAmount = () => {
      const amountHolder1 = 1 + Math.floor(Math.random() * 101);
      const amountHolder2 = 1 + Math.floor(Math.random() * 101);
      const amountHolder3 = 1 + Math.floor(Math.random() * 101);

      return {
        holder: [
          holder1.address,
          holder2.address,
          holder3.address
        ],
        amount: [
          web3.utils.toWei(amountHolder1.toString(),"ether"),
          web3.utils.toWei(amountHolder2.toString(),"ether"),
          web3.utils.toWei(amountHolder3.toString(),"ether"),
        ],
        totalAmountWei: web3.utils.toWei((amountHolder1+amountHolder2+amountHolder3).toString(),"ether"),
        totalAmount: (amountHolder1+amountHolder2+amountHolder3).toString()
      }
    }

    beforeEach(async()=>{
      await setTokenOwner();
    })

    it("Test Set Token Owner", async () => {
      expect(await webooMigrate.tokenOwner(token1.address)).to.equal(addr1.address);
      expect(await webooMigrate.tokenOwner(token2.address)).to.equal(addr2.address);
    });

    it("Test Add Holder And Check Total Deposit", async () => {
      let dataAmount = holderAmount();
      // await webooMigrate.setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      await webooMigrate.connect(addr1).setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      await webooMigrate.connect(addr2).setHolderAmount(token2.address,dataAmount.holder,dataAmount.amount);
      
      expect(await webooMigrate.totalDeposit(token1.address)).to.equal(dataAmount.totalAmountWei);
      expect(await webooMigrate.totalDeposit(token2.address)).to.equal(dataAmount.totalAmountWei);
      await expect(webooMigrate.setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount)).to.be.reverted;
    });

    it("Test Add Holder And Check Holder Ownership", async () => {
      let dataAmount = holderAmount();

      await webooMigrate.connect(addr1).setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      
      expect(await webooMigrate.getHolderAmount(token1.address,holder1.address)).to.equal(dataAmount.amount[0])
      expect(await webooMigrate.getHolderAmount(token1.address,holder2.address)).to.equal(dataAmount.amount[1])
      expect(await webooMigrate.getHolderAmount(token1.address,holder3.address)).to.equal(dataAmount.amount[2])
    });

    it("Test Add Holder And Deposit", async () => {
      let dataAmount = holderAmount();
      let dataAmount2 = holderAmount();

      await webooMigrate.connect(addr1).setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      await webooMigrate.connect(addr2).setHolderAmount(token2.address,dataAmount2.holder,dataAmount2.amount);
      
      await token1.connect(addr1).approve(webooMigrate.address,dataAmount.totalAmountWei);
      await webooMigrate.connect(addr1).deposit(token1.address);

      await token2.connect(addr2).approve(webooMigrate.address,dataAmount2.totalAmountWei);
      await webooMigrate.connect(addr2).deposit(token2.address);

      expect((await token1.balanceOf(webooMigrate.address)).toString()).to.equal(dataAmount.totalAmountWei)
      expect((await token2.balanceOf(webooMigrate.address)).toString()).to.equal(dataAmount2.totalAmountWei)
    });

    it("Test Add Holder and Claim Token", async() => {
      let dataAmount = holderAmount();
      let dataAmount2 = holderAmount();

      await webooMigrate.connect(addr1).setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      await webooMigrate.connect(addr2).setHolderAmount(token2.address,dataAmount2.holder,dataAmount2.amount);
      
      await token1.connect(addr1).approve(webooMigrate.address,dataAmount.totalAmountWei);
      await webooMigrate.connect(addr1).deposit(token1.address);

      await token2.connect(addr2).approve(webooMigrate.address,dataAmount2.totalAmountWei);
      await webooMigrate.connect(addr2).deposit(token2.address);

      // Claim Token
      await webooMigrate.connect(holder1).claimToken(token1.address,holder1.address);
      await webooMigrate.claimToken(token1.address,holder2.address);
      await webooMigrate.claimToken(token1.address,holder3.address);

      await webooMigrate.claimToken(token2.address,holder1.address);
      await webooMigrate.claimToken(token2.address,holder2.address);
      await webooMigrate.claimToken(token2.address,holder3.address);

      expect(await token1.balanceOf(holder1.address)).to.equal(dataAmount.amount[0])
      expect(await token1.balanceOf(holder2.address)).to.equal(dataAmount.amount[1])
      expect(await token1.balanceOf(holder3.address)).to.equal(dataAmount.amount[2])
      expect(await token1.balanceOf(webooMigrate.address)).to.equal("0")

      expect(await token2.balanceOf(holder1.address)).to.equal(dataAmount2.amount[0])
      expect(await token2.balanceOf(holder2.address)).to.equal(dataAmount2.amount[1])
      expect(await token2.balanceOf(holder3.address)).to.equal(dataAmount2.amount[2])
      expect(await token2.balanceOf(webooMigrate.address)).to.equal("0")

      expect(await webooMigrate.getHolderAmount(token1.address,holder1.address)).to.equal("0")
      expect(await webooMigrate.getHolderAmount(token1.address,holder2.address)).to.equal("0")
      expect(await webooMigrate.getHolderAmount(token1.address,holder3.address)).to.equal("0")

      expect(await webooMigrate.getHolderAmount(token2.address,holder1.address)).to.equal("0")
      expect(await webooMigrate.getHolderAmount(token2.address,holder2.address)).to.equal("0")
      expect(await webooMigrate.getHolderAmount(token2.address,holder3.address)).to.equal("0")

      // Claim Token After Claim
      await webooMigrate.claimToken(token1.address,holder1.address);
      await webooMigrate.claimToken(token1.address,holder2.address);
      await webooMigrate.claimToken(token1.address,holder3.address);

      expect(await token1.balanceOf(holder1.address)).to.equal(dataAmount.amount[0])
      expect(await token1.balanceOf(holder2.address)).to.equal(dataAmount.amount[1])
      expect(await token1.balanceOf(holder3.address)).to.equal(dataAmount.amount[2])
    })

    it("Test Add Holder and Some User Claim, Then Withdrawl", async()=>{
      let dataAmount = holderAmount();
      let dataAmount2 = holderAmount();

      await webooMigrate.connect(addr1).setHolderAmount(token1.address,dataAmount.holder,dataAmount.amount);
      await webooMigrate.connect(addr2).setHolderAmount(token2.address,dataAmount2.holder,dataAmount2.amount);
      
      await token1.connect(addr1).approve(webooMigrate.address,dataAmount.totalAmountWei);
      await webooMigrate.connect(addr1).deposit(token1.address);

      await token2.connect(addr2).approve(webooMigrate.address,dataAmount2.totalAmountWei);
      await webooMigrate.connect(addr2).deposit(token2.address);

      // Claim Token
      await webooMigrate.claimToken(token1.address,holder1.address);
      await webooMigrate.claimToken(token1.address,holder2.address);

      expect(await token1.balanceOf(webooMigrate.address)).to.equal(dataAmount.amount[2]);
      const balanceBeforeWd = await token1.balanceOf(addr1.address);
      const balanceMigrateLeft = await token1.balanceOf(webooMigrate.address);
      const balanceShould = balanceBeforeWd.add(balanceMigrateLeft);
      
      // if not owner, then reverted
      await expect(webooMigrate.withdrawl(token1.address)).to.be.reverted;
      await expect(webooMigrate.connect(addr2).withdrawl(token1.address)).to.be.reverted;

      await webooMigrate.connect(addr1).withdrawl(token1.address);

      expect(await token1.balanceOf(webooMigrate.address)).to.equal("0")
      expect(await token1.balanceOf(addr1.address)).to.equal(balanceShould)
    })
  })

  describe("Testing Swap Token", async()=>{
    const setTokenOwner = async() => {
      await webooMigrate.setTokenOwnerSwap(token1.address,addr1.address);
      await webooMigrate.setTokenOwnerSwap(token2.address,addr2.address);
    }
    beforeEach(async()=>{
      await setTokenOwner();
    })
    it("Test Set Token Owner", async()=>{
      expect(await webooMigrate.tokenOwnerSwap(token1.address)).to.equal(addr1.address);
      expect(await webooMigrate.tokenOwnerSwap(token2.address)).to.equal(addr2.address);
    })

    it("Test Set Pair", async()=>{
      await expect(webooMigrate.setPairForSwap(token1.address,token2.address)).to.be.reverted;

      await webooMigrate.connect(addr2).setPairForSwap(token1.address,token2.address);      
      expect(await webooMigrate.pairForSwap(token2.address)).to.equal(token1.address)
    })

    it("Test Deposit", async()=>{
      const amountSend = web3.utils.toWei("1000","ether")
      await token1.connect(addr1).transfer(addr2.address,amountSend);
      await expect(webooMigrate.connect(addr2).depositForSwapToken(token1.address)).to.be.reverted;

      await token1.connect(addr1).approve(webooMigrate.address,amountSend)
      await webooMigrate.connect(addr1).depositForSwapToken(token1.address,amountSend)
      expect(await token1.balanceOf(webooMigrate.address)).to.equal(amountSend)
    })

    it("Test Swap For Claim", async()=>{
      const amountSend = web3.utils.toWei("1000","ether")
      await token2.connect(addr2).approve(webooMigrate.address,amountSend)
      await webooMigrate.connect(addr2).depositForSwapToken(token2.address,amountSend)
      expect(await token2.balanceOf(webooMigrate.address)).to.equal(amountSend)

      //swap token
      const amountSwap = web3.utils.toWei("100","ether");
      const amountContractAfterSwap = web3.utils.toWei("900","ether");
      const amountUserOriginAfterSwap = (await token1.balanceOf(addr1.address)).sub(amountSwap);
      // console.log(amountUserOriginAfterSwap);
      await expect(webooMigrate.connect(addr2).swapForOneToOneTokenThenBurnTokenOrigin(token1.address,token2.address,amountSwap)).to.be.reverted

      await webooMigrate.connect(addr2).setPairForSwap(token1.address,token2.address); 
      await token1.connect(addr1).approve(webooMigrate.address,amountSwap);
      await webooMigrate.connect(addr1).swapForOneToOneTokenThenBurnTokenOrigin(token1.address,token2.address,amountSwap)

      expect(await token2.balanceOf(addr1.address)).to.equal(amountSwap);
      expect(await token2.balanceOf(webooMigrate.address)).to.equal(amountContractAfterSwap);
      expect(await token1.balanceOf(addr1.address)).to.equal(amountUserOriginAfterSwap)
    });
  });
});
