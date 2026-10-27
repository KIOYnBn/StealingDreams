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
  advanceNight,
  announceDawn,
  beginPk,
  canWitchSave,
  completeElection,
  createGame,
  explode,
  finishBadge,
  finishHunter,
  finishSpeech,
  finishVote,
  hunterStatus,
  living,
  nightError,
  nightPhases,
  playerCount,
  playerLabel,
  resolveManualWinner,
  roleCounts,
  rolePlayer,
  settleNight,
  tallyVotes,
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
    return saved;
  } catch {
    return null;
  }
}

const phaseTitles: Record<Game["phase"], string> = {
  guard: "守卫行动",
  wolf: "狼人行动",
  witch: "女巫行动",
  seer: "预言家行动",
  hunterStatus: "猎人状态",
  resolve: "夜晚结算",
  election: "警长竞选",
  dawn: "公布昨夜死讯",
  hunter: "猎人技能",
  badge: "警徽移交",
  speech: "白天发言",
  vote: "放逐投票",
  end: "对局结束",
};

const nightShort: Record<NightPhase, string> = {
  guard: "守卫",
  wolf: "狼人",
  witch: "女巫",
  seer: "预言家",
  hunterStatus: "猎人",
  resolve: "结算",
};

function RoleIcon({ role, size = 17 }: { role: Role; size?: number }) {
  const props = { size, strokeWidth: 1.7 };
  if (role === "wolf") return <MoonStar {...props} />;
  if (role === "villager") return <Users {...props} />;
  if (role === "seer") return <Eye {...props} />;
  if (role === "witch") return <FlaskConical {...props} />;
  if (role === "hunter") return <Crosshair {...props} />;
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
            {playerCount(board)} 人 · {board.name}
          </strong>
        </div>
      </div>
      <div className="rail-divider" />
      <div className="rail-subhead">
        身份配置 <span>{playerCount(board)} 张</span>
      </div>
      <div className="role-list">
        {ROLE_ORDER.filter((role) => counts[role] > 0).map((role) => (
          <div className="role-list-item" key={role}>
            <span className={`role-mini ${role}`}>
              <RoleIcon role={role} size={15} />
            </span>
            <span>{ROLE_LABELS[role]}</span>
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
    count < 5 || count > 20
      ? "请将玩家人数设置为 5 至 20 人。"
      : rules.victory === "edge" && board.specials.length === 0
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
              <div className="board-grid">
                {PRESETS.map((preset) => (
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
                      {playerCount(preset)}
                      <small> 人局</small>
                    </span>
                    <strong>{preset.name}</strong>
                    <span className="board-detail">
                      {preset.wolves} 狼 / {preset.villagers} 民 /{" "}
                      {preset.specials.length} 神
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
                    <span>神职角色</span>
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
                            {ROLE_LABELS[role]}（剩余{" "}
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
                  {ROLE_LABELS[role]}{" "}
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
              (showRoles ? ROLE_LABELS[player.role] : "号玩家")}
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
              {ROLE_LABELS[player.role]}
            </span>
            {game.sheriff === player.id && (
              <Crown className="crown-icon" size={14} />
            )}
            <span className="roster-status">
              {player.alive ? "存活" : "出局"}
            </span>
          </div>
        ))}
      </div>
      {game.board.specials.includes("witch") && (
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
      {game.board.specials.includes("guard") && (
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
    value: number | Game["actions"]["witch"] | null,
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
              blocked={
                game.lastGuard ? { [game.lastGuard]: "上夜守护" } : undefined
              }
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
            <h2>狼人请睁眼</h2>
            <p>记录狼人商议后的刀口，也支持空刀或自刀。</p>
          </div>
          <span className="stage-icon wolf">
            <MoonStar size={22} />
          </span>
        </div>
        <Cue>狼人请睁眼，今晚你们要袭击谁？</Cue>
        <div className="field-heading">
          选择狼刀目标 <span>只记录狼人最终达成的选择</span>
        </div>
        <TargetGrid
          players={alive}
          selected={game.actions.wolf}
          onSelect={(id) => updateAction("wolf", id)}
          passLabel="空刀"
        />
        {footer(nightNext, "确认狼刀", nightWarning)}
      </div>
    );

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
                className={`seer-result${target.role === "wolf" ? " is-wolf" : ""}`}
              >
                <Eye size={18} />
                <div>
                  <small>向预言家示意</small>
                  <strong>
                    {playerLabel(target.id)}是
                    {target.role === "wolf" ? "狼人（查杀）" : "好人（金水）"}
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

  if (game.phase === "hunterStatus") {
    const status = hunterStatus(game);
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">NIGHT ACTION / HUNTER</span>
            <h2>确认猎人状态</h2>
            <p>根据今晚的行动，向猎人示意是否可以发动技能。</p>
          </div>
          <span className="stage-icon hunter">
            <Crosshair size={22} />
          </span>
        </div>
        <Cue>猎人请睁眼，请确认你的开枪状态。</Cue>
        {status === "absent" ? (
          disabledRole("hunter")
        ) : (
          <div className={`hunter-status ${status}`}>
            <span>
              {status === "can" ? (
                <CheckCircle2 size={23} />
              ) : (
                <AlertCircle size={23} />
              )}
            </span>
            <div>
              <strong>
                {status === "can" ? "今晚状态：可以开枪" : "今晚状态：不能开枪"}
              </strong>
              <p>
                {status === "can"
                  ? "若符合出局条件，天亮后可选择是否发动技能。"
                  : "依据中毒或本局奶穿规则，猎人不能发动技能。"}
              </p>
            </div>
          </div>
        )}
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
              {game.board.specials.includes("guard") &&
              game.actions.guard !== null
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

  if (game.phase === "hunter")
    return (
      <div className="stage-card">
        <div className="stage-head">
          <div>
            <span className="step-eyebrow">SPECIAL SKILL / HUNTER</span>
            <h2>猎人可以开枪</h2>
            <p>猎人符合发动条件，请记录开枪目标或选择压枪。</p>
          </div>
          <span className="stage-icon hunter">
            <Crosshair size={22} />
          </span>
        </div>
        <Cue>猎人是否发动技能，带走一位玩家？</Cue>
        <div className="field-heading">
          选择开枪目标 <span>猎人已出局，只能选择存活玩家</span>
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
          "确认猎人技能",
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
            <p>警长已出局，请记录警徽移交或撕毁。</p>
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
          players={alive}
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
    const wolves = alive.filter((player) => player.role === "wolf");
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
                  if (window.confirm(`确认 ${playerLabel(wolf.id)}狼人自爆？`))
                    commit(explode(game, wolf.id));
                }}
              >
                {playerLabel(wolf.id)}自爆
              </button>
            ))}
          </div>
          <small>警长竞选阶段自爆与吞警徽规则请由法官线下处理。</small>
        </details>
        {footer(() => commit(finishSpeech(game)), "发言结束，进入投票")}
      </div>
    );
  }

  if (game.phase === "vote") {
    const tally = tallyVotes(game);
    const candidates = game.vote.candidates
      ? alive.filter((player) => game.vote.candidates?.includes(player.id))
      : alive;
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
              players={alive}
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
              狼人、村民、预言家、女巫、猎人和守卫；警长结果录入、警徽移交、白天自爆、投票计数、平票
              PK，以及屠边或屠城判胜。
            </p>
            <h3>请提前约定</h3>
            <p>
              可设置女巫自救、同守同救、猎人奶穿状态、双药、狼刀优先和双方同时达成胜利时的处理。默认先处理死亡和猎人技能，再判断胜负。
            </p>
            <h3>暂不自动裁定</h3>
            <p>
              白痴、狼王、丘比特等特殊角色，警长竞选阶段的自爆与吞警徽，以及复杂的警上资格和遗言规则，请由法官依照桌规线下处理。
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
          `${player.id} 号：${ROLE_LABELS[player.role]}（${player.alive ? "存活" : "出局"}）`,
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
