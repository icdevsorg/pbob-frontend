import './App.css';
import React, { useState, useEffect, ReactElement } from 'react';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/bob.png';
import viteLogo from './assets/vite.svg';
import { useQueryCall, useUpdateCall } from '@ic-reactor/react';
import { Principal } from '@dfinity/principal';
import {Agent, Actor} from '@dfinity/agent';

import { idlFactory as icpFactory} from './declarations/nns-ledger';
import { _SERVICE as icpService } from './declarations/nns-ledger/index.d';

import { idlFactory as bobFactory, createActor as createbobTemp } from './declarations/bob';
import { _SERVICE as bobService } from './declarations/bob/index.d';
import {  Miner } from './declarations/bob/bob.did.d';

import { idlFactory as pbobFactory, createActor as createpbobTemp} from './declarations/backend';
import { _SERVICE as pbobService} from './declarations/backend/index.d';
import {  Stats } from './declarations/backend/backend.did.d';

const bobLedgerID = "7pail-xaaaa-aaaas-aabmq-cai";
const icpCanisterID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const bobCanisterID = "6lnhz-oaaaa-aaaas-aabkq-cai";
const pbobCanisterID = "oqvo3-qqaaa-aaaas-aibca-cai";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [icpBalance, setIcpBalance] = useState<bigint>(0n);
  const [bobLedgerBalance, setBobLedgerBalance] = useState<bigint>(0n);
  const [pbobLedgerBalance, setPBobLedgerBalance] = useState<bigint>(0n);
  const [share, setShare] = useState<bigint>(0n);
  const [stats, setStats] = useState<Stats | null>(null);

  const [miners, setMiners] = useState<Miner[]>([]);

  const [bobActor, setBobActor] = useState<bobService |null>(null);
  const [bobActorTemp, setBobActorTemp] = useState<bobService |null>(null);
  const [pbobActor, setPBobActor] = useState<pbobService |null>(null);
  const [pbobActorTemp, setPBobActorTemp] = useState<pbobService |null>(null);
  const [icpActor, setIcpActor] = useState<icpService | null>(null);
  const [bobLedgerActor, setBobLedgerActor] = useState<icpService | null>(null);
  const [yourPrincipal, setYourPrincipal] = useState<string>("null");

  function bigintToFloatString(bigintValue : bigint, decimals = 8) {
    const stringValue = bigintValue.toString();
    // Ensure the string is long enough by padding with leading zeros if necessary
    const paddedStringValue = stringValue.padStart(decimals + 1, '0');
    // Insert decimal point decimals places from the end
    const beforeDecimal = paddedStringValue.slice(0, -decimals);
    const afterDecimal = paddedStringValue.slice(-decimals);
    // Combine and trim any trailing zeros after the decimal point for display
    const result = `${beforeDecimal}.${afterDecimal}`.replace(/\.?0+$/, '');
    return result;
  }
  


  const checkConnection = async () => {
    try {
      // Assuming window.ic?.plug?.isConnected() is a Promise-based method
      
      const connected = await window.ic.plug.isConnected();
      if(connected){
        await handleLogin();
      } else {
        
      }
      
    } catch (error) {
      console.error("Error checking connection status:", error);
      // Handle any errors, for example, by setting an error state
    }
  };

  useEffect(() => {
    
    console.log("Component mounted, waiting for user to log in...");
    //console.log("first time", isConnected);

    setUpStatsActor();



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
    if (isConnected) {
      
      fetchPrincipal();
      // Ensure fetchBalances is defined and correctly handles asynchronous operations
      setUpActors();
    };

    console.log("isConnected", isConnected);

    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [isConnected]);

  const fetchPrincipal = async () => {
    if(!(await window.ic.plug.agent)) return;
    setYourPrincipal((await window.ic.plug.agent.getPrincipal()).toString());
  };

  const fetchStats = async () => {

    if(bobActorTemp != null){
      let miners = await bobActorTemp.get_miners(Principal.fromText(pbobCanisterID));
      console.log ("Miners", miners);

      console.log("Miners fetched:", miners);

      await setMiners(miners);
    };
    

    if(pbobActorTemp != null){
      let stats = await pbobActorTemp.stats();
      await setStats(stats);

      
    };
  };

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

    const getICPActor = await window.ic.plug.createActor({
      canisterId: icpCanisterID,
      interfaceFactory:icpFactory,
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
    
    console.log("actors", icpActor, bobLedgerActor, bobActor);
  };

  const fetchBalances = async () => {
    // Assuming icdvFactory and icpFactory are your actor factories
    // You'd need to replace this with actual logic to instantiate your actors and fetch balances
    // This is a placeholder for actor creation and balance fetching

    console.log("Fetching balances...", icpActor, bobLedgerActor, pbobActor);
    if(bobLedgerActor === null || icpActor === null || pbobActor === null || bobActor === null) return;
    // Fetch balances (assuming these functions return balances in a suitable format)

    


    let icpBalance = await icpActor.icrc1_balance_of({
      owner: await window.ic.plug.agent.getPrincipal(),
      subaccount: [],
    });
    await setIcpBalance(icpBalance);
  
    console.log("Fetching balances...", icpBalance);

    let bobLedgerBalance = await bobLedgerActor.icrc1_balance_of({
          owner: await window.ic.plug.agent.getPrincipal(),
          subaccount: [],
        });

    console.log("Fetching balances...", bobLedgerBalance);
    
    let pbobLedgerBalance = await pbobActor.icrc1_balance_of({
      owner: await window.ic.plug.agent.getPrincipal(),
      subaccount: [],
    });

    await setPBobLedgerBalance(pbobLedgerBalance);

    console.log("Fetching balances...", pbobLedgerBalance);

    let share = await pbobActor.get_share_of({
      owner: await window.ic.plug.agent.getPrincipal(),
      subaccount: [],
    });

    console.log("Fetching balances...", share);

      await setShare(share);

      console.log("Balances fetched:", bobLedgerBalance, icpBalance, pbobLedgerBalance);

      await setBobLedgerBalance(bobLedgerBalance);

  };



  const handleLogout = async () => {
    setLoading(true);
    try {
      await window.ic.plug.disconnect();
      setIsConnected(false);
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
              await setIsConnected(!!await window.ic.plug.isConnected());
            },
          });
          console.log("Connected with pubkey:", pubkey);
          await setIsConnected(true);
        } else {
          setIsConnected(true);
          //await handleLogin();
        };
      } catch (error) {
        console.error('Login failed:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    
  };

  const handleMint = async () => {
    if (!isConnected) {
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


  const handleFunding = async () => {
    if (!isConnected) {
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
        alert("This may take a while! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. A message box should appear after a few seconds.");
        let result = await pbobActor.fundCycles([],amountInE8s );
        if("ok" in result){
          alert("Mint successful! Block: " + result.ok.toString() + ".");
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
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if(!pbobActor) return;

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const withdrawResult  = await pbobActor.withdraw({
        owner: await window.ic.plug.agent.getPrincipal(),
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
            <tr><td>pBob total supply: {bigintToFloatString(stats.totalSupply)}</td></tr>
            <tr><td>Holders: {stats.holders.toString()}</td></tr>
            <tr><td>Miners: {stats.miners.toString()}</td></tr>
            <tr><td>Total Bob Withdrawn: {bigintToFloatString(stats.totalBobWithdrawn)}</td></tr>
            <tr><td>Total Bob Distributed: {bigintToFloatString(stats.totalBobDist)}</td></tr>
            <tr><td>Total Cycles Funded: {stats.totalCyclesFunded.toString()}</td></tr>
            <tr><td>Hashes Computed: {stats.hashesComputed.toString()}</td></tr>
            <tr><td>Challenges Solved: {stats.solvedChallenges.toString()}</td></tr>
            </tbody>
            </table>
          </div>
          ): (<div/>)
          }
      <h3>The BOB canister is not open sourced and is deployed and developed by an anon. <b>YOU SHOULD NEVER TRUST A CANISTER THAT IS NOT OPEN SOURCE WITH YOUR ASSETS.</b> It was not built by ICDevs.org, we don't know who built it, and we have no control over it. It very well may be a scam and you may lose any and all ICP sent to the canister. Expect to lose any funds deposited. Donations to ICDevs.org are non-refundable and benefit funding of public goods in the IC ecosystem.  By using this site or the pBob canister you acknowledge that ICDevs has warned you about the risks involved and you absolve ICDevs.org of any liability for your actions or the behavior of the pBob interface and canister.  This site is purely educational.</h3>

      <h4>When you mint a Bob Miner or Fund Cycles through the pBob pool you donate 0.4 ICP to ICDevs.org. This goes directly to an 8 year locked neuron and cannot be returned. The ICP is used to mint a Bob Miner and pay fees. When you withdraw your BOB, 1% is donated to ICDevs.org.</h4>
      <p>The pBob canister is at oqvo3-qqaaa-aaaas-aibca-cai - An ICRC-2 canister.</p>

      
      
      <div className="card">
      </div>
      <div className="card">
        
        {!isConnected ? (
          <button onClick={handleLogin} disabled={loading}>Login with Plug</button>
        ) : (
          <>
            <button onClick={handleLogout} disabled={loading}>Logout</button>
            <h3>Your current $pBob Balance: {bigintToFloatString(pbobLedgerBalance)}</h3>
            <h3>Your current $Bob Balance: {bigintToFloatString(bobLedgerBalance)}</h3>
            <h3>Your current $ICP Balance: {bigintToFloatString(icpBalance)}</h3>
            
            <div className="card">
            {icpBalance < 140030000 ? (
              <div>
                <p>You need more ICP to add a Bob Miner to the pBob pool. Send At least 1.4003 ICP to your principal. Your principal is {yourPrincipal}</p>
              </div>
            ) : (
              <div>
              <h2>Fund Cycles and get ~1,000,000 pBob</h2>
              <button onClick={handleFunding} disabled={loading}>
                {"Click here to fund cycles and mint $pBOB (1.4004 ICP)"}
              </button>
              <p></p>
              <p>You can add a Miner to the pBob pool. <br/>Your principal is {yourPrincipal}</p>
              <h2>Add a Minter and get ~900,000 pBob</h2>
              <button onClick={handleMint} disabled={loading}>
                {"Click here to add an Miner and mint $pBOB (1.4004 ICP)"}
              </button>
              
              
                
              </div>
            )}
          </div>
          <div className="card">
            <p>Withdraws are currently halted until the merge. Current: {bigintToFloatString(share)}</p>
            {/* {share < 10_000 ? (
              <div>
                <p>You need more share of the pBob pool before you can withdraw Bob. Current: {bigintToFloatString(share)}</p>
              </div>
            ) : (
              <div>
              
              <button onClick={handleWithdrawl} disabled={loading}>
                  {"Withdraw about " + bigintToFloatString(share) + " Bob"}
                </button>
              </div>
            )} */}
          </div>
          
          </>
        )
        }
      </div>
      {miners ? <div className="card">
            {miners.length > 0 ? (
              // iterate through the miners and list the details
              <div>
                <h2>Pool Miners</h2>
                <ul>
                {miners.map((miner) => (
                  <li key={miner.id.toString()}>
                    <p>{miner.id.toString()} - {miner.mined_blocks.toString()}</p>
                  </li>
                ))}
                </ul>
              </div>
              ) : (
              <div>
                <p>No miners.</p>
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
