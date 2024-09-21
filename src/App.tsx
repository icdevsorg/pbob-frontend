import './App.css';
import React, { useState, useEffect, ReactElement } from 'react';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/bob.png';
import viteLogo from './assets/vite.svg';
import { useQueryCall, useUpdateCall } from '@ic-reactor/react';
import { Principal } from '@dfinity/principal';
import {Agent, Actor} from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';

import pLimit from 'p-limit';

import { idlFactory as icpFactory, createActor as createICP} from './declarations/nns-ledger';
import { _SERVICE as icpService } from './declarations/nns-ledger/index.d';

import { idlFactory as bobFactory, createActor as createbobTemp } from './declarations/bob';
import { _SERVICE as bobService } from './declarations/bob/index.d';
import {  Miner } from './declarations/bob/bob.did.d';

import { idlFactory as bobInstanceFactory, createActor as createbobInstanceTemp } from './declarations/bobInstance';
import { _SERVICE as bobServiceInstance } from './declarations/bobInstance/index.d';
import {  Stats as InstanceStats } from './declarations/bobInstance/bobInstance.did.d';

import { idlFactory as pbobFactory, createActor as createpbobTemp} from './declarations/backend';
import { _SERVICE as pbobService} from './declarations/backend/index.d';
import {  Stats } from './declarations/backend/backend.did.d';


const bobLedgerID = "7pail-xaaaa-aaaas-aabmq-cai";
const icpCanisterID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const bobCanisterID = "6lnhz-oaaaa-aaaas-aabkq-cai";
const pbobCanisterID = "oqvo3-qqaaa-aaaas-aibca-cai";
const oldpbobCanisterID = "auotf-hqaaa-aaaas-aem7q-cai";

