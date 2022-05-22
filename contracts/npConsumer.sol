// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 */

contract NPConsumer is ChainlinkClient {
    using Chainlink for Chainlink.Request;
  
    string public priceArea;
    uint256 public value;
    
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    /**
     * Network: Matic Mumbai
     * Oracle: 0x7f09b14C7975800D9624256C5329713970CC0176 (northpole bridge naas)  
     * Job ID: 409e23293f7d4490857d80669026ed77
     * Fee: 1 LINK
     */
    constructor() {
        setPublicChainlinkToken();
        oracle = 0x7f09b14C7975800D9624256C5329713970CC0176;
        jobId = "409e23293f7d4490857d80669026ed77";
        fee = 1 * 10 ** 18; // (Varies by network and job)
    }
    
    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestPriceAreaPriceData(string memory _priceArea) public returns (bytes32 requestId) 
    {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        // Set the parameters for the bridge request
        request.add("pricearea", _priceArea);
        request.add("return", "Value");
        // Sends the request
        return sendChainlinkRequestTo(oracle, request, fee);
    }
    
    /**
     * Receive the response in the form of uint256
     */ 
    function fulfill(bytes32 _requestId, uint256 _value) public recordChainlinkFulfillment(_requestId)
    {
        value = _value;
    }

    // function withdrawLink() external {} - Implement a withdraw function to avoid locking your LINK in the contract
}