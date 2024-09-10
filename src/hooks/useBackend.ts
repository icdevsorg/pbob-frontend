import { Agent } from '../types';
import { Principal } from '@dfinity/principal';
import { HttpAgent, Actor } from '@dfinity/agent';
import { useIdentityKit } from '@nfid/identitykit/react';
import {
  _SERVICE as BackendCanister,
  idlFactory as BackendIdlFactory,
} from '../declarations/backend/backend';

export const useBackend = ({
  canisterId,
}: {
  canisterId: string;
}): BackendCanister => {
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

  return Actor.createActor(BackendIdlFactory, {
    agent: agent,
    canisterId,
  });
};
