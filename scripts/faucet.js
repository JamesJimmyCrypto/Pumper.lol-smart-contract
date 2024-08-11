const { ethers } = require("hardhat");
require("dotenv").config();

const transferAbi = ["function transfer(address to, uint256 value) returns (bool)"];
const walletPrivateKey = new ethers.Wallet(process.env.walletPrivateKey);
// RPC URL: https://sepolia.blast.io is provider URL, so put it in .env file
const provider = new ethers.JsonRpcProvider(process.env.rpcUrl);
const wallet = walletPrivateKey.connect(provider);
const usdcContract = await ethers.getContractAt(transferAbi, process.env.usdcContract, wallet);
const sailContract = await ethers.getContractAt(transferAbi, process.env.sailContract, wallet);
const veSailContract = await ethers.getContractAt(transferAbi, process.env.veSailContract, wallet);

/**
 * A faucet is simply a contract that sends some tokens to an address for test purposes
 *
 * This fauce sends 0.001 EDU, 100 USDC, 100 SAIL, 100 veSAIL to the address
 * Here we are using the wallet  to send the tokens
 * @param {*} address
 */
const faucet = async (address) => {
    try {
        await usdcContract.transfer(address, ethers.utils.parseUnits("100", 18));
    } catch (error) {}
    try {
        await sailContract.transfer(address, ethers.utils.parseUnits("100", 18));
    } catch (error) {}

    try {
        await veSailContract.transfer(address, ethers.utils.parseUnits("100", 18));
    } catch (error) {}

    try {
        await wallet.sendTransaction({
            to: address,
            value: ethers.utils.parseEther("0.001"),
        });
    } catch (error) {}
};

//Pass the address from front end
// Address can only request oncce so save it in DB to track
faucet("0x0000000000000000000000000000000000000000");
