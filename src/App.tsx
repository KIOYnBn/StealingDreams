import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Crown,
  Crosshair,
  Download,
  Eye,
  FlaskConical,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  MoonStar,
  RotateCcw,
  ScrollText,
  Settings2,
  Shield,
  Shuffle,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Users,
  X,
} from "lucide-react";
import {
  CAUSE_LABELS,
  DEFAULT_RULES,
  PRESETS,
  ROLE_LABELS,
  ROLE_ORDER,
  SPECIAL_ROLES,
  activeLucky,
  advanceNight,
  announceDawn,
  beginKnight,
  beginPk,
  beginWhiteWolf,
  canWhiteWolfTake,
  canWitchSave,
  completeElection,
  createGame,
  explode,
  finishBadge,
  finishCharmResult,
  finishFoolReveal,
  finishHunter,
  finishKnight,
  finishSpeech,
  finishVote,
  finishWhiteWolf,
  gunStatus,
  hydrateGame,
  isWolf,
  living,
  nightError,
  nightPhases,
  playerCount,
  playerLabel,
  packAlive,
  resolveManualWinner,
  roleCounts,
  roleName,
  rolePlayer,
  seenRole,
  seerSeesWolf,
  settleNight,
  shadowSkillType,
  tallyVotes,
  votablePlayers,
  type Board,
  type Game,
  type NightPhase,
  type Player,
  type Role,
  type Rules,
} from "./game";

const STORAGE_KEY = "nightcourt-dm-v1";

type SetupStep = "board" | "seats";
type Modal = "help" | "log" | null;
type Draft = (update: (current: Game) => Game) => void;
type Commit = (next: Game) => void;

interface SavedState {
  board: Board;
  rules: Rules;
  assignments: (Role | null)[];
  setupStep: SetupStep;
  game: Game | null;
  history: Game[];
}

function loadSaved(): SavedState | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const saved = JSON.parse(value) as SavedState;
    if (
      !saved.board ||
      !saved.rules ||
      !Array.isArray(saved.assignments) ||
      !Array.isArray(saved.history)
    )
      return null;
    return {
      ...saved,
      rules: { ...DEFAULT_RULES, ...saved.rules },
      game: saved.game ? hydrateGame(saved.game) : null,
      history: saved.history.map(hydrateGame),
    };
  } catch {
    return null;
  }
}

const phaseTitles: Record<Game["phase"], string> = {
  merchant: "奇迹商人交易",
  shadowLearn: "隐狼模仿",
  guard: "守卫行动",
  wolf: "狼人行动",
  wolfBeauty: "狼美人魅惑",
  shadowSkill: "隐狼技能",
  witch: "女巫行动",
  seer: "预言家行动",
  mirror: "魔镜少女查验",
  lucky: "幸运儿行动",
  hunterStatus: "猎人状态",
  resolve: "夜晚结算",
  election: "警长竞选",
  dawn: "公布昨夜死讯",
  hunter: "猎人技能",
  whiteWolfSkill: "白狼王自爆",
  knightDuel: "骑士决斗",
  foolReveal: "愚者翻牌",
  charmResult: "狼美人殉情",
  badge: "警徽移交",
  speech: "白天发言",
  vote: "放逐投票",
  end: "对局结束",
};

const nightShort: Record<NightPhase, string> = {
  merchant: "商人",
  shadowLearn: "隐狼",
  guard: "守卫",
  wolf: "狼人",
  wolfBeauty: "狼美人",
  shadowSkill: "隐狼技能",
  witch: "女巫",
  seer: "预言家",
  mirror: "魔镜",
  lucky: "幸运儿",
  hunterStatus: "猎人",
  resolve: "结算",
};

function RoleIcon({ role, size = 17 }: { role: Role; size?: number }) {
  const props = { size, strokeWidth: 1.7 };
  if (isWolf(role)) return <MoonStar {...props} />;
  if (role === "villager") return <Users {...props} />;
  if (role === "seer" || role === "mirror") return <Eye {...props} />;
  if (role === "witch") return <FlaskConical {...props} />;
  if (role === "hunter") return <Crosshair {...props} />;
  if (role === "knight") return <Swords {...props} />;
  if (role === "merchant") return <Sparkles {...props} />;
  if (role === "fool") return <BookOpen {...props} />;
  return <Shield {...props} />;
}

function Logo() {
  return (
    <div className="logo-lockup">
      <span className="logo-symbol" aria-hidden="true">
        <MoonStar size={24} strokeWidth={1.55} />
      </span>
      <span>
        <strong>夜幕法官台</strong>
        <small>NIGHTFALL / DM TOOL</small>
      </span>
    </div>
  );
}

function Sidebar({
  game,
  storageAvailable,
  onModal,
  onReset,
}: {
  game: Game | null;
  storageAvailable: boolean;
  onModal: (modal: Modal) => void;
  onReset: () => void;
}) {
  return (
    <aside className="sidebar">
      <Logo />
      <div className="sidebar-label">
        WORKSPACE <span>工作空间</span>
      </div>
      <nav className="side-nav" aria-label="工作台导航">
        <button
          type="button"
          className="side-link active"
          aria-label="对局工作台"
          onClick={() => onModal(null)}
        >
          <LayoutDashboard size={17} />
          <span>对局工作台</span>
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          className="side-link"
          aria-label="对局记录"
          onClick={() => onModal("log")}
        >
          <ScrollText size={17} />
          <span>对局记录</span>
          {game && <span className="side-count">{game.logs.length}</span>}
        </button>
        <button
          type="button"
          className="side-link"
          aria-label="使用与规则"
          onClick={() => onModal("help")}
        >
          <BookOpen size={17} />
          <span>使用与规则</span>
        </button>
      </nav>
      <div className="sidebar-spacer" />
      {game && (
        <button className="side-reset" type="button" onClick={onReset}>
          <RotateCcw size={15} /> 重新开始对局
        </button>
      )}
      <div className="sidebar-bottom">
        <span
          className={`save-indicator${storageAvailable ? "" : " unavailable"}`}
        />
        <div>
          <strong>
            {storageAvailable ? "进度自动保存在本机" : "浏览器无法自动保存"}
          </strong>
          <small>
            {storageAvailable
              ? "请勿向玩家展示法官界面"
              : "请检查浏览器存储权限"}
          </small>
        </div>
        <LockKeyhole size={15} />
      </div>
    </aside>
  );
}

