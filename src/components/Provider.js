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

  const providerAddress = "0xc42a1d6b87419e66a6670cc3b21b5d020e968e70"

  const handleSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully evaluated contract`,
      title: "Evaluation successful",
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

  function convertEpoch(date) {
    const e = Date.parse(date);
    return e/1000;
  }

  const createContract = async function(providerAddress, priceArea, startEpoch, duration, fee, payout, strike) { // needs to be linked to and called from a provider contract


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
        providerAddress, 
        priceArea, 
        startEpoch, 
        duration, 
        fee, 
        payout,
        strike
      },
      msgValue: payout
    }
    console.log(providerAddress);
    console.log(priceArea);
    console.log(startEpoch);
    console.log(duration);
    console.log(fee); 
    console.log(payout); 
    console.log(strike); 


    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        handleSuccess();
      },
      onError: (error) => {
        handleError(error.message)
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
          { // add loop through newProvider in moralis + add button to create new provider (can only be executed if user does not have an active provider in database)
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
                  onChange={(event) => setPayout(Number(event.target.value*10**18))}
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
                  onChange={(event) => setFee(Number(event.target.value*10**18))}
                />
              </div>
              <Button
                onClick={() => createContract(
                  providerAddress,
                  priceArea,
                  convertEpoch(contractDate),
                  86400,
                  fee,
                  payout,
                  strike
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
