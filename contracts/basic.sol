pragma solidity ^0.8.0;

// Basic ETH-only provider contract with fixed strike price
// Problem: Payout value may fluctuate greatly during listing
// Either: allow provider to fund contract AFTER contract being accepted (problematic since he may become insolvent)
// Better solution: allow dynamic updates of contract pricing in front end (user sees fluctuating EUR amount)
// add buffer of ~1000 to block.timestamp

// Also; add maxPayout (provider deposits maxPayout, is returned the remainder of what the buyer wants to hedge)
// provider sells contract with 1 < X < 10, client wants 5, provider is returned 5 (or what if new contract is created with 1 < X < 5 ?)

contract Provider {

    address public provider = msg.sender;
    mapping (address => Option) contracts; // mapping of issued contracts

    //string[4] public priceAreas = ["SE1", "SE2", "SE3", "SE4", "FI"]


    modifier providerOnly() {
        require(msg.sender==provider, "Only the provider may call this function");
        _;
    }
    

    // add arg string _priceArea
    function createOption(uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike) public payable providerOnly returns (address) {

        require((_endEpoch - _startEpoch > 0), "Expiration date must be later than start date");
        //require(_priceArea in priceAreas);
        require(_fee > 0, "Value must be non-zero");
        require(_payout > 0, "Value must be non-zero");
        require(msg.value == _payout, "Payout must be deposited at contract creation");

        // add ether payout and fee denominated in EUR through payout * EUR/USD * ETH/USD
        // add arg _priceArea
        Option o = (new Option){value: _payout}(_startEpoch, _endEpoch, _fee, _payout, _strike);

        // emit event contract created

        contracts[address(o)] = o;

        return address(o);
    }

    function listOption(address _optionAddress) external providerOnly {
        Option o = Option(_optionAddress);
        o.listContract();
    }

    function cancelListed(address _optionAddress) external payable providerOnly {
        Option o = Option(_optionAddress);
        o.cancelListing();
    }

    function withdrawFinished(address _optionAddress) external payable providerOnly {
        Option o = Option(_optionAddress);
        o.providerWithdraw();
    }

    function getProviderBalance() external view returns (uint) {
        return address(this).balance;
    }

    function endProvider() external payable providerOnly {
        selfdestruct(payable(provider));
    }

    receive() external payable {  } // fallback for receiving ether
}


contract Option {

    uint startEpoch;
    uint endEpoch;
    //string priceArea;
    uint fee;
    uint payout;
    uint strike;

    uint constant fixedPrice = 150 * 10**18; // until we use CL-EA price

    address payable public provider;
    address payable public client;

    bool clientDeposited;
    bool providerDeposited;

    enum State {CREATED, LISTED, INITIATED, FINISHED}
    State public state;


    modifier providerOnly() {
        require(msg.sender == provider, "Only the provider can call this function");
        _;
    }

    modifier clientOnly() {
        require(msg.sender == client, "Only the client may call this function");
        _;
    }

    modifier contractCreated() {
        require(state == State.CREATED, "Contract already listed");
        _;
    }

    modifier contractListed() {
        require(state == State.LISTED, "Contract already initiated");
        _;
    }

    modifier contractStarted() {
        require(state==State.INITIATED, "Contract has ended");
        _;
    }

    modifier contractActive() {
        require(state==State.INITIATED);
        if(startEpoch < block.timestamp && block.timestamp < endEpoch) {
            _;
        }
    }

    modifier contractSettlement() {
        require(state == State.INITIATED);
        require(endEpoch < block.timestamp);
        _;
        /*if(endEpoch < block.timestamp) {
            _;
        }*/
    }

    modifier contractFinished() {
        require(state == State.FINISHED, "Contract has not yet ended");
        _;
    }

    modifier settlementPeriod() { // maybe superfluous
        require(state == State.INITIATED);
        require((endEpoch < block.timestamp && block.timestamp < (2*endEpoch - startEpoch)), "Current time is outside of settlement period");
        _;
    }

    // add arg string _priceArea
    constructor(uint _startEpoch, uint _endEpoch, 
                uint _fee, uint _payout, uint _strike) payable {
        
        require(msg.value == _payout, "Not enough funds deposited");
        providerDeposited = true;
        clientDeposited = false;
        provider = payable(msg.sender);
        startEpoch = _startEpoch;
        endEpoch = _endEpoch;
        //priceArea = _priceArea;
        fee = _fee;
        payout = _payout;
        strike = _strike;

        // emit event contract created
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    function listContract() providerOnly contractCreated public payable { // move contract to front-end
        state = State.LISTED;
    }

    function clientDeposit() contractListed public payable {
        require(clientDeposited == false, "Already funded by client");
        require(msg.value == fee);
        client = payable(msg.sender);
        clientDeposited = true;
    }

    function clientWithdraw() clientOnly contractListed public payable {
        require(clientDeposited == true, "Contract is not funded by client");
        client.transfer(fee);
        clientDeposited = false;
    }

    function initContract() contractListed public payable {
        if (block.timestamp > startEpoch) {
            if (clientDeposited) {
                client.transfer(fee);
            }
            if (providerDeposited) {
                provider.transfer(address(this).balance);
            }
            state = State.FINISHED;
        }
        if (providerDeposited && clientDeposited) {
            state == State.INITIATED;
        }   
    }

    function requestAveragePrice() contractSettlement public payable {} // call request to external adapter, pay with oracle payment

    function averagePriceCallback() contractSettlement public payable {} // callback request data

    function checkStrike() contractSettlement public payable {
        if (block.timestamp >  (2*endEpoch - startEpoch)) { // if we have entered the next month we should still be able to reach the API, change EA
            client.transfer(fee);
            provider.transfer(address(this).balance); // provider is responsible for making sure that the contract is called on time
        }
        if (fixedPrice >= strike) {
            client.transfer(payout);
            provider.transfer(address(this).balance);
        }
        if (fixedPrice < strike) {
            provider.transfer(address(this).balance);
        }
        state = State.FINISHED;
    }

    function updateContract() contractSettlement public payable {} // requestAveragePrice, wait for callback, checkStrike

    function cancelListing() providerOnly contractListed public payable { // cancel active listing
        require(clientDeposited == false);
        provider.transfer(address(this).balance);
        state = State.FINISHED;
    }

    function providerWithdraw() providerOnly contractFinished public payable { // possible to get stuck here
        require(clientDeposited == false);
        provider.transfer(address(this).balance);
    }
}
