const { expect, assert, should } = require("chai");
const { ethers } = require("hardhat");

describe("Pumper.lol", function () {
    before(async function () {
        const [deployer] = await ethers.getSigners();
        const PumperFactory = await ethers.getContractFactory("PumperFactory");
        const pumperFactory = await PumperFactory.deploy();

        await pumperFactory.waitForDeployment();

        this.pumperFactory = pumperFactory;
        this.deployer = deployer;
        this.deployerAddress = await deployer.getAddress();
    });

    describe("Pumper", function () {
        it("Should create a new Pumper Token", async function () {
            const trx = await this.pumperFactory.deployLiquidty();

            console.log(trx);
        });
    });
});

//npx hardhat test test/test-deploy-lp.js --network opencampus
