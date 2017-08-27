//@flow

import { pipe, map } from 'ramda'
import { encaseP, of, reject } from 'fluture'

import {
  type PUnitList,

  type RawInput,
  type RawMessage,
  type RawContainer,
  type RawObject,
  type MessageDraft,
  type IncomingType,
  type SystemMessage,
  type MessageUnit,

  type ᐸPatchᐳSummaryReduced,
} from './index.h'
import { isApiObject } from './fixtures'
import parser from '../service/chain'
import processing from './processing'
import { dispatch } from '../state'
import { MAIN } from 'Action'
import { queryAuthKey, queryAuthID } from '../state/query'
import Config from '../config-provider'

import mergePatch from './merge-patch'

import Logger from 'mtproto-logger'
import { convertToUint8Array } from '../bin'
const log = Logger`task-index`

export default async function normalize(input: RawInput): Promise<PUnitList> {
  const ctx = await decrypt(input).promise()
  const flattenRaw = flattenMessage(ctx)
  const processed = processing(ctx, flattenRaw)
  return { ...mergePatch(ctx, processed), ctx }
}



function decrypt(input: RawInput) {
  console.warn(queryAuthID(input.dc))
  return of(input)
    .chain(decryptorF)
    .chain(validateDecrypt)
    .map(decrypted => ({ ...input, ...decrypted }))
}

const decryptor = ({ thread, result: { data }, dc }: RawInput) =>
  parser({
    responseBuffer: data,
    uid           : thread.uid,
    authKeyID     : queryAuthID(dc) || [],
    authKeyUint8  : convertToUint8Array(queryAuthKey(dc) || []),
    thisSessionID : Config.session.get(thread.uid, dc),
    prevSessionID : thread.prevSessionID,
    getMsgById    : thread.getMsgById,
  })

const decryptorF = encaseP(decryptor)

function validateDecrypt(decrypted) {
  const { response } = decrypted
  if (!isApiObject(response)) {
    return reject(new TypeError(`Invalid decrypted response`))
  }
  return of(decrypted)//{ ...input, ...decrypted }
}

let sess: string
const sessList: string[] = []

function flattenMessage(input): MessageDraft[] {
  const { messageID, seqNo, sessionID, message, response, net } = input
  // console.warn(sessList)
  // let token = String([...sessionID])
  // if (!sess) {
  //   sess = token
  //   sessList.push(token)
  // }
  // console.warn(token, sess)
  // if (sessList.includes(token) && sess && sess !== token)
  //   return []
  // if (!sessList.includes(token)) {
  //   sess = token
  //   sessList.push(token)
  // }
  // if (net.session) {
  //   token = String([...net.session])
  //   console.warn(token, sess)
  //   if (sessList.includes(token) && sess !== token)
  //     return []
  //   if (!sessList.includes(token)) {
  //     sess = token
  //     sessList.push(token)
  //   }
  // }
  const result = checkContainer(response)
  if (result.isContainer) return flattenContainer(input, result.data)
  else return [{
    type   : 'object',
    id     : messageID,
    seq    : seqNo,
    session: sessionID,
    dc     : message.dc,
    raw    : result.data
  }]
}

function checkContainer(response: RawMessage) {
  if (Array.isArray(response.messages)) {
    //$FlowIssue
    const container: RawContainer = response
    const result: {
      isContainer: true,
      data: RawContainer,
    } = {
      isContainer: true,
      data       : container,
    }
    return result
  } else {
    const data: RawObject = response
    const result: {
      isContainer: false,
      data: RawObject,
    } = {
      isContainer: false,
      data,
    }
    return result
  }
}

function flattenContainer(input, container: RawContainer): MessageDraft[] {
  const { messages } = container
  const ids = messages.map(({ msg_id }) => msg_id)
  const session = Config.session.get(input.thread.uid, input.dc)
  console.log(`input.sessionID`, input.sessionID)
  console.log(`real session`, session)
  const cont: MessageDraft = {
    type: 'container',
    id  : input.messageID,
    seq : input.seqNo,
    session,
    dc  : input.message.dc,
    raw : ids,
  }
  const normalizedMsgs: MessageDraft[] = messages.map(msg => ({
    type: 'inner',
    id  : msg.msg_id,
    seq : msg.seqno,
    session,
    dc  : input.message.dc,
    raw : msg,
  }))
  return [...normalizedMsgs, cont]
}
