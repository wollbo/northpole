pragma solidity ^0.8.0;

// Basic ETH-only provider contract with fixed strike price
// Problem: Payout value may fluctuate greatly during listing
// Either: allow provider to fund contract AFTER contract being accepted (problematic since he may become insolvent)
// Better solution: allow dynamic updates of contract pricing in front end (user sees fluctuating EUR amount)
// add buffer of ~1000 to block.timestamp

// Also; add maxPayout (provider deposits maxPayout, is returned the remainder of what the buyer wants to hedge)
// provider sells contract with 1 < X < 10, client wants 5, provider is returned 5 (or what if new contract is created with 1 < X < 5 ?)

contract Northpole { // master contract keeping track of listed+active option offers

    address public owner;
    mapping (address => Provider) providers;
    mapping (address => Option) options;
    mapping (address => bool) activeProvider;
    mapping (address => bool) listed; // contractcycle
    mapping (address => bool) active;
    mapping (address => bool) finished;

    // Mappings: Providers. 
    // if msg.sender in providers; update listed contract
    // if msg.sender in providers; move from listed contract to active?
    
    // needs to be some sort of dict, keys are defined at provider option creation.
    // later on this must map to a provider specific "my contracts" dict, also maybe one for each client

    constructor() {
        owner = msg.sender;
    }

    event providerCreated(address _providerAddress);

    event newListedContract(address _providerAddress, address _optionAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike); // expand with contract information

    event activeContract(address _optionAddress, address _providerAddress, address _clientAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike);

    event finishedContract(address _optionAddress, address _providerAddress, address _clientAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike, uint _value);


    function addToListed(address _optionAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike) public {
        require(activeProvider[msg.sender]);
        listed[_optionAddress] = true;
        emit newListedContract(msg.sender, _optionAddress, _startEpoch, _endEpoch, _fee, _payout, _strike);
    }

    function addToActive(address _providerAddress, address _clientAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        active[msg.sender] = true;
        emit activeContract(msg.sender, _providerAddress, _clientAddress, _startEpoch, _endEpoch, _fee, _payout, _strike);
    }

    function addToFinished(address _providerAddress, address _clientAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike, uint _value) public {
        require(active[msg.sender]);
        active[msg.sender] = false;
        finished[msg.sender] = true;
        emit finishedContract(msg.sender, _providerAddress, _clientAddress, _startEpoch, _endEpoch, _fee, _payout, _strike, _value);
    }

    function cancelToFinished(address _providerAddress, uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        finished[msg.sender] = true;
        emit finishedContract(msg.sender, _providerAddress, address(0), _startEpoch, _endEpoch, _fee, _payout, _strike, 0);
    }

    function endProvider() public { // require all contracts settled?
        require(activeProvider[msg.sender]);
        activeProvider[msg.sender] = false;
    }

    function newProvider() public returns(address) {

        Provider p = (new Provider)();
        providers[address(p)] = p;
        activeProvider[address(p)] = true;

        emit providerCreated(address(p));
        return address(p);
    }
}

contract Provider {

    address public northpole = msg.sender;
    address public provider = tx.origin;
    mapping (address => Option) contracts; // mapping of issued contracts

    //string[4] public priceAreas = ["SE1", "SE2", "SE3", "SE4", "FI"]


    modifier providerOnly() {
        require(msg.sender==provider, "Only the provider may call this function");
        _;
    }

    struct option { // expand to a range of MWh, feePerMWh, payoutPerMWh, minMWh, maxMWh - separate into listedOption - initiatedOption ?
        //string priceArea;
        uint startEpoch;
        uint endEpoch;
        uint fee;
        uint payout;
        uint strike;
        //uint MWh;
        //uint minMWh;
        //uint maxMWh;
        address provider; // maybe add client
    }

    event optionCreated (address optionAddress); // it is possible that optionCreated -> optionListed is one single event
    

    // add arg string _priceArea
    function createOption(uint _startEpoch, uint _endEpoch, uint _fee, uint _payout, uint _strike) public payable providerOnly returns (address) {

        require((_endEpoch - _startEpoch > 0), "Expiration date must be later than start date");
        //require(_priceArea in priceAreas);
        require(_fee > 0, "Value must be non-zero");
        require(_payout > 0, "Value must be non-zero");
        require(msg.value == _payout, "Payout must be deposited at contract creation");

        // add ether payout and fee denominated in EUR through payout * EUR/USD * ETH/USD
        // add arg _priceArea
        Option o = (new Option){value: _payout}(northpole, _startEpoch, _endEpoch, _fee, _payout, _strike);
        emit optionCreated(address(o));
        o.listContract(); // consider completely removing CREATED state
        Northpole np = Northpole(northpole);
        np.addToListed(address(o), o.getStartEpoch(), o.getEndEpoch(), o.getFee(), o.getPayout(), o.getStrike());
        contracts[address(o)] = o;

        return address(o);
    }

    // function listOption(address _optionAddress) external providerOnly {
    //     Option o = Option(_optionAddress);
    //     o.listContract();
    //     Northpole np = Northpole(northpole);
    //     np.addToListed(address(o), o.getStartEpoch(), o.getEndEpoch(), o.getFee(), o.getPayout(), o.getStrike());
    // }

    function cancelListed(address _optionAddress) external payable providerOnly {
        Option o = Option(_optionAddress);
        o.cancelListing();
    }

    function initOption(address _optionAddress) external providerOnly {
        Option o = Option(_optionAddress);
        o.initContract();
    }

    function withdrawFinished(address _optionAddress) external payable providerOnly {
        Option o = Option(_optionAddress);
        o.providerWithdraw();
    }

    function getProviderBalance() external view returns (uint) {
        return address(this).balance;
    }

    function endProvider() external payable providerOnly {
        Northpole np = Northpole(northpole);
        np.endProvider();
        selfdestruct(payable(provider));
    }

    receive() external payable {  } // fallback for receiving ether
}


