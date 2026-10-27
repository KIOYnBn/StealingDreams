export type Role =
  | "wolf"
  | "villager"
  | "seer"
  | "witch"
  | "hunter"
  | "guard"
  | "fool"
  | "knight"
  | "merchant"
  | "mirror"
  | "wolfKing"
  | "whiteWolf"
  | "wolfBeauty"
  | "shadow";
export type SpecialRole = Exclude<Role, "wolf" | "villager">;
export type NightPhase =
  | "merchant"
  | "shadowLearn"
  | "guard"
  | "wolf"
  | "wolfBeauty"
  | "shadowSkill"
  | "witch"
  | "seer"
  | "mirror"
  | "hunterStatus"
  | "lucky"
  | "resolve";
export type Phase =
  | NightPhase
  | "election"
  | "dawn"
  | "hunter"
  | "whiteWolfSkill"
  | "knightDuel"
  | "foolReveal"
  | "charmResult"
  | "badge"
  | "speech"
  | "vote"
  | "end";
export type Winner = "good" | "wolf" | "manual";
export type DeathCause =
  | "wolf"
  | "clash"
  | "poison"
  | "vote"
  | "shot"
  | "explode"
  | "charm"
  | "trade"
  | "duel"
  | "whiteBomb"
  | "doubleKnife";
export type Gift = "check" | "poison" | "guard";

export interface Board {
  id: string;
  name: string;
  wolves: number;
  villagers: number;
  specials: SpecialRole[];
  expectedCount?: number;
  extraRole?: Role | null;
  note?: string;
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
  hiddenVariant: "awakened" | "mechanical";
  wolfKingNightGun: boolean;
  gunByWhiteWolf: boolean;
  lastWolfSkill: boolean;
  doubleKnifePierces: boolean;
}

export interface Player {
  id: number;
  role: Role;
  alive: boolean;
  death?: DeathCause[];
  revealed?: boolean;
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
  merchant: number | null;
  gift: Gift | null;
  lucky: number | null;
  shadowLearn: number | null;
  shadowSkill: number | null;
  wolfBeauty: number | null;
  mirror: number | null;
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
  merchantUsed: boolean;
  lucky: { recipient: number; skill: Gift; used: boolean } | null;
  failedTrade: boolean;
  lastLuckyGuard: number | null;
  previousGuard: number | null;
  previousLuckyGuard: number | null;
  beautyTarget: number | null;
  lastBeauty: number | null;
  mirrorSeen: number[];
  shadowLearned: Role | null;
  shadowLearnedNight: number | null;
  shadowUsed: boolean;
  shadowSeen: number[];
  knightUsed: boolean;
  specialActor: number | null;
  specialTarget: number | null;
  gunActor: number | null;
  gunQueue: number[];
  gunProcessed: number[];
  charmDeaths: number[];
}

export const ROLE_LABELS: Record<Role, string> = {
  wolf: "狼人",
  villager: "村民",
  seer: "预言家",
  witch: "女巫",
  hunter: "猎人",
  guard: "守卫",
  fool: "愚者",
  knight: "骑士",
  merchant: "奇迹商人",
  mirror: "魔镜少女",
  wolfKing: "狼王",
  whiteWolf: "白狼王",
  wolfBeauty: "狼美人",
  shadow: "觉醒隐狼",
};

export const ROLE_ORDER: Role[] = [
  "wolf",
  "villager",
  "seer",
  "witch",
  "hunter",
  "guard",
  "fool",
  "knight",
  "merchant",
  "mirror",
  "wolfKing",
  "whiteWolf",
  "wolfBeauty",
  "shadow",
];
export const SPECIAL_ROLES: SpecialRole[] = [
  "seer",
  "witch",
  "hunter",
  "guard",
  "fool",
  "knight",
  "merchant",
  "mirror",
  "wolfKing",
  "whiteWolf",
  "wolfBeauty",
  "shadow",
];

