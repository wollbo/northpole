import React from "react";
import { Icon, Modal, Card, Button, useNotification } from "web3uikit";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3ExecuteFunction} from "react-moralis";

function User({account}) {

  const [isVisible, setVisible] = useState(false);
  const { Moralis } = useMoralis();
  const [userContracts, setUserContracts] = useState();
  const [providerContracts, setProviderContracts] = useState();
  const [finishedContracts, setFinishedContracts] = useState();
  const [finishedProviderContracts, setFinishedProviderContracts] = useState();
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();

  const handleSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully evaluated contract`,
      title: "Evaluation successful",
      position: "topL"
    });
  };

  const handleRequestSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully sent price request`,
      title: "Request successful",
      position: "topL"
    });
  };

  const handleError= (msg) => {
    dispatch({
      type: "error",
      message: `${msg}`,
      title: "Evaluation failed",
      position: "topL"
    });
  };


  useEffect(() => {

    async function fetchContracts() {
      const Finished = Moralis.Object.extend("Finished");
      const finished = new Moralis.Query(Finished);
      finished.equalTo("clientAddress", account);
      finished.descending("startEpoch_decimal")
      const finishedClientResult = await finished.find();
      console.log(finishedClientResult)

      const Active = Moralis.Object.extend("Active"); // not only listed but ACTIVE contracts. EXTEND TO FINISHED FOR CLIENT+PROVIDER
      const query = new Moralis.Query(Active);
      query.equalTo("clientAddress", account);
      query.doesNotMatchKeyInQuery("optionAddress", "optionAddress", finished)
      query.descending("startEpoch_decimal")
      const result = await query.find();
      console.log(result)

      const Providers = Moralis.Object.extend("Provider");
      const provider = new Moralis.Query(Providers);
      provider.equalTo("providerOwner", account);
      
      const providerResult = await provider.find();
      console.log(providerResult)
      
      const providerContracts = [];
      providerResult.forEach(contract => {
        providerContracts.push(contract.get("providerAddress"));
      })
      console.log(providerContracts)

      const finishedProvider = new Moralis.Query(Finished);
      finishedProvider.containedIn("providerAddress", providerContracts)
      finishedProvider.descending("startEpoch_decimal")
      const finishedProviderResult = await finishedProvider.find();

      const providerQuery = new Moralis.Query(Active);
      providerQuery.containedIn("providerAddress", providerContracts)
      providerQuery.doesNotMatchKeyInQuery("optionAddress", "optionAddress", finishedProvider)
      providerQuery.descending("startEpoch_decimal")
      const providerResultMain = await providerQuery.find();
     
      setUserContracts(result);
      setFinishedContracts(finishedClientResult);
      setProviderContracts(providerResultMain);
      setFinishedProviderContracts(finishedProviderResult);
    }

    fetchContracts();
  }, [isVisible]);

  const evaluateContract = async function(optionAddress) {


    let options = {
      contractAddress: optionAddress, // works
      functionName: "checkStrike",
      abi: [
        {
          "inputs": [],
          "name": "checkStrike",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }
      ],
      params: {},
    }
    console.log(optionAddress);

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

  const requestPrice = async function(optionAddress, startEpoch, duration) { // for testing add start epoch and duration

    let options = {
      contractAddress: optionAddress,
      functionName: "requestPriceAreaPriceData",
      abi: [
        {
          "inputs": [],
          "name": "requestPriceAreaPriceData",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "requestId",
              "type": "bytes32"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      params: {},
    }
    console.log(Math.trunc(Date.now()/1000))
    console.log(Number(startEpoch)+Number(duration))

    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        handleRequestSuccess();
      },
      onError: (error) => {
        handleError(error.data.message)
      }
    });
    
  }

  function convertDate(epoch) {
    const d = new Date(epoch);
    return d.toISOString().slice(0, 10);
  }

  function convertPriceArea(shortName) {
    const priceAreaMap = {
      "SE1": "Luleå",
      "SE2": "Sundsvall",
      "SE3": "Stockholm",
      "SE4": "Malmö",
      "FI": "Finland",
      "SYS": "System"
    };
    var result = priceAreaMap[shortName];
    try {
      return result;
    }
    catch {
      return shortName;
    }
  }

  function priceAreaImageUrl(priceAreaId) {
    const ipfsUrlMap = {
      "SE1": "https://ipfs.io/ipfs/QmebzRcoRixgZA7LtJ3PGK75JUWcAD4y7HZerkuEcT7omz",
      "SE2": "https://ipfs.io/ipfs/Qmb5ozKVjBJjSUkUWvgapSSW6a7pYewYHLsjySHVK3n724",
      "SE3": "https://ipfs.io/ipfs/QmdeJWhns7mVTdVHhbNp2toa63tM16cm21RwYBrcEwLVnF",
      "SE4": "https://ipfs.io/ipfs/QmU5nEwDD5fVqaMnMjkZ6o9xDBATw2zrTqLipAaKjpJCtR",
      "FI": "https://ipfs.io/ipfs/QmPQojZz5DRjWDkENhTPYV4GaSxC9ybpzHf6t2rUX9XhXS",
      "SYS": "https://ipfs.io/ipfs/QmQrBafFSfRLct3za2biUEMLtdXh6fWuHnwRGEBpVGFWAw"
    }
    var result = ipfsUrlMap[priceAreaId];
    return result
  } 

  return (
    <>
      <div onClick={() => setVisible(true)}>
        <Icon fill="#e49c02" size={24} svg="user" />
      </div>

      <Modal
        onCloseButtonPressed={() => setVisible(false)}
        hasFooter={false}
        title="Your contracts"
        isVisible={isVisible}
        canOverflow={true}
      >
        <div style={{display:"flex", justifyContent:"start", flexWrap:"wrap", gap:"15px", overflow: "scroll"}}>
          {userContracts &&
            userContracts.map((e)=>{
              return(
                <div style={{ width: "220px"}}>
                  <Card
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)}`} // add convertPriceArea
                  >
                    <div>
                      <img
                        width="200px"
                        height="140px"
                        src={priceAreaImageUrl(e.attributes.priceArea)}
                        />
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Strike {e.attributes.strike}  €/MWh
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Payout 
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                      {e.attributes.payout/10**18}
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Fee
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />{e.attributes.fee/10**18}
                    </div>
                    <div className="buttonContainers">
                    <Button
                      isFullWidth
                      color="blue"
                      icon="chainlink"
                      iconColor="white"
                      onClick={() => requestPrice(String(e.attributes.optionAddress), e.attributes.startEpoch, e.attributes.duration)} // for testing add startEpoch and duration
                      size="default"
                      text="Request"
                      theme="primary"
                      type="button"
                    />
                    <Button
                      onClick={() => evaluateContract(String(e.attributes.optionAddress))}
                      isFullWidth
                      text="Evaluate"
                      theme="colored"
                      color="yellow"
                    />
                    </div>
                  </Card> 
                </div>
              )
            })
          }
          {providerContracts &&
            providerContracts.map((e)=>{
              return(
                <div style={{ width: "220px"}}>
                  <Card
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)}`} // add convertPriceArea
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Provider
                      </span>
                    </div>
                    <div>
                      <img
                        width="200px"
                        height="140px"
                        src={priceAreaImageUrl(e.attributes.priceArea)}
                        />
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Strike {e.attributes.strike}  €/MWh
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Payout 
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                      {e.attributes.payout/10**18}
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Fee
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />{e.attributes.fee/10**18}
                    </div>
                    <div className="buttonContainers">
                    <Button
                      isFullWidth
                      color="blue"
                      icon="chainlink"
                      iconColor="white"
                      onClick={() => requestPrice(String(e.attributes.optionAddress))}
                      size="default"
                      text="Request"
                      theme="primary"
                      type="button"
                    />
                    <Button
                      onClick={() => evaluateContract(String(e.attributes.optionAddress))}
                      isFullWidth
                      text="Evaluate"
                      theme="colored"
                      color="yellow"
                    />
                    </div>
                  </Card> 
                </div>
              )
            })
          }
          {finishedContracts &&
            finishedContracts.map((e)=>{
              return(
                <div style={{ width: "220px"}}>
                  <Card
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)}`} // add convertPriceArea
                  >
                    <div>
                      <img
                        width="200px"
                        height="140px"
                        src={priceAreaImageUrl(e.attributes.priceArea)}
                        />
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Strike {e.attributes.strike}  €/MWh
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Payout 
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                      {e.attributes.payout/10**18}
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Fee
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />{e.attributes.fee/10**18}
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Result {e.attributes.value/100}  €/MWh
                      </span>
                    </div>
                  </Card> 
                </div>
              )
            })
          }
          {finishedProviderContracts &&
            finishedProviderContracts.map((e)=>{
              return(
                <div style={{ width: "220px"}}>
                  <Card
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)}`} // add convertPriceArea
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Provider
                      </span>
                    </div>
                    <div>
                      <img
                        width="200px"
                        height="140px"
                        src={priceAreaImageUrl(e.attributes.priceArea)}
                        />
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Strike {e.attributes.strike}  €/MWh
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Payout 
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />
                      {e.attributes.payout/10**18}
                    </div>
                    <div
                      style={{
                        color: '#808080',
                        display: 'flex',
                        padding: '2.5px',
                        gap: '5px',
                        justifyContent:'flex-end',
                        fontSize: '12px',
                        width: '70%'
                      }}
                    >
                      Fee
                      <Icon
                        fill="rgb(228, 156, 2)" 
                        size={14} 
                        svg="matic"
                      />{e.attributes.fee/10**18}
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent:'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#000000',
                          fontWeight: 600
                        }}
                      >
                        Result {e.attributes.value/100}  €/MWh
                      </span>
                    </div>
                  </Card> 
                </div>
              )
            })
          }
        </div>
      </Modal>
    </>
  );
}

export default User;
