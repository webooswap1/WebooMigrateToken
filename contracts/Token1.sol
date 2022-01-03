// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token1 is ERC20 {

    uint256 private _totalSupply = 1_000_000_000 * (10**18);
    mapping(address => bool) public isFeeExempt;
    constructor() ERC20("Token1", "Token2") {
        _mint(msg.sender, _totalSupply);
    }

    function setIsFeeExempt(address holder, bool exempt) external{
        isFeeExempt[holder] = exempt;
    }
}