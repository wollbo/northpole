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
In order to create and list a contract of your own, you have to create a new provider contract. This is done by pressing the '+' icon to the right of the connect button, pressing the create button and signing the transaction. Close the dialogue window, wait for the transaction to settle and press the '+' icon again. Here you will find a modal with your provider contract address and the input fields for contract issuance. First, copy your provider contract address and send it some testnet LINK (the fee per oracle request is 0.1 LINK). Then input the data for price area, contract date (earlest possible date is tomorrow), strike price, payout and fee and press create! The funds to cover payout are paid from your regular account when you create the contract, funds escrowed by the contract are however paid out to your provider contract. Now your contract is listed and you can find it by browsing for the price area and contract date from the search bar. Your active and past contracts as a provider is also visible from your User page. <br> *Note: there is no front end connection to cancelling contracts or withdrawing funds from the provider contract, but the functions are available in the contract. See the Provider contract in contracts/northpole.sol for more details.* 
## Architecture

## Future work