function App() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null) ;
  const [isConnected, setIsConnected] = useState("none");
  const [loading, setLoading] = useState(false);
  const [icpBalance, setIcpBalance] = useState<bigint>(0n);
  const [bobLedgerBalance, setBobLedgerBalance] = useState<bigint>(0n);
  const [pbobLedgerBalance, setPBobLedgerBalance] = useState<bigint>(0n);
  const [share, setShare] = useState<bigint>(0n);
  const [stats, setStats] = useState<Stats | null>(null);
  const [minedBlocks, setMinedBlocks] = useState<bigint | null>(null);
  const [bShowMiners, setbShowMiners] = useState(false);

  type MinerStats = {
    [key: string]: InstanceStats;
  };

  const [minerStats, setMinerStats] = useState<MinerStats>({});

  const [miners, setMiners] = useState<Miner[]>([]);

  const [bobActor, setBobActor] = useState<bobService |null>(null);
  const [bobActorTemp, setBobActorTemp] = useState<bobService |null>(null);
  const [pbobActor, setPBobActor] = useState<pbobService |null>(null);
  const [pbobActorTemp, setPBobActorTemp] = useState<pbobService |null>(null);
  const [icpActor, setIcpActor] = useState<icpService | null>(null);
  const [bobLedgerActor, setBobLedgerActor] = useState<icpService | null>(null);
  const [yourPrincipal, setYourPrincipal] = useState<string>("null");

  function bigintToFloatString(bigintValue: bigint, decimals = 8) {
    const stringValue = bigintValue.toString();
    
    if (decimals === 0) {
      // If decimals is 0, return the whole number with commas
      return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Ensure the string is long enough by padding with leading zeros if necessary
    const paddedStringValue = stringValue.padStart(decimals + 1, '0');
    // Insert decimal point decimals places from the end
    const beforeDecimal = paddedStringValue.slice(0, -decimals);
    const afterDecimal = paddedStringValue.slice(-decimals);
    // Combine and trim any trailing zeros after the decimal point for display
    const result = `${beforeDecimal}.${afterDecimal}`.replace(/\.?0+$/, '');
    
    // Add commas to the integer part
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return parts.join('.');
  }
  


  const checkConnection = async () => {
    try {
      // Assuming window.ic?.plug?.isConnected() is a Promise-based method
      
      const connected = await window.ic.plug.isConnected();
      if(connected){
        await handleLogin();
      } else {
        
      };

      
      
    } catch (error) {
      console.error("Error checking connection status:", error);
      // Handle any errors, for example, by setting an error state
    }
  };

  useEffect(() => {
    
    console.log("Component mounted, waiting for user to log in...");
    //console.log("first time", isConnected);

    setUpStatsActor();

    setUpAuthClient();



    //checkConnection();
  }, []); // Dependency array remains empty if you only want this effect to run once on component mount

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    console.log("actors updated", icpActor, bobActor, bobLedgerActor, pbobActor);
  
    fetchBalances();
    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [icpActor, bobActor, bobLedgerActor, pbobActor]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    //console.log("actors updated", icpActor, bobActor, bobLedgerActor, pbobActor);
  
    fetchStats();
    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [pbobActorTemp, bobActorTemp]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    //console.log("actors updated", icpActor, bobActor, bobLedgerActor, pbobActor);  


    var totalBlocks = 0n;
    for (var i = 0; i < miners.length; i++) {
      totalBlocks += BigInt(miners[i].mined_blocks);
    };

    setMinedBlocks(totalBlocks);
    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [miners]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    //console.log("actors updated", icpActor, bobActor, bobLedgerActor, pbobActor);
    const fetchInstanceStats = async () => {
      if(miners != null){
        let limit = pLimit(2);
  
        var instanceStats = await Promise.all(miners.map(async (miner) => limit(async () => {
          try{
            let bobInstanceActorTemp = await createbobInstanceTemp(miner.id, {
              agentOptions:{host: "https://ic0.app"},
            });
            let stats = await bobInstanceActorTemp.get_statistics();
            

            // Update the state every time a miner's stats are fetched
            setMinerStats((prevStats) => ({
              ...prevStats,
              [miner.id.toString()]: stats,
            }));
            
          } catch (error) { 
            console.log("error", error, miner);
          };
         
        })));

      };
    };

    fetchInstanceStats();

    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [bShowMiners]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    if (isConnected !== "none") {
      
      fetchPrincipal();
      // Ensure fetchBalances is defined and correctly handles asynchronous operations
      setUpActors();
    };

    console.log("isConnected", isConnected);

    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [isConnected]);

  const setUpAuthClient = async () => {
    setAuthClient(await AuthClient.create());
  };

  const fetchPrincipal = async () => {
    if(isConnected == "plug") {
      if(!(await window.ic.plug.agent)) return;
      setYourPrincipal((await window.ic.plug.agent.getPrincipal()).toString());
    } else if(isConnected == "ii" && authClient != null){
      setYourPrincipal((await authClient.getIdentity()).getPrincipal().toString());
    }
  };

  const getPrincipalFromAgent  = async () => {
    if(isConnected == "plug") {
      if(!(await window.ic.plug.agent)) return Principal.anonymous();
      return await window.ic.plug.agent.getPrincipal();
    } else if(isConnected == "ii" && authClient != null){
      return await authClient.getIdentity().getPrincipal();
    };
    return Principal.anonymous();
  };

  const fetchStats = async () => {

    if(bobActorTemp != null){

      var [miners, miners2] = await Promise.all([
        bobActorTemp.get_miners(Principal.fromText(pbobCanisterID)),
        bobActorTemp.get_miners(Principal.fromText(oldpbobCanisterID))
      ]);
      console.log("Miners", miners);
      console.log("Miners", miners2);

      //merge miners and miners2
      miners = miners.concat(miners2).sort((a, b) => Number(b.mined_blocks) - Number(a.mined_blocks));

      console.log("Miners fetched:", miners);

      await setMiners(miners);
    };
    

    if(pbobActorTemp != null){
      let stats = await pbobActorTemp.stats();
      await setStats(stats);

      
    };
  };

  let buildMinerStats : MinerStats = {};



  const setUpStatsActor = async () => {
    console.log("Fetching stats...", pbobActor);
    const getPBOBActor = await createpbobTemp(pbobCanisterID, {
      agentOptions:{host: "https://ic0.app"},
    });

    const getBOBActor = await createbobTemp(bobCanisterID, {
      agentOptions:{host: "https://ic0.app"},
    });

    await setPBobActorTemp(getPBOBActor);
    await setBobActorTemp(getBOBActor);
  };

  const setUpActors = async () => {

    console.log("Setting up actors...", icpCanisterID, bobCanisterID, bobLedgerID, pbobCanisterID);

    if(isConnected == "none") return;

    

    if(isConnected == "plug"){

      const getICPActor = await window.ic.plug.createActor({
        canisterId: icpCanisterID,
        interfaceFactory: icpFactory,
      })

      await setIcpActor(getICPActor);

      const getPBOBActor = await window.ic.plug.createActor({
        canisterId: pbobCanisterID,
        interfaceFactory: pbobFactory,
      })

      await setPBobActor(getPBOBActor);

      await setBobActor(await window.ic.plug.createActor({
        canisterId: bobCanisterID,
        interfaceFactory: bobFactory,
      }));


      await setBobLedgerActor(await window.ic.plug.createActor({
        canisterId: bobLedgerID,
        interfaceFactory: icpFactory,
      }));
    } else if(isConnected == "ii" && authClient != null){ 

      

      await setIcpActor(createICP(Principal.fromText(icpCanisterID), {
        agentOptions: {
          host: "https://ic0.app", 
          identity: authClient.getIdentity()
        }
      }));



      await setPBobActor(createpbobTemp(Principal.fromText(pbobCanisterID), {
        agentOptions: { 
          host: "https://ic0.app",
          identity: authClient.getIdentity()
          }
          }));

      await setBobActor(createbobTemp(Principal.fromText(bobCanisterID), {
        agentOptions: { 
          host: "https://ic0.app",
          identity: authClient.getIdentity()
          }
      }));


      await setBobLedgerActor(createICP(bobLedgerID , {
        agentOptions: { 
          host: "https://ic0.app",
          identity: authClient.getIdentity()
          }
      }));
    };
    
    
  };

  const fetchBalances = async () => {
    // Assuming icdvFactory and icpFactory are your actor factories
    // You'd need to replace this with actual logic to instantiate your actors and fetch balances
    // This is a placeholder for actor creation and balance fetching

    console.log("Fetching balances...", icpActor, bobLedgerActor, pbobActor);
    if(bobLedgerActor === null || icpActor === null || pbobActor === null || bobActor === null) return;
    // Fetch balances (assuming these functions return balances in a suitable format)

    let owner = await getPrincipalFromAgent();

    if(owner === null) return;
    let icpBalance = await icpActor.icrc1_balance_of({
      owner: owner,
      subaccount: [],
    });
    await setIcpBalance(icpBalance);
  
    console.log("Fetching balances...", icpBalance);

    let bobLedgerBalance = await bobLedgerActor.icrc1_balance_of({
          owner: owner,
          subaccount: [],
        });

    console.log("Fetching balances...", bobLedgerBalance);
    
    let pbobLedgerBalance = await pbobActor.icrc1_balance_of({
      owner: owner,
      subaccount: [],
    });

    await setPBobLedgerBalance(pbobLedgerBalance);

    console.log("Fetching balances...", pbobLedgerBalance);

    let share = await pbobActor.get_share_of({
      owner: owner,
      subaccount: [],
    });

    console.log("Fetching balances...", share);

      await setShare(share);

      console.log("Balances fetched:", bobLedgerBalance, icpBalance, pbobLedgerBalance);

      await setBobLedgerBalance(bobLedgerBalance);

  };

  const handleShowMiners = async () => {
    setbShowMiners(!bShowMiners);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await window.ic.plug.disconnect();
      setIsConnected("none");
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
      try {
        const connected = await window.ic.plug.isConnected();
        if (!connected) {
          let pubkey = await window.ic.plug.requestConnect({
            // whitelist, host, and onConnectionUpdate need to be defined or imported appropriately
            whitelist: [bobCanisterID, icpCanisterID, bobLedgerID, pbobCanisterID],
            host: "https://ic0.app",
            onConnectionUpdate: async () => {
              console.log("Connection updated", await window.ic.plug.isConnected());
              await setIsConnected("plug");
            },
          });
          console.log("Connected with pubkey:", pubkey);
          await setIsConnected("plug");
        } else {
          setIsConnected("plug");
          //await handleLogin();
        };
      } catch (error) {
        console.error('Login failed:', error);
        setIsConnected("none");
      } finally {
        setLoading(false);
      }
    
  };

  

  const handleLoginII = async () => {
    setLoading(true);
    if (!authClient) return;
      try {
        authClient.login({
            identityProvider:
              process.env.DFX_NETWORK === "ic"
              ? "https://identity.ic0.app/#authorize"
              : `http://localhost:4943?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}#authorize`,
            onSuccess: async () => {
              
              await setIsConnected("ii");
            },
          });
          
      } catch (error) {
        console.error('Login failed:', error);
        setIsConnected("none");
      } finally {
        setLoading(false);
      }
    
  };

  const handleSendICP = async () => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    if(!icpActor) return;

    setLoading(true);
    try {
    let targetPrincipal = prompt("Enter the principal you want to send ICP to:");
    if(targetPrincipal === null) return;

    let amount = prompt("Enter the amount of ICP you want to send (deduct the fee of 0.0001):");
    if(amount === null) return;

    const amountInE8s = BigInt(Math.floor(Number(amount) * 100000000))

    
      // Assuming icpActor and icdvActor are already initialized actors
      alert("This may take a while! If it fails, refresh and log back in as it may still execute on the back end.");
      const result = await icpActor.icrc1_transfer({
        to: {
          owner : Principal.fromText(targetPrincipal),
          subaccount: [],
        },
        amount: amountInE8s,
        fee: [],
        from_subaccount: [],
        created_at_time: [],
        memo: [],
      });

      if ("Ok" in result) {
        alert("ICP sent successfully.");
        fetchBalances();
      } else {
        alert("Send failed.");
      }
    } catch (error) {
      console.error('Send failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendBob = async () => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    if(!bobLedgerActor) return;

    setLoading(true);
    try {
    let targetPrincipal = prompt("Enter the principal you want to send BoB to:");
    if(targetPrincipal === null) return;

    let amount = prompt("Enter the amount of Bob you want to send(deduct the fee of 0.01):");
    if(amount === null) return;

    const amountInE8s = BigInt(Math.floor(Number(amount) * 100000000));

    
      // Assuming icpActor and icdvActor are already initialized actors
      alert("This may take a while! If it fails, refresh and log back in as it may still execute on the back end.");
      const result = await bobLedgerActor.icrc1_transfer({
        to: {
          owner : Principal.fromText(targetPrincipal),
          subaccount: [],
        },
        amount: amountInE8s,
        fee: [],
        from_subaccount: [],
        created_at_time: [],
        memo: [],
      });

      if ("Ok" in result) {
        alert("BoB sent successfully.");
        fetchBalances();
      } else {
        alert("Send failed.");
      }
    } catch (error) {
      console.error('Send failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };


  const handleSendPBob = async () => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    if(!pbobActor) return;

    setLoading(true);
    try {
    let targetPrincipal = prompt("Enter the principal you want to send pBoB to(deduct the fee of 0.0001):");
    if(targetPrincipal === null) return;

    let amount = prompt("Enter the amount of pBoB you want to send:");
    if(amount === null) return;

    const amountInE8s = BigInt(Math.floor(Number(amount) * 100000000));

    
      // Assuming icpActor and icdvActor are already initialized actors
      alert("This may take a while! If it fails, refresh and log back in as it may still execute on the back end.");
      const result = await pbobActor.icrc1_transfer({
        to: {
          owner : Principal.fromText(targetPrincipal),
          subaccount: [],
        },
        amount: amountInE8s,
        fee: [],
        from_subaccount: [],
        created_at_time: [],
        memo: [],
      });

      if ("Ok" in result) {
        alert("pBoB sent successfully.");
        fetchBalances();
      } else {
        alert("Send failed.");
      }
    } catch (error) {
      console.error('Send failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  

  const handleMint = async () => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    
    const amountInE8s = BigInt(140030000);

    if (amountInE8s > icpBalance) {
      alert("You do not have enough ICP.");
      return;
    }

    if(!icpActor || !pbobActor) return;

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const approvalResult  = await icpActor.icrc2_approve({
        amount: amountInE8s,
        // Adjust with your canister ID and parameters
        spender: {
          owner: await Principal.fromText(pbobCanisterID),
          subaccount: [],
        },
        memo: [],
        fee: [10000n],
        created_at_time: [],
        expires_at: [],
        expected_allowance: [],
        from_subaccount: [],
      });

      if ("Ok" in approvalResult) {
        alert("This may take a long time! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. A message box should appear after a few seconds.");
        let result = await pbobActor.mintMinter([]);
        if("ok" in result){
          alert("Mint successful! Block: " + result.ok.toString() + ".");
        } else {  
          alert("Mint failed! " + result.err.toString());
        };
        fetchBalances();
        fetchStats();
      } else {
        alert("Mint failed.");
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
      await fetchBalances();
      await fetchStats();
    }
  };

  const handleFunding1 = async () => {
    handleFunding(140030000n);
  };

  const handleFunding4 = async () => {
    handleFunding(520030000n);
  };

  const handleFunding16 = async () => {
    handleFunding(1920030000n);
  };

  const handleFunding64 = async () => {
    handleFunding(7040030000n);
  };

  const handleFunding256 = async () => {
    handleFunding(26880040000n);
  };

  const handleFunding1024 = async () => {
    handleFunding(104960040000n);
  };




  const handleFunding = async (amount : bigint) => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    
    const amountInE8s = amount;

    if (amountInE8s > icpBalance) {
      alert("You do not have enough ICP.");
      return;
    }

    if(!icpActor || !pbobActor) return;

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const approvalResult  = await icpActor.icrc2_approve({
        amount: amountInE8s,
        // Adjust with your canister ID and parameters
        spender: {
          owner: await Principal.fromText(pbobCanisterID),
          subaccount: [],
        },
        memo: [],
        fee: [10000n],
        created_at_time: [],
        expires_at: [],
        expected_allowance: [],
        from_subaccount: [],
      });

      if ("Ok" in approvalResult) {
        alert("This may take a while! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. The Initial transaction may take up to 5 minutes. Your transactions will complete and then your pBob will should be minted within 5 minutes. If an error occurs and your ICP is refunded, you can try again. If you have any issues, please contact the pBob OpenChat.");
        let result = await pbobActor.fundCycles([],amountInE8s );
        if("ok" in result && "Ok" in result.ok ){
          alert("Mint successful! Block: " + result.ok.Ok.toString() + ".");
        } else if ("ok" in result) {
          alert("Mint unreachable:");
        } else {  
          console.log("fund failed", result);
          alert("Mint failed! " + result.err.toString());
        };
        fetchBalances();
        fetchStats();
      } else {
        console.log("Approval failed", approvalResult); 
        alert("Mint failed." + + approvalResult.Err.toString());
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
      await fetchBalances();
      await fetchStats();
    }
  };

  const handleWithdrawl = async () => {
    if (isConnected == "none") {
      alert("Please connect your wallet first.");
      return;
    }

    if(!pbobActor) return;

    alert("This may take a while! If it fails, refresh and log back in as it may still execute on the back end.");

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const withdrawResult  = await pbobActor.withdraw({
        owner: await getPrincipalFromAgent(),
        subaccount: [],
      });

      if ("ok" in withdrawResult) {
        alert("Your Bob has been sent to your account.");
        fetchBalances();
      } else {
        alert("Withdraw failed." + withdrawResult.err);
      }
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div>
        <a href="https://icdevs.org" target="_blank">
          <img src={viteLogo} className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://bob.fun" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a
          href="https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/"
          target="_blank"
        >
          <span className="logo-stack">
            <img
              src={motokoShadowLogo}
              className="logo motoko-shadow"
              alt="Motoko logo"
            />
            <img src={motokoLogo} className="logo motoko" alt="Motoko logo" />
          </span>
        </a>
      </div>
      <h1>pBob Pool</h1>
      <h2>Mine BOB with Frens</h2>
      <p><a href="https://oc.app/community/ajck3-xqaaa-aaaaf-bm5oq-cai" target="_blank">Join our OpenChat Group</a></p>

      <p><b>Note: If you are missing pBob: the old pBob canister, tokens, rewards, and miners will be merged into this pool once the canister stops.</b></p>
      {stats ?(

          <div>
            <table align='center'>
            <tbody>
            <tr><td><b>Stats</b></td></tr>
            <tr><td>Pool Mined Blocks: {minedBlocks ? bigintToFloatString(minedBlocks, 0) : "...searching..."}</td></tr>
            <tr><td>Total Bob Distributed: {bigintToFloatString(stats.totalBobDist)}</td></tr>
            <tr><td>Total Bob Withdrawn: {bigintToFloatString(stats.totalBobWithdrawn)}</td></tr>
            <tr><td>Total Cycles Funded: {bigintToFloatString(stats.totalCyclesFunded, 0)}</td></tr>
            <tr><td>Miners: {stats.miners.toString()}</td></tr>
            <tr><td>Hashes Computed: {bigintToFloatString(stats.hashesComputed, 0)}</td></tr>
            <tr><td>pBob total supply: {bigintToFloatString(stats.totalSupply)}</td></tr>
            <tr><td>Holders: {stats.holders.toString()}</td></tr>
            </tbody>
            </table>
          </div>
          ): (<div/>)
          }
      <h3>The BOB canister is not open sourced and is deployed and developed by an anon. <b>YOU SHOULD NEVER TRUST A CANISTER THAT IS NOT OPEN SOURCE WITH YOUR ASSETS.</b> It was not built by ICDevs.org, we don't know who built it, and we have no control over it. It very well may be a scam and you may lose any and all ICP sent to the canister. Expect to lose any funds deposited. Donations to ICDevs.org are non-refundable and benefit funding of public goods in the IC ecosystem.  By using this site or the pBob canister you acknowledge that ICDevs has warned you about the risks involved and you absolve ICDevs.org of any liability for your actions or the behavior of the pBob interface and canister.  This site is purely educational.</h3>

      <h4>When you fund Fund Cycles through the pBob pool you donate some amount to ICDevs.org. This goes directly to an 8 year locked neuron and cannot be returned. The ICP is used to mint fund cycles. When you withdraw your BOB, 1% is donated to ICDevs.org.</h4>
      <p>The pBob canister is at <a href="https://dashboard.internetcomputer.org/canister/oqvo3-qqaaa-aaaas-aibca-cai" target="_blank">oqvo3-qqaaa-aaaas-aibca-cai</a> - An ICRC-2 canister.</p>

      
      
      <div className="card">
      </div>
      <div className="card">
        
        {isConnected == "none" ? (
          <div>
          <button onClick={handleLogin} disabled={loading}>Login with Plug</button><span>&nbsp;</span><button onClick={handleLoginII} disabled={loading}>Login with II</button>
          </div>
        ) : (
          <>
            <button onClick={handleLogout} disabled={loading}>Logout</button>
            <h3>Your current $pBob Balance: {bigintToFloatString(pbobLedgerBalance)}</h3>
            {isConnected == "ii" ? (<button onClick={handleSendPBob} disabled={loading}>Send pBoB</button>) : (<div />)}
            
            <h3>Your current $Bob Balance: {bigintToFloatString(bobLedgerBalance)}</h3>
            {isConnected == "ii" ? (<button onClick={handleSendBob} disabled={loading}>Send BoB</button>) : (<div />)}
            <h3>Your current $ICP Balance: {bigintToFloatString(icpBalance)}</h3>
            {isConnected == "ii" ? (<button onClick={handleSendICP} disabled={loading}>Send ICP</button>) : (<div />)}
            
            <div className="card">
            {icpBalance < 140040000 ? (
              <div>
                <p>You need more ICP to add a Bob Miner to the pBob pool. Send At least 1.4004 ICP to your principal. Your principal is<br/> <b>{yourPrincipal}</b></p>
              </div>
            ) : (
              <div>
              <p>You can fund our Miners in the Pool with cycles. <br/>Your principal is {yourPrincipal}</p>  
              <h2>Fund Cycles and get ~1,000,000 pBob</h2>
              <button onClick={handleFunding1} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (1.4004 ICP - 40% donation)"}
              </button>
              <p></p>
              <h2>Fund Cycles and get ~4,000,000 pBob</h2>
              <button onClick={handleFunding4} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (5.2004 ICP - 30% donation)"}
              </button>
              <p></p>
              <h2>Fund Cycles and get ~16,000,000 pBob</h2>
              <button onClick={handleFunding16} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (19.2004 ICP - 20% donation)"}
              </button>
              <p></p>
              <h2>Fund Cycles and get ~64,000,000 pBob</h2>
              <button onClick={handleFunding64} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (70.4004 ICP - 10% donation)"}
              </button>
              <p></p>
              <h2>Fund Cycles and get ~256,000,000 pBob</h2>
              <button onClick={handleFunding256} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (268.8004 ICP - 5% donation)"}
              </button>
              <p></p>
              <h2>Fund Cycles and get ~1,024,000,000 pBob</h2>
              <button onClick={handleFunding1024} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (1,049.6004 ICP - 2.5% donation)"}
              </button>
              <p></p>
              {/* <p>You can add a Miner to the pBob pool. <br/>Your principal is {yourPrincipal}</p>
              <h2>Add a Minter and get ~500,000 pBob</h2>
              <button onClick={handleMint} disabled={loading}>
                {"Click here to add an Miner and mint $pBOB (1.4004 ICP)"}
              </button> */}
        
              
                
              </div>
            )}
          </div>
          <div className="card">
            
             {share < 10_000 ? (
              <div>
                <p>You need more share of the pBob pool before you can withdraw Bob. Current: {bigintToFloatString(share)}</p>
              </div>
            ) : (
              <div>
              
              <button onClick={handleWithdrawl} disabled={loading}>
                  {"Withdraw about " + bigintToFloatString(share) + " Bob"}
                </button>
              </div>
            )}
          </div>
          
          </>
        )
        }
      </div>
      {miners ? <div className="card">
            {miners.length > 0 && bShowMiners ? (
                
                
              // iterate through the miners and list the details
              <div>
                <h2>Pool Miners</h2>
                <div>
                <table align='center'>
                  <thead><th>Miner</th><th>Blocks</th><th>Cycles</th><th>Burn</th></thead>
                  <tbody>
                    {miners.map((miner) => (
                    <tr key={miner.id.toString()}>
                      <td>{miner.id.toString()} </td><td>{miner.mined_blocks.toString()}</td><td>{minerStats[miner.id.toString()] ? bigintToFloatString(minerStats[miner.id.toString()].cycle_balance,0) : "pending"}</td> <td>{minerStats[miner.id.toString()] ? bigintToFloatString(minerStats[miner.id.toString()].cycles_burned_per_minute,0) : "pending"}</td>
                    </tr>
                  
                  ))}
                  </tbody>
                </table>
                </div>
              </div>
              ) : (
              <div>
                <button onClick={handleShowMiners} disabled={loading}>Show Miner Detail</button>
              </div>
              )}
          </div> : <div/>}
      <p className="read-the-docs">
        Built by ICDevs.org on top of Bob.fun with Motoko. Click logos to learn more.
      </p>
    </div>
  );
}

export default App;
