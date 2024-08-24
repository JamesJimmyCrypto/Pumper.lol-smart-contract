// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "./PumperToken.sol";

contract PumperFactory {
    mapping(address => address[]) public deployedPumpTokens;

    event Buy(
        address indexed token,
        address indexed buyer,
        uint256 amount,
        uint256 price
    );
    event Sell(
        address indexed token,
        address indexed seller,
        uint256 amount,
        uint256 price
    );

    event LiquidtyDeployed(
        address indexed token,
        address indexed pool,
        uint256 x,
        uint256 y
    );
    event NewPumpToken(address indexed creator, address indexed token);

    modifier onlyPumperToken() {
        require(
            deployedPumpTokens[msg.sender].length > 0,
            "Only PumperToken can call this function"
        );
        _;
    }

    function createPumpToken(
        string memory name,
        string memory symbol
    ) public returns (address) {
        address newPumpToken = address(
            new PumperToken{
                salt: bytes32(deployedPumpTokens[msg.sender].length)
            }(name, symbol, address(this))
        );
        deployedPumpTokens[msg.sender].push(newPumpToken);

        emit NewPumpToken(msg.sender, newPumpToken);

        return address(newPumpToken);
    }

    function getAddressBeforeDeployment(
        bytes memory _bytecode,
        uint256 _salt
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(_bytecode)
            )
        );

        return address(uint160(uint(hash)));
    }

    function getBytecode(
        string memory name,
        string memory symbol
    ) public view returns (bytes memory) {
        bytes memory bytecode = type(PumperToken).creationCode;

        return
            abi.encodePacked(bytecode, abi.encode(name, symbol, address(this)));
    }

    function getDeployedPumpTokensLen(
        address _creator
    ) public view returns (uint256) {
        return deployedPumpTokens[_creator].length;
    }

    function getDeployedPumpTokens(
        address _creator
    ) public view returns (address[] memory) {
        return deployedPumpTokens[_creator];
    }

    function emitBuy(uint256 amount, uint256 price) external {
        emit Buy(msg.sender, tx.origin, amount, price);
    }

    function emitSell(uint256 amount, uint256 price) external {
        emit Sell(msg.sender, tx.origin, amount, price);
    }

    function emitLiquidtyDeployed(address pool, uint256 x, uint256 y) external {
        emit LiquidtyDeployed(msg.sender, pool, x, y);
    }
}