contract Option {

    address public northpole;
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

    enum State {CREATED, LISTED, INITIATED, FINISHED} // possible that CREATED and LISTED should be merged
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


    modifier contractActive() {
        require(state==State.INITIATED);
        require(startEpoch < block.timestamp && block.timestamp < endEpoch, "Current time is outside of contract duration");
        _;
    }

    modifier contractSettlement() {
        require(state == State.INITIATED);
        require(endEpoch < block.timestamp, "Current time has not yet reached settlement period");
        _;
    }

    modifier contractFinished() {
        require(state == State.FINISHED, "Contract has not yet ended");
        _;
    }


    // add arg string _priceArea, maxMWh, minMWh
    constructor(address _northpole, uint _startEpoch, uint _endEpoch, 
                uint _fee, uint _payout, uint _strike) payable {
        
        require(msg.value == _payout, "Not enough funds deposited");
        providerDeposited = true;
        clientDeposited = false;
        provider = payable(msg.sender);
        northpole = _northpole;
        startEpoch = _startEpoch;
        endEpoch = _endEpoch;
        //priceArea = _priceArea;
        fee = _fee;
        payout = _payout;
        strike = _strike;
        //mawMWh = _mawMWh;
        //minMWh = _minMWh;
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    function getCurrentEpoch() external view returns (uint) {
        return block.timestamp;
    }

    function getStartEpoch() external view returns (uint) {
        return startEpoch;
    }

    function getEndEpoch() external view returns (uint) {
        return endEpoch;
    }

    function getFee() external view returns (uint) {
        return fee;
    }

    function getPayout() external view returns (uint) {
        return payout;
    }

    function getStrike() external view returns (uint) {
        return strike;
    }

    function getClient() external view returns (address) {
        return client;
    }

    function listContract() providerOnly contractCreated public payable { // moves contract to front-end
        state = State.LISTED;
    }

    function clientDeposit() contractListed public payable {
        require(clientDeposited == false, "Already funded by client");
        require(msg.value == fee);
        client = payable(msg.sender);
        clientDeposited = true; // here client also supplies selected MWh, minMWh < MWh < maxMWh
        // such that fee = fee * MWh (fee per MWh)
    }

    function clientWithdraw() clientOnly contractListed public payable {
        require(clientDeposited == true, "Contract is not funded by client");
        client.transfer(fee);
        clientDeposited = false;
    }

    function initContract() contractListed public payable { // emit event to northpole master contract - remove from listed move to active
        if (block.timestamp > startEpoch) {
            state = State.FINISHED;
            if (clientDeposited) {
                client.transfer(fee);
            }
            if (providerDeposited) {
                provider.transfer(address(this).balance);
            }
        }
        else { // contract returns maxMWh - MWh to provider
            require((providerDeposited && clientDeposited), "Both parties have not deposited collateral");
            state = State.INITIATED;
            Northpole np = Northpole(northpole);
            np.addToActive(provider, client, startEpoch, endEpoch, fee, payout, strike);
        }   
    }

    function requestAveragePrice() contractSettlement public payable {} // call request to external adapter, pay with oracle payment

    function averagePriceCallback() contractSettlement public payable {} // callback request data

    function checkStrike() contractSettlement public payable { // in fixedprice scenario only this function needs to be called to settle
        if (block.timestamp > (2*endEpoch - startEpoch)) { // if we have entered the next month we should still be able to reach the API, change EA
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

    function cancelListing() providerOnly contractListed public payable {
        require(clientDeposited == false);
        Northpole np = Northpole(northpole);
        np.cancelToFinished(provider, startEpoch, endEpoch, fee, payout, strike);
        state = State.FINISHED;
        provider.transfer(address(this).balance);

    }

    function providerWithdraw() providerOnly contractFinished public payable { // backup for removing funds
        require(clientDeposited == false);
        provider.transfer(address(this).balance);
    }
}