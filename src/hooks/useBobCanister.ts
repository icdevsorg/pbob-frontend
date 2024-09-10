import { Agent } from '../types';
import { Principal } from '@dfinity/principal';
import { HttpAgent, Actor } from '@dfinity/agent';
import { useIdentityKit } from '@nfid/identitykit/react';
import {
  _SERVICE as BobCanister,
  idlFactory as BobIdlFactory,
} from '../declarations/bob/bob';

export const useBobCanister = ({
  canisterId,
}: {
  canisterId: string;
}): BobCanister => {
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

  return Actor.createActor(BobIdlFactory, {
    agent: agent,
    canisterId,
  });
};
