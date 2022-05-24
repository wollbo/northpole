import React from "react";
import { Icon, Modal, Card, Button, Select, DatePicker, Input, useNotification } from "web3uikit";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3ExecuteFunction} from "react-moralis";

function Provider({account}) { // add withdrawal function/self destruct

  const [isVisible, setVisible] = useState(false);
  const { Moralis } = useMoralis();
  const [providerContracts, setProviderContracts] = useState();
  const [priceArea, setPriceArea] = useState("SE1");
  const [contractDate, setContractDate] = useState(new Date());
  const [payout, setPayout] = useState(1/100);
  const [fee, setFee] = useState(1/1000);
  const [strike, setStrike] = useState(100);
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();
  const duration = 84000; // 5 minutes (300) for test case!, 84000 otherwise

  const northpoleAddress = "0x43f9fb770F40cA0D68442ed8AF69c6903d6B031C"; // remember to update for each new iteration

  const handleSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully created contract`,
      title: "Creation successful",
      position: "topL"
    });
  };

  const handleError= (msg) => {
    dispatch({
      type: "error",
      message: `${msg}`,
      title: "Contract creation failed",
      position: "topL"
    });
  };

  const handleProviderSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully created provider contract, remember to fund it with LINK! Close this window and press the "+" again to create contracts`,
      title: "Provider creation successful",
      position: "topL"
    });
  };

  const handleCopied=() => {
    dispatch({
      type: "success",
      message: `Remember to fund provider contract with LINK`,
      title: "Address copied",
      position: "topL"
    })
  }

  function convertEpoch(date) {
    const e = Date.parse(date);
    return e/1000;
  }

  function convertEpochNow() { // only used for testing
    const e = Date.now()
    return Math.trunc(e/1000)+duration;
  }

  useEffect(() => { 

    async function fetchProviders() {
      const Contracts = Moralis.Object.extend("Provider"); // not only listed but ACTIVE contracts
      const query = new Moralis.Query(Contracts);
      query.equalTo("providerOwner", account);
      const result = await query.find();

     
      setProviderContracts(result);
    }

    fetchProviders();
  }, [isVisible]);

  const createProvider = async function(northpoleAddress) {
    
    let options = {
      contractAddress: northpoleAddress,
      functionName: "newProvider",
      abi: [
        {
          "inputs": [],
          "name": "newProvider",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      params: {}
    }
    console.log(northpoleAddress)

    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        handleProviderSuccess();
      },
      onError: (error) => {
        handleError(error.data.message)
      }
    });
  }

  const createContract = async function(providerAddress, _priceArea, _startEpoch, _duration, _fee, _payout, _strike) { // needs to be linked to and called from a provider contract


    let options = {
      contractAddress: providerAddress,
      functionName: "createOption",
      abi: [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_priceArea",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "_startEpoch",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_duration",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_fee",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_payout",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_strike",
              "type": "uint256"
            }
          ],
          "name": "createOption",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "payable",
          "type": "function"
        }
      ],
      params: {
        _priceArea, 
        _startEpoch, 
        _duration, 
        _fee, 
        _payout,
        _strike
      },
      msgValue: _payout
    }
    console.log(providerAddress);
    console.log(_priceArea);
    console.log(_startEpoch);
    console.log(_duration);
    console.log(_fee); 
    console.log(_payout); 
    console.log(_strike); 


    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        handleSuccess();
      },
      onError: (error) => {
        handleError(error.data.message)
      }
    });
  }

  const copy = async (address) => {
    await navigator.clipboard.writeText(address);
    handleCopied()
  }

  return (
    <>
      <div onClick={() => setVisible(true)}>
        <Icon fill="#e49c02" size={28} svg="plus" />
      </div>
      <Modal
        id="provider"
        onCancel={() => setVisible(false)}
        onCloseButtonPressed={() => setVisible(false)}
        hasFooter={false}
        title="Create new contract"
        isVisible={isVisible}
        width="330px"
      >
        <div style={{display:"flex", justifyContent:"start", flexWrap:"wrap", gap:"10px"}}>
          {providerContracts &&
            providerContracts.map((e)=>{
              return(
                <div style={{ width: "200px"}}>
                  <Card
                    isDisabled // add convertPriceArea
                  >
                  <div className="inputs">
                    Provider 
                    <Button
                      onClick={() => copy(e.attributes.providerAddress)}
                      icon="paperclip"
                      iconLayout="trailing"
                      text={e.attributes.providerAddress.substr(0, 10)+"..."}
                      theme="ghost"
                    />

                    Price Area
                    <Select
                      defaultOptionIndex={0}
                      onChange={(data) => setPriceArea(data.id)}
                      options={[
                        {
                          id: "SE1",
                          label: "Luleå"
                        },
                        {
                          id: "SE2",
                          label: "Sundsvall"
                        },
                        {
                          id: "SE3",
                          label: "Stockholm"
                        },
                        {
                          id: "SE4",
                          label: "Malmö"
                        },
                        {
                          id: "FI",
                          label: "Finland"
                        },
                        {
                          id: "SYS",
                          label: "System"
                        },
                      ]}
                    />
                  </div>
                  <div className="inputs">
                    Contract Date
                    <DatePicker
                      id="contractDate"
                      onChange={(event) => setContractDate(event.date)} // really only one date needed, should be hardcoded to setDay
                      //validation={{min: Date.toISOString().slice(0, 10)}} // add validation later
                    />
                  </div>
                  <div className="inputs">
                    Strike €/MWh
                    <Input
                      value={100}
                      name="addStrike"
                      onChange={(event) => setStrike(event.target.value)}
                    />
                  </div>
                  <div className="inputs">
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        justifyContent:'flex-start',
                        width: '70%'
                      }}
                    >
                      Payout 
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                    </div>
                    <Input
                      value={1/100}
                      name="addPayout"
                      type="number"
                      onChange={(event) => setPayout(event.target.value)}
                    />
                  </div>
                  <div className="inputs">
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        justifyContent:'flex-start',
                        width: '70%'
                      }}
                    >
                      Fee
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                    </div>
                    <Input
                      value={1/1000}
                      name="addFee"
                      type="number"
                      onChange={(event) => setFee(event.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => createContract(
                      String(e.attributes.providerAddress), // provider contract address in database
                      priceArea,
                      convertEpoch(contractDate), // convertEpoch(contractDate) in production, convertEpochNow() for testing
                      duration,
                      String(fee*10**18),
                      String(payout*10**18),
                      strike
                    )}
                    isFullWidth
                    text="Create"
                    theme="primary"
                  />
                </Card> 
              </div>
              )
            })
          }
          {console.log(providerContracts)}
          {!(providerContracts && providerContracts.length>0) && 
            <div style={{ width: "200px"}}>
              <Card>
                New provider contract needs to be created
                <Button
                      onClick={() => createProvider(
                        northpoleAddress, // provider contract address in database
                      )}
                      isFullWidth
                      text="Create"
                      theme="primary"
                    />
              </Card> 
            </div>
          }
        </div>
      </Modal>
    </>
  );
}

export default Provider;
