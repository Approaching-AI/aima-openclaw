import { spawn } from "node:child_process";
import fs from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ID = "aima-doctor";
const HOMEPAGE = "https://aimaservice.ai/doctor";
const PRIMARY_COMMAND = "aima";
const LEGACY_COMMAND_ALIAS = "askforhelp";
const LEGACY_COMMAND_ALIAS_TWO = "doctor";
const PRIMARY_STATUS_COMMAND = "aima-status";
const LEGACY_STATUS_COMMAND_ALIAS = "askforhelp-status";
const LEGACY_STATUS_COMMAND_ALIAS_TWO = "doctor-status";
const PRIMARY_CANCEL_COMMAND = "aima-cancel";
const LEGACY_CANCEL_COMMAND_ALIAS = "askforhelp-cancel";
const LEGACY_CANCEL_COMMAND_ALIAS_TWO = "doctor-cancel";
const CJK_RE = /[\u3400-\u9fff]/;
const SESSION_STATUS_LABELS = {
  zh: {
    starting: "已启动",
    collecting: "收集中",
    registering: "注册中",
    diagnosing: "诊断中",
    executing: "执行中",
    waiting_input: "等待你的回复",
    working: "处理中",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
    interrupted: "异常中断",
  },
  en: {
    starting: "started",
    collecting: "collecting",
    registering: "registering",
    diagnosing: "diagnosing",
    executing: "executing",
    waiting_input: "waiting for your reply",
    working: "working",
    completed: "completed",
    failed: "failed",
    cancelled: "cancelled",
    interrupted: "interrupted",
  },
};
const SUPPRESSED_HELPER_MESSAGE_PATTERNS = [
  /^(从 OpenClaw 环境读取设备身份|Device identity from OpenClaw env)/,
  /^(从 CLI 状态文件读取设备身份|Device identity from CLI state)/,
  /^(从本地状态文件读取设备身份|Device identity from local state)/,
  /^(OpenClaw 进程运行中|OpenClaw process running)/,
  /^(OpenClaw 进程未运行|OpenClaw process NOT running)/,
  /^(配置文件存在|Config file found)/,
  /^(未找到配置文件|No config file found)/,
  /^(网络连通|Network OK)/,
  /^(平台网络不通|Platform unreachable)/,
  /^(设备注册成功|Device registered)/,
  /^(设备凭证已过期，正在刷新|Device credentials expired, refreshing)/,
  /^(设备凭证已刷新|Device credentials refreshed)/,
  /^(正在执行:|Running:)/,
];
const MAIN_SUBCOMMANDS = new Set(["status", "cancel", "help"]);
const sessions = new Map();
let feishuRuntimePromise = null;

function reply(text) {
  return { text };
}

function inlineCommand(name) {
  return `\`/${name}\``;
}

function commandUsage(name, suffix = "") {
  return `\`/${name}${suffix}\``;
}

function looksLikeFeishuId(value) {
  return /^ou_[a-z0-9]+$/i.test(String(value ?? "").trim());
}

function inferChannelHint(ref) {
  const candidates = [
    ref?.channel,
    ref?.channelId,
    ref?.accountId,
    ref?.target,
    ref?.senderId,
    ref?.from,
    ref?.to,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim().toLowerCase();
    if (!text) {
      continue;
    }
    if (text === "feishu" || text.includes(":feishu:")) {
      return "feishu";
    }
    if (looksLikeFeishuId(candidate)) {
      return "feishu";
    }
  }
  return "";
}

function chooseLocale(ref, seedText = "") {
  if (inferChannelHint(ref) === "feishu") {
    return "zh";
  }
  return CJK_RE.test(String(seedText ?? "")) ? "zh" : "en";
}

function splitBilingualText(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return { raw: "", zh: "", en: "" };
  }

  const parts = text.split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return {
      raw: text,
      zh: CJK_RE.test(text) ? text : "",
      en: CJK_RE.test(text) ? "" : text,
    };
  }

  return {
    raw: text,
    zh: parts.find((part) => CJK_RE.test(part)) ?? "",
    en: parts.find((part) => !CJK_RE.test(part)) ?? "",
  };
}