function SectionTitle({
  index,
  title,
  description,
  action,
}: {
  index?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div className="section-title-main">
        {index && <span className="section-number">{index}</span>}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function RulesForm({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  function change<K extends keyof Rules>(key: K, value: Rules[K]) {
    onChange({ ...rules, [key]: value });
  }
  return (
    <div className="rules-wrap">
      <div className="rules-grid">
        <label className="rule-field">
          <span>狼人胜利条件</span>
          <select
            value={rules.victory}
            onChange={(event) =>
              change("victory", event.target.value as Rules["victory"])
            }
          >
            <option value="edge">屠边：全部村民或神职出局</option>
            <option value="all">屠城：全部好人出局</option>
          </select>
        </label>
        <label className="rule-field">
          <span>女巫自救</span>
          <select
            value={rules.selfSave}
            onChange={(event) =>
              change("selfSave", event.target.value as Rules["selfSave"])
            }
          >
            <option value="first">仅首夜可以自救</option>
            <option value="never">全程不可自救</option>
            <option value="always">全程可以自救</option>
          </select>
        </label>
        <label className="rule-field">
          <span>同守同救</span>
          <select
            value={rules.clash}
            onChange={(event) =>
              change("clash", event.target.value as Rules["clash"])
            }
          >
            <option value="die">目标出局（奶穿）</option>
            <option value="live">目标存活</option>
          </select>
        </label>
        <label className="rule-field">
          <span>警长竞选</span>
          <select
            value={rules.sheriff ? "yes" : "no"}
            onChange={(event) =>
              change("sheriff", event.target.value === "yes")
            }
          >
            <option value="yes">开启，首日手动录入结果</option>
            <option value="no">不开启警长</option>
          </select>
        </label>
      </div>
      <details className="advanced-rules">
        <summary>
          <Settings2 size={15} /> 更多桌规设置 <ChevronDown size={15} />
        </summary>
        <div className="rules-grid advanced-grid">
          <label className="rule-field">
            <span>女巫同夜双药</span>
            <select
              value={rules.doublePotion ? "yes" : "no"}
              onChange={(event) =>
                change("doublePotion", event.target.value === "yes")
              }
            >
              <option value="no">不允许</option>
              <option value="yes">允许</option>
            </select>
          </label>
          <label className="rule-field">
            <span>奶穿出局的猎人</span>
            <select
              value={rules.hunterClash ? "yes" : "no"}
              onChange={(event) =>
                change("hunterClash", event.target.value === "yes")
              }
            >
              <option value="yes">可以开枪</option>
              <option value="no">不能开枪</option>
            </select>
          </label>
          <label className="rule-field">
            <span>夜晚胜负结算</span>
            <select
              value={rules.nightPriority}
              onChange={(event) =>
                change(
                  "nightPriority",
                  event.target.value as Rules["nightPriority"],
                )
              }
            >
              <option value="together">处理全部死亡和猎人技能后判胜</option>
              <option value="wolf-first">狼刀优先：刀达成狼胜即结束</option>
            </select>
          </label>
          <label className="rule-field">
            <span>双方同时达成胜利条件</span>
            <select
              value={rules.simultaneous}
              onChange={(event) =>
                change(
                  "simultaneous",
                  event.target.value as Rules["simultaneous"],
                )
              }
            >
              <option value="manual">交由法官裁定</option>
              <option value="good">好人优先</option>
              <option value="wolf">狼人优先</option>
            </select>
          </label>
          <label className="rule-field">
            <span>警长票权</span>
            <select
              value={String(rules.sheriffWeight)}
              onChange={(event) =>
                change("sheriffWeight", Number(event.target.value) as 1 | 1.5)
              }
            >
              <option value="1.5">1.5 票</option>
              <option value="1">1 票</option>
            </select>
          </label>
          <label className="rule-field">
            <span>PK 玩家参与重投</span>
            <select
              value={rules.pkCandidatesVote ? "yes" : "no"}
              onChange={(event) =>
                change("pkCandidatesVote", event.target.value === "yes")
              }
            >
              <option value="no">PK 玩家不投票</option>
              <option value="yes">PK 玩家可以投票</option>
            </select>
          </label>
          <label className="rule-field">
            <span>隐狼规则版本</span>
            <select
              value={rules.hiddenVariant}
              onChange={(event) =>
                change(
                  "hiddenVariant",
                  event.target.value as Rules["hiddenVariant"],
                )
              }
            >
              <option value="awakened">觉醒隐狼（守护可重复）</option>
              <option value="mechanical">机械狼（守护仅一次）</option>
            </select>
          </label>
          <label className="rule-field">
            <span>狼王夜间出局</span>
            <select
              value={rules.wolfKingNightGun ? "yes" : "no"}
              onChange={(event) =>
                change("wolfKingNightGun", event.target.value === "yes")
              }
            >
              <option value="yes">符合条件可开枪</option>
              <option value="no">夜间不能开枪</option>
            </select>
          </label>
          <label className="rule-field">
            <span>被白狼王带走的枪手</span>
            <select
              value={rules.gunByWhiteWolf ? "yes" : "no"}
              onChange={(event) =>
                change("gunByWhiteWolf", event.target.value === "yes")
              }
            >
              <option value="no">不能开枪</option>
              <option value="yes">可开枪</option>
            </select>
          </label>
          <label className="rule-field">
            <span>最后一狼出局时技能</span>
            <select
              value={rules.lastWolfSkill ? "yes" : "no"}
              onChange={(event) =>
                change("lastWolfSkill", event.target.value === "yes")
              }
            >
              <option value="no">技能失效</option>
              <option value="yes">仍可发动</option>
            </select>
          </label>
          <label className="rule-field">
            <span>隐狼双刀同一人</span>
            <select
              value={rules.doubleKnifePierces ? "yes" : "no"}
              onChange={(event) =>
                change("doubleKnifePierces", event.target.value === "yes")
              }
            >
              <option value="yes">无视守护和解药</option>
              <option value="no">按普通狼刀结算</option>
            </select>
          </label>
        </div>
        <p className="rule-explainer">
          守卫不能连续守同一人；毒药无视守护，被毒的猎人不能开枪。规则将在开始后固定。
        </p>
      </details>
    </div>
  );
}

function SetupSummary({
  board,
  rules,
  assignments,
}: {
  board: Board;
  rules: Rules;
  assignments: (Role | null)[];
}) {
  const counts = roleCounts(board);
  return (
    <aside className="summary-rail">
      <div className="rail-heading">
        <span>对局概览</span>
        <small>GAME SETUP</small>
      </div>
      <div className="summary-board">
        <span className="summary-moon">
          <MoonStar size={23} strokeWidth={1.5} />
        </span>
        <div>
          <small>当前板子</small>
          <strong>
            {board.expectedCount ?? playerCount(board)} 人 · {board.name}
          </strong>
        </div>
      </div>
      <div className="rail-divider" />
      <div className="rail-subhead">
        身份配置{" "}
        <span>
          {playerCount(board)}
          {board.expectedCount ? ` / ${board.expectedCount}` : ""} 张
        </span>
      </div>
      <div className="role-list">
        {ROLE_ORDER.filter((role) => counts[role] > 0).map((role) => (
          <div className="role-list-item" key={role}>
            <span className={`role-mini ${role}`}>
              <RoleIcon role={role} size={15} />
            </span>
            <span>{roleName(role, rules)}</span>
            <strong>× {counts[role]}</strong>
          </div>
        ))}
      </div>
      <div className="rail-divider" />
      <div className="rail-subhead">本局规则</div>
      <div className="summary-rules">
        <div>
          <span>获胜方式</span>
          <strong>{rules.victory === "edge" ? "屠边" : "屠城"}</strong>
        </div>
        <div>
          <span>警长</span>
          <strong>{rules.sheriff ? "开启" : "关闭"}</strong>
        </div>
        <div>
          <span>身份登记</span>
          <strong>
            {assignments.filter(Boolean).length} / {playerCount(board)}
          </strong>
        </div>
      </div>
      <div className="rail-note">
        <LockKeyhole size={15} />
        <span>所有身份和夜间信息仅供法官查看。</span>
      </div>
    </aside>
  );
}

function SetupView({
  board,
  rules,
  assignments,
  setupStep,
  setBoard,
  setRules,
  setAssignments,
  setSetupStep,
  onStart,
}: {
  board: Board;
  rules: Rules;
  assignments: (Role | null)[];
  setupStep: SetupStep;
  setBoard: (board: Board) => void;
  setRules: (rules: Rules) => void;
  setAssignments: (assignments: (Role | null)[]) => void;
  setSetupStep: (step: SetupStep) => void;
  onStart: () => void;
}) {
  const [boardFilter, setBoardFilter] = useState<"all" | "6" | "10" | "12">(
    "all",
  );
  const count = playerCount(board);
  const counts = roleCounts(board);
  const assignedCounts = ROLE_ORDER.reduce(
    (result, role) => ({
      ...result,
      [role]: assignments.filter((item) => item === role).length,
    }),
    {} as Record<Role, number>,
  );
  const setupError =
    board.expectedCount && count !== board.expectedCount
      ? `该板子还缺 ${board.expectedCount - count} 张身份，请先选择补充身份。`
      : count < 5 || count > 20
        ? "请将玩家人数设置为 5 至 20 人。"
        : rules.victory === "edge" &&
            !ROLE_ORDER.some(
              (role) =>
                role !== "villager" && !isWolf(role) && counts[role] > 0,
            )
          ? "屠边规则需要至少一张神职牌。"
          : null;
  const seatsValid =
    assignments.length === count &&
    assignments.every(Boolean) &&
    ROLE_ORDER.every((role) => assignedCounts[role] === counts[role]);

  function chooseBoard(next: Board) {
    if (next.id === board.id && next.id !== "custom") return;
    setBoard({ ...next, specials: [...next.specials] });
    setAssignments(Array(playerCount(next)).fill(null));
  }

  function updateCustom(next: Board) {
    setBoard(next);
    setAssignments(Array(playerCount(next)).fill(null));
  }

  function randomAssign() {
    if (
      assignments.some(Boolean) &&
      !window.confirm("随机分配会覆盖已登记的身份，继续吗？")
    )
      return;
    const roles = ROLE_ORDER.flatMap((role) =>
      Array<Role>(counts[role]).fill(role),
    );
    for (let index = roles.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [roles[index], roles[random]] = [roles[random], roles[index]];
    }
    setAssignments(roles);
  }

  return (
    <div className="workspace-grid">
      <div className="workspace-main">
        <div className="setup-progress">
          <div className={setupStep === "board" ? "current" : "done"}>
            <span>{setupStep === "seats" ? <Check size={13} /> : "01"}</span>{" "}
            选择板子与规则
          </div>
          <i />
          <div className={setupStep === "seats" ? "current" : ""}>
            <span>02</span> 登记玩家身份
          </div>
        </div>
        {setupStep === "board" ? (
          <>
            <section className="setup-section">
              <SectionTitle
                index="01"
                title="选择板子"
                description="从常用配置开始，也可以自定义人数。"
              />
              <div
                className="board-filter"
                role="group"
                aria-label="按人数筛选板子"
              >
                {(["all", "6", "10", "12"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={boardFilter === filter ? "active" : ""}
                    aria-pressed={boardFilter === filter}
                    onClick={() => setBoardFilter(filter)}
                  >
                    {filter === "all" ? "全部板子" : `${filter} 人`}
                  </button>
                ))}
                <span>向下滚动查看更多</span>
              </div>
              <div className="board-grid">
                {PRESETS.filter(
                  (preset) =>
                    boardFilter === "all" ||
                    (preset.expectedCount ?? playerCount(preset)) ===
                      Number(boardFilter),
                ).map((preset) => (
                  <button
                    className={`board-card${board.id === preset.id ? " selected" : ""}`}
                    key={preset.id}
                    type="button"
                    onClick={() => chooseBoard(preset)}
                    aria-pressed={board.id === preset.id}
                  >
                    <span className="board-top">
                      <span className="board-icon">
                        <Moon size={17} />
                      </span>
                      <span className="board-check">
                        {board.id === preset.id && <Check size={13} />}
                      </span>
                    </span>
                    <span className="board-size">
                      {preset.expectedCount ?? playerCount(preset)}
                      <small> 人局</small>
                    </span>
                    <strong>{preset.name}</strong>
                    <span className="board-detail">
                      {preset.wolves + preset.specials.filter(isWolf).length} 狼
                      / {preset.villagers} 民 /{" "}
                      {preset.specials.filter((role) => !isWolf(role)).length}{" "}
                      神
                      {preset.expectedCount && !preset.extraRole
                        ? " · 缺 1"
                        : ""}
                    </span>
                  </button>
                ))}
                <button
                  className={`board-card custom-card${board.id === "custom" ? " selected" : ""}`}
                  type="button"
                  onClick={() =>
                    chooseBoard({
                      id: "custom",
                      name: "自定义",
                      wolves: 3,
                      villagers: 3,
                      specials: ["seer", "witch", "hunter"],
                    })
                  }
                  aria-pressed={board.id === "custom"}
                >
                  <span className="board-top">
                    <span className="board-icon">
                      <Settings2 size={17} />
                    </span>
                    <span className="board-check">
                      {board.id === "custom" && <Check size={13} />}
                    </span>
                  </span>
                  <span className="board-size custom-size">自定义</span>
                  <strong>自由搭配</strong>
                  <span className="board-detail">按现场人数设置</span>
                </button>
              </div>
              {board.note && (
                <div className="board-notice">
                  <AlertCircle size={16} />
                  <span>
                    {board.id === "10-white-knight" && board.extraRole
                      ? `已补充第 10 张：${ROLE_LABELS[board.extraRole]}。请与你的现场配置核对。`
                      : board.note}
                  </span>
                </div>
              )}
              {board.expectedCount && (
                <label className="rule-field missing-role">
                  <span>补充第 10 张身份</span>
                  <select
                    value={board.extraRole ?? ""}
                    onChange={(event) =>
                      updateCustom({
                        ...board,
                        extraRole: (event.target.value || null) as Role | null,
                      })
                    }
                  >
                    <option value="">请选择缺失的身份</option>
                    {ROLE_ORDER.filter(
                      (role) =>
                        role === "wolf" ||
                        role === "villager" ||
                        !board.specials.includes(
                          role as Exclude<Role, "wolf" | "villager">,
                        ),
                    ).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {board.id === "custom" && (
                <div className="custom-settings">
                  <div className="custom-counts">
                    <label>
                      狼人数量
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={board.wolves}
                        onChange={(event) =>
                          updateCustom({
                            ...board,
                            wolves: Math.max(
                              1,
                              Math.min(8, Number(event.target.value) || 1),
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      村民数量
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={board.villagers}
                        onChange={(event) =>
                          updateCustom({
                            ...board,
                            villagers: Math.max(
                              1,
                              Math.min(12, Number(event.target.value) || 1),
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="custom-specials">
                    <span>特殊角色</span>
                    {SPECIAL_ROLES.map((role) => (
                      <label key={role}>
                        <input
                          type="checkbox"
                          checked={board.specials.includes(role)}
                          onChange={(event) =>
                            updateCustom({
                              ...board,
                              specials: event.target.checked
                                ? [...board.specials, role]
                                : board.specials.filter(
                                    (item) => item !== role,
                                  ),
                            })
                          }
                        />
                        {ROLE_LABELS[role]}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
            <section className="setup-section rules-section">
              <SectionTitle
                index="02"
                title="确认本局规则"
                description="每个场子的玩法不同，开局前先约定好。"
              />
              <RulesForm rules={rules} onChange={setRules} />
            </section>
            <div className="setup-footer">
              <div className="footer-hint">
                <LockKeyhole size={15} /> 对局数据仅保存在本机
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={Boolean(setupError)}
                onClick={() => setSetupStep("seats")}
              >
                下一步：登记身份 <ArrowRight size={17} />
              </button>
            </div>
            {setupError && (
              <p className="validation-message">
                <AlertCircle size={14} />
                {setupError}
              </p>
            )}
          </>
        ) : (
          <section className="setup-section seats-section">
            <SectionTitle
              index="02"
              title="登记玩家身份"
              description="按座位号记录真实身份，开始后仅法官可见。"
              action={
                <button
                  className="outline-button compact"
                  type="button"
                  onClick={randomAssign}
                >
                  <Shuffle size={15} /> 随机分配
                </button>
              }
            />
            <div className="seat-tip">
              <AlertCircle size={16} />
              <span>
                如果玩家已经抽过身份牌，请手动登记。随机分配适合由法官发牌的场景。
              </span>
            </div>
            <div className="seat-grid">
              {Array.from({ length: count }, (_, index) => {
                const selected = assignments[index] ?? "";
                return (
                  <label
                    className={`seat-field${selected ? " has-role" : ""}`}
                    key={index}
                  >
                    <span className="seat-field-number">
                      {String(index + 1).padStart(2, "0")} <small>号玩家</small>
                    </span>
                    <select
                      aria-label={`${index + 1} 号玩家身份`}
                      value={selected}
                      onChange={(event) => {
                        const updated = [...assignments];
                        updated[index] = (event.target.value ||
                          null) as Role | null;
                        setAssignments(updated);
                      }}
                    >
                      <option value="">选择身份</option>
                      {ROLE_ORDER.filter((role) => counts[role] > 0).map(
                        (role) => (
                          <option
                            key={role}
                            value={role}
                            disabled={
                              selected !== role &&
                              assignedCounts[role] >= counts[role]
                            }
                          >
                            {roleName(role, rules)}（剩余{" "}
                            {counts[role] -
                              assignedCounts[role] +
                              Number(selected === role)}
                            ）
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                );
              })}
            </div>
            <div className="assignment-counts">
              {ROLE_ORDER.filter((role) => counts[role] > 0).map((role) => (
                <span
                  key={role}
                  className={
                    assignedCounts[role] === counts[role] ? "complete" : ""
                  }
                >
                  {roleName(role, rules)}{" "}
                  <strong>
                    {assignedCounts[role]}/{counts[role]}
                  </strong>
                </span>
              ))}
            </div>
            <div className="setup-footer">
              <button
                className="text-button"
                type="button"
                onClick={() => setSetupStep("board")}
              >
                <ArrowLeft size={16} /> 返回板子设置
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={!seatsValid}
                onClick={onStart}
              >
                开始第一夜 <ArrowRight size={17} />
              </button>
            </div>
            {!seatsValid && (
              <p className="validation-message muted">
                请登记全部玩家，且身份数量须与板子一致。
              </p>
            )}
          </section>
        )}
      </div>
      <SetupSummary board={board} rules={rules} assignments={assignments} />
    </div>
  );
}

function TargetGrid({
  players,
  selected,
  onSelect,
  passLabel,
  blocked,
  showRoles = true,
}: {
  players: Player[];
  selected: number | null;
  onSelect: (id: number) => void;
  passLabel?: string;
  blocked?: Record<number, string>;
  showRoles?: boolean;
}) {
  return (
    <div className="target-grid">
      {players.map((player) => (
        <button
          className={`target-button${selected === player.id ? " selected" : ""}`}
          type="button"
          key={player.id}
          disabled={Boolean(blocked?.[player.id])}
          onClick={() => onSelect(player.id)}
          aria-pressed={selected === player.id}
        >
          <strong>{String(player.id).padStart(2, "0")}</strong>
          <span>
            {blocked?.[player.id] ||
              (showRoles
                ? player.role === "shadow"
                  ? "隐狼"
                  : ROLE_LABELS[player.role]
                : "号玩家")}
          </span>
        </button>
      ))}
      {passLabel && (
        <button
          className={`target-button pass-target${selected === 0 ? " selected" : ""}`}
          type="button"
          onClick={() => onSelect(0)}
          aria-pressed={selected === 0}
        >
          <strong>-</strong>
          <span>{passLabel}</span>
        </button>
      )}
    </div>
  );
}

function GameRail({ game, onLog }: { game: Game; onLog: () => void }) {
  const alive = living(game);
  return (
    <aside className="summary-rail game-rail">
      <div className="rail-heading">
        <span>玩家状态</span>
        <small>仅法官可见</small>
      </div>
      <div className="alive-summary">
        <div>
          <strong>{String(alive.length).padStart(2, "0")}</strong>
          <span>人存活</span>
        </div>
        <span>共 {game.players.length} 人</span>
      </div>
      <div className="roster-list">
        {game.players.map((player) => (
          <div
            className={`roster-row${player.alive ? "" : " dead"}`}
            key={player.id}
          >
            <span className="roster-num">
              {String(player.id).padStart(2, "0")}
            </span>
            <span className={`roster-role ${player.role}`}>
              <RoleIcon role={player.role} size={14} />
              {roleName(player.role, game.rules)}
            </span>
            {game.sheriff === player.id && (
              <Crown className="crown-icon" size={14} />
            )}
            <span className="roster-status">
              {player.alive ? (player.revealed ? "翻牌" : "存活") : "出局"}
            </span>
          </div>
        ))}
      </div>
      {roleCounts(game.board).witch > 0 && (
        <>
          <div className="rail-divider" />
          <div className="rail-subhead">女巫药剂</div>
          <div className="potion-row">
            <span>
              <i className={game.antidote ? "available" : ""} /> 解药
            </span>
            <strong>{game.antidote ? "未使用" : "已使用"}</strong>
          </div>
          <div className="potion-row">
            <span>
              <i className={game.poison ? "available poison" : ""} /> 毒药
            </span>
            <strong>{game.poison ? "未使用" : "已使用"}</strong>
          </div>
        </>
      )}
      {roleCounts(game.board).guard > 0 && (
        <div className="last-guard">
          最近守护{" "}
          <strong>{game.lastGuard ? playerLabel(game.lastGuard) : "无"}</strong>
        </div>
      )}
      <button type="button" className="rail-log-link" onClick={onLog}>
        查看完整对局记录 <ArrowRight size={14} />
      </button>
    </aside>
  );
}

function StageFooter({
  canUndo,
  onUndo,
  onNext,
  label,
  error,
  children,
}: {
  canUndo: boolean;
  onUndo: () => void;
  onNext?: () => void;
  label?: string;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="stage-footer-wrap">
      {error && (
        <p className="stage-error">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <div className="stage-footer">
        <button
          className="text-button"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <ArrowLeft size={16} /> 上一步
        </button>
        <div className="stage-footer-actions">
          {children}
          {onNext && (
            <button
              className="primary-button"
              type="button"
              disabled={Boolean(error)}
              onClick={onNext}
            >
              {label || "确认并继续"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Cue({ children }: { children: ReactNode }) {
  return (
    <div className="judge-cue">
      <span>
        <Sparkles size={14} /> 法官提示词
      </span>
      <p>“{children}”</p>
    </div>
  );
}

function StagePanel({
  game,
  draft,
  commit,
  canUndo,
  onUndo,
  onReset,
  onDownload,
}: {
  game: Game;
  draft: Draft;
  commit: Commit;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onDownload: () => void;
}) {
  const alive = living(game);
  const activeRole = (role: Role) => Boolean(rolePlayer(game, role));
  const updateAction = (
    key: keyof Game["actions"],
    value: Game["actions"][keyof Game["actions"]],
  ) =>
    draft((current) => ({
      ...current,
      actions: { ...current.actions, [key]: value },
    }));
  const disabledRole = (role: Role) => (
    <div className="inactive-role">
      <AlertCircle size={18} />
      <div>
        <strong>{ROLE_LABELS[role]}已出局</strong>
        <p>可按现场习惯保留播报，直接进入下一步，不再记录行动。</p>
      </div>
    </div>
  );
  const footer = (onNext: () => void, label: string, error?: string | null) => (
    <StageFooter
      canUndo={canUndo}
      onUndo={onUndo}
      onNext={onNext}
      label={label}
      error={error}
    />
  );
  const nightNext = () => commit(advanceNight(game));
  const nightWarning = nightError(game);

  if (game.phase === "merchant") {
    const merchant = rolePlayer(game, "merchant");
    const target = game.players.find(
      (player) => player.id === game.actions.merchant,
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / MERCHANT</span>
            <h2>奇迹商人请睁眼</h2>
            <p>全局可交易一次：选择他人并赠送查验、毒药或守护。</p>
          </div>
          <span className="stage-icon">
            <Sparkles size={22} />
          </span>
        </div>
        <Cue>奇迹商人请睁眼，今晚是否进行交易？</Cue>
        {!merchant ? (
          disabledRole("merchant")
        ) : game.merchantUsed ? (
          <div className="inactive-role">
            <CheckCircle2 size={18} />
            <div>
              <strong>交易机会已使用</strong>
              <p>可保留播报，直接继续。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="field-heading">
              选择交易对象 <span>不能选择商人自己</span>
            </div>
            <TargetGrid
              players={alive.filter((player) => player.id !== merchant.id)}
              selected={game.actions.merchant}
              onSelect={(id) => updateAction("merchant", id)}
              passLabel="暂不交易"
            />
            {target && (
              <>
                <div className="field-heading">
                  选择赠送技能 <span>若对象为狼人，交易失败且商人出局</span>
                </div>
                <div className="witch-actions">
                  {(
                    [
                      ["check", "查验"],
                      ["poison", "毒药"],
                      ["guard", "守护"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      className={game.actions.gift === value ? "selected" : ""}
                      onClick={() => updateAction("gift", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="inline-hint">
                  仅法官可见：
                  {isWolf(target.role)
                    ? "交易对象属于狼人阵营，交易将失败。"
                    : "交易对象为好人，幸运儿可在当晚或之后使用一次。"}
                </p>
              </>
            )}
          </>
        )}
        {footer(nightNext, "确认商人行动", nightWarning)}
      </div>
    );
  }

  if (game.phase === "shadowLearn") {
    const shadow = rolePlayer(game, "shadow");
    const target = game.players.find(
      (player) => player.id === game.actions.shadowLearn,
    );
    const allowed: Role[] = [
      "wolf",
      "villager",
      "seer",
      "witch",
      "hunter",
      "guard",
      "mirror",
    ];
    const blocked = Object.fromEntries(
      alive
        .filter((player) => !allowed.includes(player.role))
        .map((player) => [player.id, "暂不支持"]),
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / SHADOW</span>
            <h2>
              {game.rules.hiddenVariant === "mechanical"
                ? "机械狼"
                : "觉醒隐狼"}
              请睁眼
            </h2>
            <p>可在任意夜晚模仿一名玩家，全局限一次。</p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>隐狼请睁眼，今晚是否模仿一名玩家？</Cue>
        {!shadow ? (
          disabledRole("shadow")
        ) : game.shadowLearned ? (
          <div className="inactive-role">
            <CheckCircle2 size={18} />
            <div>
              <strong>已模仿：{ROLE_LABELS[game.shadowLearned]}</strong>
              <p>身份立即生效，其他技能从下一夜起使用；猎人枪从当夜生效。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="field-heading">
              选择模仿目标 <span>不与其他狼人见面，不能模仿自己</span>
            </div>
            <TargetGrid
              players={alive.filter((player) => player.id !== shadow.id)}
              selected={game.actions.shadowLearn}
              onSelect={(id) => updateAction("shadowLearn", id)}
              passLabel="暂不模仿"
              blocked={blocked}
            />
            {target && (
              <div className="seer-result">
                <Eye size={18} />
                <div>
                  <small>向隐狼示意目标真实身份</small>
                  <strong>
                    {playerLabel(target.id)}是{ROLE_LABELS[target.role]}
                  </strong>
                </div>
              </div>
            )}
            <p className="inline-hint">
              当前支持模仿普狼、平民、预言家、魔镜、女巫、守卫和猎人；其他特殊角色需线下裁定。
            </p>
          </>
        )}
        {footer(nightNext, "确认模仿", nightWarning)}
      </div>
    );
  }

  if (game.phase === "guard")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / 01</span>
            <h2>守卫请睁眼</h2>
            <p>记录今晚要守护的玩家，守卫也可以选择空守。</p>
          </div>
          <span className="stage-icon guard">
            <Shield size={22} />
          </span>
        </div>
        <Cue>守卫请睁眼，今晚你要守护谁？</Cue>
        {activeRole("guard") ? (
          <>
            <div className="field-heading">
              选择守护目标 <span>不可连续两晚守护同一人</span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.guard}
              onSelect={(id) => updateAction("guard", id)}
              passLabel="空守"
              blocked={Object.fromEntries(
                [game.lastGuard, game.lastLuckyGuard]
                  .filter((id): id is number => Boolean(id))
                  .map((id) => [id, "上夜守护"]),
              )}
            />
          </>
        ) : (
          disabledRole("guard")
        )}
        {footer(nightNext, "确认守护", nightWarning)}
      </div>
    );

  if (game.phase === "wolf")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / WOLVES</span>
            <h2>
              {rolePlayer(game, "shadow") && !packAlive(game)
                ? "隐狼单独带刀"
                : "狼人请睁眼"}
            </h2>
            <p>
              {rolePlayer(game, "shadow") && packAlive(game)
                ? "隐狼不与狼队见面；只记录其他狼人的刀口。"
                : "记录狼人商议后的刀口，也支持空刀或自刀。"}
            </p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>
          {rolePlayer(game, "shadow") && !packAlive(game)
            ? "隐狼请单独睁眼，今晚你要袭击谁？"
            : "狼人请睁眼，今晚你们要袭击谁？"}
        </Cue>
        <div className="field-heading">
          选择狼刀目标 <span>只记录狼人最终达成的选择</span>
        </div>
        <TargetGrid
          players={alive}
          selected={game.actions.wolf}
          onSelect={(id) => updateAction("wolf", id)}
          passLabel="空刀"
          blocked={Object.fromEntries(
            alive
              .filter((player) => player.role === "wolfBeauty")
              .map((player) => [player.id, "不可自刀"]),
          )}
        />
        {footer(nightNext, "确认狼刀", nightWarning)}
      </div>
    );

  if (game.phase === "wolfBeauty") {
    const beauty = rolePlayer(game, "wolfBeauty");
    const blocked = Object.fromEntries(
      [beauty?.id, game.lastBeauty]
        .filter((id): id is number => Boolean(id))
        .map((id) => [id, id === beauty?.id ? "不可自魅" : "上夜魅惑"]),
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / BEAUTY</span>
            <h2>狼美人请睁眼</h2>
            <p>选择魅惑目标；狼美人出局时目标可能殉情。</p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>狼美人请睁眼，今晚你要魅惑谁？</Cue>
        {beauty ? (
          <>
            <div className="field-heading">
              选择魅惑目标 <span>不能连续魅惑同一人</span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.wolfBeauty}
              onSelect={(id) => updateAction("wolfBeauty", id)}
              passLabel="空魅"
              blocked={blocked}
            />
          </>
        ) : (
          disabledRole("wolfBeauty")
        )}
        {footer(nightNext, "确认魅惑", nightWarning)}
      </div>
    );
  }

  if (game.phase === "shadowSkill") {
    const skill = shadowSkillType(game);
    const target = game.players.find(
      (player) => player.id === game.actions.shadowSkill,
    );
    const title =
      skill === "guard"
        ? "隐狼守护"
        : skill === "poison"
          ? "隐狼毒药"
          : skill === "check"
            ? "隐狼查验"
            : skill === "double"
              ? "隐狼额外刀"
              : "隐狼技能状态";
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / SHADOW SKILL</span>
            <h2>{title}</h2>
            <p>隐狼与狼队互不见面，模仿技能按所选版本结算。</p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>隐狼请单独睁眼，是否使用已获得的技能？</Cue>
        {skill ? (
          <>
            <div className="field-heading">
              选择技能目标{" "}
              <span>
                {skill === "guard"
                  ? "可挡狼刀与毒药"
                  : skill === "poison"
                    ? "毒药全局一次"
                    : skill === "double"
                      ? "额外刀全局一次"
                      : "不可重复查验"}
              </span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.shadowSkill}
              onSelect={(id) => updateAction("shadowSkill", id)}
              passLabel="暂不使用"
              blocked={
                skill === "check"
                  ? Object.fromEntries(
                      game.shadowSeen.map((id) => [id, "已查验"]),
                    )
                  : undefined
              }
            />
            {skill === "check" && target && (
              <div className="seer-result">
                <Eye size={18} />
                <div>
                  <small>向隐狼示意</small>
                  <strong>
                    {playerLabel(target.id)}：
                    {game.shadowLearned === "seer"
                      ? seerSeesWolf(game, target)
                        ? "狼人"
                        : "好人"
                      : roleName(seenRole(game, target), game.rules)}
                  </strong>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="inactive-role">
            <AlertCircle size={18} />
            <div>
              <strong>今晚没有可使用的模仿技能</strong>
              <p>当夜模仿的技能通常从下一夜使用；学普狼后须等其他狼人出局。</p>
            </div>
          </div>
        )}
        {footer(nightNext, "确认隐狼技能", nightWarning)}
      </div>
    );
  }

  if (game.phase === "witch") {
    const canSave = canWitchSave(game);
    const action = game.actions.witch;
    const needsPoison = action === "poison" || action === "both";
    const choose = (value: Game["actions"]["witch"]) =>
      draft((current) => ({
        ...current,
        actions: {
          ...current.actions,
          witch: value,
          poison:
            value === "poison" || value === "both"
              ? current.actions.poison
              : null,
        },
      }));
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / WITCH</span>
            <h2>女巫请睁眼</h2>
            <p>先确认刀口，再记录女巫是否使用药剂。</p>
          </div>
          <span className="stage-icon witch">
            <FlaskConical size={22} />
          </span>
        </div>
        <Cue>女巫请睁眼，今晚是否使用药剂？</Cue>
        {activeRole("witch") ? (
          <>
            <div className="knife-info">
              <span>法官记录的刀口</span>
              <strong>
                {game.actions.wolf
                  ? playerLabel(game.actions.wolf)
                  : "今晚空刀"}
              </strong>
              <small>
                {game.antidote
                  ? "解药仍在，可按规则向女巫示意。"
                  : "解药已使用，常见规则下不再向女巫告知刀口。"}
              </small>
            </div>
            <div className="field-heading">
              女巫的选择{" "}
              <span>
                解药 {game.antidote ? "可用" : "已用"} / 毒药{" "}
                {game.poison ? "可用" : "已用"}
              </span>
            </div>
            <div className="witch-actions">
              <button
                type="button"
                className={action === "none" ? "selected" : ""}
                onClick={() => choose("none")}
              >
                不使用
              </button>
              <button
                type="button"
                className={action === "save" ? "selected" : ""}
                disabled={!canSave}
                onClick={() => choose("save")}
              >
                使用解药
              </button>
              <button
                type="button"
                className={action === "poison" ? "selected" : ""}
                disabled={!game.poison}
                onClick={() => choose("poison")}
              >
                使用毒药
              </button>
              {game.rules.doublePotion && (
                <button
                  type="button"
                  className={action === "both" ? "selected" : ""}
                  disabled={!canSave || !game.poison}
                  onClick={() => choose("both")}
                >
                  使用双药
                </button>
              )}
            </div>
            {!canSave && game.antidote && (
              <p className="inline-hint">
                空刀、受自救规则限制或女巫已出局时不能使用解药。
              </p>
            )}
            {needsPoison && (
              <>
                <div className="field-heading poison-heading">
                  选择毒药目标 <span>毒药不受守护影响</span>
                </div>
                <TargetGrid
                  players={alive}
                  selected={game.actions.poison}
                  onSelect={(id) => updateAction("poison", id)}
                />
              </>
            )}
          </>
        ) : (
          disabledRole("witch")
        )}
        {footer(nightNext, "确认女巫行动", nightWarning)}
      </div>
    );
  }

  if (game.phase === "seer") {
    const target = game.players.find(
      (player) => player.id === game.actions.seer,
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / SEER</span>
            <h2>预言家请睁眼</h2>
            <p>选择查验对象，系统会显示应告知的阵营。</p>
          </div>
          <span className="stage-icon seer">
            <Eye size={22} />
          </span>
        </div>
        <Cue>预言家请睁眼，今晚你要查验谁？</Cue>
        {activeRole("seer") ? (
          <>
            <div className="field-heading">
              选择查验目标 <span>仅显示好人或狼人阵营</span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.seer}
              onSelect={(id) => updateAction("seer", id)}
              passLabel="不查验"
            />
            {target && (
              <div
                className={`seer-result${seerSeesWolf(game, target) ? " is-wolf" : ""}`}
              >
                <Eye size={18} />
                <div>
                  <small>向预言家示意</small>
                  <strong>
                    {playerLabel(target.id)}是
                    {seerSeesWolf(game, target)
                      ? "狼人（查杀）"
                      : "好人（金水）"}
                  </strong>
                </div>
              </div>
            )}
          </>
        ) : (
          disabledRole("seer")
        )}
        {footer(nightNext, "确认查验", nightWarning)}
      </div>
    );
  }

  if (game.phase === "mirror") {
    const target = game.players.find(
      (player) => player.id === game.actions.mirror,
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / MIRROR</span>
            <h2>魔镜少女请睁眼</h2>
            <p>查验一名玩家显示的具体身份，不可重复查验。</p>
          </div>
          <span className="stage-icon seer">
            <Eye size={22} />
          </span>
        </div>
        <Cue>魔镜少女请睁眼，今晚要查验谁？</Cue>
        {activeRole("mirror") ? (
          <>
            <div className="field-heading">
              选择查验目标 <span>隐狼模仿后显示模仿身份</span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.mirror}
              onSelect={(id) => updateAction("mirror", id)}
              passLabel="不查验"
              blocked={Object.fromEntries(
                game.mirrorSeen.map((id) => [id, "已查验"]),
              )}
            />
            {target && (
              <div className="seer-result">
                <Eye size={18} />
                <div>
                  <small>向魔镜少女示意</small>
                  <strong>
                    {playerLabel(target.id)}显示为
                    {roleName(seenRole(game, target), game.rules)}
                  </strong>
                </div>
              </div>
            )}
          </>
        ) : (
          disabledRole("mirror")
        )}
        {footer(nightNext, "确认魔镜查验", nightWarning)}
      </div>
    );
  }

  if (game.phase === "lucky") {
    const lucky = activeLucky(game);
    const recipient =
      lucky && game.players.find((player) => player.id === lucky.recipient);
    const target = game.players.find(
      (player) => player.id === game.actions.lucky,
    );
    const blocked: Record<number, string> = {};
    if (lucky?.skill === "guard" && recipient?.role === "guard")
      for (const id of [
        game.actions.guard,
        game.previousGuard,
        game.previousLuckyGuard,
      ])
        if (id) blocked[id] = "不可重复守护";
    if (
      lucky?.skill === "poison" &&
      recipient?.role === "witch" &&
      game.actions.poison
    )
      blocked[game.actions.poison] = "当晚已毒";
    if (
      lucky?.skill === "check" &&
      recipient?.role === "seer" &&
      game.actions.seer
    )
      blocked[game.actions.seer] = "当晚已查";
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / LUCKY</span>
            <h2>幸运儿行动</h2>
            <p>幸运儿可当夜或之后任意一夜使用一次获得的技能。</p>
          </div>
          <span className="stage-icon">
            <Sparkles size={22} />
          </span>
        </div>
        <Cue>幸运儿请睁眼，今晚是否使用获得的技能？</Cue>
        {lucky ? (
          <>
            <div className="knife-info">
              <span>幸运儿</span>
              <strong>{playerLabel(lucky.recipient)}</strong>
              <small>
                获得：
                {lucky.skill === "check"
                  ? "查验"
                  : lucky.skill === "poison"
                    ? "毒药"
                    : "守护"}
              </small>
            </div>
            <div className="field-heading">
              选择技能目标 <span>也可暂不使用</span>
            </div>
            <TargetGrid
              players={alive}
              selected={game.actions.lucky}
              onSelect={(id) => updateAction("lucky", id)}
              passLabel="暂不使用"
              blocked={blocked}
            />
            {lucky.skill === "check" && target && (
              <div className="seer-result">
                <Eye size={18} />
                <div>
                  <small>向幸运儿示意</small>
                  <strong>
                    {playerLabel(target.id)}是
                    {seerSeesWolf(game, target) ? "狼人" : "好人"}
                  </strong>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="inactive-role">
            <AlertCircle size={18} />
            <div>
              <strong>当前没有可行动的幸运儿</strong>
              <p>交易失败、未交易、技能已用或幸运儿已出局时，直接继续。</p>
            </div>
          </div>
        )}
        {footer(nightNext, "确认幸运儿行动", nightWarning)}
      </div>
    );
  }

  if (game.phase === "hunterStatus") {
    const actors = (["hunter", "wolfKing", "shadow"] as const).filter(
      (role) =>
        roleCounts(game.board)[role] > 0 &&
        (role !== "shadow" || game.shadowLearned === "hunter"),
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / HUNTER</span>
            <h2>确认枪手状态</h2>
            <p>根据全部夜间行动，分别向枪手示意技能状态。</p>
          </div>
          <span className="stage-icon hunter">
            <Crosshair size={22} />
          </span>
        </div>
        <Cue>请依次单独睁眼，确认你的开枪状态。</Cue>
        {actors.length === 0 && (
          <div className="inactive-role">
            <AlertCircle size={18} />
            <div>
              <strong>今晚没有可确认的枪手</strong>
              <p>直接进入下一步。</p>
            </div>
          </div>
        )}
        {actors.map((role) => {
          const status = gunStatus(game, role);
          return status === "absent" ? (
            <div key={role}>{disabledRole(role)}</div>
          ) : (
            <div className={`hunter-status ${status}`} key={role}>
              <span>
                {status === "can" ? (
                  <CheckCircle2 size={23} />
                ) : (
                  <AlertCircle size={23} />
                )}
              </span>
              <div>
                <strong>
                  {roleName(role, game.rules)}：
                  {status === "can" ? "可以开枪" : "不能开枪"}
                </strong>
                <p>
                  {status === "can"
                    ? "若符合出局条件，天亮后可选择是否发动技能。"
                    : "依据出局原因、最后一狼或本局桌规，不能发动技能。"}
                </p>
              </div>
            </div>
          );
        })}
        {footer(nightNext, "进入夜晚结算")}
      </div>
    );
  }

  if (game.phase === "resolve")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">END OF NIGHT</span>
            <h2>所有人请闭眼</h2>
            <p>夜间行动已记录，确认后自动计算昨夜结果。</p>
          </div>
          <span className="stage-icon">
            <Moon size={22} />
          </span>
        </div>
        <Cue>天快亮了，请所有玩家保持闭眼。</Cue>
        <div className="recap-list">
          <div>
            <span>守卫</span>
            <strong>
              {roleCounts(game.board).guard > 0 && game.actions.guard !== null
                ? game.actions.guard
                  ? `守护 ${playerLabel(game.actions.guard)}`
                  : "空守"
                : "未行动"}
            </strong>
          </div>
          <div>
            <span>狼人</span>
            <strong>
              {game.actions.wolf
                ? `刀 ${playerLabel(game.actions.wolf)}`
                : "空刀"}
            </strong>
          </div>
          <div>
            <span>女巫</span>
            <strong>
              {game.actions.witch === "save"
                ? "使用解药"
                : game.actions.witch === "poison"
                  ? `毒 ${playerLabel(game.actions.poison)}`
                  : game.actions.witch === "both"
                    ? `解药 + 毒 ${playerLabel(game.actions.poison)}`
                    : "未使用药剂"}
            </strong>
          </div>
          <div>
            <span>预言家</span>
            <strong>
              {game.actions.seer
                ? `查验 ${playerLabel(game.actions.seer)}`
                : "未查验"}
            </strong>
          </div>
          {roleCounts(game.board).wolfBeauty > 0 && (
            <div>
              <span>狼美人</span>
              <strong>
                {game.actions.wolfBeauty
                  ? `魅惑 ${playerLabel(game.actions.wolfBeauty)}`
                  : "空魅"}
              </strong>
            </div>
          )}
          {roleCounts(game.board).merchant > 0 && (
            <div>
              <span>商人与幸运儿</span>
              <strong>
                {game.actions.merchant
                  ? `交易 ${playerLabel(game.actions.merchant)}`
                  : "未交易"}
                {game.actions.lucky
                  ? ` / 技能目标 ${playerLabel(game.actions.lucky)}`
                  : ""}
              </strong>
            </div>
          )}
          {roleCounts(game.board).shadow > 0 && (
            <div>
              <span>隐狼</span>
              <strong>
                {game.actions.shadowLearn
                  ? `模仿 ${playerLabel(game.actions.shadowLearn)}`
                  : game.shadowLearned
                    ? `已模仿 ${ROLE_LABELS[game.shadowLearned]}`
                    : "未模仿"}
                {game.actions.shadowSkill
                  ? ` / 技能目标 ${playerLabel(game.actions.shadowSkill)}`
                  : ""}
              </strong>
            </div>
          )}
          {roleCounts(game.board).mirror > 0 && (
            <div>
              <span>魔镜少女</span>
              <strong>
                {game.actions.mirror
                  ? `查验 ${playerLabel(game.actions.mirror)}`
                  : "未查验"}
              </strong>
            </div>
          )}
        </div>
        {footer(() => commit(settleNight(game)), "结算今夜")}
      </div>
    );

  if (game.phase === "election")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">DAY 01 / SHERIFF</span>
            <h2>先进行警长竞选</h2>
            <p>公布死讯前，在线下完成上警、发言和投票。</p>
          </div>
          <span className="stage-icon sheriff">
            <Crown size={22} />
          </span>
        </div>
        <Cue>天亮，竞选警长的玩家请举手。</Cue>
        <div className="note-box">
          <AlertCircle size={16} />{" "}
          首夜死亡玩家仍可被记录为警长；上警资格、退水及竞选 PK
          请按现场规则处理。
        </div>
        <div className="field-heading">
          录入最终警长 <span>如果警徽流失，选择无警长</span>
        </div>
        <TargetGrid
          players={alive}
          selected={game.electionTarget}
          onSelect={(id) =>
            draft((current) => ({ ...current, electionTarget: id }))
          }
          passLabel="无警长"
        />
        {footer(
          () => commit(completeElection(game)),
          "确认竞选结果",
          game.electionTarget === null ? "请选择警长或无警长。" : null,
        )}
      </div>
    );

  if (game.phase === "dawn")
    return (
      <div className="stage-card dawn-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">
              DAY {String(game.night).padStart(2, "0")} / DAWN
            </span>
            <h2>天亮了，请睁眼</h2>
            <p>向玩家只公布出局号码，原因和身份留给法官。</p>
          </div>
          <span className="stage-icon day">
            <Sun size={22} />
          </span>
        </div>
        <div className="dawn-result">
          <span>昨夜结果</span>
          <strong>
            {game.pendingDeaths.length
              ? game.pendingDeaths
                  .map((death) => `${death.player} 号`)
                  .join("、") + " 出局"
              : "平安夜"}
          </strong>
          <p>
            {game.pendingDeaths.length
              ? "请按现场规则安排遗言和技能。"
              : "昨夜没有玩家出局。"}
          </p>
        </div>
        {game.pendingDeaths.length > 0 && (
          <div className="private-causes">
            <span>
              <LockKeyhole size={13} /> 仅法官可见
            </span>
            {game.pendingDeaths.map((death) => (
              <div key={death.player}>
                <strong>{playerLabel(death.player)}</strong>
                <span>
                  {death.causes.map((cause) => CAUSE_LABELS[cause]).join(" + ")}
                </span>
              </div>
            ))}
          </div>
        )}
        {game.forcedWinner && (
          <div className="note-box warning">
            <AlertCircle size={16} />{" "}
            狼刀已满足胜利条件；按本局“狼刀优先”，后续毒药不结算。
          </div>
        )}
        {footer(() => commit(announceDawn(game)), "确认公布，继续")}
      </div>
    );

  if (game.phase === "whiteWolfSkill") {
    const canTake = canWhiteWolfTake(game);
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / WHITE WOLF</span>
            <h2>白狼王自爆</h2>
            <p>{playerLabel(game.specialActor)}选择自爆，记录是否带走一人。</p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>白狼王是否发动技能带走一名玩家？</Cue>
        {!canTake && (
          <div className="note-box warning">
            <AlertCircle size={16} />{" "}
            本局设置为最后一狼出局时技能失效，请选择不带人。
          </div>
        )}
        <div className="field-heading">选择带走目标</div>
        <TargetGrid
          players={
            canTake
              ? alive.filter((player) => player.id !== game.specialActor)
              : []
          }
          selected={game.specialTarget}
          onSelect={(id) =>
            draft((current) => ({ ...current, specialTarget: id }))
          }
          passLabel="不带人"
        />
        {footer(
          () => commit(finishWhiteWolf(game)),
          "确认自爆",
          game.specialTarget === null ? "请选择目标或不带人。" : null,
        )}
      </div>
    );
  }

  if (game.phase === "knightDuel") {
    const target = game.players.find(
      (player) => player.id === game.specialTarget,
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / KNIGHT</span>
            <h2>骑士决斗</h2>
            <p>
              每局限一次；戳中狼人则狼人出局并进入黑夜，戳中好人则骑士出局、继续白天。
            </p>
          </div>
          <span className="stage-icon">
            <Swords size={22} />
          </span>
        </div>
        <Cue>骑士请选择一名玩家进行决斗。</Cue>
        <div className="field-heading">
          选择决斗目标 <span>不能选择骑士自己</span>
        </div>
        <TargetGrid
          players={alive.filter((player) => player.id !== game.specialActor)}
          selected={game.specialTarget}
          onSelect={(id) =>
            draft((current) => ({ ...current, specialTarget: id }))
          }
        />
        {target && (
          <div className="seer-result">
            <Swords size={18} />
            <div>
              <small>仅法官可见</small>
              <strong>
                {isWolf(target.role)
                  ? `${playerLabel(target.id)}是狼人，将出局并进入黑夜`
                  : `${playerLabel(target.id)}是好人，骑士将出局并继续白天`}
              </strong>
            </div>
          </div>
        )}
        {footer(
          () => commit(finishKnight(game)),
          "确认决斗",
          game.specialTarget === null ? "请选择决斗目标。" : null,
        )}
      </div>
    );
  }

  if (game.phase === "foolReveal")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / FOOL</span>
            <h2>愚者翻牌免死</h2>
            <p>
              {playerLabel(game.specialActor)}
              翻牌，本次放逐无效。之后仍存活并可发言，但不能投票、被投票或接警徽。
            </p>
          </div>
          <span className="stage-icon">
            <BookOpen size={22} />
          </span>
        </div>
        <Cue>该玩家翻牌发动技能，本次免于放逐。</Cue>
        {footer(() => commit(finishFoolReveal(game)), "确认翻牌，继续")}
      </div>
    );

  if (game.phase === "charmResult")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / BEAUTY</span>
            <h2>狼美人魅惑生效</h2>
            <p>
              {game.charmDeaths.map(playerLabel).join("、")}
              随狼美人殉情出局，殉情者不能发动技能。
            </p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>被魅惑的玩家一同出局。</Cue>
        {footer(() => commit(finishCharmResult(game)), "确认殉情，继续")}
      </div>
    );

  if (game.phase === "hunter")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / HUNTER</span>
            <h2>
              {roleName(
                game.players.find((player) => player.id === game.gunActor)
                  ?.role ?? "hunter",
                game.rules,
              )}
              可以开枪
            </h2>
            <p>
              {playerLabel(game.gunActor)}
              符合发动条件，请记录开枪目标或选择压枪。
            </p>
          </div>
          <span className="stage-icon hunter">
            <Crosshair size={22} />
          </span>
        </div>
        <Cue>该枪手是否发动技能，带走一位玩家？</Cue>
        <div className="field-heading">
          选择开枪目标 <span>枪手已出局，只能选择存活玩家</span>
        </div>
        <TargetGrid
          players={alive}
          selected={game.hunterTarget}
          onSelect={(id) =>
            draft((current) => ({ ...current, hunterTarget: id }))
          }
          passLabel="不开枪"
        />
        {footer(
          () => commit(finishHunter(game)),
          "确认开枪技能",
          game.hunterTarget === null ? "请选择开枪目标，或选择不开枪。" : null,
        )}
      </div>
    );

  if (game.phase === "badge")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL EVENT / BADGE</span>
            <h2>处理警徽</h2>
            <p>
              {game.players.find((player) => player.id === game.sheriff)
                ?.revealed
                ? "警长因愚者翻牌须移交或撕毁警徽。"
                : "警长已出局，请记录警徽移交或撕毁。"}
            </p>
          </div>
          <span className="stage-icon sheriff">
            <Crown size={22} />
          </span>
        </div>
        <Cue>警长请选择移交警徽，或撕毁警徽。</Cue>
        <div className="field-heading">
          警徽去向 <span>只能移交给存活玩家</span>
        </div>
        <TargetGrid
          players={alive.filter((player) => !player.revealed)}
          selected={game.badgeTarget}
          onSelect={(id) =>
            draft((current) => ({ ...current, badgeTarget: id }))
          }
          passLabel="撕毁警徽"
        />
        {footer(
          () => commit(finishBadge(game)),
          "确认警徽去向",
          game.badgeTarget === null ? "请选择警徽去向。" : null,
        )}
      </div>
    );

  if (game.phase === "speech") {
    const wolves = alive.filter(
      (player) =>
        player.role === "wolf" ||
        player.role === "wolfKing" ||
        player.role === "whiteWolf",
    );
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">
              DAY {String(game.night).padStart(2, "0")} / DISCUSSION
            </span>
            <h2>白天发言时间</h2>
            <p>按照现场约定安排遗言与发言顺序，完成后进入投票。</p>
          </div>
          <span className="stage-icon day">
            <Sun size={22} />
          </span>
        </div>
        <Cue>请依次发言，其他玩家保持安静。</Cue>
        <div className="day-instructions">
          <div>
            <span>01</span>
            <p>按桌规安排出局玩家遗言和技能展示。</p>
          </div>
          <div>
            <span>02</span>
            <p>
              {game.sheriff
                ? `${playerLabel(game.sheriff)}是警长，可指定发言顺序并在最后归票。`
                : "本局没有警长，请按约定顺序发言。"}
            </p>
          </div>
          <div>
            <span>03</span>
            <p>所有存活玩家发言完毕后，开始放逐投票。</p>
          </div>
        </div>
        <details className="explode-details">
          <summary>
            <Skull size={15} /> 记录白天狼人自爆 <ChevronDown size={15} />
          </summary>
          <p>自爆后立即结束发言，处理警徽与胜负后进入下一夜。</p>
          <div className="explode-list">
            {wolves.map((wolf) => (
              <button
                key={wolf.id}
                type="button"
                onClick={() => {
                  if (wolf.role === "whiteWolf")
                    commit(beginWhiteWolf(game, wolf.id));
                  else if (
                    window.confirm(`确认 ${playerLabel(wolf.id)}狼人自爆？`)
                  )
                    commit(explode(game, wolf.id));
                }}
              >
                {playerLabel(wolf.id)}
                {wolf.role === "whiteWolf" ? "白狼王自爆" : "自爆"}
              </button>
            ))}
          </div>
          <small>警长竞选阶段自爆与吞警徽规则请由法官线下处理。</small>
        </details>
        {rolePlayer(game, "knight") && !game.knightUsed && (
          <div className="day-skill">
            <button
              type="button"
              className="outline-button"
              onClick={() => commit(beginKnight(game))}
            >
              <Swords size={15} /> 记录骑士决斗
            </button>
          </div>
        )}
        {footer(() => commit(finishSpeech(game)), "发言结束，进入投票")}
      </div>
    );
  }

  if (game.phase === "vote") {
    const tally = tallyVotes(game);
    const votable = votablePlayers(game);
    const candidates = game.vote.candidates
      ? votable.filter((player) => game.vote.candidates?.includes(player.id))
      : votable;
    const updateVote = (patch: Partial<Game["vote"]>) =>
      draft((current) => ({ ...current, vote: { ...current.vote, ...patch } }));
    const tie = tally.complete && tally.leaders.length > 1;
    const result = tally.leaders.length === 1 ? tally.leaders[0] : 0;
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">
              DAY {String(game.night).padStart(2, "0")} / VOTE
            </span>
            <h2>放逐投票</h2>
            <p>可直接录入现场结果，也可以逐票登记并自动计票。</p>
          </div>
          <span className="stage-icon day">
            <ClipboardList size={22} />
          </span>
        </div>
        <div className="mode-tabs" role="group" aria-label="计票方式">
          <button
            type="button"
            className={game.vote.mode === "direct" ? "active" : ""}
            onClick={() =>
              updateVote({
                mode: "direct",
                direct: null,
                candidates: null,
                ballots: {},
                round: 1,
              })
            }
          >
            快速记录结果
          </button>
          <button
            type="button"
            className={game.vote.mode === "tally" ? "active" : ""}
            onClick={() =>
              updateVote({
                mode: "tally",
                direct: null,
                candidates: null,
                ballots: {},
                round: 1,
              })
            }
          >
            逐票自动计数
          </button>
        </div>
        {game.vote.mode === "direct" ? (
          <>
            <div className="field-heading">
              选择被放逐的玩家 <span>平票或无人出局时选择“无人出局”</span>
            </div>
            <TargetGrid
              players={votable}
              selected={game.vote.direct}
              onSelect={(id) => updateVote({ direct: id })}
              passLabel="无人出局"
            />
            {footer(
              () => commit(finishVote(game, game.vote.direct ?? 0)),
              "确认投票结果",
              game.vote.direct === null ? "请选择放逐结果。" : null,
            )}
          </>
        ) : (
          <>
            <div className="field-heading">
              第 {game.vote.round} 轮投票{" "}
              <span>
                {game.vote.candidates
                  ? `PK：${game.vote.candidates.map(playerLabel).join("、")}`
                  : game.sheriff
                    ? `警长票权 ${game.rules.sheriffWeight} 票`
                    : "逐个记录存活玩家的投票"}
              </span>
            </div>
            {game.vote.candidates && !game.rules.pkCandidatesVote && (
              <p className="inline-hint">本局设置为 PK 玩家不参与重投。</p>
            )}
            <div className="ballot-list">
              {tally.voters.map((voter) => (
                <label className="ballot-row" key={voter.id}>
                  <span>
                    <strong>{String(voter.id).padStart(2, "0")}</strong> 号玩家{" "}
                    {game.sheriff === voter.id && <Crown size={13} />}
                  </span>
                  <select
                    aria-label={`${voter.id} 号玩家投票`}
                    value={game.vote.ballots[String(voter.id)] ?? ""}
                    onChange={(event) =>
                      updateVote({
                        ballots: {
                          ...game.vote.ballots,
                          [String(voter.id)]: event.target.value,
                        },
                      })
                    }
                  >
                    <option value="">未录入</option>
                    <option value="0">弃票</option>
                    {candidates.map((candidate) => (
                      <option value={candidate.id} key={candidate.id}>
                        {playerLabel(candidate.id)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="tally-result">
              <span>当前票数</span>
              <div>
                {Object.keys(tally.totals).length ? (
                  Object.entries(tally.totals)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([id, total]) => (
                      <strong key={id}>
                        {id} 号 <em>{total} 票</em>
                      </strong>
                    ))
                ) : (
                  <small>尚无有效票</small>
                )}
              </div>
            </div>
            {tie ? (
              <StageFooter canUndo={canUndo} onUndo={onUndo}>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => commit(beginPk(game, tally.leaders))}
                >
                  平票 PK 重投
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => commit(finishVote(game, 0))}
                >
                  平票无人出局 <ArrowRight size={16} />
                </button>
              </StageFooter>
            ) : (
              footer(
                () => commit(finishVote(game, result)),
                tally.leaders.length
                  ? `确认放逐 ${playerLabel(result)}`
                  : "确认无人出局",
                tally.complete
                  ? null
                  : "请为每位有投票权的玩家录入投票或弃票。",
              )
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="stage-card end-card">
      <div className="end-emblem">
        {game.winner === "wolf" ? (
          <MoonStar size={30} />
        ) : game.winner === "good" ? (
          <Sun size={30} />
        ) : (
          <Swords size={30} />
        )}
      </div>
      <span className="step-eyebrow">THE GAME IS OVER</span>
      <h2>
        {game.winner === "good"
          ? "好人阵营获胜"
          : game.winner === "wolf"
            ? "狼人阵营获胜"
            : "等待法官裁定"}
      </h2>
      <p>
        {game.winner === "good"
          ? "所有狼人均已出局。"
          : game.winner === "wolf"
            ? game.rules.victory === "edge"
              ? "全部村民或全部神职已出局。"
              : "所有好人均已出局。"
            : "双方同时达到胜利条件，请依照本局桌规裁定。"}
      </p>
      {game.winner === "manual" && (
        <div className="manual-winner">
          <button
            type="button"
            className="outline-button"
            onClick={() => commit(resolveManualWinner(game, "good"))}
          >
            判定好人胜
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={() => commit(resolveManualWinner(game, "wolf"))}
          >
            判定狼人胜
          </button>
        </div>
      )}
      <div className="end-actions">
        <button type="button" className="outline-button" onClick={onDownload}>
          <Download size={15} /> 下载对局记录
        </button>
        <button type="button" className="primary-button" onClick={onReset}>
          开始新对局 <ArrowRight size={16} />
        </button>
      </div>
      <button
        className="end-undo"
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <ArrowLeft size={14} /> 返回上一步修正
      </button>
    </div>
  );
}

function GameView({
  game,
  draft,
  commit,
  canUndo,
  onUndo,
  onReset,
  onLog,
  onDownload,
}: {
  game: Game;
  draft: Draft;
  commit: Commit;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onLog: () => void;
  onDownload: () => void;
}) {
  const phases = nightPhases(game.board);
  const currentNightIndex = phases.indexOf(game.phase as NightPhase);
  return (
    <div className="workspace-grid game-workspace">
      <div className="workspace-main">
        <div className="flow-heading">
          <div>
            <span className="section-number">
              {currentNightIndex >= 0 ? "N" : "D"}
            </span>
            <div>
              <h2>
                {currentNightIndex >= 0
                  ? `第 ${game.night} 夜 · 夜间流程`
                  : `第 ${game.night} 天 · 白天流程`}
              </h2>
              <p>跟随提示操作，系统会为你记录每一步。</p>
            </div>
          </div>
          <span className="private-label">
            <LockKeyhole size={13} /> 法官专属视图
          </span>
        </div>
        {currentNightIndex >= 0 && (
          <div className="night-progress" aria-label="夜间流程进度">
            {phases.map((phase, index) => (
              <div
                className={`${index === currentNightIndex ? "current" : ""}${index < currentNightIndex ? " complete" : ""}`}
                key={phase}
              >
                <span>
                  {index < currentNightIndex ? (
                    <Check size={12} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{nightShort[phase]}</strong>
                {index < phases.length - 1 && <i />}
              </div>
            ))}
          </div>
        )}
        <StagePanel
          game={game}
          draft={draft}
          commit={commit}
          canUndo={canUndo}
          onUndo={onUndo}
          onReset={onReset}
          onDownload={onDownload}
        />
        <p className="game-disclaimer">
          <LockKeyhole size={13} />{" "}
          本页面包含所有身份和夜间行动，请避免让玩家看到屏幕。
        </p>
      </div>
      <GameRail game={game} onLog={onLog} />
    </div>
  );
}

function ModalView({
  modal,
  game,
  onClose,
  onDownload,
}: {
  modal: Modal;
  game: Game | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  if (!modal) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="step-eyebrow">
              {modal === "log" ? "GAME JOURNAL" : "HOW TO PLAY"}
            </span>
            <h2 id="modal-title">
              {modal === "log" ? "对局记录" : "使用与规则说明"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        {modal === "log" ? (
          <>
            <p className="modal-intro">
              记录包含身份和夜间行动，仅供法官查看。
            </p>
            {game?.logs.length ? (
              <div className="log-list">
                {[...game.logs].reverse().map((entry, index) => (
                  <div className="log-entry" key={`${entry.title}-${index}`}>
                    <span className="log-dot" />
                    <div>
                      <strong>{entry.title}</strong>
                      <p>{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-log">
                <ScrollText size={24} />
                <p>对局开始后，记录会出现在这里。</p>
              </div>
            )}
            {game && (
              <button
                type="button"
                className="outline-button modal-download"
                onClick={onDownload}
              >
                <Download size={15} /> 下载记录
              </button>
            )}
          </>
        ) : (
          <div className="help-content">
            <p>
              选好板子并确认桌规，登记每位玩家的真实身份后，按照屏幕提示推进即可。页面会在本机自动保存进度，也可以用“上一步”修正操作。
            </p>
            <h3>当前支持</h3>
            <p>
              狼人、村民、预言家、女巫、猎人、守卫、愚者、骑士、狼王、白狼王、狼美人、奇迹商人、觉醒隐狼和魔镜少女；支持警徽、投票与胜负判定。
            </p>
            <h3>请提前约定</h3>
            <p>
              可设置女巫自救、同守同救、狼王夜枪、白狼王带走枪手、最后一狼技能、觉醒隐狼或机械狼版本等规则。默认先处理死亡和枪手技能，再判断胜负。
            </p>
            <h3>暂不自动裁定</h3>
            <p>
              丘比特等未列出的角色、隐狼模仿其他特殊角色、警长竞选阶段的自爆与吞警徽，以及复杂的警上资格和遗言规则，请由法官依照桌规线下处理。
            </p>
            <div className="note-box">
              <LockKeyhole size={16} />{" "}
              数据只保存在当前浏览器。清除浏览器数据会丢失记录，请勿将此页面给玩家查看。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [initial] = useState(loadSaved);
  const [board, setBoard] = useState<Board>(initial?.board ?? PRESETS[0]);
  const [rules, setRules] = useState<Rules>(initial?.rules ?? DEFAULT_RULES);
  const [assignments, setAssignments] = useState<(Role | null)[]>(
    initial?.assignments ?? Array(playerCount(PRESETS[0])).fill(null),
  );
  const [setupStep, setSetupStep] = useState<SetupStep>(
    initial?.setupStep ?? "board",
  );
  const [game, setGame] = useState<Game | null>(initial?.game ?? null);
  const [history, setHistory] = useState<Game[]>(initial?.history ?? []);
  const [modal, setModal] = useState<Modal>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ board, rules, assignments, setupStep, game, history }),
      );
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [board, rules, assignments, setupStep, game, history]);

  useEffect(() => {
    if (!modal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modal]);

  function start() {
    if (assignments.some((role) => !role)) return;
    setGame(createGame(board, rules, assignments as Role[]));
    setHistory([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function commit(next: Game) {
    if (!game || next === game) return;
    setHistory((previous) => [...previous, game].slice(-80));
    setGame(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const draft: Draft = (update) =>
    setGame((previous) => (previous ? update(previous) : previous));

  function undo() {
    if (!history.length) return;
    setGame(history[history.length - 1]);
    setHistory((previous) => previous.slice(0, -1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    if (
      game &&
      !window.confirm("确定结束当前对局并返回配置？当前记录将被清除。")
    )
      return;
    setGame(null);
    setHistory([]);
    setAssignments(Array(playerCount(board)).fill(null));
    setSetupStep("board");
    setModal(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadLog() {
    if (!game) return;
    const content = [
      `夜幕法官台 · ${playerCount(game.board)} 人${game.board.name}`,
      "仅法官查看，包含身份与夜间行动。",
      "",
      "玩家身份：",
      ...game.players.map(
        (player) =>
          `${player.id} 号：${roleName(player.role, game.rules)}（${player.alive ? "存活" : "出局"}）`,
      ),
      "",
      "对局记录：",
      ...game.logs.map((entry) => `${entry.title}：${entry.detail}`),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "狼人杀对局记录.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const isNight = game
    ? nightPhases(game.board).includes(game.phase as NightPhase)
    : false;
  const bannerTitle = !game
    ? "准备一场狼人杀。"
    : game.phase === "end"
      ? "这一局，落下帷幕。"
      : isNight
        ? "天黑，请闭眼。"
        : game.phase === "election"
          ? "天将亮，竞选警长。"
          : "天亮，请睁眼。";
  const bannerSubtitle = !game
    ? "从选板子到公布结果，把注意力留给现场。"
    : game.phase === "end"
      ? "每一个选择，都已留在这场故事里。"
      : `第 ${game.night} ${isNight ? "夜" : "天"} · 当前步骤：${phaseTitles[game.phase]}`;

  return (
    <div className="app-shell">
      <Sidebar
        game={game}
        storageAvailable={storageAvailable}
        onModal={setModal}
        onReset={reset}
      />
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>工作空间</span>
            <ChevronRight size={14} />
            <strong>{game ? "当前对局" : "新建对局"}</strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`local-status${storageAvailable ? "" : " unavailable"}`}
            >
              <i /> {storageAvailable ? "本机自动保存" : "自动保存不可用"}
            </span>
            {game && (
              <button className="top-reset" type="button" onClick={reset}>
                <RotateCcw size={15} /> 重开
              </button>
            )}
            <button
              className="top-help"
              type="button"
              onClick={() => setModal("help")}
            >
              <CircleHelp size={16} /> 使用说明
            </button>
          </div>
        </header>
        <div className="content-area">
          {!storageAvailable && (
            <div className="storage-warning" role="alert">
              <AlertCircle size={16} />{" "}
              浏览器存储不可用，本次进度在刷新后可能丢失。
            </div>
          )}
          <div className="intro-banner">
            <img src="./images/moonlit-forest.jpg" alt="" />
            <div className="intro-overlay" />
            <div className="intro-copy">
              <p>
                <span />{" "}
                {game ? "THE NIGHTFALL JOURNAL" : "YOUR GAME MASTER COMPANION"}
              </p>
              <h1>{bannerTitle}</h1>
              <div>{bannerSubtitle}</div>
            </div>
            <span className="intro-caption">
              NIGHTFALL
              <br />
              GAME MASTER
            </span>
          </div>
          {game ? (
            <GameView
              game={game}
              draft={draft}
              commit={commit}
              canUndo={history.length > 0}
              onUndo={undo}
              onReset={reset}
              onLog={() => setModal("log")}
              onDownload={downloadLog}
            />
          ) : (
            <SetupView
              board={board}
              rules={rules}
              assignments={assignments}
              setupStep={setupStep}
              setBoard={setBoard}
              setRules={setRules}
              setAssignments={setAssignments}
              setSetupStep={setSetupStep}
              onStart={start}
            />
          )}
          <footer className="app-footer">
            <span>
              夜幕法官台 <i>·</i> 为每一场面杀保驾护航
            </span>
            <button type="button" onClick={() => setModal("help")}>
              使用与规则说明 <ArrowRight size={13} />
            </button>
          </footer>
        </div>
      </div>
      <ModalView
        modal={modal}
        game={game}
        onClose={() => setModal(null)}
        onDownload={downloadLog}
      />
    </div>
  );
}

export default App;
