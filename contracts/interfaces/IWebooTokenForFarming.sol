// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWebooTokenForFarming {
    function addLiquidityETH(uint256 webooAmount, address recipient) external payable returns(uint256, uint256, uint256);
    //bugs Stack Too Deep when using returns
    function addLiquidityToken(address tokenAddress, uint256 webooAmount, uint256 tokenAmount, address recipient) external;
    function removeLiquidityETH(uint256 amountLiquidity, address recipient) external returns(uint256,uint256);
    function removeLiquidityToken(address tokenAddress, uint256 amountLiquidity, address recipient) external returns(uint256,uint256);
}