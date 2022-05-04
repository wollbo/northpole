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

    mapping (address => optionInfo) listedOptions;
    mapping (address => optionInfo) activeOptions;
    mapping (address => optionInfo) finishedOptions;

    struct optionInfo { // expand to a range of MWh, feePerMWh, payoutPerMWh, minMWh, maxMWh - separate into listedOption - initiatedOption ?
        string priceArea;
        uint startEpoch;
        uint duration;
        uint fee;
        uint payout;
        uint strike;
        //uint MWh;
        //uint minMWh;
        //uint maxMWh;
        address provider; // maybe add client
        address client;
        uint value;
    }

    constructor() {
        owner = msg.sender;
    }

    event providerCreated(address providerAddress);

    event newListedContract(address providerAddress, address optionAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike); // expand with contract information

    event activeContract(address optionAddress, address providerAddress, address clientAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike);

    event finishedContract(address optionAddress, address providerAddress, address clientAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike, uint value);


    function addToListed(address _optionAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(activeProvider[msg.sender]);
        listed[_optionAddress] = true;
        optionInfo storage newListedOption = listedOptions[_optionAddress];
        newListedOption.priceArea = _priceArea;
        newListedOption.startEpoch = _startEpoch;
        newListedOption.duration = _duration;
        newListedOption.fee = _fee;
        newListedOption.payout = _payout;
        newListedOption.strike = _strike;
        emit newListedContract(msg.sender, _optionAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
    }

    function addToActive(address _providerAddress, address _clientAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        active[msg.sender] = true;
        activeOptions[msg.sender] = listedOptions[msg.sender];
        delete(listedOptions[msg.sender]);
        optionInfo storage newActiveOption = activeOptions[msg.sender];
        newActiveOption.client = _clientAddress;
        emit activeContract(msg.sender, _providerAddress, _clientAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
    }

    function addToFinished(address _providerAddress, address _clientAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike, uint _value) public {
        require(active[msg.sender]);
        active[msg.sender] = false;
        finished[msg.sender] = true;
        finishedOptions[msg.sender] = activeOptions[msg.sender];
        delete(activeOptions[msg.sender]);
        optionInfo storage newFinishedOption = activeOptions[msg.sender];
        newFinishedOption.value = _value;
        emit finishedContract(msg.sender, _providerAddress, _clientAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike, _value);
    }

    function expiredToFinished(address _providerAddress, address _clientAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        finished[msg.sender] = true;
        emit finishedContract(msg.sender, _providerAddress, _clientAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike, 0);
    }

    function cancelToFinished(address _providerAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        finished[msg.sender] = true;
        emit finishedContract(msg.sender, _providerAddress, address(0), _priceArea, _startEpoch, _duration, _fee, _payout, _strike, 0);
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

    event optionCreated (address optionAddress); // it is possible that optionCreated -> optionListed is one single event
    

    // add arg string _priceArea
    function createOption(string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public payable providerOnly returns (address) {

        require((_duration > 0), "Expiration date must be later than start date");
        //require(_priceArea in priceAreas);
        require(_fee > 0, "Value must be non-zero");
        require(_payout > 0, "Value must be non-zero");
        require(msg.value == _payout * 1 ether, "Payout must be deposited at contract creation");

        // add ether payout and fee denominated in EUR through payout * EUR/USD * ETH/USD
        // add arg _priceArea
        Option o = (new Option){value: _payout}(northpole, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
        emit optionCreated(address(o));
        o.listContract(); // consider completely removing CREATED state
        Northpole np = Northpole(northpole);
        np.addToListed(address(o), o.getPriceArea(), o.getStartEpoch(), o.getDuration(), o.getFee(), o.getPayout(), o.getStrike());
        contracts[address(o)] = o;

        return address(o);
    }


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
    string priceArea;
    uint startEpoch;
    uint duration;
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
        require(startEpoch < block.timestamp && block.timestamp < (startEpoch + duration), "Current time is outside of contract duration");
        _;
    }

    modifier contractSettlement() {
        require(state == State.INITIATED);
        require((startEpoch + duration) < block.timestamp, "Current time has not yet reached settlement period");
        _;
    }

    modifier contractFinished() {
        require(state == State.FINISHED, "Contract has not yet ended");
        _;
    }


    // add arg string _priceArea, maxMWh, minMWh
    constructor(address _northpole, string memory _priceArea, uint _startEpoch, uint _duration, 
                uint _fee, uint _payout, uint _strike) payable {
        
        require(msg.value == _payout * 1 ether, "Not enough funds deposited");
        require(keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("se1")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("se2")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("se3")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("se4")) ||
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("fin")) ||
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("sys")));
        providerDeposited = true;
        clientDeposited = false;
        provider = payable(msg.sender);
        northpole = _northpole;
        priceArea = _priceArea;
        startEpoch = _startEpoch;
        duration = _duration;
        fee = _fee;
        payout = _payout;
        strike = _strike;
        //mawMWh = _mawMWh;
        //minMWh = _minMWh;
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    function getPriceArea() external view returns (string memory) {
        return priceArea;
    }

    function getCurrentEpoch() external view returns (uint) {
        return block.timestamp;
    }

    function getStartEpoch() external view returns (uint) {
        return startEpoch;
    }

    function getDuration() external view returns (uint) {
        return duration;
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

    function listContract() providerOnly contractCreated public payable { // moves contract to front-end
        state = State.LISTED;
    }

    function clientDeposit() contractListed public payable {
        require(clientDeposited == false, "Already funded by client");
        require(msg.value == fee * 1 ether);
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
            Northpole np = Northpole(northpole);
            np.expiredToFinished(provider, client, priceArea, startEpoch, duration, fee, payout, strike);
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
            np.addToActive(provider, client, priceArea, startEpoch, duration, fee, payout, strike);
        }   
    }

    function requestAveragePrice() contractSettlement public payable {} // call request to external adapter, pay with oracle payment

    function averagePriceCallback() contractSettlement public payable {} // callback request data

    function checkStrike() contractSettlement public payable { // in fixedprice scenario only this function needs to be called to settle
        if (block.timestamp > (2*duration + startEpoch)) { // if we have entered the next month we should still be able to reach the API, change EA
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
        Northpole np = Northpole(northpole);
        np.addToFinished(provider, client, priceArea, startEpoch, duration, fee, payout, strike, fixedPrice);
        state = State.FINISHED;
    }

    function updateContract() contractSettlement public payable {} // requestAveragePrice, wait for callback, checkStrike

    function cancelListing() providerOnly contractListed public payable {
        require(clientDeposited == false);
        Northpole np = Northpole(northpole);
        np.cancelToFinished(provider, priceArea, startEpoch, duration, fee, payout, strike);
        state = State.FINISHED;
        provider.transfer(address(this).balance);

    }

    function providerWithdraw() providerOnly contractFinished public payable { // backup for removing funds
        require(clientDeposited == false);
        provider.transfer(address(this).balance);
    }
}