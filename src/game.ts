export type Role = "wolf" | "villager" | "seer" | "witch" | "hunter" | "guard";
export type SpecialRole = Exclude<Role, "wolf" | "villager">;
export type NightPhase =
  "guard" | "wolf" | "witch" | "seer" | "hunterStatus" | "resolve";
export type Phase =
  | NightPhase
  | "election"
  | "dawn"
  | "hunter"
  | "badge"
  | "speech"
  | "vote"
  | "end";
export type Winner = "good" | "wolf" | "manual";
export type DeathCause =
  "wolf" | "clash" | "poison" | "vote" | "shot" | "explode";

export interface Board {
  id: string;
  name: string;
  wolves: number;
  villagers: number;
  specials: SpecialRole[];
}

export interface Rules {
  victory: "edge" | "all";
  selfSave: "first" | "always" | "never";
  clash: "die" | "live";
  doublePotion: boolean;
  hunterClash: boolean;
  nightPriority: "together" | "wolf-first";
  simultaneous: "manual" | "good" | "wolf";
  sheriff: boolean;
  sheriffWeight: 1 | 1.5;
  pkCandidatesVote: boolean;
}

export interface Player {
  id: number;
  role: Role;
  alive: boolean;
  death?: DeathCause[];
}

export interface Death {
  player: number;
  causes: DeathCause[];
}

export interface NightActions {
  guard: number | null;
  wolf: number | null;
  witch: "none" | "save" | "poison" | "both" | null;
  poison: number | null;
  seer: number | null;
}

export interface LogEntry {
  title: string;
  detail: string;
}

export interface VoteState {
  mode: "direct" | "tally";
  direct: number | null;
  ballots: Record<string, string>;
  candidates: number[] | null;
  round: number;
}

export interface Game {
  board: Board;
  rules: Rules;
  players: Player[];
  phase: Phase;
  night: number;
  actions: NightActions;
  lastGuard: number | null;
  antidote: boolean;
  poison: boolean;
  pendingDeaths: Death[];
  forcedWinner: Winner | null;
  winner: Winner | null;
  sheriff: number | null;
  electionTarget: number | null;
  hunterTarget: number | null;
  badgeTarget: number | null;
  resumeAfter: "speech" | "night" | null;
  vote: VoteState;
  logs: LogEntry[];
}

export const ROLE_LABELS: Record<Role, string> = {
  wolf: "狼人",
  villager: "村民",
  seer: "预言家",
  witch: "女巫",
  hunter: "猎人",
  guard: "守卫",
};

export const ROLE_ORDER: Role[] = [
  "wolf",
  "villager",
  "seer",
  "witch",
  "hunter",
  "guard",
];
export const SPECIAL_ROLES: SpecialRole[] = [
  "seer",
  "witch",
  "hunter",
  "guard",
];

export const PRESETS: Board[] = [
  {
    id: "12",
    name: "预女猎守",
    wolves: 4,
    villagers: 4,
    specials: ["seer", "witch", "hunter", "guard"],
  },
  {
    id: "10",
    name: "预女猎守",
    wolves: 3,
    villagers: 3,
    specials: ["seer", "witch", "hunter", "guard"],
  },
  {
    id: "9",
    name: "预女猎",
    wolves: 3,
    villagers: 3,
    specials: ["seer", "witch", "hunter"],
  },
];

export const DEFAULT_RULES: Rules = {
  victory: "edge",
  selfSave: "first",
  clash: "die",
  doublePotion: false,
  hunterClash: true,
  nightPriority: "together",
  simultaneous: "manual",
  sheriff: true,
  sheriffWeight: 1.5,
  pkCandidatesVote: false,
};

export const CAUSE_LABELS: Record<DeathCause, string> = {
  wolf: "狼人刀杀",
  clash: "同守同救",
  poison: "女巫毒杀",
  vote: "投票放逐",
  shot: "猎人开枪",
  explode: "狼人自爆",
};

export function playerCount(board: Board) {
  return board.wolves + board.villagers + board.specials.length;
}

export function roleCounts(board: Board): Record<Role, number> {
  return {
    wolf: board.wolves,
    villager: board.villagers,
    seer: Number(board.specials.includes("seer")),
    witch: Number(board.specials.includes("witch")),
    hunter: Number(board.specials.includes("hunter")),
    guard: Number(board.specials.includes("guard")),
  };
}

