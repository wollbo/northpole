import React from "react";
import styled from "styled-components"
import "./Home.css";
import "../App.css";
import { Link } from "react-router-dom";
import bg from "../images/waterfallbg.jpg";
import logo from "../images/npsimple.png";
import { ConnectButton, DatePicker, Select, Input, Icon, Logo} from "web3uikit";
import { useState } from "react";

const StyledSelect = styled.div`
  border: 0px !important;
  padding-left: 0px !important;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
  height: 40px !important;
  font-size: 14px !important;
  width: 170px !important;
`;

const StyledConnect = styled.div`
  font-size: 2px !important
`

const Home = () => {
  const [contractDate, setContractDate] = useState(new Date()); // initialize to either day or month
  const [priceArea, setPriceArea] = useState("SE1");
  const [energyAmount, setEnergyAmount] = useState(1); // some sort of minimum/maximum MWh

  // has to be in range of listed contracts minPower < powerAmount < maxPower
  // create market page, default clickable through tab- no filter
  // create functionality for creating, listing and cancelling contract
  // seller has to specify+fund oracle to contract
  // seller should initialize contract and have it already deposited when listed, change this
  // seller registers master smart contract containing the MAX ETH of all listed (MAX MWh * contracts) contracts
  // Javascript converter from datetime to epoch

  return (
    <>
      <div className="container" style={{ backgroundImage: `url(${bg})`}}>
        <div className="containerGradient"></div>
      </div>
      <div className="topBanner">
        <div>
          <img className="logo" src={logo} alt="logo"></img>
        </div>
        <div className="tabs">
          <div className="selected">Home</div>
          <div><Link to="/market" state={{
            priceArea: "",
            contractDate: contractDate, // hardcode to one single day
            energyAmount: ""
          }} style={{ textDecoration: 'none' }} className="link">Market</Link></div>
        </div>
        <div className="lrContainers">       
          <ConnectButton />
        </div>
      </div> 
      <div className="tabContent">
        <div className="searchFields">
          <div className="inputs">
            Price Area
            <div id="select">
              <Select 
                defaultOptionIndex={0}
                onChange={(data) => setPriceArea(data.id)}
                options={[
                  {
                    id: "SE1",
                    label: "Lule??"
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
                    label: "Malm??"
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
          </div>
          <div className="vl"/>
          <div className="inputs">
            Contract Date
            <DatePicker
              id="contractDate"
              //type="month" // with month this works but calendar is disabled!
              //disabled="False"
              //value={contractDate.toLocaleString('default', { month: 'long' })} // "1999-02-22" format works
              onChange={(event) => setContractDate(event.date)} // really only one date needed, should be hardcoded to setDay
              //validation={{min: Date.toISOString().slice(0, 10)}} // add validation later
            />
          </div>
          <div className="vl" />
          <div className="inputs">
            Energy (MWh)
            <Input
              value={1}
              name="addEnergy"
              type="number"
              //prefixIcon="plug"
              onChange={(event) => setEnergyAmount(Number(event.target.value))}
            />
          </div>
          <Link to={"/market"} state={{
            priceArea: priceArea,
            contractDate: contractDate,
            energyAmount: energyAmount
          }}>
            <div className="searchButton">
              <Icon fill="#ffffff" size={24} svg="search" />
            </div>
          </Link>
        </div>
      </div>
      <div className="electricityMarket">
        <div className="title"> Hedge electricity</div>
        <div className="text"> Peer-to-peer decentralized binary options on European physical energy markets </div>
      </div>
      <div className="bottomRight">
        <div>
          <Icon fill="rgb(255, 255, 255)" size={25} svg="chainlink" />
        </div>
        <div>
          <Icon fill="rgb(255, 255, 255)" size={33} svg="matic" />
        </div>
        <div>
          <Logo color="white" theme="icon"/>
        </div>
      </div>
      <div className="bottomRightText">
        <div className="text"> Powered by</div>
      </div>
    </>
  );
};

export default Home;
