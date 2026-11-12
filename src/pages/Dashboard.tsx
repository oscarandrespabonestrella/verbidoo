import { go } from "../App";
import { Icon, type IconName } from "../components/icons";
import { Gaston, Logo, ParisScene } from "../components/gaston";
import {
  Avatar,
  ProgressBar,
  StreakPill,
  VoiceWarning,
  XpPill,
} from "../components/ui";
import { CATEGORIES } from "../data/i18n";
import { VERBS } from "../data/verbs";
import { conjugate, infinitive } from "../engine/conjugate";
import { recommendations, trickyVerbs, type Rec } from "../lib/adaptive";
import type { Kind } from "../lib/games";
import {
  DAILY_GOAL,
  character,
  dailyOf,
  learnedCount,
  learner,
  levelOf,
  liveStreak,
  openVerbs,
  recommend,
  t,
  todayXp,
  useProfiles,
  useProgress,
  weeklyOf,
} from "../lib/progress";
import {
  MISSION_XP,
  WEEKLY_XP,
  dailyMissions,
  isDone,
  weeklyChallenge,
} from "../lib/rewards";
import { nameOf } from "./Parent";

const ALL_KINDS: Kind[] = [
  "picture",
  "listen",
  "conjugate",
  "complete",
  "timetravel",
  "translate",
  "build",
  "pronounce",
];

/** Recommendation type → icon tile, as in the design's "Para ti" rows. */
const REC_STYLE: Record<
  string,
  { icon: IconName; bg: string; fg: string; tag?: string }
> = {
  rec_unlocked: { icon: "unlock", bg: "#E3F6EE", fg: "#0A875C" },
  rec_review: { icon: "repeat", bg: "#E3F4FD", fg: "#0C76B8" },
  rec_weakTense: { icon: "target", bg: "#E6EDFE", fg: "#1E46C4" },
  rec_weakSkill: { icon: "gauge", bg: "#FFF4D6", fg: "#8A6514" },
  rec_new: { icon: "pencil", bg: "#FFEEDD", fg: "#C2410C" },
  rec_adventure: { icon: "gamepad", bg: "#E6EDFE", fg: "#1E46C4" },
};