export function emptyActions(): NightActions {
  return { guard: null, wolf: null, witch: null, poison: null, seer: null };
}

export function emptyVote(): VoteState {
  return {
    mode: "direct",
    direct: null,
    ballots: {},
    candidates: null,
    round: 1,
  };
}

export function nightPhases(board: Board): NightPhase[] {
  const phases: NightPhase[] = [];
  if (board.specials.includes("guard")) phases.push("guard");
  phases.push("wolf");
  if (board.specials.includes("witch")) phases.push("witch");
  if (board.specials.includes("seer")) phases.push("seer");
  if (board.specials.includes("hunter")) phases.push("hunterStatus");
  phases.push("resolve");
  return phases;
}

export function createGame(board: Board, rules: Rules, roles: Role[]): Game {
  return {
    board: { ...board, specials: [...board.specials] },
    rules: { ...rules },
    players: roles.map((role, index) => ({ id: index + 1, role, alive: true })),
    phase: nightPhases(board)[0],
    night: 1,
    actions: emptyActions(),
    lastGuard: null,
    antidote: true,
    poison: true,
    pendingDeaths: [],
    forcedWinner: null,
    winner: null,
    sheriff: null,
    electionTarget: null,
    hunterTarget: null,
    badgeTarget: null,
    resumeAfter: null,
    vote: emptyVote(),
    logs: [
      {
        title: "对局开始",
        detail: `${playerCount(board)} 人${board.name}，进入第 1 夜。`,
      },
    ],
  };
}

function copy(game: Game): Game {
  return JSON.parse(JSON.stringify(game)) as Game;
}

export function living(game: Game) {
  return game.players.filter((player) => player.alive);
}

export function rolePlayer(game: Game, role: Role) {
  return game.players.find((player) => player.role === role && player.alive);
}

export function playerLabel(id: number | null) {
  return id ? `${id} 号` : "无";
}

function validTarget(game: Game, target: number | null) {
  return (
    target === 0 ||
    (target !== null &&
      game.players.some((player) => player.id === target && player.alive))
  );
}

export function canWitchSave(game: Game) {
  const witch = rolePlayer(game, "witch");
  const target = game.actions.wolf;
  if (!witch || !game.antidote || !target) return false;
  if (target !== witch.id) return true;
  return (
    game.rules.selfSave === "always" ||
    (game.rules.selfSave === "first" && game.night === 1)
  );
}

export function nightError(game: Game): string | null {
  const { phase, actions } = game;
  if (phase === "guard" && rolePlayer(game, "guard")) {
    if (!validTarget(game, actions.guard))
      return "请选择守护目标，或选择空守。";
    if (actions.guard !== 0 && actions.guard === game.lastGuard)
      return "守卫不能连续两晚守护同一人。";
  }
  if (phase === "wolf" && !validTarget(game, actions.wolf))
    return "请选择狼刀目标，或选择空刀。";
  if (phase === "witch" && rolePlayer(game, "witch")) {
    if (!actions.witch) return "请选择女巫今晚的行动。";
    const saves = actions.witch === "save" || actions.witch === "both";
    const poisons = actions.witch === "poison" || actions.witch === "both";
    if (saves && !canWitchSave(game))
      return "当前规则或药剂状态不允许使用解药。";
    if (
      poisons &&
      (!game.poison || !actions.poison || !validTarget(game, actions.poison))
    )
      return "请选择有效的毒药目标。";
    if (actions.witch === "both" && !game.rules.doublePotion)
      return "本局不允许女巫同夜使用两瓶药。";
  }
  if (
    phase === "seer" &&
    rolePlayer(game, "seer") &&
    !validTarget(game, actions.seer)
  )
    return "请选择查验目标，或选择不查验。";
  return null;
}

