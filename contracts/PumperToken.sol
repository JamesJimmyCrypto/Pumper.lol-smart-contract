// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/sailfish/IFactory.sol";
import {IVault} from "./interfaces/sailfish/IVault.sol";
import "./PumperFactory.sol";
import "./libs/Token.sol";
import "hardhat/console.sol";

contract PumperToken is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public traders;

    uint256 public liqCap = 10.05 ether; //When Liquidty crosses 10.05 EDU deploy on DEX

    uint256 public x;
    uint256 public y = 10 ether; //Starting EDU virtual Balance
    uint256 public k;

    uint256 currentPrice;

    address pumperFactory;

    address sailFishStablePoolFactory =
        0x1CcC7382d46313C24e1D13510B1C9445A792f4d4;
    address sailFishVault = 0xB97582DCB6F2866098cA210095a04dF3e11B76A6;

    string public constant TYPE = "PumperToken";

    bool public deployed = false;

    uint256 public circulatingSupply = 0;

    constructor(
        string memory name,
        string memory symbol,
        address _pumperFactory
    ) ERC20(name, symbol) Ownable(msg.sender) {
        x = 1_000_000_000 * 1 ether;
        _mint(address(this), x);
        unchecked {
            k = x * y;
        }

        pumperFactory = _pumperFactory;
    }

    //Swap fee is Zero for now
    function buyX() public payable {
        require(msg.value > 0, "Invalid amount");
        require(deployed == false, "Liquidity already deployed");

        uint256 out = getTokenOutputX(msg.value);

        unchecked {
            y += msg.value;
            x -= out;
        }

        if (y >= liqCap) {
            _deployLiquidty();
        }

        address(pumperFactory).call(
            abi.encodeWithSignature(
                "emitBuy(address,uint256,uint256)",
                msg.sender,
                out,
                msg.value
            )
        );

        _transfer(address(this), msg.sender, out);

        circulatingSupply += out;
    }

    function _deployLiquidty() internal {
        address pair = IFactory(sailFishStablePoolFactory).deploy(
            NATIVE_TOKEN,
            toToken(IERC20(address(this)))
        ); //Example. EDU-{address(this).name()} pair

        _approve(address(this), sailFishVault, type(uint256).max);

        uint256 yLiq = y - 10 ether; //subtract starting virtual balance of 10 EDU
        IVault(sailFishVault).addLiquidity{value: yLiq}(
            address(this),
            address(0),
            false,
            address(this).balance,
            yLiq,
            0,
            0,
            address(this),
            type(uint256).max
        );

        address(pumperFactory).call(
            abi.encodeWithSignature(
                "emitLiquidtyDeployed(address,uint256,uint256)",
                pair,
                x,
                y
            )
        );

        deployed = true;
    }

    function sellY(uint256 amount) public {
        require(amount > 0, "Invalid amount");
        require(deployed == false, "Liquidity already deployed");

        uint256 out = getTokenOutputY(amount);

        unchecked {
            x += amount;
            y -= out;
        }

        address(pumperFactory).call(
            abi.encodeWithSignature(
                "emitSell(address,uint256,uint256)",
                msg.sender,
                amount,
                out
            )
        );

        payable(msg.sender).transfer(out);

        circulatingSupply -= amount;
    }

    function getTokenOutputX(uint256 yAmount) public view returns (uint256) {
        unchecked {
            uint256 ep = k / (y + yAmount);

            return x - ep;
        }
    }

    function getTokenOutputY(uint256 xAmount) public view returns (uint256) {
        unchecked {
            uint256 ep = (k / (x + xAmount));

            return y - ep;
        }
    }
}
