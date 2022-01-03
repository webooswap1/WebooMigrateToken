require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");

const ROPSTEN_PRIVATE_KEY = "669c2b7fbf0cc6fbac2b63a3173ef3d5088bb4429d1630eddde8cdc675275650";
const ALCHEMY_API_KEY = "AhpRqm47BqdrOmuIpfx9JJ1T5T19YlX8";
const secret = require('./secret.json');
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            forking: {
                url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
                // blockNumber: 8036017,
                blockNumber: 11650956,
            }
        },
        ropsten: {
            url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
            accounts: [`${ROPSTEN_PRIVATE_KEY}`],
            gas: 750000
        },
        bt: {
            url: secret.bscTestnetMoralisURL,
            chainId: 97,
            accounts: [
                secret.privateKey1,
                secret.privateKey2,
                secret.privateKey3,
                secret.privateKey4,
                secret.privateKey5,
                secret.privateKey6
            ],
            gasLimit: 2000000000,
            blockGasLimit: 200000000,
            gas: 2100000,
        },
        bm: {
            url: secret.bscMainnetMoralisURL,
            chainId: 56,
            accounts: [
                secret.privateKeyMainnet
            ],
            gasLimit: 2000000000,
            blockGasLimit: 200000000,
            gas: 2100000,
        }
    },
    etherscan: {
        apiKey: secret.bscAPIKey
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 300
            }
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 200000000
    }

}