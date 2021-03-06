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

contract WebooMigrate is Context, Auth {
    using SafeMath for uint256;

    mapping(address => address) public tokenOwner;
    mapping(address => address) public tokenOwnerSwap;
    mapping(address => mapping(address => uint256)) private holderAmountSwap;
    mapping(address => mapping(address => uint256)) private holderClaim;
    mapping(address => uint256) public totalDeposit;
    mapping(address => uint256) public tokenBalanceLeft;
    mapping(address => uint256) public tokenBalanceSwapLeft;
    mapping(address => address) public pairForSwap;
    mapping(address => address) public addressForReceiveSwap;

    address ZERO = 0x0000000000000000000000000000000000000000;

    address public routerAddress;

    constructor(address _routerAddress) Auth(msg.sender){
        owner = msg.sender;
        routerAddress = _routerAddress;
    }

    /** Setting Owner Token */
    function setTokenOwner(address _token, address _owner) external authorized {
        tokenOwner[_token] = _owner;
    }

    function setTokenOwnerSwap(address _tokenDestination, address _owner) external authorized {
        tokenOwnerSwap[_tokenDestination] = _owner;
    }

    function setHolderAmount(address _token,address[] memory _holder,uint256[] memory _amount) external {
        require(tokenOwner[_token]==_msgSender(),"Unauthorize");
        require(_holder.length == _amount.length,"Holder and Amount need same length");

        for(uint i;i<_holder.length;i++){
            holderAmountSwap[_token][_holder[i]] = _amount[i];
            holderClaim[_token][_holder[i]] = 0;
            totalDeposit[_token] = totalDeposit[_token].add(_amount[i]);
        }
    }

    function setPairForSwap(address _tokenOrigin, address _tokenDestination) external {
        require(tokenOwnerSwap[_tokenDestination]==_msgSender(),"Unauthorize");
        pairForSwap[_tokenDestination] = _tokenOrigin;
    }

    function setAddressForReceiveSwap(address _tokenDestination, address _receiverAddress) external {
       require(tokenOwnerSwap[_tokenDestination]==_msgSender(),"Unauthorize");
       addressForReceiveSwap[_tokenDestination] = _receiverAddress; 
    }

    function deposit(address _token) external {
        require(tokenOwner[_token]==_msgSender(),"Unauthorize"); 
        uint256 _totalDeposit = totalDeposit[_token];
        IERC20(_token).transferFrom(_msgSender(),address(this),_totalDeposit);
        tokenBalanceLeft[_token] = tokenBalanceLeft[_token].add(_totalDeposit);
    }

    function depositForSwapToken(address _tokenDestination, uint256 _amount) external {
        require(tokenOwnerSwap[_tokenDestination]==_msgSender(),"Unauthorize");
        IERC20(_tokenDestination).transferFrom(_msgSender(), address(this), _amount);
        tokenBalanceSwapLeft[_tokenDestination] = tokenBalanceSwapLeft[_tokenDestination].add(_amount);
    }

    function withdrawl(address _token) external {
        require(tokenOwner[_token]==_msgSender(),"Unauthorize");
        uint256 balance = tokenBalanceLeft[_token];
        IERC20(_token).approve(_msgSender(),balance);
        IERC20(_token).transfer(_msgSender(),balance);
    }

    function withdrawlForSwap(address _tokenDestination) external {
        require(tokenOwnerSwap[_tokenDestination]==_msgSender(),"Unauthorize");
        uint256 balance = tokenBalanceSwapLeft[_tokenDestination];
        IERC20(_tokenDestination).approve(_msgSender(),balance);
        IERC20(_tokenDestination).transfer(_msgSender(),balance);
    }

    function balanceOf(address _token) public view returns(uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function claimToken(address _token, address _holder) external {
        require(holderAmountSwap[_token][_holder] > 0,"Holder amount is 0");

        uint256 amountSend = holderAmountSwap[_token][_holder].sub(holderClaim[_token][_holder]);
        
        IERC20(_token).approve(_holder,amountSend);
        IERC20(_token).transfer(_holder,amountSend);
        holderClaim[_token][_holder] = holderClaim[_token][_holder].add(amountSend);
        tokenBalanceLeft[_token] = tokenBalanceLeft[_token].sub(amountSend);
    }

    function getHolderAmount(address _token, address _holder) external view returns(uint256) {
        return holderAmountSwap[_token][_holder].sub(holderClaim[_token][_holder]);
    }


    function getTokenFromContract(address tokenAddress, address to, uint256 amount) external onlyOwner {
        try IERC20(tokenAddress).approve(to, amount) {} catch {}
        try IERC20(tokenAddress).transfer(to,amount) {} catch {}
    }
}
