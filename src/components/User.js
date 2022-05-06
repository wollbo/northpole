import React from "react";
import { Icon, Modal, Card } from "web3uikit";
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
    return new Date(epoch);
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
        <Icon fill="#e49c02" size={24} svg="user" />
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
                    title={`${e.attributes.priceArea} ${convertDate(e.attributes.startEpoch*1000)} average >${e.attributes.strike} €`} // add convertPriceArea
                    description={`cost ${e.attributes.fee} payout ${e.attributes.payout}`}
                  >
                    <div>
                      <img
                        width="180px"
                        src="https://ipfs.io/images/ipfs-cluster.png"
                        />
                    </div>
                  </Card> 
                </div>// transform into this card https://web3ui.github.io/web3uikit/?path=/story/4-ui-card--pro-plan with Upgrade as CheckStrike
              )
            })
          }
        </div>
      </Modal>
    </>
  );
}

export default User;
