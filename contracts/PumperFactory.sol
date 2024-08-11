// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "./PumperToken.sol";

contract PumperFactory {
    mapping(address => address[]) public deployedPumpTokens;

    event Buy(address indexed buyer, uint256 amount, uint256 price);
    event Sell(address indexed seller, uint256 amount, uint256 price);
    event LiquidtyDeployed(address indexed pool, uint256 x, uint256 y);

    modifier onlyPumperToken() {
        require(
            deployedPumpTokens[msg.sender].length > 0,
            "Only PumperToken can call this function"
        );
        _;
    }

    function createPumpToken(string memory name, string memory symbol) public {
        address newPumpToken = address(
            new PumperToken(name, symbol, address(this))
        );
        deployedPumpTokens[msg.sender].push(newPumpToken);
    }

    function getDeployedPumpTokens() public view returns (address[] memory) {
        return deployedPumpTokens[msg.sender];
    }

    function emitBuy(
        address buyer,
        uint256 amount,
        uint256 price
    ) public onlyPumperToken {
        emit Buy(buyer, amount, price);
    }

    function emitSell(
        address seller,
        uint256 amount,
        uint256 price
    ) public onlyPumperToken {
        emit Sell(seller, amount, price);
    }

    function emitLiquidtyDeployed(
        address pool,
        uint256 x,
        uint256 y
    ) public onlyPumperToken {
        emit LiquidtyDeployed(pool, x, y);
    }
}