function localizeChatText(value, locale = "zh") {
  const parts = splitBilingualText(value);
  if (!parts.raw) {
    return "";
  }
  if (locale === "zh") {
    return parts.zh || parts.en || parts.raw;
  }
  return parts.en || parts.zh || parts.raw;
}

function translate(locale, zh, en) {
  return locale === "zh" ? zh : en;
}

function answerUsage(locale) {
  return commandUsage(PRIMARY_COMMAND, locale === "zh" ? " <你的回复>" : " <your reply>");
}

function normalizeLevel(level) {
  const value = String(level ?? "info").trim().toLowerCase();
  if (value === "warn") {
    return "warning";
  }
  return value || "info";
}

function isSuppressedHelperMessage(text) {
  return SUPPRESSED_HELPER_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function isTaskCreatedMessage(text) {
  return /^(诊断任务已创建，AI agent 正在分析|Diagnosis task created, AI agent analyzing)/.test(text);
}

function isResumeDirective(text) {
  return /^resume$/i.test(String(text ?? "").trim());
}

function isRestartDirective(text) {
  return /^(restart)(\s+.+)?$/i.test(String(text ?? "").trim());
}

function isTaskConflictPromptId(value) {
  return String(value ?? "").trim() === "task_conflict";
}

function formatNoticeLabel(locale, phase = "update", level = "info") {
  const normalizedLevel = normalizeLevel(level);
  if (normalizedLevel === "error") {
    return translate(locale, "错误", "Error");
  }
  if (normalizedLevel === "warning") {
    return translate(locale, "警告", "Warning");
  }
  switch (phase) {
    case "start":
      return translate(locale, "AIMA", "AIMA");
    case "action":
      return translate(locale, "操作", "Action");
    case "decision":
      return translate(locale, "决策", "Decision");
    case "waiting":
      return translate(locale, "等待", "Waiting");
    case "result":
      return translate(locale, "结果", "Result");
    default:
      return translate(locale, "更新", "Update");
  }
}

function formatNotice(locale, phase, message, level = "info") {
  const label = formatNoticeLabel(locale, phase, level);
  return locale === "zh" ? `${label}：${message}` : `${label}: ${message}`;
}

function parseMainDirective(args) {
  const normalized = String(args ?? "").trim().toLowerCase();
  return MAIN_SUBCOMMANDS.has(normalized) ? normalized : "";
}

function parseRunningIntent(text) {
  const zhMatch = text.match(/^正在执行:\s*(.+)$/);
  if (zhMatch) {
    return zhMatch[1].trim();
  }
  const enMatch = text.match(/^Running:\s*(.+)$/);
  if (enMatch) {
    return enMatch[1].trim();
  }
  return "";
}

function formatNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  return numeric.toFixed(digits);
}

function formatBudgetReminder(locale, payload) {
  const lines = [];
  const taskRemaining = Number(payload.budget_tasks_remaining);
  const taskTotal = Number(payload.budget_tasks_total);
  if (Number.isFinite(taskRemaining)) {
    const totalText = Number.isFinite(taskTotal)
      ? translate(locale, ` / 总量 ${taskTotal}`, ` / ${taskTotal} total`)
      : "";
    lines.push(
      translate(
        locale,
        `任务额度：剩余 ${taskRemaining}${totalText}`,
        `Task budget: ${taskRemaining}${Number.isFinite(taskTotal) ? ` / ${taskTotal}` : ""} remaining`,
      ),
    );
  }

  const usdRemaining = formatNumber(payload.budget_usd_remaining);
  const usdTotal = formatNumber(payload.budget_usd_total);
  if (usdRemaining) {
    const totalText = usdTotal
      ? translate(locale, ` / 总额 $${usdTotal}`, ` / $${usdTotal} total`)
      : "";
    lines.push(
      translate(
        locale,
        `金额余额：$${usdRemaining}${totalText}`,
        `Amount balance: $${usdRemaining}${usdTotal ? ` / $${usdTotal}` : ""} remaining`,
      ),
    );
  }
  return lines;
}

