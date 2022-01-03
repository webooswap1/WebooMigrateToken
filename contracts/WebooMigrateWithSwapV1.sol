//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";


abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}
abstract contract Auth {
    address internal owner;
    mapping(address => bool) internal authorizations;

    constructor(address _owner) {
        owner = _owner;
        authorizations[_owner] = true;
    }

    modifier onlyOwner() {
        require(isOwner(msg.sender), "!OWNER");
        _;
    }

    modifier authorized() {
        require(isAuthorized(msg.sender), "!AUTHORIZED");
        _;
    }

    function authorize(address adr) public onlyOwner {
        authorizations[adr] = true;
    }

    function unauthorize(address adr) public onlyOwner {
        authorizations[adr] = false;
    }

    function isOwner(address account) public view returns (bool) {
        return account == owner;
    }

    function isAuthorized(address adr) public view returns (bool) {
        return authorizations[adr];
    }

    function transferOwnership(address payable adr) public onlyOwner {
        owner = adr;
        authorizations[adr] = true;
        emit OwnershipTransferred(adr);
    }

    function _getOwner() public view returns (address) {
        return owner;
    }

    event OwnershipTransferred(address owner);
}
library SafeMath {
    function tryAdd(uint256 a, uint256 b)
        internal
        pure
        returns (bool, uint256)
    {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    function trySub(uint256 a, uint256 b)
        internal
        pure
        returns (bool, uint256)
    {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    function tryMul(uint256 a, uint256 b)
        internal
        pure
        returns (bool, uint256)
    {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    function tryDiv(uint256 a, uint256 b)
        internal
        pure
        returns (bool, uint256)
    {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    function tryMod(uint256 a, uint256 b)
        internal
        pure
        returns (bool, uint256)
    {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

interface IWebooOld {
    function setIsFeeExempt(address holder, bool exempt) external;
}
 
contract WebooMigrateWithSwapV1 is Context, Auth {
    using SafeMath for uint256;

    mapping(address => uint256) private holderClaim;
    mapping(address => uint256) private holderAmount;
    uint256 public totalDeposit;
    uint256 public tokenBalanceLeft;
    address public tokenOrigin;
    address public tokenDestination;
    

    address ZERO = 0x0000000000000000000000000000000000000000;

    address public routerAddress;

    constructor(address _routerAddress, address _tokenOrigin, address _tokenDestination) Auth(msg.sender){
        owner = msg.sender;
        routerAddress = _routerAddress;
        tokenOrigin = _tokenOrigin;
        tokenDestination = _tokenDestination;
    }

    receive() external payable {}

    function setHolderAmount(address[] memory _holder,uint256[] memory _amount) external onlyOwner {
        require(_holder.length == _amount.length,"Holder and Amount need same length");

        for(uint i;i<_holder.length;i++){
            holderAmount[_holder[i]] = _amount[i];
            totalDeposit = totalDeposit.add(_amount[i]);
        }
    }

    function resetHolderClaim(address _holder, uint256 _amount) external onlyOwner {
        holderClaim[_holder] = _amount;
    }

    function deposit() external onlyOwner{
        IERC20(tokenDestination).transferFrom(_msgSender(),address(this),totalDeposit);
    }

    function claimToken(address _holder) external {
        require(holderAmount[_holder] > 0,"Holder amount is 0");
        uint256 amountSend = holderAmount[_holder].sub(holderClaim[_holder]);
        uint256 balanceBefore = IERC20(tokenOrigin).balanceOf(address(this));
        /** 1. Update set exempt fee untuk holder */
        IWebooOld(tokenOrigin).setIsFeeExempt(_holder,true);

        /** 2. Send V1 */
        IERC20(tokenOrigin).transferFrom(_holder, address(this), amountSend);
        uint256 balanceAfter = IERC20(tokenOrigin).balanceOf(address(this));
        uint256 balanceDiff = balanceAfter.sub(balanceBefore);

        /** 3. Send V2 */
        IERC20(tokenDestination).transfer(_holder,amountSend);
        holderClaim[_holder] = holderClaim[_holder].add(amountSend);

        /** 4. Swap v1 to v2 token and send to dev */
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);
        IERC20(tokenOrigin).approve(routerAddress,amountSend);
        address[] memory path = new address[](3);
        path[0] = tokenOrigin;
        path[1] = router.WETH();
        path[2] = tokenDestination;
        uint256[] memory estimate = router.getAmountsOut(balanceDiff,path);
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            balanceDiff,
            estimate[1],
            path,
            address(this), // wallet owner
            block.timestamp
        );
    }

    function getHolderAmount(address _holder) external view returns(uint256) {
        return holderAmount[_holder].sub(holderClaim[_holder]);
    }

    function getTokenFromContract(address tokenAddress, address to, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(to,amount);
    }

    function getETH(address to, uint256 amount) external onlyOwner{
        if(address(this).balance >= amount){
            payable(to).transfer(amount);
        }
    }
}
