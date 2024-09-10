import { SignerAgent } from '@slide-computer/signer-agent';
import { Signer } from '@slide-computer/signer';
import { HttpAgent } from '@dfinity/agent';

export type Agent = SignerAgent<Signer> | HttpAgent;