function formatCompletionMessage(session, payload) {
  const locale = session.locale ?? "zh";
  const taskStatus = String(payload.task_status ?? "").trim();
  const interrupted = taskStatus === "interrupted";
  const lines = [
    translate(
      locale,
      payload.success
        ? "结果：诊断与修复已完成"
        : interrupted
          ? "结果：救援会话已中断"
          : "结果：诊断与修复未完成",
      payload.success
        ? "Result: diagnosis and repair completed"
        : interrupted
          ? "Result: the rescue session was interrupted"
          : "Result: diagnosis and repair did not complete",
    ),
  ];
  const summary = localizeChatText(payload.summary ?? "", locale);
  if (summary) {
    lines.push(translate(locale, `说明：${summary}`, `Summary: ${summary}`));
  }
  for (const line of formatBudgetReminder(locale, payload)) {
    lines.push(line);
  }
  const bindUrl = String(payload.bind_url ?? "").trim();
  const bindUserCode = String(payload.bind_user_code ?? "").trim();
  if (bindUrl) {
    lines.push(
      translate(
        locale,
        "下一步：打开下面的链接，注册或登录后绑定这台设备，后续才能继续充值和管理额度。",
        "Next: open the link below to sign in or register, bind this device, and then manage billing.",
      ),
    );
    lines.push(bindUrl);
    if (bindUserCode) {
      lines.push(translate(locale, `设备码：${bindUserCode}`, `Device code: ${bindUserCode}`));
    }
  }
  return lines.join("\n");
}

function formatUsage(locale) {
  return [
    translate(locale, "使用方式：", "Usage:"),
    translate(locale, `启动诊断：${commandUsage(PRIMARY_COMMAND, " <症状>")}`, `Start diagnosis: ${commandUsage(PRIMARY_COMMAND, " <symptom>")}`),
    translate(locale, `查看状态：${commandUsage(PRIMARY_COMMAND, " status")}`, `Check status: ${commandUsage(PRIMARY_COMMAND, " status")}`),
    translate(locale, `取消处理：${commandUsage(PRIMARY_COMMAND, " cancel")}`, `Cancel: ${commandUsage(PRIMARY_COMMAND, " cancel")}`),
  ].join("\n");
}

function formatSessionStatusLabel(status, locale = "zh") {
  const normalized = String(status ?? "working").trim();
  return SESSION_STATUS_LABELS[locale]?.[normalized] ?? normalized;
}

function sessionKeyFromContext(ctx) {
  return JSON.stringify({
    channel: ctx.channel,
    accountId: ctx.accountId ?? "",
    conversationId: ctx.to ?? ctx.from ?? ctx.senderId ?? "",
    threadId: ctx.messageThreadId ?? "",
  });
}

function conversationRefFromContext(ctx) {
  return {
    channel: ctx.channel,
    channelId: ctx.channelId,
    accountId: ctx.accountId,
    target: ctx.to ?? ctx.from ?? null,
    from: ctx.from ?? null,
    to: ctx.to ?? null,
    messageThreadId: ctx.messageThreadId,
    senderId: ctx.senderId ?? null,
  };
}

