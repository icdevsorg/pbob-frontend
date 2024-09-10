import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Agent } from '../types';
import { Principal } from '@dfinity/principal';
import { HttpAgent } from '@dfinity/agent';
import { useIdentityKit } from '@nfid/identitykit/react';

export const useICRCLedger = ({
  canisterId,
}: {
  canisterId: string;
}): IcrcLedgerCanister => {
  let agent: Agent;

  const { agent: identityAgent } = useIdentityKit();
  if (identityAgent) {
    agent = identityAgent;
  } else {
    // If not use anonymous agent
    agent = HttpAgent.createSync({
      host: 'https://ic0.app',
    });
  }
  return IcrcLedgerCanister.create({
    agent,
    canisterId: Principal.fromText(canisterId),
  });
};
