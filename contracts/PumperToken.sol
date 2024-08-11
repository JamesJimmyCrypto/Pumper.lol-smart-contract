// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IFactory} from "./interfaces/sailfish/IFactory.sol";
import {IVault} from "./interfaces/sailfish/IVault.sol";
import "./PumperFactory.sol";
import "./libs/Token.sol";

contract PumperToken is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public traders;

    uint256 public liqCap = 0.1 ether; //When Liquidty crosses 1 EDU deploy on DEX

    uint256 public x;
    uint256 public y = 1 gwei; //Starting EDU virtual Balance
    uint256 public k;

    uint256 currentPrice;

    PumperFactory pumperFactory;

    address sailFishStablePoolFactory =
        0x1C9f7def9b509D0d64a2adCe6f73F235147aB7f1;
    address sailFishVault = 0xB97582DCB6F2866098cA210095a04dF3e11B76A6;

    constructor(
        string memory name,
        string memory symbol,
        address _pumperFactory
    ) ERC20(name, symbol) Ownable(msg.sender) {
        x = 1_000_000_000 * 1 ether;
        _mint(address(this), x);
        k = x * y;
        pumperFactory = PumperFactory(_pumperFactory);
    }

    function buyX() public payable {
        require(msg.value > 0, "Invalid amount");

        uint256 amount = _getPriceX(msg.value);

        transfer(msg.sender, amount);

        x = x - amount;
        y = y + msg.value;

        if (y >= liqCap) {
            _deployLiquidty();
        }

        pumperFactory.emitBuy(msg.sender, amount, msg.value);
    }

    function _deployLiquidty() internal {
        IFactory(sailFishStablePoolFactory).deploy(
            NATIVE_TOKEN,
            toToken(IERC20(this))
        ); //EDU-{address(this).name()} pair
        _approve(address(this), sailFishVault, type(uint256).max);
        IVault(sailFishVault).addLiquidity{value: y}(
            address(0),
            address(this),
            false,
            address(this).balance,
            x,
            0,
            0,
            address(this),
            type(uint256).max
        );

        pumperFactory.emitLiquidtyDeployed(address(this), x, y);
    }

    function sellY(uint256 amount) public {
        require(amount > 0, "Invalid amount");

        uint256 price = _getPriceY(amount);

        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        transferFrom(msg.sender, address(this), amount);

        x = x + price;
        y = y - amount;

        payable(msg.sender).transfer(price);

        pumperFactory.emitSell(msg.sender, amount, price);
    }

    function getTokenPriceX(uint256 amount) public view returns (uint256) {
        return _getPriceX(amount);
    }

    function getTokenPriceY(uint256 amount) public view returns (uint256) {
        return _getPriceY(amount);
    }

    function _getPriceX(uint256 amount) internal view returns (uint256) {
        unchecked {
            return (k / y) * amount;
        }
    }

    function _getPriceY(uint256 amount) internal view returns (uint256) {
        unchecked {
            return (k / x) * amount;
        }
    }
}
