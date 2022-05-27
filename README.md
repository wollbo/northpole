![logo](https://user-images.githubusercontent.com/34742686/164756366-89852e9b-8155-4955-a889-886024c7f1e9.png)
# Northpole
A decentralized binary options platform for physical electricity markets
## Overview
Northpole allows you to create binary options based on the Nordic electricity markets (currently price areas SE1, SE2, SE3, SE4, FI, SYS). The platform is governed by smart contracts on the Polygon Mumbai PoS testnet, and all settlement is denominated in Matic. The smart contracts retrieve external data from the Nord Pool power exchange to arbitrate the contracts.

## Try it out
The platform is hosted at:
https://ppqs6ko41pvb.usemoralis.com/ and
https://northpole.vercel.app/ <br>
However, the web3uikit resources are currently not inheriting the .css styling in the public builds. For a better experience, clone the repo and host the platform locally with yarn! <br>
`git clone https://github.com/wollbo/northpole.git` <br>
`cd northpole` <br>
`yarn install` <br>
`yarn start`<br>

## Instructions
From the main page you can search for different contracts based on contract date and price area (the energy field is currently not used). This will take you to the market, and if there are any contracts matching your query, you will find them displayed with price area, date, strike price, payout and fee. Buying contracts is straightforward, connect your web3 wallet through the connect button in the top right and press 'Purchase' on the contract of your choice. After you sign the transaction, the contract will move into an active state and can not be purchased by anyone else. You can view your current and past contracts by pressing the User icon to the left of the connect button. Active contracts have two buttons, one for requesting the average price of the contract duration and one for comparing the requested price with the strike price. You can only request the average price once the contract duration has expired. The contracts are issued for the average spot price in the price area during a certain date, if you buy a contract after the beginning of its contracted time period, it will automatically return the funds and report the average price as 0 €/MWh. <br> *Note: If the contract is not evaluated within a time period of 24 hours after expiration, the contract will return the funds to the respective parties.* 
### Issuing contracts
In order to create and list a contract of your own, you have to create a new provider contract. This is done by pressing the '+' icon to the right of the connect button, pressing the create button and signing the transaction. Close the dialogue window, wait for the transaction to settle and press the '+' icon again. Here you will find a modal with your provider contract address and the input fields for contract issuance. First, copy your provider contract address and send it some testnet LINK (the fee per oracle request is 0.1 LINK). Then input the data for price area, contract date (earlest possible date is tomorrow), strike price, payout and fee and press create! The funds to cover payout are paid from your regular account when you create the contract, funds escrowed by the contract are however paid out to your provider contract. Now your contract is listed and you can find it by browsing for the price area and contract date from the search bar. Your active and past contracts as a provider is also visible from your User page. <br> *Note: There is currently no front end connection to cancelling contracts or withdrawing funds from the provider contract, but the functions are available in the contract. See the Provider contract in contracts/northpole.sol for more details.* 
## Architecture
The platform is governed by smart contracts on the Polygon Mumbai PoS testnet, which query a Chainlink external adapter connecting to the Nord Pool power exchange APIs to inject the average spot price for the different price areas to the blockchain. The front end is built with react and the back end is provided by Moralis. The external adapter is written in python and hosted as a lambda function on aws.
### Smart contract hierarchy
The smart contracts that make up the backbone of the platform are divided into three parts: <br>
- The master smart contract Northpole which creates new Provider contracts and emits events to the Moralis database
- The Provider smart contracts which create new Option contracts and receive fees from clients and payouts for ITM Options
- The Option contracts which represent the agreements between Providers and clients, escrow the funds and queries the Chainlink oracle for arbitration of the contracts

## Future work
- Add the remaining European electricity markets without cluttering the website
- Batch contracts with the same price area and contract date together to be arbitrated by a single oracle request
- Automate batched requests and evaluation through keeper networks
- Add UI elements and functionality for cancelling contracts/withdrawing funds
- Add better user performance feedback 
- Add resources for viewing historical prices and future price predictions/fixed rate prices to help users assess contract terms
