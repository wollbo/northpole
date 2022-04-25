import React from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import bg from "../images/waterfallbg.jpg";
import logo from "../images/npsimple.png";
import { ConnectButton, DatePicker, Select, Input, Icon, TabList, Tab } from "web3uikit";
import { useState } from "react";


const Home = () => {
  const [contractDate, setContractDate] = useState(new Date()); // should be hardcoded to only day, setDay
  const [priceArea, setPriceArea] = useState("Luleå");
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
        {/* <div className="tabs">
          <TabList defaultActiveKey={1} tabStyle="bar">
            <Tab tabKey={1} tabName={"Home"}></Tab>
            <Tab tabKey={2} tabName={"Market"}></Tab>
          </TabList>
        </div> */}
        <div className="lrContainers">
          <ConnectButton />
        </div>
      </div> 
      <div className="tabContent">
        <div className="searchFields">
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
          <div className="vl"/>
          <div className="inputs">
            Contract Date
            <DatePicker
              id="contractDate"
              onChange={(event) => setContractDate(event.date)} // really only one date needed, should be hardcoded to setDay
              //validation={{min: Date.toISOString().slice(0, 10)}} add validation later
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
            contractDate: contractDate, // hardcode to one single day
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
    </>
  );
};

export default Home;
