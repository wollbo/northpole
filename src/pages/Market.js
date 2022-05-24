import React, { useState, useEffect } from "react";
import "./Market.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import logo from "../images/npsimple2.png";
import { ConnectButton, Icon, DatePicker, Select, Input, Button, useNotification} from "web3uikit";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import Provider from "../components/Provider"
import User from "../components/User";
import Map from "../images/panordic.png";

const Market = () => {
  const { state: searchFilters } = useLocation(); // change searchReminder to searchFilter, default NO filter show all contracts

  const [contractDate, setContractDate] = useState(searchFilters.contractDate); // should be hardcoded to only day, setDay
  const [priceArea, setPriceArea] = useState(searchFilters.priceArea);
  const [energyAmount, setEnergyAmount] = useState(searchFilters.energyAmount); // some sort of minimum/maximum MWh
  const { Moralis, account } = useMoralis();
  const [contractsList, setContractsList] = useState();
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();

  const handleSuccess= () => {
    dispatch({
      type: "success",
      message: `Successfully purchased ${priceArea} contract for ${contractDate}`,
      title: "Purchase confirmed",
      position: "topL"
    });
  };

  const handleError= (msg) => {
    dispatch({
      type: "error",
      message: `${msg}`,
      title: "Purchase failed",
      position: "topL"
    });
  };

  const handleNoAccount= (msg) => {
    dispatch({
      type: "error",
      message: `${msg}`,
      title: "You need to connect your wallet to purchase contracts",
      position: "topL"
    });
  };

  useEffect(() =>{
    
    async function fetchContracts() {
      const Listed = Moralis.Object.extend("ContractListed");
      const query = new Moralis.Query(Listed);
      query.equalTo("priceArea", searchFilters.priceArea);
      //query.greaterThanOrEqualTo("maxMWh_decimal", searchFilters.energyAmount);
      //query.lessThanOrEqualTo("minMWh_decimal", searchFilters.energyAmount);
      //query.equalTo("startEpoch_decimal", Date.parse(searchFilters.contractDate)/1000); // commented out for testing; Date.parse returns in ms + GMT, sync this with adapter

      const Active = Moralis.Object.extend("ContractActive");
      const active = new Moralis.Query(Active);
      var contracts = await active.find();
      var activeContracts = [];
      contracts.forEach(contract => {
        activeContracts.push(contract.get("optionAddress"));
      })
      console.log(activeContracts);

      const Finished = Moralis.Object.extend("ContractFinished");
      const finished = new Moralis.Query(Finished);
      var contracts = await finished.find();
      var finishedContracts = [];
      contracts.forEach(contract => {
        finishedContracts.push(contract.get("optionAddress"));
      })
      console.log(finishedContracts);

      query.notContainedIn("optionAddress", finishedContracts) // for some reason this does not act as an 'and' operator
      query.notContainedIn("optionAddress", activeContracts)

      const result = await query.find();
      setContractsList(result);
    }

    fetchContracts();
  }, [searchFilters]);

  const purchaseContract = async function(optionAddress, fee) {


    let options = {
      contractAddress: optionAddress, // works
      functionName: "clientDeposit",
      abi: [
        {
          "inputs": [],
          "name": "clientDeposit",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }
      ],
      params: {},
      msgValue: fee
    }
    console.log(optionAddress);
    console.log(fee);

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
              value={priceArea}
            />
          </div>
          <div className="vl"/>
          <div className="inputs">
            Contract Date
            <DatePicker
              id="contractDate"
              value={contractDate.toISOString().slice(0, 10)} // in final product, this should map to YYYY-MM-01 (but display only YYYY-M)
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
          {account &&
          <User account={account} />
        }
          <ConnectButton />
          {account &&
          <Provider account={account} />
        }
        </div>
      </div>
      <div className="marketPlace">
        <div className="marketPlaceContracts">
          {contractsList && // eventually add /MWh and energy
          contractsList.map(e => { // add some way for contract creation through front end - endEpoch will be Date.parse(startEpoch)+86400000 (Date.parse uses ms)
            return( // Remap attributes.attribute for each attribute to name in moralis DB !! and add prefill number input beside purchase button+
              <> 
                <div className="contractDiv"> 
                  <img className="priceAreaImg" src={"https://ipfs.io/images/ipfs-cluster.png"}></img>
                  <div className="contractInfo">
                    <div className="contractTitle"> {">"} {e.attributes.strike} {"€/MWh"}</div>
                    <div className="contractDesc">
                      <div className="payout">
                        <Icon fill="rgb(228, 156, 2)" size={14} svg="matic" /> {e.attributes.payout/10**18} 
                        </div>
                      </div> 
                    <div className="contractDesc">{e.attributes.minAmount} - {e.attributes.maxAmount}</div>
                    <div className="bottomButton">
                      <Button // e.attributes.address fed as address parameter to purchaseContract
                      onClick={() => {
                        if(account){
                          purchaseContract(
                            String(e.attributes.optionAddress),
                            Number(e.attributes.fee_decimal.value.$numberDecimal)
                          )
                        }else{
                          handleNoAccount()
                        }
                      }
                      }
                        text="Purchase"
                      />
                      <div className="price">
                        <Icon fill="rgb(228, 156, 2)" size={10} svg="matic" /> {e.attributes.fee/10**18} 
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
          <img src={Map} alt="Price area map" height="766px" width="555px" />
        </div>
      </div>
    </>
  );
};

export default Market;
