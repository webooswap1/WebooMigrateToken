// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWebooReward {
    function setShare(address account,uint256 amount) external;
    function migrate(address rewardAddress, uint256 gas) external;
    function setMigration(address account, uint256 totalExclude, uint256 totalClaimed) external;
    function distributeDividend() external;
    function claim(address account) external;
    function claimTo(address account, address targetToken) external;
    function claimTotalOf(address account) external returns(uint256);
    function deposit() external payable;
}