export function advanceNight(game: Game): Game {
  if (nightError(game)) return game;
  const next = copy(game);
  const { phase, actions } = next;
  if (phase === "guard") {
    if (rolePlayer(next, "guard")) {
      next.lastGuard = actions.guard || null;
      next.logs.push({
        title: `第 ${next.night} 夜 · 守卫`,
        detail: actions.guard
          ? `守护 ${playerLabel(actions.guard)}。`
          : "选择空守。",
      });
    }
  }
  if (phase === "wolf") {
    next.logs.push({
      title: `第 ${next.night} 夜 · 狼人`,
      detail: actions.wolf
        ? `狼刀指向 ${playerLabel(actions.wolf)}。`
        : "狼人选择空刀。",
    });
  }
  if (phase === "witch" && rolePlayer(next, "witch")) {
    const saves = actions.witch === "save" || actions.witch === "both";
    const poisons = actions.witch === "poison" || actions.witch === "both";
    if (saves) next.antidote = false;
    if (poisons) next.poison = false;
    const details = [
      saves ? `使用解药救 ${playerLabel(actions.wolf)}` : "",
      poisons ? `毒杀 ${playerLabel(actions.poison)}` : "",
    ].filter(Boolean);
    next.logs.push({
      title: `第 ${next.night} 夜 · 女巫`,
      detail: details.length ? `${details.join("；")}。` : "没有使用药剂。",
    });
  }
  if (phase === "seer" && rolePlayer(next, "seer")) {
    const target = next.players.find((player) => player.id === actions.seer);
    next.logs.push({
      title: `第 ${next.night} 夜 · 预言家`,
      detail: target
        ? `查验 ${playerLabel(target.id)}，结果为${target.role === "wolf" ? "狼人" : "好人"}。`
        : "没有查验。",
    });
  }
  const phases = nightPhases(next.board);
  const index = phases.indexOf(phase as NightPhase);
  if (index >= 0 && index < phases.length - 1) next.phase = phases[index + 1];
  return next;
}

export function calculateNight(game: Game): {
  deaths: Death[];
  knifeDeath: Death | null;
} {
  const { actions, rules } = game;
  const saved = actions.witch === "save" || actions.witch === "both";
  const poisoned = actions.witch === "poison" || actions.witch === "both";
  const guarded = Boolean(actions.wolf && actions.guard === actions.wolf);
  let knifeDeath: Death | null = null;
  if (actions.wolf) {
    if (guarded && saved && rules.clash === "die") {
      knifeDeath = { player: actions.wolf, causes: ["clash"] };
    } else if (!guarded && !saved) {
      knifeDeath = { player: actions.wolf, causes: ["wolf"] };
    }
  }
  const deaths: Death[] = knifeDeath
    ? [{ player: knifeDeath.player, causes: [...knifeDeath.causes] }]
    : [];
  if (poisoned && actions.poison) {
    const existing = deaths.find((death) => death.player === actions.poison);
    if (existing) existing.causes.push("poison");
    else deaths.push({ player: actions.poison, causes: ["poison"] });
  }
  return { deaths: deaths.sort((a, b) => a.player - b.player), knifeDeath };
}

export function applyDeaths(players: Player[], deaths: Death[]) {
  return players.map((player) => {
    const death = deaths.find((item) => item.player === player.id);
    return death && player.alive
      ? { ...player, alive: false, death: [...death.causes] }
      : player;
  });
}

function wolfCondition(players: Player[], rules: Rules) {
  const villagers = players.filter(
    (player) => player.alive && player.role === "villager",
  ).length;
  const gods = players.filter(
    (player) =>
      player.alive && player.role !== "wolf" && player.role !== "villager",
  ).length;
  return rules.victory === "edge"
    ? villagers === 0 || gods === 0
    : villagers + gods === 0;
}

export function determineWinner(
  players: Player[],
  rules: Rules,
): Winner | null {
  const wolves = players.filter(
    (player) => player.alive && player.role === "wolf",
  ).length;
  const goodWin = wolves === 0;
  const wolfWin = wolfCondition(players, rules);
  if (goodWin && wolfWin) return rules.simultaneous;
  if (goodWin) return "good";
  if (wolfWin && wolves > 0) return "wolf";
  return null;
}

export function settleNight(game: Game): Game {
  const next = copy(game);
  const result = calculateNight(next);
  next.pendingDeaths = result.deaths;
  next.forcedWinner = null;
  if (next.rules.nightPriority === "wolf-first" && result.knifeDeath) {
    const afterKnife = applyDeaths(next.players, [result.knifeDeath]);
    const wolvesRemain = afterKnife.some(
      (player) => player.alive && player.role === "wolf",
    );
    if (wolvesRemain && wolfCondition(afterKnife, next.rules)) {
      next.pendingDeaths = [result.knifeDeath];
      next.forcedWinner = "wolf";
    }
  }
  const projectedWinner = determineWinner(
    applyDeaths(next.players, next.pendingDeaths),
    next.rules,
  );
  next.phase =
    next.night === 1 &&
    next.rules.sheriff &&
    !projectedWinner &&
    !next.forcedWinner
      ? "election"
      : "dawn";
  return next;
}

