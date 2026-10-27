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

test("狼刀优先也检查隐狼的额外刀", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-shadow-mirror");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "shadow",
    "villager",
    "villager",
    "villager",
    "villager",
    "guard",
    "witch",
    "hunter",
    "mirror",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false, nightPriority: "wolf-first" },
    roles,
  );
  game.players.forEach((player) => {
    if ([1, 2, 3, 6, 7, 8].includes(player.id)) player.alive = false;
  });
  game.night = 2;
  game.shadowLearned = "wolf";
  game.shadowLearnedNight = 1;
  game.actions.wolf = 11;
  game.actions.guard = 11;
  game.actions.shadowSkill = 5;
  game.actions.witch = "poison";
  game.actions.poison = 4;
  game = engine.settleNight(game);
  assert.equal(game.forcedWinner, "wolf");
  assert.deepEqual(
    game.pendingDeaths.map((death) => death.player),
    [5],
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

test("新增板子人数正确，10 人白狼王骑士需要补一张", () => {
  const expected = {
    "6-dark": 6,
    "10-white-knight": 9,
    "6-merchant": 6,
    "12-standard": 12,
    "12-king-guard": 12,
    "12-white-guard": 12,
    "12-beauty-knight": 12,
    "12-white-knight": 12,
    "12-merchant": 12,
    "12-beauty-hunter": 12,
    "12-shadow-mirror": 12,
  };
  for (const [id, count] of Object.entries(expected)) {
    const board = engine.PRESETS.find((item) => item.id === id);
    assert.ok(board, id);
    assert.equal(engine.playerCount(board), count, id);
  }
  const incomplete = engine.PRESETS.find(
    (item) => item.id === "10-white-knight",
  );
  assert.equal(incomplete.expectedCount, 10);
  assert.equal(
    engine.playerCount({ ...incomplete, extraRole: "villager" }),
    10,
  );
  assert.equal(
    engine.roleCounts({ ...incomplete, extraRole: "villager" }).villager,
    4,
  );
});

test("愚者翻牌免死并丧失投票和被投票权，警徽需要移交", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-standard");
  const game = engine.createGame(board, { ...engine.DEFAULT_RULES }, [
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
    "fool",
  ]);
  game.phase = "vote";
  game.sheriff = 12;
  let next = engine.finishVote(game, 12);
  assert.equal(next.phase, "foolReveal");
  assert.equal(next.players[11].alive, true);
  assert.equal(next.players[11].revealed, true);
  assert.equal(
    engine.votablePlayers(next).some((player) => player.id === 12),
    false,
  );
  assert.equal(
    engine.voteVoters(next).some((player) => player.id === 12),
    false,
  );
  next = engine.finishFoolReveal(next);
  assert.equal(next.phase, "badge");
  next.badgeTarget = 12;
  assert.equal(engine.finishBadge(next), next);
  next.badgeTarget = 5;
  next = engine.finishBadge(next);
  assert.equal(next.sheriff, 5);
});

test("骑士戳中狼美人不触发殉情，戳好人则骑士出局", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-beauty-knight");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "wolfBeauty",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "guard",
    "knight",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.phase = "speech";
  game.beautyTarget = 5;
  game = engine.beginKnight(game);
  game.specialTarget = 4;
  game = engine.finishKnight(game);
  assert.equal(game.players[3].alive, false);
  assert.equal(game.players[4].alive, true);
  assert.equal(game.night, 2);
  assert.equal(game.knightUsed, true);

  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.phase = "speech";
  game = engine.beginKnight(game);
  game.specialTarget = 5;
  game = engine.finishKnight(game);
  assert.equal(game.players[11].alive, false);
  assert.equal(game.players[4].alive, true);
  assert.equal(game.phase, "speech");
});

test("狼王被毒不能开枪，被猎人枪杀可连锁开枪", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-king-guard");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "wolfKing",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "hunter",
    "guard",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game = night(game, 0, 5, "poison", 4);
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.phase, "speech");
  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game = night(game, 0, 11, "none");
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.gunActor, 11);
  game.hunterTarget = 4;
  game = engine.finishHunter(game);
  assert.equal(game.phase, "hunter");
  assert.equal(game.gunActor, 4);
  game.hunterTarget = 5;
  game = engine.finishHunter(game);
  assert.equal(game.players[4].alive, false);
  assert.equal(game.phase, "speech");
});

