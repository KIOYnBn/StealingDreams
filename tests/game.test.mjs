import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let engine;

before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });
  engine = await server.ssrLoadModule("/src/game.ts");
});

after(async () => {
  await server?.close();
});

const roles = [
  "wolf",
  "wolf",
  "wolf",
  "wolf",
  "villager",
  "villager",
  "villager",
  "villager",
  "seer",
  "witch",
  "hunter",
  "guard",
];
const smallBoard = {
  id: "custom",
  name: "测试",
  wolves: 1,
  villagers: 1,
  specials: ["seer", "witch", "hunter", "guard"],
};
const smallRoles = ["wolf", "villager", "seer", "witch", "hunter", "guard"];

function fresh() {
  return engine.createGame(
    engine.PRESETS[0],
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
}

function small() {
  return engine.createGame(
    smallBoard,
    { ...engine.DEFAULT_RULES, sheriff: false },
    smallRoles,
  );
}

function night(game, guard, wolf, witch, poison = null) {
  return {
    ...game,
    phase: "resolve",
    actions: { guard, wolf, witch, poison, seer: 1 },
  };
}

test("守卫不能连守，女巫自救和双药遵守设置", () => {
  const game = fresh();
  game.lastGuard = 6;
  game.actions.guard = 6;
  assert.match(engine.nightError(game), /连续两晚/);
  game.actions.guard = 0;
  assert.equal(engine.nightError(game), null);

  game.phase = "witch";
  game.actions.wolf = 10;
  assert.equal(engine.canWitchSave(game), true);
  game.night = 2;
  assert.equal(engine.canWitchSave(game), false);
  game.rules.selfSave = "always";
  assert.equal(engine.canWitchSave(game), true);
  game.actions.witch = "both";
  game.actions.poison = 1;
  assert.match(engine.nightError(game), /不允许/);
  game.rules.doublePotion = true;
  assert.equal(engine.nightError(game), null);

  const spent = fresh();
  spent.phase = "witch";
  spent.actions.wolf = 5;
  spent.actions.witch = "save";
  const next = engine.advanceNight(spent);
  assert.equal(next.antidote, false);
  next.phase = "witch";
  assert.equal(engine.canWitchSave(next), false);
});

test("同守同救和毒药按桌规结算，守护不能挡毒", () => {
  assert.deepEqual(
    engine.calculateNight(night(fresh(), 5, 5, "none")).deaths,
    [],
  );
  assert.deepEqual(
    engine.calculateNight(night(fresh(), 0, 5, "save")).deaths,
    [],
  );
  let game = night(fresh(), 5, 5, "save");
  assert.deepEqual(engine.calculateNight(game).deaths, [
    { player: 5, causes: ["clash"] },
  ]);
  game.rules.clash = "live";
  assert.deepEqual(engine.calculateNight(game).deaths, []);
  game = night(fresh(), 5, 5, "poison", 5);
  assert.deepEqual(engine.calculateNight(game).deaths, [
    { player: 5, causes: ["poison"] },
  ]);
  game = night(fresh(), 0, 5, "poison", 5);
  assert.deepEqual(engine.calculateNight(game).deaths, [
    { player: 5, causes: ["wolf", "poison"] },
  ]);
});

test("屠边与屠城分别按对应胜利条件判断", () => {
  const game = fresh();
  const noVillagers = game.players.map((player) =>
    player.role === "villager" ? { ...player, alive: false } : player,
  );
  assert.equal(engine.determineWinner(noVillagers, game.rules), "wolf");
  assert.equal(
    engine.determineWinner(noVillagers, { ...game.rules, victory: "all" }),
    null,
  );
  const noWolves = game.players.map((player) =>
    player.role === "wolf" ? { ...player, alive: false } : player,
  );
  assert.equal(engine.determineWinner(noWolves, game.rules), "good");
});

test("被毒猎人不能开枪，刀杀猎人可以选择带人", () => {
  let game = night(fresh(), 0, 5, "poison", 11);
  assert.equal(engine.hunterStatus(game), "cannot");
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.phase, "speech");
  assert.equal(game.players[10].alive, false);

  game = night(fresh(), 11, 11, "save");
  game.rules.hunterClash = false;
  assert.equal(engine.hunterStatus(game), "cannot");
  game = night(fresh(), 0, 11, "none");
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.phase, "hunter");
  game.hunterTarget = 1;
  game = engine.finishHunter(game);
  assert.equal(game.players[0].alive, false);
  assert.equal(game.phase, "speech");
});

test("首夜死者当选警长后可以移交警徽", () => {
  let game = night(fresh(), 0, 5, "none");
  game.rules.sheriff = true;
  game = engine.settleNight(game);
  assert.equal(game.phase, "election");
  game.electionTarget = 5;
  game = engine.announceDawn(engine.completeElection(game));
  assert.equal(game.phase, "badge");
  game.badgeTarget = 6;
  game = engine.finishBadge(game);
  assert.equal(game.sheriff, 6);
  assert.equal(game.phase, "speech");
});

test("狼刀优先与双方同时达成胜利的处理不同", () => {
  let game = night(small(), 0, 2, "poison", 1);
  game.rules.nightPriority = "wolf-first";
  game = engine.settleNight(game);
  assert.equal(game.forcedWinner, "wolf");
  assert.deepEqual(
    game.pendingDeaths.map((death) => death.player),
    [2],
  );
  game = engine.announceDawn(game);
  assert.equal(game.winner, "wolf");
  assert.equal(game.players[0].alive, true);

  game = night(small(), 0, 2, "poison", 1);
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.winner, "manual");
  assert.equal(
    engine.determineWinner(game.players, {
      ...engine.DEFAULT_RULES,
      simultaneous: "good",
    }),
    "good",
  );
  assert.equal(
    engine.determineWinner(game.players, {
      ...engine.DEFAULT_RULES,
      simultaneous: "wolf",
    }),
    "wolf",
  );
});

test("猎人开枪后再判断胜负", () => {
  let game = night(small(), 0, 5, "none");
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.phase, "hunter");
  game.hunterTarget = 1;
  game = engine.finishHunter(game);
  assert.equal(game.winner, "good");
});

test("警长票权、平票 PK 和狼人自爆", () => {
  let game = small();
  game.phase = "vote";
  game.sheriff = 1;
  game.vote.mode = "tally";
  game.vote.ballots = { 1: "2", 2: "3", 3: "3", 4: "2", 5: "0", 6: "0" };
  const tally = engine.tallyVotes(game);
  assert.equal(tally.complete, true);
  assert.equal(tally.totals[2], 2.5);
  assert.equal(tally.totals[3], 2);
  assert.deepEqual(tally.leaders, [2]);
  game = engine.beginPk(game, [2, 3]);
  assert.deepEqual(
    engine.voteVoters(game).map((player) => player.id),
    [1, 4, 5, 6],
  );
  game.rules.pkCandidatesVote = true;
  assert.equal(engine.voteVoters(game).length, 6);

  game = small();
  game.phase = "speech";
  game = engine.explode(game, 1);
  assert.equal(game.winner, "good");
});
