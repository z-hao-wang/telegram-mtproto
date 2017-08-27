//@flow
import { Fluture } from 'fluture'
import { type Emit } from 'eventemitter2'
import { type AsyncStorage } from 'mtproto-shared'

import { ProviderRegistryError } from '../error'
import { type TLSchema } from '../tl/index.h'
import type { DCNumber } from '../state/index.h'
import {
  type PublicKey,
  type PublicKeyExtended,
  type ApiConfig,
} from '../service/main/index.h'
import ScopedEmitter from '../event/scoped-emitter'
import NetworkerThread from '../service/networker'
import Layout from '../layout'

const provider: Provider = { }

export function getConfig(uid: string) {
  const config = provider[uid]
  if (config == null) throw new ProviderRegistryError(uid)
  return config
}

export function registerInstance(config: $Diff<InstanceConfig, InstanceDiff>) {
  const fullConfig: InstanceConfig = {
    //$FlowIssue
    ...config,
    keyManager   : keyManagerNotInited,
    timerOffset  : 0,
    seq          : {},
    session      : {},
    thread       : {},
    authRequest  : {},
    publicKeys   : {},
    lastMessageID: [0, 0]
  }
  provider[fullConfig.uid] = fullConfig
}

function keyManagerNotInited(/*::fingerprints: string[] */): PublicKeyExtended {
  throw new Error(`Key manager not inited`)
}

type InstanceConfig = {
  /*::+*/uid: string,
  emit: Emit,
  /*::+*/rootEmitter: ScopedEmitter,
  /*::+*/storage: AsyncStorage,
  /*::+*/apiConfig: ApiConfig,
  publicKeys: { [key: string]: PublicKey },
  keyManager: (fingerprints: string[]) => PublicKeyExtended,
  authRequest: { [dc: number]: Fluture<*, *> },
  seq: { [dc: number]: number },
  session: { [dc: number]: number[] },
  thread: { [dc: number]: NetworkerThread },
  /*::+*/schema: {|
    apiSchema: TLSchema,
    mtSchema: TLSchema
  |},
  /*::+*/layer: {|
    apiLayer: Layout,
    mtLayer: Layout,
  |},
  timerOffset: number,
  lastMessageID: [number, number],
  dcMap: Map<DCNumber, string>
}

type InstanceDiff = {
  timerOffset: number,
  lastMessageID: [number, number],
  authRequest: { [dc: number]: Fluture<*, *> },
  thread: { [dc: number]: NetworkerThread },
  keyManager(fingerprints: string[]): PublicKeyExtended,
  publicKeys: { [key: string]: PublicKey },
  seq: { [dc: number]: number },
  session: { [dc: number]: number[] },
}

type Provider = {
  [uid: string]: InstanceConfig
}