test("白狼王自爆带人及最后一狼技能限制", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-white-guard");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "whiteWolf",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "hunter",
    "guard",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.phase = "speech";
  game = engine.beginWhiteWolf(game, 4);
  game.specialTarget = 11;
  game = engine.finishWhiteWolf(game);
  assert.equal(game.players[3].alive, false);
  assert.equal(game.players[10].alive, false);
  assert.notEqual(game.phase, "hunter");

  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.players.slice(0, 3).forEach((player) => {
    player.alive = false;
  });
  game.phase = "speech";
  game = engine.beginWhiteWolf(game, 4);
  assert.equal(engine.canWhiteWolfTake(game), false);
  game.specialTarget = 5;
  assert.equal(engine.finishWhiteWolf(game), game);
  game.specialTarget = 0;
  assert.equal(engine.finishWhiteWolf(game).winner, "good");
});

test("狼美人魅惑殉情、最后一狼限制和猎人禁枪", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-beauty-hunter");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "wolfBeauty",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "hunter",
    "knight",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.phase = "wolfBeauty";
  game.actions.wolfBeauty = 11;
  game = engine.advanceNight(game);
  game = night(game, 0, 5, "poison", 4);
  const deaths = engine.calculateNight(game).deaths;
  assert.deepEqual(deaths.find((death) => death.player === 11).causes, [
    "charm",
  ]);
  game = engine.announceDawn(engine.settleNight(game));
  assert.equal(game.players[10].alive, false);
  assert.notEqual(game.phase, "hunter");

  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.players.slice(0, 3).forEach((player) => {
    player.alive = false;
  });
  game.beautyTarget = 11;
  game.phase = "vote";
  game = engine.finishVote(game, 4);
  assert.equal(game.players[10].alive, true);
  assert.equal(game.winner, "good");
});

test("奇迹商人交易失败出局，幸运儿守护参与同守同救", () => {
  const board = engine.PRESETS.find((item) => item.id === "6-merchant");
  const roles = ["wolf", "wolf", "villager", "villager", "seer", "merchant"];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.actions.merchant = 1;
  game.actions.gift = "poison";
  game = engine.advanceNight(game);
  assert.equal(game.failedTrade, true);
  assert.equal(game.lucky, null);
  game = night(game, 0, 3, "none");
  assert.ok(
    engine
      .calculateNight(game)
      .deaths.some(
        (death) => death.player === 6 && death.causes.includes("trade"),
      ),
  );

  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.actions.merchant = 3;
  game.actions.gift = "guard";
  game = engine.advanceNight(game);
  assert.equal(game.lucky.recipient, 3);
  game = night(game, 0, 4, "save");
  game.actions.lucky = 4;
  assert.deepEqual(engine.calculateNight(game).deaths, [
    { player: 4, causes: ["clash"] },
  ]);
});

test("魔镜识别模仿身份，觉醒隐狼盾及双刀按版本结算", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-shadow-mirror");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "shadow",
    "villager",
    "villager",
    "villager",
    "villager",
    "guard",
    "witch",
    "hunter",
    "mirror",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  assert.equal(engine.seenRole(game, game.players[3]), "shadow");
  assert.equal(engine.seerSeesWolf(game, game.players[3]), false);
  game.actions.shadowLearn = 9;
  game = engine.advanceNight(game);
  assert.equal(game.shadowLearned, "guard");
  assert.equal(engine.seenRole(game, game.players[3]), "guard");
  assert.equal(engine.shadowSkillType(game), null);
  game.night = 2;
  game.phase = "shadowSkill";
  assert.equal(engine.shadowSkillType(game), "guard");
  game.actions.shadowSkill = 5;
  game = engine.advanceNight(game);
  game.actions.wolf = 5;
  game.actions.witch = "poison";
  game.actions.poison = 5;
  assert.deepEqual(engine.calculateNight(game).deaths, []);

  game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.shadowLearned = "wolf";
  game.shadowLearnedNight = 1;
  game.night = 2;
  game.players.slice(0, 3).forEach((player) => {
    player.alive = false;
  });
  game.phase = "shadowSkill";
  game.actions.shadowSkill = 5;
  assert.equal(engine.shadowSkillType(game), "double");
  game = engine.advanceNight(game);
  game.actions.wolf = 5;
  game.actions.guard = 5;
  game.actions.witch = "save";
  assert.deepEqual(engine.calculateNight(game).deaths, [
    { player: 5, causes: ["doubleKnife"] },
  ]);
});

