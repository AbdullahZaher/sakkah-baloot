  assert.equal(snapshot.bidding.phase, "CONTRACT_SELECTED");
  assert.equal(snapshot.game?.phase, "PLAYING");

  while (snapshot.game?.phase === "PLAYING" && guard++ < 256) {
    if (snapshot.humanTurn) {
      assert.ok(snapshot.legalCardIds.length > 0, JSON.stringify({ phase: snapshot.game?.phase, currentPlayerId: snapshot.game?.currentPlayerId, humanTurn: snapshot.humanTurn, humanPlayerHandLength: snapshot.game?.hands?.HUMAN_PLAYER?.length, currentPlayerHandLength: snapshot.game?.hands?.[snapshot.game?.currentPlayerId ?? ""]?.length, playerKeys: Object.keys(snapshot.game?.hands ?? {}), players: snapshot.game?.players, trickNumber: snapshot.game?.trickNumber, currentTrickLength: snapshot.game?.currentTrick?.length, currentTrickPlayers: snapshot.game?.currentTrick?.map((play) => play.playerId), completedTricks: snapshot.game?.completedTricks?.length }));
      snapshot = session.dispatchCardPlay(snapshot.legalCardIds[0]);
    } else {