import type { MatchProtocolEvent, MatchProtocolState, ServerEventEnvelope } from "@sakkah-baloot/game-protocol";

export interface ClientCommand<TAction = unknown> {
  readonly matchId:string;
  readonly actionId:string;
  readonly playerId:string;
  readonly expectedStateVersion:number;
  readonly action:TAction;
}

export interface HostDispatchResult {
  readonly accepted:boolean;
  readonly duplicate:boolean;
  readonly envelope:ServerEventEnvelope<MatchProtocolEvent>|null;
  readonly state:MatchProtocolState;
}

export interface AuthoritativeEventStore {
  readonly state:MatchProtocolState;
  readonly events:readonly ServerEventEnvelope<MatchProtocolEvent>[];
  readonly dispatch(event:MatchProtocolEvent, expectedStateVersion:number, actionId:string):HostDispatchResult;
  readonly snapshot():{readonly matchId:string;readonly stateVersion:number;readonly state:MatchProtocolState};
}

export function createAuthoritativeEventStore(
  initial:MatchProtocolState,
):AuthoritativeEventStore {
  let state=initial;
  let events:ServerEventEnvelope<MatchProtocolEvent>[]=[];
  const actionToEvent=new Map<string,ServerEventEnvelope<MatchProtocolEvent>>();

  return {
    get state(){return state;},
    get events(){return events;},
    dispatch(event,expectedStateVersion,actionId){
      const existing=actionToEvent.get(actionId);
      if(existing){
        return {accepted:true,duplicate:true,envelope:existing,state};
      }
      if(expectedStateVersion!==state.stateVersion){
        throw new Error(`STALE_STATE_VERSION: expected ${state.stateVersion}, received ${expectedStateVersion}`);
      }
      if(event.roundId && "roundId" in event && event.roundId!==state.roundId && event.type!=="NEXT_ROUND"){
        throw new Error("ROUND_MISMATCH");
      }

      const envelope:ServerEventEnvelope<MatchProtocolEvent>={
        matchId:state.matchId,
        eventId:`${state.matchId}:action:${actionId}`,
        stateVersion:state.stateVersion+1,
        event,
      };

      const next=reduceProtocolState(state,envelope);
      state=next;
      events=[...events,envelope];
      actionToEvent.set(actionId,envelope);
      return {accepted:true,duplicate:false,envelope,state};
    },
    snapshot(){
      return {matchId:state.matchId,stateVersion:state.stateVersion,state};
    },
  };
}

function reduceProtocolState(
  state:MatchProtocolState,
  envelope:ServerEventEnvelope<MatchProtocolEvent>,
):MatchProtocolState {
  const event=envelope.event;
  const score=event.type==="ROUND_COMPLETE"||event.type==="MATCH_COMPLETE"?event.score:state.score;
  return {
    ...state,
    stateVersion:envelope.stateVersion,
    score,
    phase:phaseFor(event),
    roundId:event.type==="NEXT_ROUND"?event.roundId:state.roundId,
    roundNumber:event.type==="NEXT_ROUND"?event.nextRoundNumber:state.roundNumber,
    dealerSeat:event.type==="DEAL"||event.type==="NEXT_ROUND"?event.dealerSeat:state.dealerSeat,
  };
}

function phaseFor(event:MatchProtocolEvent):MatchProtocolState["phase"]{
  switch(event.type){
    case"DEAL":return"DEAL";
    case"BID":return"BID";
    case"PLAY_CARD":return"PLAY_CARD";
    case"BALOOT":return"BALOOT";
    case"PROJECT":return"PROJECT";
    case"TRICK_COMPLETE":return"TRICK_COMPLETE";
    case"ROUND_COMPLETE":return"ROUND_COMPLETE";
    case"NEXT_ROUND":return"NEXT_ROUND";
    case"MATCH_COMPLETE":return"MATCH_COMPLETE";
  }
}