const today = () =>
  new Date().toLocaleDateString(document.documentElement.lang || undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export function Dashboard() {
  const s = useProgress();
  const idx = useProfiles();
  const target = s.target!;
  const open = openVerbs(s, CATEGORIES);
  const next = recommend(s, open)[0];
  const L = learner(s);
  const tenseLabel = (id: string) =>
    conjugate(VERBS[0], target).find((x) => x.tense.id === id)?.tense.label ??
    id;
  const recText = (r: Rec) =>
    t(r.title, {
      ...r.vars,
      ...(r.tense ? { tense: tenseLabel(r.tense) } : {}),
      ...(r.kind ? { game: t(`game_${r.kind}`) } : {}),
      ...(r.verb ? { verb: infinitive(r.verb, target) } : {}),
    });
  const tricky = trickyVerbs(L, open);
  const me = character(s);
  const profile = idx.list.find((p) => p.id === idx.active);
  const name = profile ? nameOf(profile, idx.list.indexOf(profile)) : me.name;
  const daily = dailyOf(s),
    weekly = weeklyOf(s),
    challenge = weeklyChallenge(weekly.week);
  const missions = dailyMissions(daily.day);
  const doneCount = missions.filter(
    (m) => daily.missions.includes(m.id) || isDone(m, daily)
  ).length;
  const xpToday = Math.min(todayXp(s), DAILY_GOAL);
  const level = levelOf(s.xp),
    streak = liveStreak(s),
    learned = learnedCount(s);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Phone header: who + streak/XP pills. */}
      <header className="flex items-center justify-between gap-3 lg:hidden">
        <Logo size={28} className="min-w-0" />
        <div className="flex shrink-0 gap-1.5">
          <StreakPill n={streak} label={t("streak")} />
          <XpPill n={s.xp} label={t("xp")} />
        </div>
        <a
          href="#/profiles"
          aria-label={`${t("switchPlayer")} (${name})`}
          className="shrink-0 rounded-full border-2 border-white shadow-[0_4px_12px_rgba(20,32,94,0.12)]"
        >
          <Avatar emoji={profile?.avatar ?? me.emoji} />
        </a>
      </header>
      {/* Laptop header. */}
      <header className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
        <div>
          <span className="mut font-bold first-letter:uppercase">
            {today()}
          </span>
          <h1 className="page-title !text-[34px]">{t("hm_hi", { name })}</h1>
        </div>
        <div className="flex gap-2">
          <StreakPill n={t("hm_days", { n: streak })} label={t("streak")} />
          <XpPill n={`${s.xp} XP`} label={t("xp")} />
        </div>
      </header>

      <VoiceWarning variant={target} />

      <div className="grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] lg:gap-5">
        {/* Hero (design V2-Home): Gaston with the flag over Paris, his bubble, then today's goal + Continue on glass. */}
        <section className="scene relative flex min-h-[380px] min-w-0 flex-col justify-end gap-3 overflow-hidden rounded-[32px] p-4 shadow-[0_20px_48px_rgba(20,32,94,0.16)] lg:col-span-full lg:min-h-[420px] lg:flex-row lg:items-end lg:p-7">
          <ParisScene />
          <div className="relative flex min-h-[210px] flex-1 items-end lg:min-h-0 lg:self-stretch">
            <Gaston
              pose="guide"
              size={170}
              alt="Gaston"
              className="gaston-shadow -mb-2 lg:!size-[280px]"
            />
            <p className="bubble absolute right-0 top-0 m-0 max-w-[62%] rounded-br-md text-[15px] lg:left-[230px] lg:right-auto lg:top-6 lg:max-w-[260px]">
              <span lang="fr">Bonjour {name} !</span> {t("gastonToday")}{" "}
              <b lang={target} className="whitespace-nowrap text-grape-dark">
                <span className="emoji mr-1">{next.emoji}</span>
                {infinitive(next, target)}
              </b>
              .
            </p>
          </div>
          <div className="card relative flex min-w-0 flex-col gap-3 p-4 lg:w-[400px] lg:shrink-0 lg:gap-4 lg:p-6">
            <div className="flex items-baseline justify-between gap-2">
              <b className="font-display text-[17px] font-semibold">
                {t("todayGoal")}
              </b>
              <span className="text-sm font-bold">
                {xpToday} / {DAILY_GOAL} XP
              </span>
            </div>
            <ProgressBar value={xpToday} max={DAILY_GOAL} />
            <button
              type="button"
              onClick={() => go(`verb/${next.id}`)}
              className="btn btn-primary w-full lg:w-auto lg:self-start"
            >
              {t("continue")}
              <Icon name="arrowRight" />
            </button>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-full lg:grid lg:grid-cols-2 lg:gap-5">
          {/* Stats. */}
          <section
            aria-label={t("progress")}
            className="grid grid-cols-3 gap-2.5"
          >
            <div className="card flex min-w-0 flex-col gap-1 px-3 py-3.5">
              <Icon
                name="flame"
                style={{ fill: "#FF6B3D", stroke: "#FF6B3D" }}
              />
              <b className="font-display text-[22px] font-bold leading-tight">
                {t("hm_days", { n: streak })}
              </b>
              <span className="mut text-[13px] font-bold leading-tight">
                {t("streak")}
              </span>
            </div>
            <div className="card flex min-w-0 flex-col gap-1 px-3 py-3.5">
              <Icon name="book" className="text-grape" />
              <b className="font-display text-[22px] font-bold leading-tight">
                {learned}
                <span className="mut text-[15px]">/{VERBS.length}</span>
              </b>
              <span className="mut text-[13px] font-bold leading-tight">
                {t("verbs")}
              </span>
            </div>
            <div className="card flex min-w-0 flex-col gap-1 px-3 py-3.5">
              <Icon name="trophy" className="text-mint" />
              <b className="font-display text-[22px] font-bold leading-tight">
                {t("level")} {level}
              </b>
              <ProgressBar
                value={s.xp % 100}
                max={100}
                color="bg-mint"
                className="mt-1 !h-1.5"
              />
            </div>
          </section>

          {/* Daily challenge. */}
          <button
            type="button"
            onClick={() => go("play/mixed")}
            className="flex w-full items-center gap-3.5 rounded-[20px] border-[1.5px] border-[#FFE3A3] bg-[#FFF4D6] p-4 text-left text-ink"
          >
            <span className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-sun text-[#5A3B00]">
              <Icon name="trophy" size={28} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="font-display text-[19px] font-bold">
                {t("dailyChallenge")}
              </b>
              <span className="text-sm font-semibold text-[#5C4A1E]">
                {t("dailyChallengeDesc")}
              </span>
            </span>
            <Icon name="chevron" className="text-[#8A6514]" />
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] lg:gap-5">
        {/* Missions. */}
        <section className="card flex min-w-0 flex-col gap-3.5 px-4 py-[18px] lg:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="h2">{t("missions")}</h2>
            <span className="cap">
              {t("hm_of", { a: doneCount, b: missions.length })}
            </span>
          </div>
          {missions.map((m) => {
            const done = daily.missions.includes(m.id) || isDone(m, daily);
            return (
              <div key={m.id} className="flex items-center gap-3">
                {done ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint text-white">
                    <Icon name="check" size={16} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="size-7 shrink-0 rounded-full border-[2.5px] border-[#D3D7E6]" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-[15px] font-bold">
                    <span className="min-w-0">
                      {t(m.title, { n: m.target })}
                    </span>
                    {done ? (
                      <span className="shrink-0 text-mint-dark">
                        {t("hm_done")}
                      </span>
                    ) : (
                      <span className="mut shrink-0">
                        {Math.min(m.value(daily), m.target)}/{m.target}
                      </span>
                    )}
                  </div>
                  <ProgressBar
                    value={m.value(daily)}
                    max={m.target}
                    color={done ? "bg-mint" : "bg-grape"}
                  />
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[13px] font-extrabold ${
                    done
                      ? "bg-mint-soft text-mint-dark"
                      : "bg-[#FFF4D6] text-[#8A6514]"
                  }`}
                >
                  +{MISSION_XP}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-3 border-t border-dashed border-line-strong pt-3.5">
            <span className="rb bg-grape-soft text-grape">
              <Icon name={weekly.done ? "check" : "target"} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex justify-between gap-2 text-[15px] font-bold">
                <span className="min-w-0">
                  {t("weeklyTitle")} ·{" "}
                  {t(challenge.title, { n: challenge.target })}
                </span>
                <span className="mut shrink-0">
                  {Math.min(challenge.value(weekly), challenge.target)}/
                  {challenge.target}
                </span>
              </div>
              <ProgressBar
                value={challenge.value(weekly)}
                max={challenge.target}
                color={weekly.done ? "bg-mint" : "bg-grape"}
              />
            </div>
            <span className="shrink-0 rounded-full bg-[#FFF4D6] px-2 py-1 text-[13px] font-extrabold text-[#8A6514]">
              +{WEEKLY_XP}
            </span>
          </div>
        </section>

        {/* For you. */}
        <section className="card flex min-w-0 flex-col gap-2.5 px-4 py-[18px] lg:p-5">
          <h2 className="h2 mb-1">{t("forYou")}</h2>
          {recommendations(L, open, ALL_KINDS).map((r) => {
            const st = REC_STYLE[r.title] ?? REC_STYLE.rec_adventure;
            return (
              <button
                key={r.title + (r.tense ?? r.kind ?? r.verb?.id ?? "")}
                type="button"
                onClick={() => go(r.path)}
                className="row"
              >
                <span
                  className="rb"
                  style={{ background: st.bg, color: st.fg }}
                >
                  {r.verb ? (
                    <span className="emoji text-xl leading-none">
                      {r.verb.emoji}
                    </span>
                  ) : (
                    <Icon name={st.icon} />
                  )}
                </span>
                <b className="min-w-0 flex-1 text-[15px]">{recText(r)}</b>
                <Icon name="chevron" className="text-subtle" />
              </button>
            );
          })}
        </section>

        {/* Tricky verbs. */}
        {tricky.length > 0 && (
          <section className="card flex min-w-0 flex-col gap-3 px-4 py-[18px] lg:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="h2">{t("trickyVerbs")}</h2>
              <a
                href="#/play/conjugate"
                className="flex min-h-11 items-center text-[15px] font-extrabold text-grape lg:hidden"
              >
                {t("hm_review")}
              </a>
            </div>
            <div className="flex flex-wrap gap-2" lang={target}>
              {tricky.map(({ verb, wrongPct }) => {
                const pct = 100 - wrongPct;
                return (
                  <a
                    key={verb.id}
                    href={`#/verb/${verb.id}`}
                    className="chip max-w-full"
                  >
                    <span className="truncate">{infinitive(verb, target)}</span>
                    <span
                      className={`text-[13px] font-extrabold ${
                        pct < 45 ? "text-[#A12424]" : "text-[#C2410C]"
                      }`}
                    >
                      {pct}%
                    </span>
                  </a>
                );
              })}
            </div>
            <a
              href="#/play/conjugate"
              className="btn btn-ghost hidden lg:inline-flex"
            >
              {t("hm_reviewThese")}
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