export function completeElection(game: Game): Game {
  if (game.electionTarget === null || !validTarget(game, game.electionTarget))
    return game;
  const next = copy(game);
  next.sheriff = next.electionTarget || null;
  next.logs.push({
    title: "警长竞选",
    detail: next.sheriff
      ? `${playerLabel(next.sheriff)}当选警长。`
      : "本局没有警长。",
  });
  next.phase = "dawn";
  return next;
}

function hunterCanShoot(game: Game, death: Death) {
  const player = game.players.find((item) => item.id === death.player);
  if (player?.role !== "hunter" || death.causes.includes("poison"))
    return false;
  if (death.causes.includes("clash") && !game.rules.hunterClash) return false;
  return (
    death.causes.includes("wolf") ||
    death.causes.includes("clash") ||
    death.causes.includes("vote")
  );
}

export function hunterStatus(game: Game): "can" | "cannot" | "absent" {
  const hunter = rolePlayer(game, "hunter");
  if (!hunter) return "absent";
  const death = calculateNight(game).deaths.find(
    (item) => item.player === hunter.id,
  );
  return death && !hunterCanShoot(game, death) ? "cannot" : "can";
}

function startNextNight(game: Game) {
  game.night += 1;
  game.actions = emptyActions();
  game.pendingDeaths = [];
  game.forcedWinner = null;
  game.hunterTarget = null;
  game.badgeTarget = null;
  game.resumeAfter = null;
  game.vote = emptyVote();
  game.phase = nightPhases(game.board)[0];
  game.logs.push({
    title: `第 ${game.night} 夜`,
    detail: "天黑，请所有玩家闭眼。",
  });
}

function finishConsequences(game: Game, resume: "speech" | "night") {
  const winner = determineWinner(game.players, game.rules);
  if (winner) {
    game.winner = winner;
    game.phase = "end";
    game.logs.push({
      title: "对局结束",
      detail:
        winner === "good"
          ? "所有狼人出局，好人阵营获胜。"
          : winner === "wolf"
            ? "狼人阵营达到胜利条件。"
            : "双方同时达到胜利条件，等待法官裁定。",
    });
    return;
  }
  if (
    game.sheriff &&
    !game.players.find((player) => player.id === game.sheriff)?.alive
  ) {
    game.resumeAfter = resume;
    game.badgeTarget = null;
    game.phase = "badge";
    return;
  }
  if (resume === "speech") game.phase = "speech";
  else startNextNight(game);
}

function handleDeaths(game: Game, deaths: Death[], resume: "speech" | "night") {
  game.players = applyDeaths(game.players, deaths);
  const hunterDeath = deaths.find((death) => hunterCanShoot(game, death));
  if (hunterDeath) {
    game.resumeAfter = resume;
    game.hunterTarget = null;
    game.phase = "hunter";
  } else {
    finishConsequences(game, resume);
  }
}

export function announceDawn(game: Game): Game {
  const next = copy(game);
  const summary = next.pendingDeaths.length
    ? next.pendingDeaths
        .map(
          (death) =>
            `${playerLabel(death.player)}（${death.causes.map((cause) => CAUSE_LABELS[cause]).join("、")}）`,
        )
        .join("，")
    : "平安夜，无人出局";
  next.logs.push({
    title: `第 ${next.night} 天 · 天亮`,
    detail: `${summary}。`,
  });
  if (next.forcedWinner) {
    next.players = applyDeaths(next.players, next.pendingDeaths);
    next.winner = next.forcedWinner;
    next.phase = "end";
    next.logs.push({
      title: "对局结束",
      detail: "按狼刀优先规则，狼刀已达成狼人胜利条件，后续毒药不结算。",
    });
  } else {
    handleDeaths(next, next.pendingDeaths, "speech");
  }
  return next;
}

