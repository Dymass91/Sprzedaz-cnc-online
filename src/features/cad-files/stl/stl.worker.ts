/// <reference lib="webworker" />
import { processStl } from "./process";
import type { StlWorkerRequest } from "./protocol";

/** Worker: parsowanie i analiza STL poza wątkiem interfejsu. */
self.onmessage = (event: MessageEvent<StlWorkerRequest>) => {
  const { id, buffer } = event.data;
  const result = processStl(id, buffer);
  if (result.ok) {
    (self as DedicatedWorkerGlobalScope).postMessage(result, [result.positions.buffer]);
  } else {
    (self as DedicatedWorkerGlobalScope).postMessage(result);
  }
};
