import test from "node:test";
import assert from "node:assert/strict";
import {createAuthoritativeEventStore} from "../dist/index.js";

const initial={
  matchId:"m1",stateVersion:0,roundId:"r1",roundNumber:1,dealerSeat:"NORTH",
  phase:"DEAL",score:{NORTH_SOUTH:0,EAST_WEST:0},escalation:"NORMAL",
};

test("event store increments authoritative versions",()=>{
  const store=createAuthoritativeEventStore(initial);
  const event={type:"BID",roundId:"r1",playerId:"P1",action:{type:"PASS",actionId:"a1"}};
  const result=store.dispatch(event,0,"a1");
  assert.equal(result.state.stateVersion,1);
  assert.equal(result.duplicate,false);
});

test("duplicate action id is idempotent",()=>{
  const store=createAuthoritativeEventStore(initial);
  const event={type:"BID",roundId:"r1",playerId:"P1",action:{type:"PASS",actionId:"a1"}};
  const first=store.dispatch(event,0,"a1");
  const second=store.dispatch(event,0,"a1");
  assert.equal(second.duplicate,true);
  assert.deepEqual(second.envelope,first.envelope);
  assert.equal(store.events.length,1);
});

test("stale client state is rejected",()=>{
  const store=createAuthoritativeEventStore(initial);
  const event={type:"BID",roundId:"r1",playerId:"P1",action:{type:"PASS",actionId:"a1"}};
  store.dispatch(event,0,"a1");
  assert.throws(()=>store.dispatch(event,0,"a2"),/STALE_STATE_VERSION/);
});

test("snapshot is replay-friendly",()=>{
  const store=createAuthoritativeEventStore(initial);
  const event={type:"BID",roundId:"r1",playerId:"P1",action:{type:"PASS",actionId:"a1"}};
  store.dispatch(event,0,"a1");
  const snapshot=store.snapshot();
  assert.equal(snapshot.stateVersion,1);
  assert.equal(snapshot.matchId,"m1");
});
