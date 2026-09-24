    }

    if (snapshot.completedTrickPresentation) {
      snapshot = session.acknowledgeCompletedTrick();
    }

    assert.ok(snapshot.roundScore, `round score missing: ${JSON.stringify({ roundNumber: snapshot.roundNumber, gamePhase: snapshot.game?.phase ?? null, completedTricks: snapshot.game?.completedTricks.length ?? null, biddingPhase: snapshot.bidding.phase, matchEnd: snapshot.matchEnd.status, matchScore: snapshot.matchScore, lastEvent: snapshot.lastProtocolEvent, protocolVersion: snapshot.protocol.stateVersion })}`);
    const completedScore = snapshot.matchScore;

    if (snapshot.matchEnd.status === "FINISHED") {
      const terminal = session.advanceRound();
      assert.equal(terminal.matchEnd.status, "FINISHED");