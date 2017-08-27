//@flow

/* eslint-disable object-shorthand */

import { combineReducers } from 'redux'
import { createReducer } from 'redux-act'

import { API } from 'Action'
import { type ApiMetaPL } from '../action'
import List from '../../util/immutable-list'
import guard from '../../util/match-spec'
import { type ApiNewRequest, type OnRequestDone } from '../index.h'
import { RpcApiError } from '../../error'
import { type MessageUnit } from '../../task/index.h'
import { guardedReducer } from '../helpers'

const eqTest = guard({
  flags: {
    api : true,
    body: true,
  },
  api: {
    resolved: true,
  },
})

const guardedRequestDone = /*:: ( */ guardedReducer([
  (_: List<ApiNewRequest, string>, msg: MessageUnit) => eqTest(msg),
  (acc: List<ApiNewRequest, string>, msg: MessageUnit) => acc.has(msg.api.apiID),
], requestDoneReducer) /*:: , requestDoneReducer) */


function requestDoneReducer(acc: List<ApiNewRequest, string>, msg: MessageUnit) {
  console.log(`\n--- requestDone ---\n`, msg)
  // if (!msg.flags.api || !msg.flags.body || !msg.api.resolved || !acc.has(msg.api.apiID)) return acc
  const stored = acc
    .get(msg.api.apiID)
    .netReq
    .deferFinal
  if (msg.flags.error){
    if (msg.error.handled)
      return acc
    stored.reject(new RpcApiError(msg.error.code, msg.error.message))
  } else
    stored.resolve(msg.body)
  return acc.delete(msg.api.apiID)
}

const api = createReducer({
  //$FlowIssue
  [API.REQUEST.NEW]: (state: List<ApiNewRequest, string>, payload: ApiNewRequest, meta: ApiMetaPL) =>
    state.set(meta.id, { ...payload, timestamp: new Date(payload.timestamp) }),
  //$FlowIssue
  [API.REQUEST.DONE]: (state: List<ApiNewRequest, string>,
                       payload: OnRequestDone) =>
    payload
      .filter(data => data.flags.api)
      .reduce(guardedRequestDone, state)
}, List.empty())

const reducer = combineReducers({
  api
})

export default reducer