function truncateText(value, limit = 3500) {
  const text = String(value ?? "").trim();
  if (!text || text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}\n...[truncated]`;
}

function findOpenClawDistModule(prefix) {
  const entryPath = typeof process.argv?.[1] === "string" ? process.argv[1] : "";
  if (!entryPath) {
    return null;
  }

  const distDir = path.dirname(entryPath);
  let entries = [];
  try {
    entries = fs.readdirSync(distDir);
  } catch {
    return null;
  }

  const match = entries.find((entry) => entry.startsWith(prefix) && entry.endsWith(".js"));
  return match ? path.join(distDir, match) : null;
}

async function loadFeishuChannelRuntime(api) {
  const runtimeFeishu = api.runtime?.channel?.feishu;
  if (runtimeFeishu?.sendMessageFeishu) {
    return runtimeFeishu;
  }

  if (!feishuRuntimePromise) {
    const modulePath = findOpenClawDistModule("channel.runtime-");
    if (!modulePath) {
      throw new Error("OpenClaw Feishu runtime module not found");
    }

    feishuRuntimePromise = import(pathToFileURL(modulePath).href)
      .then((mod) => {
        if (!mod?.feishuChannelRuntime?.sendMessageFeishu) {
          throw new Error("OpenClaw Feishu runtime unavailable");
        }
        return mod.feishuChannelRuntime;
      })
      .catch((error) => {
        feishuRuntimePromise = null;
        throw error;
      });
  }

  return feishuRuntimePromise;
}

function formatStatus(session) {
  const locale = session.locale ?? "zh";
  const lines = [
    translate(
      locale,
      `AIMA 状态：${formatSessionStatusLabel(session.status, locale)}`,
      `AIMA status: ${formatSessionStatusLabel(session.status, locale)}`,
    ),
  ];
  if (session.symptom) {
    lines.push(
      translate(
        locale,
        `问题：${localizeChatText(session.symptom, locale)}`,
        `Symptom: ${localizeChatText(session.symptom, locale)}`,
      ),
    );
  }
  if (session.lastSummary) {
    lines.push(
      translate(
        locale,
        `最近更新：${localizeChatText(session.lastSummary, locale)}`,
        `Latest summary: ${localizeChatText(session.lastSummary, locale)}`,
      ),
    );
  }
  if (session.pendingPromptText) {
    lines.push(
      translate(
        locale,
        `等待你的回复：${localizeChatText(session.pendingPromptText, locale)}`,
        `Waiting for your reply: ${localizeChatText(session.pendingPromptText, locale)}`,
      ),
    );
    lines.push(
      translate(
        locale,
        `请用 ${answerUsage(locale)} 回复。`,
        `Reply with ${answerUsage(locale)}.`,
      ),
    );
  }
  if (session.aimaTaskId) {
    lines.push(translate(locale, `AIMA 任务：${session.aimaTaskId}`, `AIMA task: ${session.aimaTaskId}`));
  }
  lines.push(
    translate(
      locale,
      `控制：${commandUsage(PRIMARY_COMMAND, " status")} · ${commandUsage(PRIMARY_COMMAND, " cancel")}`,
      `Controls: ${commandUsage(PRIMARY_COMMAND, " status")} · ${commandUsage(PRIMARY_COMMAND, " cancel")}`,
    ),
  );
  return lines.join("\n");
}

async function sendConversationMessage(api, ref, text, locale = "zh") {
  if (!ref.target) {
    api.logger.warn?.(`${PLUGIN_ID}: missing conversation target for ${ref.channel}`);
    return;
  }

  const message = truncateText(localizeChatText(text, locale));
  if (!message) {
    return;
  }

  if (ref.channel === "telegram") {
    await api.runtime.channel.telegram.sendMessageTelegram(ref.target, message, {
      accountId: ref.accountId,
      messageThreadId: typeof ref.messageThreadId === "number" ? ref.messageThreadId : undefined,
    });
    return;
  }

  if (ref.channel === "slack") {
    await api.runtime.channel.slack.sendMessageSlack(ref.target, message, {
      accountId: ref.accountId,
      threadTs: typeof ref.messageThreadId === "string" ? ref.messageThreadId : undefined,
    });
    return;
  }

  if (ref.channel === "discord") {
    await api.runtime.channel.discord.sendMessageDiscord(ref.target, message, {
      accountId: ref.accountId,
    });
    return;
  }

  if (ref.channel === "feishu") {
    if (!api.config) {
      throw new Error("OpenClaw config unavailable for Feishu delivery");
    }

    const feishuRuntime = await loadFeishuChannelRuntime(api);
    await feishuRuntime.sendMessageFeishu({
      cfg: api.config,
      to: ref.target,
      text: message,
      accountId: ref.accountId,
    });
    return;
  }

  api.logger.warn?.(`${PLUGIN_ID}: unsupported channel ${ref.channel}`);
}

function writeHelperInput(session, payload) {
  const stdin = session.child.stdin;
  if (!stdin || stdin.destroyed || !stdin.writable) {
    return false;
  }
  stdin.write(`${JSON.stringify(payload)}\n`);
  return true;
}

function clearSession(key) {
  sessions.delete(key);
}

async function handleHelperLine(api, session, line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(trimmed);
  } catch (error) {
    api.logger.warn?.(`${PLUGIN_ID}: invalid JSON line: ${trimmed}`);
    return;
  }

  const type = String(payload.type ?? "");

  if (type === "message") {
    const level = normalizeLevel(payload.level ?? "info");
    const text = localizeChatText(payload.text ?? "", session.locale);
    if (!text) {
      return;
    }
    if (isTaskCreatedMessage(text)) {
      const summary = translate(
        session.locale,
        "已完成本地检查，正在由 AIMA 远程分析问题。",
        "Local checks are done. AIMA is now analyzing the issue remotely.",
      );
      session.status = "executing";
      session.lastSummary = summary;
      await sendConversationMessage(
        api,
        session.ref,
        formatNotice(session.locale, "start", summary, "info"),
        session.locale,
      );
      return;
    }
    if (isSuppressedHelperMessage(text)) {
      api.logger.info?.(`${PLUGIN_ID}: suppressed helper message :: ${text}`);
      return;
    }
    session.lastSummary = text;
    const runningIntent = parseRunningIntent(text);
    if (runningIntent) {
      await sendConversationMessage(
        api,
        session.ref,
        formatNotice(
          session.locale,
          "action",
          translate(
            session.locale,
            `正在执行修复：${runningIntent}`,
            `Applying repair: ${runningIntent}`,
          ),
          "info",
        ),
        session.locale,
      );
      return;
    }
    await sendConversationMessage(
      api,
      session.ref,
      formatNotice(session.locale, "update", text, level),
      session.locale,
    );
    return;
  }

  if (type === "status") {
    const nextStatus = String(payload.state ?? "working");
    session.status = nextStatus;
    session.lastSummary = localizeChatText(payload.detail ?? session.lastSummary ?? "", session.locale);
    api.logger.info?.(
      `${PLUGIN_ID}: session status ${session.status}${session.lastSummary ? ` :: ${session.lastSummary}` : ""}`,
    );
    return;
  }

  if (type === "command_output") {
    const intent = String(payload.intent ?? "Command output");
    const output = truncateText(payload.text ?? "", 2500);
    if (output) api.logger.info?.(`${PLUGIN_ID}: helper output [${intent}] ${output}`);
    return;
  }

  if (type === "prompt") {
    session.status = "waiting_input";
    session.pendingPromptId = String(payload.id ?? "");
    session.pendingPromptText = localizeChatText(
      payload.text ?? translate(session.locale, "还需要你补充一些信息。", "More information is required."),
      session.locale,
    );
    const options = Array.isArray(payload.options)
      ? payload.options.map((entry) => localizeChatText(entry, session.locale)).filter(Boolean)
      : [];
    session.pendingPromptOptions = options;
    const optionsBlock = options.length > 0
      ? translate(session.locale, `\n可选项：${options.join(" | ")}`, `\nOptions: ${options.join(" | ")}`)
      : "";
    await sendConversationMessage(
      api,
      session.ref,
      formatNotice(
        session.locale,
        "decision",
        translate(
          session.locale,
          `${session.pendingPromptText}${optionsBlock}\n\n请用 ${answerUsage(session.locale)} 回复。`,
          `${session.pendingPromptText}${optionsBlock}\n\nReply with ${answerUsage(session.locale)}.`,
        ),
        "info",
      ),
      session.locale,
    );
    return;
  }

  if (type === "done") {
    session.finished = true;
    session.status = String(payload.task_status ?? "").trim() || (payload.success ? "completed" : "failed");
    session.lastSummary = localizeChatText(payload.summary ?? "", session.locale);
    clearSession(session.key);
    await sendConversationMessage(
      api,
      session.ref,
      formatCompletionMessage(session, payload),
      session.locale,
    );
    return;
  }

  api.logger.info?.(`${PLUGIN_ID}: ignored helper event ${type}`);
}

function startDoctorSession(api, ctx, symptom) {
  const key = sessionKeyFromContext(ctx);
  const ref = conversationRefFromContext(ctx);
  const locale = chooseLocale(ref, symptom);
  const runtimeDir = path.join(__dirname, "runtime");
  const isWindows = process.platform === "win32";
  const command = isWindows ? "powershell" : "bash";
  const args = isWindows
    ? ["-ExecutionPolicy", "Bypass", "-File", path.join(runtimeDir, "run.ps1"), "--run"]
    : [path.join(runtimeDir, "run.sh"), "--run"];

  if (symptom) {
    args.push("--symptom", symptom);
  }

  const child = spawn(command, args, {
    cwd: runtimeDir,
    stdio: ["pipe", "pipe", "pipe"],
    env: process.env,
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

    const session = {
    key,
    child,
    ref,
    locale,
    symptom,
    status: "starting",
    lastSummary: "",
    pendingPromptId: null,
    pendingPromptText: null,
    pendingPromptOptions: [],
      finished: false,
      cancelRequested: false,
      aimaTaskId: null,
    };
  sessions.set(key, session);
  api.logger.info?.(`${PLUGIN_ID}: started session ${key} (${ref.channel})`);

  const stdout = createInterface({ input: child.stdout });
  stdout.on("line", (line) => {
    void handleHelperLine(api, session, line).catch((error) => {
      api.logger.error?.(`${PLUGIN_ID}: helper line handling failed: ${String(error)}`);
    });
  });

  child.stderr.on("data", (chunk) => {
    const text = truncateText(chunk, 1500);
    if (text) {
      api.logger.warn?.(`${PLUGIN_ID}: helper stderr: ${text}`);
    }
  });

  child.on("exit", (code, signal) => {
    if (session.finished) {
      return;
    }
    clearSession(key);
    const status = session.cancelRequested ? "cancelled" : "interrupted";
    session.status = status;
    const why = session.cancelRequested
      ? translate(session.locale, "AIMA 远程诊断已取消。", "AIMA remote diagnosis cancelled.")
      : translate(
          session.locale,
          `本地救援进程异常退出（code=${code ?? "null"}, signal=${signal ?? "null"}）。`,
          `The local recovery helper exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
        );
    void sendConversationMessage(api, ref, why, session.locale).catch((error) => {
      api.logger.error?.(`${PLUGIN_ID}: failed to report helper exit: ${String(error)}`);
    });
  });

  return session;
}

