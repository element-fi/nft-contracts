import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "tsconfig-paths/register";

import { ethers, providers } from "ethers";
import { existsSync, readFileSync } from "fs";
import { HardhatUserConfig, task, types } from "hardhat/config";
import { updateMerkleRoot } from "scripts/updateMerkleRoot";

const EXPECTED_ACCOUNT_FILE = "accounts.json";

// Expects a json file with a list of private keys
const getAddresses = (): string[] | undefined => {
  if (existsSync(EXPECTED_ACCOUNT_FILE)) {
    console.log("External list of addresses loaded.");
    const externalAccounts = readFileSync(EXPECTED_ACCOUNT_FILE);
    return JSON.parse(externalAccounts.toString());
  }

  console.warn(
    "Could not find external account list, defaulting to hardhat defaults."
  );
};

const addresses = getAddresses();

const { PRIVATE_KEY, ALCHEMY_GOERLI_RPC_HOST } = process.env;

task("updateMerkleRoot", "updates the merkle root")
  .addParam("merkleRoot", "The new merkle root", undefined, types.string)
  .setAction(async (taskArgs: { merkleRoot: string }) => {
    const { merkleRoot } = taskArgs;

    if (!PRIVATE_KEY) {
      console.log("ERROR: no private key provided");
      return;
    }

    const localhostProvider = new providers.JsonRpcProvider(
      ALCHEMY_GOERLI_RPC_HOST
    );

    const owner = new ethers.Wallet(PRIVATE_KEY, localhostProvider);

    const ownerAddress = owner.address;
    console.log("ownerAddress", ownerAddress);

    await updateMerkleRoot(owner, merkleRoot);
  });

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 7500,
          },
        },
      },
    ],
  },
  mocha: { timeout: 0 },
  networks: {
    hardhat: {
      accounts: addresses
        ? addresses.map((address) => ({
            privateKey: address,
            balance: "100000000000000000000000",
          }))
        : {
            accountsBalance: "100000000000000000000000", // 100000 ETH
            count: 5,
          },
    },
  },
};

export default config;
