import './App.css';
import React, { useState, useEffect, ReactElement } from 'react';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/bob.png';
import viteLogo from './assets/vite.svg';
import { Principal } from '@dfinity/principal';
import { Agent, Actor } from '@dfinity/agent';

// import { idlFactory as icpFactory } from './declarations/nns-ledger';
// import { _SERVICE as icpService } from './declarations/nns-ledger/index.d';

import {
  Stats as BackendStats,
  TransferResult,
} from './declarations/backend/backend';
// import { _SERVICE as bobService } from './declarations/bob/index.d';
// import { Miner } from './declarations/bob/bob.did.d';

// import {
//   idlFactory as pbobFactory,
//   createActor as createpbobTemp,
// } from './declarations/backend/backend';
// import { _SERVICE as pbobService } from './declarations/backend/index.d';
// import { Stats } from './declarations/backend/backend.did.d';
import { ConnectWallet, useIdentityKit } from '@nfid/identitykit/react';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { useICRCLedger } from './hooks/useICRCLedger';
import { useBobCanister } from './hooks/useBobCanister';
import { useBackend } from './hooks/useBackend';
import { parseResultResponse } from './utils';

const bobLedgerID = '7pail-xaaaa-aaaas-aabmq-cai';
const icpCanisterID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const bobCanisterID = '6lnhz-oaaaa-aaaas-aabkq-cai';
const pbobCanisterID = 'auotf-hqaaa-aaaas-aem7q-cai';

