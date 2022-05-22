pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

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

    constructor() {
        owner = msg.sender;
    }

    event providerCreated(address providerAddress, address providerOwner);

    event newListedContract(address providerAddress, address optionAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike); // expand with contract information

    event activeContract(address optionAddress, address providerAddress, address clientAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike);

    event finishedContract(address optionAddress, address providerAddress, address clientAddress, string priceArea, uint startEpoch, uint duration, uint fee, uint payout, uint strike, uint value);


    function addToListed(address _optionAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(activeProvider[msg.sender]);
        listed[_optionAddress] = true;
        emit newListedContract(msg.sender, _optionAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
    }

    function addToActive(address _providerAddress, address _clientAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike) public {
        require(listed[msg.sender]);
        listed[msg.sender] = false;
        active[msg.sender] = true;
        emit activeContract(msg.sender, _providerAddress, _clientAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
    }

    function addToFinished(address _providerAddress, address _clientAddress, string memory _priceArea, uint _startEpoch, uint _duration, uint _fee, uint _payout, uint _strike, uint _value) public {
        require(active[msg.sender]);
        active[msg.sender] = false;
        finished[msg.sender] = true;
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

        emit providerCreated(address(p), msg.sender);
        return address(p);
    }
}

contract Provider {

    address public northpole = msg.sender;
    address public provider = tx.origin;
    mapping (address => Option) contracts; // mapping of issued contracts

    address public LINK_MATIC = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;
    uint public ORACLE_PAYMENT = 1 * 10 ** 17;
    address public ORACLE = 0x7f09b14C7975800D9624256C5329713970CC0176;
    bytes32 JOB_ID = "b6e55cc8ec9340a2870f309bd1ab59f6";

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
        require(msg.value == _payout, "Payout must be deposited at contract creation");
        //require(address(this).balance > _payout, "Provider contract must be appropriately funded with ETH"); // unclear how to implement at option creation (compared to value: _payout)

        // add ether payout and fee denominated in EUR through payout * EUR/USD * ETH/USD
        // add arg _priceArea
        Option o = (new Option){value: _payout}(northpole, _priceArea, _startEpoch, _duration, _fee, _payout, _strike);
        LinkTokenInterface link = LinkTokenInterface(LINK_MATIC);
        link.transfer(address(o), ORACLE_PAYMENT);

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


contract Option is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    address public northpole;
    string priceArea;
    uint startEpoch;
    uint duration;
    uint fee;
    uint payout;
    uint strike;

    uint requests = 0;
    uint value = 0;

    address payable public provider;
    address payable public client;

    LinkTokenInterface link; // sadly needs to be hardcoded in here, will not compile if used as constructor arguments from provider
    address public LINK_MATIC = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;
    uint public ORACLE_PAYMENT = 1 * 10 ** 17;
    address public ORACLE = 0x7f09b14C7975800D9624256C5329713970CC0176;
    bytes32 JOB_ID = "b6e55cc8ec9340a2870f309bd1ab59f6";

    bool clientDeposited = false;
    bool providerDeposited = true;

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

    modifier isLinkFunded() {
        require(link.balanceOf(address(this)) >= ORACLE_PAYMENT, "Contract needs to be funded with LINK");
        _;
    }


    // add maxMWh, minMWh
    constructor(address _northpole, string memory _priceArea, uint _startEpoch, uint _duration, 
                uint _fee, uint _payout, uint _strike) payable {
        
        require(msg.value == _payout, "Not enough funds deposited");
        require(keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("SE1")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("SE2")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("SE3")) || 
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("SE4")) ||
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("FI")) ||
                keccak256(abi.encodePacked(_priceArea)) == keccak256(abi.encodePacked("SYS")));

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
        link = LinkTokenInterface(LINK_MATIC);
        setChainlinkToken(LINK_MATIC);
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

    function getValue() external view returns (uint) {
        return value;
    }

    function listContract() providerOnly contractCreated public payable { // moves contract to front-end
        state = State.LISTED;
    }

    function clientDeposit() contractListed public payable {
        require(clientDeposited == false, "Already funded by client");
        require(msg.value == fee);
        client = payable(msg.sender);
        clientDeposited = true; // here client also supplies selected MWh, minMWh < MWh < maxMWh such that fee = fee * MWh (fee per MWh)
        initContract(); // in the basic case, provider has always deposited
    }

    function clientWithdraw() clientOnly contractListed public payable {
        require(clientDeposited == true, "Contract is not funded by client");
        client.transfer(fee);
        clientDeposited = false;
    }

    function initContract() contractListed isLinkFunded public payable { // emit event to northpole master contract - remove from listed move to active
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

    function requestPriceAreaPriceData() contractSettlement public returns (bytes32 requestId) { // hardcoded to contracted priceArea
        Chainlink.Request memory request = buildChainlinkRequest(JOB_ID, address(this), this.fulfill.selector);
        // Set the parameters for the bridge request
        request.add("pricearea", priceArea);
        request.add("return", "Value");
        // Sends the request
        return sendChainlinkRequestTo(ORACLE, request, ORACLE_PAYMENT);
    }
    
    /**
     * Oracle callback function
     */ 
    function fulfill(bytes32 _requestId, uint256 _value) contractSettlement public recordChainlinkFulfillment(_requestId) {
        value = _value;
        requests = requests + 1;
    }

    function checkStrike() contractSettlement public payable {
        Northpole np = Northpole(northpole);
        np.addToFinished(provider, client, priceArea, startEpoch, duration, fee, payout, strike, value);
        state = State.FINISHED;
        if (block.timestamp > (2*duration + startEpoch)) { // if we have entered the next month we should still be able to reach the API, change EA
            client.transfer(fee);
            provider.transfer(address(this).balance); // provider is responsible for making sure that the contract is called on time
        }
        else {
            require(requests > 0, "Price needs to be requested atleast once");
            require(value > 0, "Error with requested price, wait or request again");
            if (value >= strike * 100) { // multiplied by 100 in external adapter to remove decimals
                client.transfer(payout);
            }
            provider.transfer(address(this).balance); // more gas efficient to condense
        }
    }

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