export const WOLF_ROLES: Role[] = [
  "wolf",
  "wolfKing",
  "whiteWolf",
  "wolfBeauty",
  "shadow",
];
export function isWolf(role: Role) {
  return WOLF_ROLES.includes(role);
}
export function roleName(role: Role, rules: Pick<Rules, "hiddenVariant">) {
  return role === "shadow" && rules.hiddenVariant === "mechanical"
    ? "机械狼"
    : ROLE_LABELS[role];
}

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
  {
    id: "6-dark",
    name: "暗牌",
    wolves: 2,
    villagers: 2,
    specials: ["seer", "guard"],
  },
  {
    id: "10-white-knight",
    name: "白狼王骑士",
    wolves: 2,
    villagers: 3,
    specials: ["whiteWolf", "seer", "fool", "knight"],
    expectedCount: 10,
    extraRole: null,
    note: "所列身份共 9 张，请补充第 10 张。",
  },
  {
    id: "6-merchant",
    name: "奇迹商人",
    wolves: 2,
    villagers: 2,
    specials: ["seer", "merchant"],
  },
  {
    id: "12-standard",
    name: "标准预女猎愚",
    wolves: 4,
    villagers: 4,
    specials: ["seer", "witch", "hunter", "fool"],
  },
  {
    id: "12-king-guard",
    name: "狼王守卫",
    wolves: 3,
    villagers: 4,
    specials: ["wolfKing", "seer", "witch", "hunter", "guard"],
  },
  {
    id: "12-white-guard",
    name: "白狼王守卫",
    wolves: 3,
    villagers: 4,
    specials: ["whiteWolf", "seer", "witch", "hunter", "guard"],
  },
  {
    id: "12-beauty-knight",
    name: "狼美人骑士",
    wolves: 3,
    villagers: 4,
    specials: ["wolfBeauty", "seer", "witch", "guard", "knight"],
  },
  {
    id: "12-white-knight",
    name: "白狼王骑士",
    wolves: 3,
    villagers: 4,
    specials: ["whiteWolf", "seer", "witch", "guard", "knight"],
  },
  {
    id: "12-merchant",
    name: "狼王奇迹商人",
    wolves: 3,
    villagers: 4,
    specials: ["wolfKing", "seer", "guard", "witch", "merchant"],
    note: "原描述未注明平民数量，按 12 人暂定 4 民。",
  },
  {
    id: "12-beauty-hunter",
    name: "狼美猎骑",
    wolves: 3,
    villagers: 4,
    specials: ["wolfBeauty", "seer", "witch", "hunter", "knight"],
  },
  {
    id: "12-shadow-mirror",
    name: "觉醒隐狼魔镜",
    wolves: 3,
    villagers: 4,
    specials: ["shadow", "guard", "witch", "hunter", "mirror"],
    note: "可在桌规中选择觉醒隐狼或机械狼版本。",
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
  hiddenVariant: "awakened",
  wolfKingNightGun: true,
  gunByWhiteWolf: false,
  lastWolfSkill: false,
  doubleKnifePierces: true,
};

export const CAUSE_LABELS: Record<DeathCause, string> = {
  wolf: "狼人刀杀",
  clash: "同守同救",
  poison: "女巫毒杀",
  vote: "投票放逐",
  shot: "猎人开枪",
  explode: "狼人自爆",
  charm: "狼美人殉情",
  trade: "奇迹商人交易失败",
  duel: "骑士决斗",
  whiteBomb: "白狼王自爆带走",
  doubleKnife: "双刀同刀",
};

export function playerCount(board: Board) {
  return (
    board.wolves +
    board.villagers +
    board.specials.length +
    Number(Boolean(board.extraRole))
  );
}

export function roleCounts(board: Board): Record<Role, number> {
  const counts = Object.fromEntries(
    ROLE_ORDER.map((role) => [role, 0]),
  ) as Record<Role, number>;
  counts.wolf = board.wolves;
  counts.villager = board.villagers;
  for (const role of board.specials) counts[role] += 1;
  if (board.extraRole) counts[board.extraRole] += 1;
  return counts;
}

export function emptyActions(): NightActions {
  return {
    guard: null,
    wolf: null,
    witch: null,
    poison: null,
    seer: null,
    merchant: null,
    gift: null,
    lucky: null,
    shadowLearn: null,
    shadowSkill: null,
    wolfBeauty: null,
    mirror: null,
  };
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
  const counts = roleCounts(board);
  if (counts.merchant) phases.push("merchant");
  if (counts.shadow) phases.push("shadowLearn");
  if (counts.guard) phases.push("guard");
  phases.push("wolf");
  if (counts.wolfBeauty) phases.push("wolfBeauty");
  if (counts.shadow) phases.push("shadowSkill");
  if (counts.witch) phases.push("witch");
  if (counts.seer) phases.push("seer");
  if (counts.mirror) phases.push("mirror");
  if (counts.merchant) phases.push("lucky");
  if (counts.hunter || counts.wolfKing || counts.shadow)
    phases.push("hunterStatus");
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
    merchantUsed: false,
    lucky: null,
    failedTrade: false,
    lastLuckyGuard: null,
    previousGuard: null,
    previousLuckyGuard: null,
    beautyTarget: null,
    lastBeauty: null,
    mirrorSeen: [],
    shadowLearned: null,
    shadowLearnedNight: null,
    shadowUsed: false,
    shadowSeen: [],
    knightUsed: false,
    specialActor: null,
    specialTarget: null,
    gunActor: null,
    gunQueue: [],
    gunProcessed: [],
    charmDeaths: [],
  };
}

