import React from "react";
import { Icon, Modal, Card, Button, Select, DatePicker, Input, useNotification } from "web3uikit";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3ExecuteFunction} from "react-moralis";

function Provider({account}) {

  const [isVisible, setVisible] = useState(false);
  const { Moralis } = useMoralis();
  const [providerContracts, setProviderContracts] = useState();
  const [priceArea, setPriceArea] = useState("se1");
  const [contractDate, setContractDate] = useState(new Date());
  const [payout, setPayout] = useState(1/100);
  const [fee, setFee] = useState(1/1000);
  const [strike, setStrike] = useState(100);
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();

  const northpoleAddress = "0xA753E4a0a82e4eC531ABE3636E2CF04629984f33";

  const providerContractConst = "0xe823e0226cebfc0d1964348e2c06e16e8435901b"
  const priceAreaConst = "se2";
  const contractEpochConst = 1653613200;
  const durationConst = 84000;
  const strikePriceConst = 100;
  const payoutConst = 100;
  const feeConst = 1000;


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
      message: `Successfully created provider contract. Close this window and press the "+" again to create contracts`,
      title: "Provider creation successful",
      position: "topL"
    });
  };

  function convertEpoch(date) {
    const e = Date.parse(date);
    return e/1000;
  }

  useEffect(() => { // need a case for when there is no provider contract

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
        handleError(error.message)
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
        handleError(error)
      }
    });
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
                    Price Area
                    <Select
                      defaultOptionIndex={0}
                      onChange={(data) => setPriceArea(data.id)}
                      options={[
                        {
                          id: "se1",
                          label: "Luleå"
                        },
                        {
                          id: "se2",
                          label: "Sundsvall"
                        },
                        {
                          id: "se3",
                          label: "Stockholm"
                        },
                        {
                          id: "se4",
                          label: "Malmö"
                        },
                        {
                          id: "fin",
                          label: "Finland"
                        },
                        {
                          id: "sys",
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
                      convertEpoch(contractDate),
                      86400,
                      String(fee*10**18),
                      String(payout*10**18),
                      strike
                    )}
                    isFullWidth
                    text="Create"
                    theme="primary"
                  />
                  {/* <Button
                    onClick={() => createContract(
                      providerContractConst, // provider contract address in database
                      priceAreaConst,
                      contractEpochConst,
                      86400,
                      feeConst,
                      payoutConst,
                      strikePriceConst
                    )}
                    isFullWidth
                    text="Create"
                    theme="primary"
                  />  */}
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
