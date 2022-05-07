import React from "react";
import { Icon, Modal, Card, Button } from "web3uikit";
import { useState, useEffect } from "react";
import {useMoralis} from "react-moralis";

function User({account}) {

  const [isVisible, setVisible] = useState(false);
  const { Moralis } = useMoralis();
  const [userContracts, setUserContracts] = useState();

  const priceAreaMap = {
      "se1": "Luleå",
      "se2": "Sundsvall",
      "se3": "Stockholm",
      "se4": "Malmö",
      "fin": "Finland",
      "sys": "System"
  };


  useEffect(() => {

    async function fetchContracts() {
      const Contracts = Moralis.Object.extend("ContractActive"); // not only listed but ACTIVE contracts
      const query = new Moralis.Query(Contracts);
      query.equalTo("clientAddress", account);
      const result = await query.find();

     
      setUserContracts(result);
    }

    fetchContracts();
  }, [isVisible]);

  function convertDate(epoch) {
    const d = new Date(epoch);
    return d.toISOString().slice(0, 10);
  }

  function convertPriceArea(shortName) {
    const priceAreaMap = {
      "se1": "Luleå",
      "se2": "Sundsvall",
      "se3": "Stockholm",
      "se4": "Malmö",
      "fin": "Finland",
      "sys": "System"
    };
    try {
      return priceAreaMap.shortName;
    }
    catch {
      return shortName;
    }
  }

  return (
    <>
      <div onClick={() => setVisible(true)}>
        <Icon fill="#e49c02" size={28} svg="plus" />
      </div>

      <Modal
        onCloseButtonPressed={() => setVisible(false)}
        hasFooter={false}
        title="Your contracts"
        isVisible={isVisible}
      >
        <div style={{display:"flex", justifyContent:"start", flexWrap:"wrap", gap:"10px"}}>
          {userContracts &&
            userContracts.map((e)=>{
              return(
                <div style={{ width: "200px"}}>
                  <Card
                    isDisabled
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)}`} // add convertPriceArea
                  >
                    <div>
                      <img
                        width="180px"
                        src="https://ipfs.io/images/ipfs-cluster.png"
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
                    <Button
                      isFullWidth
                      text="Evaluate"
                      theme="primary"
                    />
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