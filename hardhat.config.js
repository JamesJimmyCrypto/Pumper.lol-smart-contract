require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    solidity: "0.8.24",
    paths: {
        artifacts: "./src",
    },
    networks: {
        opencampus: {
            url: `https://rpc.open-campus-codex.gelato.digital/`,
            accounts: [process.env.ACCOUNT_PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: {
            opencampus: "your-etherscan-api-key",
        },
        customChains: [
            {
                network: "opencampus",
                chainId: 656476,
                urls: {
                    apiURL: "https://opencampus-codex.blockscout.com/api",
                    browserURL: "https://opencampus-codex.blockscout.com",
                },
            },
        ],
    },
};
