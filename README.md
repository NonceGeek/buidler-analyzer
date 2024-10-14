# Buidler Analyzer

<h4 align="center">
  <a href="https://buidler-analyzer.rootmud.xyz"> -[ Lanuch App ]- </a>
</h4>



Buidler Analyzer & Simple Community Verifier.

> Smart Contract:
>
> **OP:** https://optimistic.etherscan.io/address/0x2a05e2c16b5e83b28673e8677157dedfac488512#code

## Materials

* [Deck](./deck.pdf)
* [Demo](https://buidler-analyzer.rootmud.xyz)

## Quickstart

如果您想快速体验我们的功能请通过：<a href="https://buidler-analyzer.rootmud.xyz">Lanuch App</a>

## Frontend
### Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

### Quick Guide

To get started with dApp, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/NonceGeek/buidler-analyzer.git
cd buidler-analyzer
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend. You can tweak the app config in `packages/nextjs/explorer.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `CommunityVerifier.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`

