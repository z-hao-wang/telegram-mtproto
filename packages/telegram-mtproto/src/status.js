//@flow

import { async } from 'most-subject'
import { Stream, type Sink } from 'most'

import { emitter } from './state/portal'

export type ModuleStatus =
  | 'init'
  | 'import storage'
  | 'loaded'
  | 'dc detected'
  | 'activated'

/*::
opaque type EmptyStatus: ModuleStatus = 'init'
*/

export const statuses: {
  init: 'init',
  importStorage: 'import storage',
  loaded: 'loaded',
  dcDetected: 'dc detected',
  activated: 'activated'
} = {
  init         : 'init',
  importStorage: 'import storage',
  loaded       : 'loaded',
  dcDetected   : 'dc detected',
  activated    : 'activated',
}

const statusList: ModuleStatus[] = [
  'init',
  'import storage',
  'loaded',
  'dc detected',
  'activated'
]

const iso = {
  from(status: ModuleStatus) {
    const index = statusList.indexOf(status)
    if (index === -1) return 0
    return index
  },
  to(index: number): ModuleStatus {
    if (index < 0 || index > statusList.length - 1)
      return Status.empty()
    return statusList[index]
  },
  pro(fn: (index: number) => number): (status: ModuleStatus) => ModuleStatus {
    return (status: ModuleStatus) => iso.to(fn(iso.from(status)))
  }
}

const Status = {
  empty: (): ModuleStatus => statuses.init,
  next : iso.pro(n => n + 1),
  back : iso.pro(n => n - 1),
  eq   : (s1: ModuleStatus, s2: ModuleStatus) => s1 === s2,
  gt(s1: ModuleStatus, s2: ModuleStatus): boolean {
    return iso.from(s1) > iso.from(s2)
  },
  gte: (s1: ModuleStatus, s2: ModuleStatus) =>
    Status.eq(s1, s2) || Status.gt(s1, s2),
  max: (s1: ModuleStatus, s2: ModuleStatus) =>
    Status.gt(s1, s2)
      ? s1
      : s2,
  ensure(obj: mixed): ModuleStatus {
    switch (obj) {
      case 'init': return 'init'
      case 'import storage': return 'import storage'
      case 'loaded': return 'loaded'
      case 'dc detected': return 'dc detected'
      case 'activated': return 'activated'
      default: return Status.empty()
    }
  },
  is: isStatus
}

function isStatus(obj: mixed): boolean %checks {
  return statuses.init === obj
    || statuses.importStorage === obj
    || statuses.loaded === obj
    || statuses.dcDetected === obj
    || statuses.activated === obj
}

export default Status


declare class Subj<+T> extends Stream<T> {
  +source: Sink<T>,

  next (value: T): void,
  error <Err: Error> (err: Err): void,
  complete (value?: T): void,
}

type AsyncSubj = <+T>() => Subj<T>

/*::
(async: AsyncSubj)
*/

function pushList<T>(list: T[], subj: Subj<T>) {
  for (let i = 0, ln = list.length; i < ln; i++)
    subj.next(list[i])
}

export function statusGuard<T>(minStatus: ModuleStatus, guard: Stream<ModuleStatus>, source: Stream<T>): Stream<T> {
  const result = async()
  let buffer: T[] = []
  let active = false
  emitter.on('cleanup', () => {
    buffer = []
    // active = false
  })
  source.subscribe({
    next(x: T) {
      active
        ? result.next(x)
        : buffer.push(x)
    },
    error(x) {
      result.error(x)
    },
    complete(x?: T) {
      pushList(buffer, result)
      result.complete(x)
    }
  })

  guard
    .map(x => Status.gte(x, minStatus))
    .skipRepeats()
    .observe(x => {
      if (x) pushList(buffer, result)
      active = x
      buffer = []
    })
  return result
}