export function finishHunter(game: Game): Game {
  if (game.hunterTarget === null || !validTarget(game, game.hunterTarget))
    return game;
  const next = copy(game);
  if (next.hunterTarget) {
    next.players = applyDeaths(next.players, [
      { player: next.hunterTarget, causes: ["shot"] },
    ]);
    next.logs.push({
      title: "猎人技能",
      detail: `猎人开枪带走 ${playerLabel(next.hunterTarget)}。`,
    });
  } else {
    next.logs.push({ title: "猎人技能", detail: "猎人选择不开枪。" });
  }
  finishConsequences(next, next.resumeAfter ?? "speech");
  return next;
}

export function finishBadge(game: Game): Game {
  if (game.badgeTarget === null || !validTarget(game, game.badgeTarget))
    return game;
  const next = copy(game);
  next.sheriff = next.badgeTarget || null;
  next.logs.push({
    title: "警徽处理",
    detail: next.sheriff
      ? `警徽移交给 ${playerLabel(next.sheriff)}。`
      : "警徽撕毁，本局没有警长。",
  });
  if (next.resumeAfter === "night") startNextNight(next);
  else {
    next.resumeAfter = null;
    next.phase = "speech";
  }
  return next;
}

export function finishSpeech(game: Game): Game {
  const next = copy(game);
  next.phase = "vote";
  next.vote = emptyVote();
  return next;
}

export function voteVoters(game: Game) {
  return living(game).filter(
    (player) =>
      game.rules.pkCandidatesVote || !game.vote.candidates?.includes(player.id),
  );
}

export function tallyVotes(game: Game) {
  const voters = voteVoters(game);
  const complete = voters.every(
    (player) =>
      game.vote.ballots[String(player.id)] !== undefined &&
      game.vote.ballots[String(player.id)] !== "",
  );
  const totals: Record<number, number> = {};
  for (const voter of voters) {
    const target = Number(game.vote.ballots[String(voter.id)] || 0);
    if (!target) continue;
    const eligible =
      game.players.some((player) => player.id === target && player.alive) &&
      (!game.vote.candidates || game.vote.candidates.includes(target));
    if (eligible)
      totals[target] =
        (totals[target] || 0) +
        (voter.id === game.sheriff ? game.rules.sheriffWeight : 1);
  }
  const top = Math.max(0, ...Object.values(totals));
  const leaders = top
    ? Object.entries(totals)
        .filter(([, count]) => count === top)
        .map(([id]) => Number(id))
        .sort((a, b) => a - b)
    : [];
  return { complete, totals, top, leaders, voters };
}

export function beginPk(game: Game, leaders: number[]): Game {
  const next = copy(game);
  next.vote = {
    mode: "tally",
    direct: null,
    ballots: {},
    candidates: leaders,
    round: next.vote.round + 1,
  };
  next.logs.push({
    title: "平票进入 PK",
    detail: `${leaders.map(playerLabel).join("、")}平票，进行新一轮投票。`,
  });
  return next;
}

export function finishVote(game: Game, target: number): Game {
  if (!validTarget(game, target)) return game;
  const next = copy(game);
  if (!target) {
    next.logs.push({
      title: `第 ${next.night} 天 · 投票`,
      detail: "本轮没有玩家被放逐。",
    });
    finishConsequences(next, "night");
  } else {
    next.logs.push({
      title: `第 ${next.night} 天 · 投票`,
      detail: `${playerLabel(target)}被投票放逐。`,
    });
    handleDeaths(next, [{ player: target, causes: ["vote"] }], "night");
  }
  return next;
}

export function explode(game: Game, target: number): Game {
  const wolf = game.players.find(
    (player) => player.id === target && player.alive && player.role === "wolf",
  );
  if (game.phase !== "speech" || !wolf) return game;
  const next = copy(game);
  next.players = applyDeaths(next.players, [
    { player: target, causes: ["explode"] },
  ]);
  next.logs.push({
    title: `第 ${next.night} 天 · 狼人自爆`,
    detail: `${playerLabel(target)}自爆，结束白天发言。`,
  });
  finishConsequences(next, "night");
  return next;
}

export function resolveManualWinner(game: Game, winner: "good" | "wolf"): Game {
  const next = copy(game);
  next.winner = winner;
  next.logs.push({
    title: "法官裁定",
    detail: `双方同时达成条件，法官按桌规判定${winner === "good" ? "好人" : "狼人"}获胜。`,
  });
  return next;
}
