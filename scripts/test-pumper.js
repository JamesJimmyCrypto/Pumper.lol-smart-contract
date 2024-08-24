const { expect, assert, should } = require("chai");
const { ethers } = require("hardhat");

describe("Pumper.lol", function () {
    before(async function () {
        const [deployer] = await ethers.getSigners();
        const PumperFactory = await ethers.getContractFactory("PumperFactory");
        const pumperFactory = await PumperFactory.deploy();

        await pumperFactory.waitForDeployment();

        this.pumperFactory = pumperFactory;
        this.pumperFactoryAddress = await pumperFactory.getAddress();
        this.deployer = deployer;
        this.deployerAddress = await deployer.getAddress();
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

            console.log("Factory Address: ", this.pumperFactoryAddress);
            console.log("Pumper Token Address: ", deployedPumpTokens[1]);

            assert.equal(address, deployedPumpTokens[1]);
            assert.equal(deployedPumpTokens.length, 2);
            assert.equal(await pumperToken.name(), "TokenB");
            assert.equal(await pumperToken.symbol(), "TB");
            assert.equal(await pumperToken.totalSupply(), ethers.parseEther("1000000000"));
        });

        it("Should buy confirm x, y, k and x * k = k set by default", async function () {
            const deployedPumpTokens = await this.pumperFactory.getDeployedPumpTokens(
                this.deployerAddress
            );
            const tokenBAddress = deployedPumpTokens[1];
            const pumperToken = await ethers.getContractAt("PumperToken", tokenBAddress);

            const x = await pumperToken.x();
            const y = await pumperToken.y();
            const k = await pumperToken.k();

            console.table({
                x: ethers.formatEther(x),
                y: ethers.formatEther(y),
                k: ethers.formatEther(k),
            });

            assert.equal(x, ethers.parseEther("1000000000")); //Initial token Liquidity
            assert.equal(y, ethers.parseEther("10")); // Initial virtual EDU liquidty

            const supplyPrev = await pumperToken.balanceOf(tokenBAddress);
            const purchaseAmt = ethers.parseEther("0.04");
            const out = await pumperToken.getTokenOutputX(purchaseAmt);

            await pumperToken.buyX({ value: purchaseAmt });

            await pumperToken.approve(await pumperToken.getAddress(), ethers.parseEther("1000"));
            await pumperToken.sellX(ethers.parseEther("1000"));

            const supplyAfter = await pumperToken.balanceOf(tokenBAddress);

            const x2 = await pumperToken.x();
            const y2 = await pumperToken.y();
            const k2 = await pumperToken.k();

            expect(out).to.be.eq(await pumperToken.balanceOf(this.deployerAddress));
            expect(supplyPrev).to.be.gt(supplyAfter);
            expect(x2).to.be.lt(x);
            expect(y2).to.be.gt(y);
            expect(k2).to.be.eq(k);

            console.table({
                x2: ethers.formatEther(x2),
                y2: ethers.formatEther(y2),
                k2: ethers.formatEther(k2),
            });
        });

        it("Should sell half of my token for half of EDU I purchase with as the first and only buyer", async function () {
            const deployedPumpTokens = await this.pumperFactory.getDeployedPumpTokens(
                this.deployerAddress
            );
            const tokenBAddress = deployedPumpTokens[1];
            const pumperToken = await ethers.getContractAt("PumperToken", tokenBAddress);

            const supplyPrev = await pumperToken.balanceOf(tokenBAddress);
            const purchaseAmt = ethers.parseEther("0.03");
            const out = await pumperToken.getTokenOutputX(purchaseAmt);

            const x2 = await pumperToken.x();
            const y2 = await pumperToken.y();
            const k2 = await pumperToken.k();

            await pumperToken.buyX({ value: purchaseAmt });

            const supplyAfter = await pumperToken.balanceOf(tokenBAddress);

            const x3 = await pumperToken.x();
            const y3 = await pumperToken.y();
            const k3 = await pumperToken.k();

            expect(supplyPrev).to.be.gt(supplyAfter);
            expect(x3).to.be.lt(x2);
            expect(y3).to.be.gt(y2);
            expect(k3).to.be.eq(k2);

            await pumperToken.approve(await pumperToken.getAddress(), ethers.parseEther("1000"));
            await pumperToken.sellX(ethers.parseEther("1000"));

            console.table({
                x3: ethers.formatEther(x3),
                y3: ethers.formatEther(y3),
                k3: ethers.formatEther(k3),
            });
        });

        it.skip("Should deploy liquidty when it reaches cap of 11 EDU token", async function () {
            const deployedPumpTokens = await this.pumperFactory.getDeployedPumpTokens(
                this.deployerAddress
            );
            const tokenBAddress = deployedPumpTokens[1];
            const pumperToken = await ethers.getContractAt("PumperToken", tokenBAddress);

            const supplyPrev = await pumperToken.balanceOf(tokenBAddress);
            const purchaseAmt = ethers.parseEther("0.92");
            const out = await pumperToken.getTokenOutputX(purchaseAmt);

            await pumperToken.buyX({ value: purchaseAmt });

            const x4 = await pumperToken.x();
            const y4 = await pumperToken.y();
            const k4 = await pumperToken.k();

            console.table({
                x4: ethers.formatEther(x4),
                y4: ethers.formatEther(y4),
                k4: ethers.formatEther(k4),
            });
        });
    });
});

//npx hardhat test scripts/test-pumper.js --network hardhat