function App() {
  // Actor
  const bobCanisterActor = useBobCanister({ canisterId: bobCanisterID });
  const bobLedgerActor = useICRCLedger({ canisterId: bobLedgerID });
  const icpLedgerActor = useICRCLedger({ canisterId: icpCanisterID });
  const backendActor = useBackend({ canisterId: pbobCanisterID });

  // State
  const { connectedAccount, icpBalance } = useIdentityKit();
  const [load, setLoading] = useState(false);
  const [stats, setStats] = useState<BackendStats | null>(null);

  function bigintToFloatString(bigintValue: bigint, decimals = 8) {
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

  const fetchStats = async () => {
    if (!backendActor) {
      setStats(null);
    }

    try {
      const statsResp = await backendActor.stats();
      setStats(statsResp);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMint = async () => {
    if (!connectedAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    if (icpBalance === undefined || icpBalance === null) {
      alert('Cannot fetch ICP balance.');
      return;
    }

    const amountInE8s = BigInt(140030000);

    if (amountInE8s > icpBalance) {
      alert('You do not have enough ICP.');
      return;
    }

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const approvalResult = await icpLedgerActor.approve({
        amount: amountInE8s,
        // Adjust with your canister ID and parameters
        spender: {
          owner: await Principal.fromText(pbobCanisterID),
          subaccount: [],
        },
        fee: BigInt(10000),
      });

      const mintMinterResp = await backendActor.mintMinter([]);
      const txTransferResp: TransferResult =
        parseResultResponse(mintMinterResp);

      const index = parseResultResponse(txTransferResp);
    } catch (error) {
      console.error('Minting failed:', error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // const handleFunding = async () => {
  //   if (!connectedAccount) {
  //     alert('Please connect your wallet first.');
  //     return;
  //   }

  //   const amountInE8s = BigInt(140030000);

  //   if (amountInE8s > icpBalance) {
  //     alert('You do not have enough ICP.');
  //     return;
  //   }

  //   if (!icpActor || !pbobActor) return;

  //   setLoading(true);
  //   try {
  //     // Assuming icpActor and icdvActor are already initialized actors
  //     const approvalResult = await icpActor.icrc2_approve({
  //       amount: amountInE8s,
  //       // Adjust with your canister ID and parameters
  //       spender: {
  //         owner: await Principal.fromText(pbobCanisterID),
  //         subaccount: [],
  //       },
  //       memo: [],
  //       fee: [10000n],
  //       created_at_time: [],
  //       expires_at: [],
  //       expected_allowance: [],
  //       from_subaccount: [],
  //     });

  //     if ('Ok' in approvalResult) {
  //       alert(
  //         'This may take a while! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. A message box should appear after a few seconds.',
  //       );
  //       let result = await pbobActor.fundCycles([], amountInE8s);
  //       if ('ok' in result) {
  //         alert('Mint successful! Block: ' + result.ok.toString() + '.');
  //       } else {
  //         console.log('fund failed', result);
  //         alert('Mint failed! ' + result.err.toString());
  //       }
  //       fetchBalances();
  //       fetchStats();
  //     } else {
  //       console.log('Approval failed', approvalResult);
  //       alert('Mint failed.' + +approvalResult.Err.toString());
  //     }
  //   } catch (error) {
  //     console.error('Minting failed:', error);
  //     alert('An error occurred.');
  //   } finally {
  //     setLoading(false);
  //     await fetchBalances();
  //     await fetchStats();
  //   }
  // };

  // const handleWithdrawl = async () => {
  //   if (!isConnected) {
  //     alert('Please connect your wallet first.');
  //     return;
  //   }

  //   if (!pbobActor) return;

  //   setLoading(true);
  //   try {
  //     // Assuming icpActor and icdvActor are already initialized actors
  //     const withdrawResult = await pbobActor.withdraw({
  //       owner: await window.ic.plug.agent.getPrincipal(),
  //       subaccount: [],
  //     });

  //     if ('ok' in withdrawResult) {
  //       alert('Your Bob has been sent to your account.');
  //       fetchBalances();
  //     } else {
  //       alert('Withdraw failed.' + withdrawResult.err);
  //     }
  //   } catch (error) {
  //     console.error('Withdraw failed:', error);
  //     alert('An error occurred.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="App">
      <div
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
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
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <ConnectWallet />
      </div>

      <h1>pBob Pool</h1>
      <h2>Mine BOB with Frens</h2>
      {stats ? (
        <div>
          <table align="center">
            <tbody>
              <tr>
                <td>
                  <b>Stats</b>
                </td>
              </tr>
              <tr>
                <td>
                  pBob total supply: {bigintToFloatString(stats.totalSupply)}
                </td>
              </tr>
              <tr>
                <td>Holders: {stats.holders.toString()}</td>
              </tr>
              <tr>
                <td>Miners: {stats.miners.toString()}</td>
              </tr>
              <tr>
                <td>
                  Total Bob Withdrawn:{' '}
                  {bigintToFloatString(stats.totalBobWithdrawn)}
                </td>
              </tr>
              <tr>
                <td>
                  Total Bob Distributed:{' '}
                  {bigintToFloatString(stats.totalBobDist)}
                </td>
              </tr>
              <tr>
                <td>
                  Total Cycles Funded: {stats.totalCyclesFunded.toString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div />
      )}
      <h3>
        The BOB canister is not open sourced and is deployed and developed by an
        anon.{' '}
        <b>
          YOU SHOULD NEVER TRUST A CANISTER THAT IS NOT OPEN SOURCE WITH YOUR
          ASSETS.
        </b>{' '}
        It was not built by ICDevs.org, we don't know who built it, and we have
        no control over it. It very well may be a scam and you may lose any and
        all ICP sent to the canister. Expect to lose any funds deposited.
        Donations to ICDevs.org are non-refundable and benefit funding of public
        goods in the IC ecosystem. By using this site or the pBob canister you
        acknowledge that ICDevs has warned you about the risks involved and you
        absolve ICDevs.org of any liability for your actions or the behavior of
        the pBob interface and canister. This site is purely educational.
      </h3>

      <h4>
        When you mint a Bob Miner through the pBob pool you donate 0.4 ICP to
        ICDevs.org. This goes directly to an 8 year locked neuron and cannot be
        returned. The ICP is used to mint a Bob Miner and pay fees. When you
        withdraw your BOB, 1% is donated to ICDevs.org.
      </h4>
      <p>
        The pBob canister is at auotf-hqaaa-aaaas-aem7q-cai - An ICRC-2
        canister.
      </p>

      <p className="read-the-docs">
        Built by ICDevs.org on top of Bob.fun with Motoko. Click logos to learn
        more.
      </p>
    </div>
  );
}

export default App;
