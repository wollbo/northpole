import React from "react";
import "./Market.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import logo from "../images/npsimple2.png";
import { ConnectButton, Icon, DatePicker, Select, Input, Button} from "web3uikit";
import { useState } from "react";

const Market = () => {
  const { state: searchFilters } = useLocation(); // change searchReminder to searchFilter, default NO filter show all contracts

  const [contractDate, setContractDate] = useState(searchFilters.contractDate); // should be hardcoded to only day, setDay
  const [priceArea, setPriceArea] = useState(searchFilters.priceArea);
  const [energyAmount, setEnergyAmount] = useState(searchFilters.energyAmount); // some sort of minimum/maximum MWh
  //future work: each seller provide a strikePrice/Payout/fee curve which customers can choose to purchase
  const contractsList = [
    {
      attributes: {
        priceArea: "Sundsvall",
        contractDate: "2022-04-22",
        fee: "20 €/MWh",
        strikePrice: "150 €",
        payOut: "100 €/MWh",
        minAmount: "1 MWh",
        maxAmount: "10 MWh",
        imgUrl:
          "https://ipfs.io/images/ipfs-cluster.png",
      },
    },
  ];

  return (
    <>
      <div className="marketBanner">
        <div>
          <Link to="/">
            <img className="logo" src={logo} alt="logo"></img>
          </Link>
        </div>
        <div className="searchFields">
          <div className="inputs">
            Price Area
            <Select
              // defaultOptionIndex={0}
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
              value={priceArea}
            />
          </div>
          <div className="vl"/>
          <div className="inputs">
            Contract Date
            <DatePicker
              id="contractDate"
              value={contractDate.toISOString().slice(0, 10)} // in final product, this should map to YYYY-MM-01
              onChange={(event) => setContractDate(event.date)} // really only one date needed, should be hardcoded to setDay
            />
          </div>
          <div className="vl" />
          <div className="inputs">
            Energy (MWh)
            <Input
              value={energyAmount}
              name="addEnergy"
              type="number"
              //prefixIcon="plug"
              onChange={(event) => setEnergyAmount(Number(event.target.value))}
            />
          </div>
          <Link to={"/market"} state={{
            priceArea: priceArea,
            contractDate: contractDate, // hardcode to one single day
            energyAmount: energyAmount
          }}>
            <div className="searchButton">
              <Icon fill="#ffffff" size={24} svg="search" />
            </div>
          </Link>
        </div>
        <div className="lrContainers">
          {/* {account &&
          <User account={account} />
        } */}
          <ConnectButton />
        </div>
      </div>
      <div className="marketPlace">
        <div className="marketPlaceContracts">
          {contractsList &&
          contractsList.map(e => {
            return( // and prefill number input beside purchase button+
              <>
                <div className="contractDiv">
                  <img className="priceAreaImg" src={e.attributes.imgUrl}></img>
                  <div className="contractInfo">
                    <div className="contractTitle">({e.attributes.priceArea} {e.attributes.contractDate}) {e.attributes.strikePrice}</div>
                    <div className="contractDesc">Payout {e.attributes.payOut}</div> 
                    <div className="contractDesc">{e.attributes.minAmount} - {e.attributes.maxAmount}</div>
                    <div className="bottomButton">
                      <Button
                        text="Purchase"
                      />
                      <div className="price">
                        <Icon fill="rgb(228, 156, 2)" size={10} svg="matic" /> {e.attributes.fee}
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="line2"></hr>
                </>
            )
          })}
        </div>
        <div className="marketPlaceMap">
        </div>
      </div>
    </>
  );
};

export default Market;