export default {
  id: PLUGIN_ID,
  name: "AIMA Doctor",
  description: "Deterministic fallback diagnosis and repair for OpenClaw.",
  register(api) {
    const replyNoActive = (locale) => reply(
      [
        translate(
          locale,
          "当前没有进行中的 AIMA 接管任务。",
          "There is no active AIMA takeover task in this conversation.",
        ),
        translate(
          locale,
          `发起诊断：${commandUsage(PRIMARY_COMMAND, " OpenClaw 没有回复了")}`,
          `Start diagnosis: ${commandUsage(PRIMARY_COMMAND, " OpenClaw stopped replying")}`,
        ),
      ].join("\n"),
    );

    const cancelActiveSession = (active) => {
      active.cancelRequested = true;
      writeHelperInput(active, { type: "cancel" });
      setTimeout(() => {
        if (!active.finished) {
          active.child.kill();
        }
      }, 3000).unref?.();
      return reply(translate(active.locale, "已提交取消请求。", "Cancellation requested."));
    };

    const registerMainCommand = (name, description) => api.registerCommand({
      name,
      description,
      acceptsArgs: true,
      handler: async (ctx) => {
        const key = sessionKeyFromContext(ctx);
        const active = sessions.get(key);
        const args = String(ctx.args ?? "").trim();
        const directive = parseMainDirective(args);

        if (active) {
          if (directive === "help") {
            return reply(formatUsage(active.locale));
          }
          if (directive === "status") {
            return reply(formatStatus(active));
          }
          if (directive === "cancel") {
            return cancelActiveSession(active);
          }
          if (active.pendingPromptId && args) {
            const promptId = active.pendingPromptId;
            const written = writeHelperInput(active, {
              type: "answer",
              id: promptId,
              text: args,
            });
            if (!written) {
              return reply(
                translate(
                  active.locale,
                  `当前会话已不再接收输入。请先用 ${commandUsage(PRIMARY_COMMAND, " status")} 查看状态，或重新发送 ${inlineCommand(PRIMARY_COMMAND)}。`,
                  `This session is no longer accepting input. Check ${commandUsage(PRIMARY_COMMAND, " status")} or send ${inlineCommand(PRIMARY_COMMAND)} again.`,
                ),
              );
            }
            active.status = "diagnosing";
            active.pendingPromptId = null;
            active.pendingPromptText = null;
            active.pendingPromptOptions = [];
            if (isTaskConflictPromptId(promptId) && isResumeDirective(args)) {
              return reply(translate(active.locale, "好的，我继续跟进上一次未完成的救援。", "Okay. I will continue the unfinished rescue."));
            }
            if (isTaskConflictPromptId(promptId) && isRestartDirective(args)) {
              return reply(translate(active.locale, "好的，我会取消旧救援并重新开始。", "Okay. I will cancel the previous rescue and start over."));
            }
            return reply(translate(active.locale, "已收到你的补充信息，我继续处理。", "Got it. I will continue with your answer."));
          }
          return reply(formatStatus(active));
        }

        const locale = chooseLocale(conversationRefFromContext(ctx), args);
        if (isResumeDirective(args) || isRestartDirective(args)) {
          return replyNoActive(locale);
        }
        if (directive === "help") {
          return reply(formatUsage(locale));
        }
        if (directive === "status" || directive === "cancel") {
          return replyNoActive(locale);
        }

        const symptom = args || translate(locale, `用户通过 /${PRIMARY_COMMAND} 发起诊断`, `User started diagnosis via /${PRIMARY_COMMAND}`);
        startDoctorSession(api, ctx, symptom);
        return reply(
          [
            translate(locale, "AIMA 已接管这个问题。", "AIMA has taken over this issue."),
            translate(locale, `问题：${localizeChatText(symptom, locale)}`, `Symptom: ${localizeChatText(symptom, locale)}`),
            translate(locale, "我只会推送关键决策、执行动作和最终结果。", "I will only push key decisions, repair actions, and the final result."),
            translate(locale, `如果我追问，请用 ${answerUsage(locale)} 回复。`, `If I ask a follow-up question, reply with ${answerUsage(locale)}.`),
            translate(
              locale,
              `查看进度：${commandUsage(PRIMARY_COMMAND, " status")} · 取消：${commandUsage(PRIMARY_COMMAND, " cancel")}`,
              `Status: ${commandUsage(PRIMARY_COMMAND, " status")} · Cancel: ${commandUsage(PRIMARY_COMMAND, " cancel")}`,
            ),
          ].join("\n"),
        );
      },
    });

    const registerStatusCommand = (name, description) => api.registerCommand({
      name,
      description,
      handler: async (ctx) => {
        const active = sessions.get(sessionKeyFromContext(ctx));
        if (!active) {
          const locale = chooseLocale(conversationRefFromContext(ctx), ctx.args ?? "");
          return replyNoActive(locale);
        }
        return reply(formatStatus(active));
      },
    });

    const registerCancelCommand = (name, description) => api.registerCommand({
      name,
      description,
      handler: async (ctx) => {
        const active = sessions.get(sessionKeyFromContext(ctx));
        if (!active) {
          const locale = chooseLocale(conversationRefFromContext(ctx), ctx.args ?? "");
          return replyNoActive(locale);
        }
        return cancelActiveSession(active);
      },
    });

    registerMainCommand(PRIMARY_COMMAND, "请求 AIMA 远程接管 OpenClaw 的诊断与修复。");
    registerMainCommand(LEGACY_COMMAND_ALIAS, "兼容旧命令的别名。");
    registerMainCommand(LEGACY_COMMAND_ALIAS_TWO, "兼容旧命令的别名。");
    registerStatusCommand(PRIMARY_STATUS_COMMAND, "查看当前 AIMA 远程诊断状态。");
    registerStatusCommand(LEGACY_STATUS_COMMAND_ALIAS, "兼容旧状态命令的别名。");
    registerStatusCommand(LEGACY_STATUS_COMMAND_ALIAS_TWO, "兼容旧状态命令的别名。");
    registerCancelCommand(PRIMARY_CANCEL_COMMAND, "取消当前 AIMA 远程诊断。");
    registerCancelCommand(LEGACY_CANCEL_COMMAND_ALIAS, "兼容旧取消命令的别名。");
    registerCancelCommand(LEGACY_CANCEL_COMMAND_ALIAS_TWO, "兼容旧取消命令的别名。");
  },
};