test("白天狼美人出局后先提示殉情，再继续流程", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-beauty-hunter");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "wolfBeauty",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "hunter",
    "knight",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.phase = "vote";
  game.beautyTarget = 5;
  game = engine.finishVote(game, 4);
  assert.equal(game.phase, "charmResult");
  assert.deepEqual(game.charmDeaths, [5]);
  assert.equal(game.players[4].alive, false);
  game = engine.finishCharmResult(game);
  assert.equal(game.night, 2);
  assert.equal(game.phase, "wolf");
});

test("可配置白狼王带走猎人后开枪", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-white-guard");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "whiteWolf",
    "villager",
    "villager",
    "villager",
    "villager",
    "seer",
    "witch",
    "hunter",
    "guard",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false, gunByWhiteWolf: true },
    roles,
  );
  game.phase = "speech";
  game = engine.beginWhiteWolf(game, 4);
  game.specialTarget = 11;
  game = engine.finishWhiteWolf(game);
  assert.equal(game.phase, "hunter");
  assert.equal(game.gunActor, 11);
});

test("旧版对局可迁移并保留行动与规则", () => {
  const old = fresh();
  old.phase = "wolf";
  old.actions.wolf = 5;
  delete old.actions.merchant;
  delete old.rules.hiddenVariant;
  delete old.gunQueue;
  const migrated = engine.hydrateGame(old);
  assert.equal(migrated.phase, "wolf");
  assert.equal(migrated.actions.wolf, 5);
  assert.equal(migrated.actions.merchant, null);
  assert.equal(migrated.rules.hiddenVariant, "awakened");
  assert.deepEqual(migrated.gunQueue, []);
});

test("幸运儿技能可以保留，使用后不能重复，守护能挡刀", () => {
  const board = engine.PRESETS.find((item) => item.id === "6-merchant");
  const roles = ["wolf", "wolf", "villager", "villager", "seer", "merchant"];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, sheriff: false },
    roles,
  );
  game.actions.merchant = 3;
  game.actions.gift = "guard";
  game = engine.advanceNight(game);
  game.phase = "lucky";
  game.actions.lucky = 0;
  game = engine.advanceNight(game);
  assert.equal(game.lucky.used, false);
  game.phase = "lucky";
  game.actions.lucky = 4;
  game.actions.wolf = 4;
  game = engine.advanceNight(game);
  assert.equal(game.lucky.used, true);
  assert.deepEqual(engine.calculateNight(game).deaths, []);
  assert.equal(engine.activeLucky(game), null);
});

test("幸运儿的毒药会让猎人失去开枪状态", () => {
  const game = fresh();
  game.lucky = { recipient: 5, skill: "poison", used: true };
  game.actions.lucky = 11;
  game.actions.wolf = 0;
  assert.equal(engine.hunterStatus(game), "cannot");
});

test("机械狼盾仅一次，而觉醒隐狼盾可在后续夜晚继续使用", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-shadow-mirror");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "shadow",
    "villager",
    "villager",
    "villager",
    "villager",
    "guard",
    "witch",
    "hunter",
    "mirror",
  ];
  let game = engine.createGame(
    board,
    { ...engine.DEFAULT_RULES, hiddenVariant: "mechanical" },
    roles,
  );
  game.shadowLearned = "guard";
  game.shadowLearnedNight = 1;
  game.night = 2;
  game.phase = "shadowSkill";
  game.actions.shadowSkill = 5;
  game = engine.advanceNight(game);
  assert.equal(game.shadowUsed, true);
  assert.equal(engine.shadowSkillType({ ...game, night: 3 }), null);
  game.rules.hiddenVariant = "awakened";
  assert.equal(engine.shadowSkillType({ ...game, night: 3 }), "guard");
});

test("特殊狼人计入狼队胜负，魔镜与预言家获得对应结果", () => {
  const board = engine.PRESETS.find((item) => item.id === "12-shadow-mirror");
  const roles = [
    "wolf",
    "wolf",
    "wolf",
    "shadow",
    "villager",
    "villager",
    "villager",
    "villager",
    "guard",
    "witch",
    "hunter",
    "mirror",
  ];
  const game = engine.createGame(board, { ...engine.DEFAULT_RULES }, roles);
  game.players.slice(0, 3).forEach((player) => {
    player.alive = false;
  });
  assert.equal(engine.determineWinner(game.players, game.rules), null);
  assert.equal(engine.seerSeesWolf(game, game.players[3]), false);
  game.rules.hiddenVariant = "mechanical";
  assert.equal(engine.seerSeesWolf(game, game.players[3]), true);
  assert.equal(engine.roleName("shadow", game.rules), "机械狼");
});
