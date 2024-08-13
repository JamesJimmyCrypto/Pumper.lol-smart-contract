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
        this.deployerAddress = deployer.getAddress();
    });

    describe("Pumper", function () {
        it("Should create a new Pumper Token", async function () {
            const salt = await this.pumperFactory.getDeployedPumpTokensLen(this.deployerAddress);
            const byteCode = await this.pumperFactory.getBytecode("TokenA", "TA");
            const address = await this.pumperFactory.getAddressBeforeDeployment(byteCode, salt);

            await this.pumperFactory.createPumpToken("TokenA", "TA");

            const deployedPumpTokens = await this.pumperFactory.getDeployedPumpTokens(
                this.deployerAddress
            );

            assert.equal(address, deployedPumpTokens[0]);
            assert.equal(deployedPumpTokens.length, 1);
        });

        it("Should create a new pumper token and confirm deploy address macthes and token data is valid", async function () {
            const salt = await this.pumperFactory.getDeployedPumpTokensLen(this.deployerAddress);
            const byteCode = await this.pumperFactory.getBytecode("TokenB", "TB");
            const address = await this.pumperFactory.getAddressBeforeDeployment(byteCode, salt);

            await this.pumperFactory.createPumpToken("TokenB", "TB");

            const deployedPumpTokens = await this.pumperFactory.getDeployedPumpTokens(
                this.deployerAddress
            );

            const pumperToken = await ethers.getContractAt("PumperToken", deployedPumpTokens[1]);

            assert.equal(address, deployedPumpTokens[1]);
            assert.equal(deployedPumpTokens.length, 2);
            assert.equal(await pumperToken.name(), "TokenB");
            assert.equal(await pumperToken.symbol(), "TB");
        });
    });
});

//npx hardhat test scripts/test-pumper.js --network localhost