export function hydrateGame(saved: Game): Game {
  const rules = { ...DEFAULT_RULES, ...saved.rules };
  const defaults = createGame(
    saved.board,
    rules,
    saved.players.map((player) => player.role),
  );
  return {
    ...defaults,
    ...saved,
    rules,
    actions: { ...defaults.actions, ...saved.actions },
    gunActor:
      saved.gunActor ??
      (saved.phase === "hunter"
        ? (saved.players.find(
            (player) => player.role === "hunter" && !player.alive,
          )?.id ?? null)
        : null),
    gunQueue: saved.gunQueue ?? [],
    gunProcessed: saved.gunProcessed ?? [],
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

export function seenRole(game: Game, player: Player): Role {
  return player.role === "shadow" && game.shadowLearned
    ? game.shadowLearned
    : player.role;
}

export function seerSeesWolf(game: Game, player: Player): boolean {
  if (player.role === "shadow" && game.rules.hiddenVariant === "awakened")
    return false;
  return isWolf(player.role);
}

export function packAlive(game: Game) {
  return game.players.some(
    (player) => player.alive && isWolf(player.role) && player.role !== "shadow",
  );
}

export function shadowSkillType(
  game: Game,
): "guard" | "poison" | "check" | "double" | null {
  if (
    !rolePlayer(game, "shadow") ||
    !game.shadowLearned ||
    game.shadowLearnedNight === null ||
    game.shadowLearnedNight >= game.night
  )
    return null;
  if (
    game.shadowLearned === "guard" &&
    (game.rules.hiddenVariant === "awakened" || !game.shadowUsed)
  )
    return "guard";
  if (game.shadowLearned === "witch" && !game.shadowUsed) return "poison";
  if (game.shadowLearned === "mirror" || game.shadowLearned === "seer")
    return "check";
  if (game.shadowLearned === "wolf" && !game.shadowUsed && !packAlive(game))
    return "double";
  return null;
}

export function activeLucky(game: Game) {
  return game.lucky &&
    !game.lucky.used &&
    game.players.some(
      (player) => player.alive && player.id === game.lucky?.recipient,
    )
    ? game.lucky
    : null;
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
  if (
    phase === "merchant" &&
    rolePlayer(game, "merchant") &&
    !game.merchantUsed
  ) {
    if (!validTarget(game, actions.merchant))
      return "请选择交易对象，或选择暂不交易。";
    if (actions.merchant === rolePlayer(game, "merchant")?.id)
      return "奇迹商人不能给自己交易。";
    if (actions.merchant && !actions.gift) return "请选择赠送的技能。";
  }
  if (
    phase === "shadowLearn" &&
    rolePlayer(game, "shadow") &&
    !game.shadowLearned
  ) {
    if (!validTarget(game, actions.shadowLearn))
      return "请选择模仿对象，或选择暂不模仿。";
    if (actions.shadowLearn === rolePlayer(game, "shadow")?.id)
      return "觉醒隐狼不能模仿自己。";
    const target = game.players.find(
      (player) => player.id === actions.shadowLearn,
    );
    if (
      target &&
      ![
        "wolf",
        "villager",
        "seer",
        "witch",
        "hunter",
        "guard",
        "mirror",
      ].includes(target.role)
    )
      return "该特殊角色的模仿规则暂未支持，请按桌规更换对象。";
  }
  if (phase === "guard" && rolePlayer(game, "guard")) {
    if (!validTarget(game, actions.guard))
      return "请选择守护目标，或选择空守。";
    if (
      actions.guard !== 0 &&
      (actions.guard === game.lastGuard ||
        actions.guard === game.lastLuckyGuard)
    )
      return "守卫不能连续两晚守护同一人。";
  }
  if (phase === "wolf" && !validTarget(game, actions.wolf))
    return "请选择狼刀目标，或选择空刀。";
  if (
    phase === "wolf" &&
    actions.wolf &&
    game.players.find((player) => player.id === actions.wolf)?.role ===
      "wolfBeauty"
  )
    return "狼美人不能自刀。";
  if (phase === "wolfBeauty" && rolePlayer(game, "wolfBeauty")) {
    if (!validTarget(game, actions.wolfBeauty))
      return "请选择魅惑目标，或选择空魅。";
    if (actions.wolfBeauty === rolePlayer(game, "wolfBeauty")?.id)
      return "狼美人不能魅惑自己。";
    if (actions.wolfBeauty && actions.wolfBeauty === game.lastBeauty)
      return "狼美人不能连续两晚魅惑同一人。";
  }
  if (phase === "shadowSkill" && shadowSkillType(game)) {
    if (!validTarget(game, actions.shadowSkill))
      return "请选择技能目标，或选择暂不使用。";
    if (
      shadowSkillType(game) === "check" &&
      actions.shadowSkill &&
      game.shadowSeen.includes(actions.shadowSkill)
    )
      return "不能重复查验同一名玩家。";
  }
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
  if (phase === "mirror" && rolePlayer(game, "mirror")) {
    if (!validTarget(game, actions.mirror))
      return "请选择查验目标，或选择不查验。";
    if (actions.mirror && game.mirrorSeen.includes(actions.mirror))
      return "魔镜少女不能重复查验同一人。";
  }
  if (phase === "lucky" && activeLucky(game)) {
    if (!validTarget(game, actions.lucky))
      return "请选择幸运儿技能目标，或选择暂不使用。";
    const lucky = activeLucky(game)!;
    const recipient = game.players.find(
      (player) => player.id === lucky.recipient,
    );
    if (
      actions.lucky &&
      lucky.skill === "guard" &&
      recipient?.role === "guard" &&
      [actions.guard, game.previousGuard, game.previousLuckyGuard].includes(
        actions.lucky,
      )
    )
      return "守卫不能重复守护当晚或上晚的目标。";
    if (
      actions.lucky &&
      lucky.skill === "poison" &&
      recipient?.role === "witch" &&
      actions.lucky === actions.poison
    )
      return "女巫不能在同一晚重复毒同一人。";
    if (
      actions.lucky &&
      lucky.skill === "check" &&
      recipient?.role === "seer" &&
      actions.lucky === actions.seer
    )
      return "预言家不能在同一晚重复查验同一人。";
  }
  return null;
}

export function advanceNight(game: Game): Game {
  if (nightError(game)) return game;
  const next = copy(game);
  const { phase, actions } = next;
  if (
    phase === "merchant" &&
    rolePlayer(next, "merchant") &&
    !next.merchantUsed
  ) {
    if (actions.merchant && actions.gift) {
      next.merchantUsed = true;
      const recipient = next.players.find(
        (player) => player.id === actions.merchant,
      )!;
      if (isWolf(recipient.role)) next.failedTrade = true;
      else
        next.lucky = {
          recipient: recipient.id,
          skill: actions.gift,
          used: false,
        };
      next.logs.push({
        title: `第 ${next.night} 夜 · 奇迹商人`,
        detail: `向 ${playerLabel(recipient.id)}赠送${actions.gift === "check" ? "查验" : actions.gift === "poison" ? "毒药" : "守护"}，${isWolf(recipient.role) ? "交易失败" : "交易成功"}。`,
      });
    } else
      next.logs.push({
        title: `第 ${next.night} 夜 · 奇迹商人`,
        detail: "暂不交易。",
      });
  }
  if (
    phase === "shadowLearn" &&
    rolePlayer(next, "shadow") &&
    !next.shadowLearned &&
    actions.shadowLearn
  ) {
    const target = next.players.find(
      (player) => player.id === actions.shadowLearn,
    )!;
    next.shadowLearned = target.role;
    next.shadowLearnedNight = next.night;
    next.logs.push({
      title: `第 ${next.night} 夜 · 隐狼模仿`,
      detail: `模仿 ${playerLabel(target.id)}，身份为${ROLE_LABELS[target.role]}。`,
    });
  }
  if (phase === "guard") {
    if (rolePlayer(next, "guard")) {
      next.previousGuard = next.lastGuard;
      next.previousLuckyGuard = next.lastLuckyGuard;
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
  if (phase === "wolfBeauty" && rolePlayer(next, "wolfBeauty")) {
    next.beautyTarget = actions.wolfBeauty || null;
    next.lastBeauty = actions.wolfBeauty || null;
    next.logs.push({
      title: `第 ${next.night} 夜 · 狼美人`,
      detail: actions.wolfBeauty
        ? `魅惑 ${playerLabel(actions.wolfBeauty)}。`
        : "选择空魅。",
    });
  }
  if (phase === "shadowSkill" && shadowSkillType(next) && actions.shadowSkill) {
    const skill = shadowSkillType(next);
    if (
      skill === "poison" ||
      skill === "double" ||
      (skill === "guard" && next.rules.hiddenVariant === "mechanical")
    )
      next.shadowUsed = true;
    if (skill === "check") next.shadowSeen.push(actions.shadowSkill);
    const target = next.players.find(
      (player) => player.id === actions.shadowSkill,
    )!;
    next.logs.push({
      title: `第 ${next.night} 夜 · 隐狼技能`,
      detail:
        skill === "check"
          ? `查验 ${playerLabel(target.id)}，显示为${next.shadowLearned === "seer" ? (seerSeesWolf(next, target) ? "狼人" : "好人") : roleName(seenRole(next, target), next.rules)}。`
          : `${skill === "guard" ? "守护" : skill === "poison" ? "毒杀" : "额外袭击"} ${playerLabel(target.id)}。`,
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
        ? `查验 ${playerLabel(target.id)}，结果为${seerSeesWolf(next, target) ? "狼人" : "好人"}。`
        : "没有查验。",
    });
  }
  if (phase === "mirror" && rolePlayer(next, "mirror") && actions.mirror) {
    const target = next.players.find((player) => player.id === actions.mirror)!;
    next.mirrorSeen.push(target.id);
    next.logs.push({
      title: `第 ${next.night} 夜 · 魔镜少女`,
      detail: `查验 ${playerLabel(target.id)}，显示为${roleName(seenRole(next, target), next.rules)}。`,
    });
  }
  if (phase === "lucky" && activeLucky(next) && actions.lucky) {
    const lucky = activeLucky(next)!;
    const target = next.players.find((player) => player.id === actions.lucky)!;
    next.lucky!.used = true;
    next.logs.push({
      title: `第 ${next.night} 夜 · 幸运儿`,
      detail:
        lucky.skill === "check"
          ? `查验 ${playerLabel(target.id)}，结果为${seerSeesWolf(next, target) ? "狼人" : "好人"}。`
          : `${lucky.skill === "guard" ? "守护" : "毒杀"} ${playerLabel(target.id)}。`,
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
  knifeDeaths: Death[];
} {
  const { actions, rules } = game;
  const saved = actions.witch === "save" || actions.witch === "both";
  const luckyGuard =
    game.lucky?.skill === "guard" && actions.lucky ? actions.lucky : null;
  const shadowGuard =
    game.shadowLearned === "guard" &&
    game.shadowLearnedNight !== null &&
    game.shadowLearnedNight < game.night &&
    actions.shadowSkill
      ? actions.shadowSkill
      : null;
  const shadowPoison =
    game.shadowLearned === "witch" &&
    game.shadowLearnedNight !== null &&
    game.shadowLearnedNight < game.night
      ? actions.shadowSkill
      : null;
  const extraKnife =
    game.shadowLearned === "wolf" &&
    game.shadowLearnedNight !== null &&
    game.shadowLearnedNight < game.night &&
    !packAlive(game)
      ? actions.shadowSkill
      : null;
  const guarded = Boolean(
    actions.wolf &&
    [actions.guard, luckyGuard, shadowGuard].includes(actions.wolf),
  );
  let knifeDeath: Death | null = null;
  if (actions.wolf) {
    if (extraKnife === actions.wolf && rules.doubleKnifePierces) {
      knifeDeath = { player: actions.wolf, causes: ["doubleKnife"] };
    } else if (guarded && saved && rules.clash === "die") {
      knifeDeath = { player: actions.wolf, causes: ["clash"] };
    } else if (!guarded && !saved) {
      knifeDeath = { player: actions.wolf, causes: ["wolf"] };
    }
  }
  const deaths: Death[] = knifeDeath
    ? [{ player: knifeDeath.player, causes: [...knifeDeath.causes] }]
    : [];
  if (
    extraKnife &&
    extraKnife !== actions.wolf &&
    ![actions.guard, luckyGuard, shadowGuard].includes(extraKnife)
  ) {
    deaths.push({ player: extraKnife, causes: ["wolf"] });
  }
  const knifeDeaths = deaths.map((death) => ({
    ...death,
    causes: [...death.causes],
  }));
  const poisonTargets = [
    actions.witch === "poison" || actions.witch === "both"
      ? actions.poison
      : null,
    game.lucky?.skill === "poison" ? actions.lucky : null,
    shadowPoison,
  ].filter((target): target is number => Boolean(target));
  for (const target of poisonTargets) {
    if (target === shadowGuard) continue;
    const existing = deaths.find((death) => death.player === target);
    if (existing && !existing.causes.includes("poison"))
      existing.causes.push("poison");
    else if (!existing) deaths.push({ player: target, causes: ["poison"] });
  }
  const merchant = rolePlayer(game, "merchant");
  if (game.failedTrade && merchant) {
    const existing = deaths.find((death) => death.player === merchant.id);
    if (existing) existing.causes.push("trade");
    else deaths.push({ player: merchant.id, causes: ["trade"] });
  }
  return {
    deaths: addCharmDeaths(game, deaths).sort((a, b) => a.player - b.player),
    knifeDeath,
    knifeDeaths,
  };
}

function addCharmDeaths(game: Game, source: Death[]): Death[] {
  const deaths = source.map((death) => ({
    ...death,
    causes: [...death.causes],
  }));
  const beauty = deaths.find(
    (death) =>
      game.players.find((player) => player.id === death.player)?.role ===
      "wolfBeauty",
  );
  if (!beauty || beauty.causes.includes("duel") || !game.beautyTarget)
    return deaths;
  const otherWolvesRemain = applyDeaths(game.players, deaths).some(
    (player) => player.alive && isWolf(player.role),
  );
  if (!game.rules.lastWolfSkill && !otherWolvesRemain) return deaths;
  const target = game.players.find(
    (player) => player.id === game.beautyTarget && player.alive,
  );
  if (!target) return deaths;
  const existing = deaths.find((death) => death.player === target.id);
  if (existing && !existing.causes.includes("charm"))
    existing.causes.push("charm");
  else if (!existing) deaths.push({ player: target.id, causes: ["charm"] });
  return deaths;
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
      player.alive && !isWolf(player.role) && player.role !== "villager",
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
    (player) => player.alive && isWolf(player.role),
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
  if (next.rules.nightPriority === "wolf-first" && result.knifeDeaths.length) {
    const afterKnife = applyDeaths(next.players, result.knifeDeaths);
    const wolvesRemain = afterKnife.some(
      (player) => player.alive && isWolf(player.role),
    );
    if (wolvesRemain && wolfCondition(afterKnife, next.rules)) {
      next.pendingDeaths = result.knifeDeaths;
      next.forcedWinner = "wolf";
    }
  }
  const projectedWinner = determineWinner(
    applyDeaths(next.players, next.pendingDeaths),
    next.rules,
  );
  const luckyGuardOwner =
    next.lucky &&
    next.players.find((player) => player.id === next.lucky?.recipient)?.role ===
      "guard";
  next.lastLuckyGuard =
    luckyGuardOwner && next.lucky?.skill === "guard" && next.actions.lucky
      ? next.actions.lucky
      : null;
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

function gunCanShoot(game: Game, death: Death, nightDeath: boolean) {
  const player = game.players.find((item) => item.id === death.player);
  const wolfGun =
    player?.role === "wolfKing" ||
    (player?.role === "shadow" && game.shadowLearned === "hunter");
  if (!player || (player.role !== "hunter" && !wolfGun)) return false;
  if (
    death.causes.some((cause) =>
      ["poison", "charm", "trade", "duel", "explode"].includes(cause),
    )
  )
    return false;
  if (death.causes.includes("whiteBomb") && !game.rules.gunByWhiteWolf)
    return false;
  if (
    wolfGun &&
    player.role === "wolfKing" &&
    nightDeath &&
    !game.rules.wolfKingNightGun
  )
    return false;
  if (
    wolfGun &&
    !game.rules.lastWolfSkill &&
    !game.players.some((item) => item.alive && isWolf(item.role))
  )
    return false;
  if (death.causes.includes("clash") && !game.rules.hunterClash) return false;
  return death.causes.some((cause) =>
    ["wolf", "doubleKnife", "clash", "vote", "shot", "whiteBomb"].includes(
      cause,
    ),
  );
}

export function hunterStatus(game: Game): "can" | "cannot" | "absent" {
  const hunter = rolePlayer(game, "hunter");
  if (!hunter) return "absent";
  const death = calculateNight(game).deaths.find(
    (item) => item.player === hunter.id,
  );
  const projected = {
    ...game,
    players: applyDeaths(game.players, calculateNight(game).deaths),
  };
  return death && !gunCanShoot(projected, death, true) ? "cannot" : "can";
}

export function gunStatus(
  game: Game,
  role: "hunter" | "wolfKing" | "shadow",
): "can" | "cannot" | "absent" {
  const actor = rolePlayer(game, role);
  if (!actor || (role === "shadow" && game.shadowLearned !== "hunter"))
    return "absent";
  if (role === "wolfKing" && !game.rules.wolfKingNightGun) return "cannot";
  if (
    role !== "hunter" &&
    !game.rules.lastWolfSkill &&
    game.players.filter((player) => player.alive && isWolf(player.role))
      .length === 1
  )
    return "cannot";
  const deaths = calculateNight(game).deaths;
  const death = deaths.find((item) => item.player === actor.id);
  const projected = { ...game, players: applyDeaths(game.players, deaths) };
  return death && !gunCanShoot(projected, death, true) ? "cannot" : "can";
}

function startNextNight(game: Game) {
  game.night += 1;
  game.actions = emptyActions();
  game.pendingDeaths = [];
  game.forcedWinner = null;
  game.failedTrade = false;
  game.hunterTarget = null;
  game.badgeTarget = null;
  game.resumeAfter = null;
  game.vote = emptyVote();
  game.previousGuard = game.lastGuard;
  game.previousLuckyGuard = game.lastLuckyGuard;
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
    (!game.players.find((player) => player.id === game.sheriff)?.alive ||
      Boolean(
        game.players.find((player) => player.id === game.sheriff)?.revealed,
      ))
  ) {
    game.resumeAfter = resume;
    game.badgeTarget = null;
    game.phase = "badge";
    return;
  }
  if (resume === "speech") game.phase = "speech";
  else startNextNight(game);
}

function queueGuns(game: Game, deaths: Death[], resume: "speech" | "night") {
  for (const death of deaths) {
    if (
      !game.gunProcessed.includes(death.player) &&
      !game.gunQueue.includes(death.player) &&
      gunCanShoot(game, death, resume === "speech")
    )
      game.gunQueue.push(death.player);
  }
}

function nextGunOrContinue(game: Game, resume: "speech" | "night") {
  const actor = game.gunQueue.shift();
  if (actor) {
    game.gunActor = actor;
    game.gunProcessed.push(actor);
    game.resumeAfter = resume;
    game.hunterTarget = null;
    game.phase = "hunter";
  } else {
    game.gunActor = null;
    finishConsequences(game, resume);
  }
}

function handleDeaths(game: Game, deaths: Death[], resume: "speech" | "night") {
  const resolved = addCharmDeaths(game, deaths);
  const linked = resolved.filter(
    (death) =>
      death.causes.includes("charm") &&
      !deaths.some(
        (item) => item.player === death.player && item.causes.includes("charm"),
      ),
  );
  if (linked.length)
    game.logs.push({
      title: "狼美人殉情",
      detail: `${linked.map((death) => playerLabel(death.player)).join("、")}随狼美人出局，不能发动技能。`,
    });
  game.players = applyDeaths(game.players, resolved);
  queueGuns(game, resolved, resume);
  if (game.phase !== "dawn" && linked.length) {
    game.charmDeaths = linked.map((death) => death.player);
    game.resumeAfter = resume;
    game.phase = "charmResult";
    return;
  }
  nextGunOrContinue(game, resume);
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
  const actor = next.players.find((player) => player.id === next.gunActor);
  if (next.hunterTarget) {
    const shieldBlocksShot =
      next.resumeAfter === "speech" &&
      next.rules.hiddenVariant === "mechanical" &&
      next.shadowLearned === "guard" &&
      next.actions.shadowSkill === next.hunterTarget;
    const deaths: Death[] = shieldBlocksShot
      ? []
      : addCharmDeaths(next, [{ player: next.hunterTarget, causes: ["shot"] }]);
    next.players = applyDeaths(next.players, deaths);
    next.logs.push({
      title: `${actor ? ROLE_LABELS[actor.role] : "猎人"}技能`,
      detail: shieldBlocksShot
        ? `${playerLabel(next.hunterTarget)}被机械盾保护，未出局。`
        : `开枪带走 ${playerLabel(next.hunterTarget)}。`,
    });
    queueGuns(next, deaths, next.resumeAfter ?? "speech");
    const linked = deaths.filter((death) => death.causes.includes("charm"));
    if (linked.length) {
      next.charmDeaths = linked.map((death) => death.player);
      next.logs.push({
        title: "狼美人殉情",
        detail: `${linked.map((death) => playerLabel(death.player)).join("、")}随狼美人出局，不能发动技能。`,
      });
      next.phase = "charmResult";
      return next;
    }
  } else {
    next.logs.push({
      title: `${actor ? ROLE_LABELS[actor.role] : "猎人"}技能`,
      detail: "选择不开枪。",
    });
  }
  nextGunOrContinue(next, next.resumeAfter ?? "speech");
  return next;
}

export function finishCharmResult(game: Game): Game {
  if (game.phase !== "charmResult") return game;
  const next = copy(game);
  next.charmDeaths = [];
  nextGunOrContinue(next, next.resumeAfter ?? "speech");
  return next;
}

export function finishBadge(game: Game): Game {
  if (game.badgeTarget === null || !validTarget(game, game.badgeTarget))
    return game;
  if (
    game.badgeTarget &&
    game.players.find((player) => player.id === game.badgeTarget)?.revealed
  )
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
      !player.revealed &&
      (game.rules.pkCandidatesVote ||
        !game.vote.candidates?.includes(player.id)),
  );
}

export function votablePlayers(game: Game) {
  return living(game).filter((player) => !player.revealed);
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
      game.players.some(
        (player) => player.id === target && player.alive && !player.revealed,
      ) &&
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
  if (target && game.players.find((player) => player.id === target)?.revealed)
    return game;
  const next = copy(game);
  if (!target) {
    next.logs.push({
      title: `第 ${next.night} 天 · 投票`,
      detail: "本轮没有玩家被放逐。",
    });
    finishConsequences(next, "night");
  } else {
    const player = next.players.find((item) => item.id === target)!;
    if (player.role === "fool" && !player.revealed) {
      player.revealed = true;
      next.logs.push({
        title: `第 ${next.night} 天 · 愚者翻牌`,
        detail: `${playerLabel(target)}翻牌免于放逐，之后不能投票或被投票。`,
      });
      next.specialActor = target;
      next.phase = "foolReveal";
      return next;
    }
    next.logs.push({
      title: `第 ${next.night} 天 · 投票`,
      detail: `${playerLabel(target)}被投票放逐。`,
    });
    handleDeaths(next, [{ player: target, causes: ["vote"] }], "night");
  }
  return next;
}

export function finishFoolReveal(game: Game): Game {
  if (game.phase !== "foolReveal") return game;
  const next = copy(game);
  finishConsequences(next, "night");
  return next;
}

export function explode(game: Game, target: number): Game {
  const wolf = game.players.find(
    (player) =>
      player.id === target &&
      player.alive &&
      (player.role === "wolf" || player.role === "wolfKing"),
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

export function beginWhiteWolf(game: Game, actor: number): Game {
  if (
    game.phase !== "speech" ||
    !game.players.some(
      (player) =>
        player.id === actor && player.role === "whiteWolf" && player.alive,
    )
  )
    return game;
  const next = copy(game);
  next.specialActor = actor;
  next.specialTarget = null;
  next.phase = "whiteWolfSkill";
  return next;
}

export function canWhiteWolfTake(game: Game) {
  return (
    game.rules.lastWolfSkill ||
    game.players.some(
      (player) =>
        player.alive && isWolf(player.role) && player.id !== game.specialActor,
    )
  );
}

export function finishWhiteWolf(game: Game): Game {
  if (
    game.phase !== "whiteWolfSkill" ||
    !game.specialActor ||
    game.specialTarget === null ||
    !validTarget(game, game.specialTarget) ||
    game.specialTarget === game.specialActor ||
    (game.specialTarget && !canWhiteWolfTake(game))
  )
    return game;
  const next = copy(game);
  const deaths: Death[] = [{ player: next.specialActor!, causes: ["explode"] }];
  if (next.specialTarget)
    deaths.push({ player: next.specialTarget, causes: ["whiteBomb"] });
  next.logs.push({
    title: `第 ${next.night} 天 · 白狼王自爆`,
    detail: next.specialTarget
      ? `${playerLabel(next.specialActor)}自爆，带走 ${playerLabel(next.specialTarget)}。`
      : `${playerLabel(next.specialActor)}自爆，不带人。`,
  });
  handleDeaths(next, deaths, "night");
  return next;
}

export function beginKnight(game: Game): Game {
  if (game.phase !== "speech" || game.knightUsed || !rolePlayer(game, "knight"))
    return game;
  const next = copy(game);
  next.specialActor = rolePlayer(next, "knight")!.id;
  next.specialTarget = null;
  next.phase = "knightDuel";
  return next;
}

export function finishKnight(game: Game): Game {
  if (
    game.phase !== "knightDuel" ||
    !game.specialActor ||
    !game.specialTarget ||
    game.specialTarget === game.specialActor ||
    !validTarget(game, game.specialTarget)
  )
    return game;
  const next = copy(game);
  next.knightUsed = true;
  const target = next.players.find(
    (player) => player.id === next.specialTarget,
  )!;
  const targetIsWolf = isWolf(target.role);
  const out = targetIsWolf ? target.id : next.specialActor!;
  next.logs.push({
    title: `第 ${next.night} 天 · 骑士决斗`,
    detail: `${playerLabel(next.specialActor)}决斗 ${playerLabel(target.id)}（${targetIsWolf ? "狼人" : "好人"}），${playerLabel(out)}出局。`,
  });
  handleDeaths(
    next,
    [{ player: out, causes: ["duel"] }],
    targetIsWolf ? "night" : "speech",
  );
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
