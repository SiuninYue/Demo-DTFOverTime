import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PullToRefresh from "@/components/common/PullToRefresh";
import SalarySummaryCard from "@/components/salary/SalarySummaryCard";

import { useSalary, DEMO_EMPLOYEE_ID } from "@/hooks/useSalary";
import { useSchedule } from "@/hooks/useSchedule";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/utils/formatting";

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-6 h-4 w-32 rounded bg-slate-100" />
    <div className="mb-2 h-8 w-48 rounded bg-slate-100" />
    <div className="space-y-3">
      <div className="h-3 rounded bg-slate-100" />
      <div className="h-3 rounded bg-slate-100" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
    </div>
  </div>
);

const SkeletonListItem = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm animate-pulse">
    <div className="h-12 w-12 rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/3 rounded bg-slate-100" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
    </div>
  </div>
);

function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const month = getCurrentMonthKey();
  const salaryRoute = `/salary/${month}`;
  const employeeId = user?.id ?? DEMO_EMPLOYEE_ID;
  const todayKey = getTodayKey();

  const {
    summary,
    isLoading,
    isPersisting,
    error,
    refresh: refreshSalary,
  } = useSalary({
    employeeId,
    month,
  });
  const {
    schedule,
    refresh: refreshSchedule,
    isLoading: isScheduleLoading,
    error: scheduleError,
  } = useSchedule({ employeeId, month, autoFetch: true });

  useEffect(() => {
    Promise.all([refreshSalary(), refreshSchedule()]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingEntries = useMemo(() => {
    if (!schedule) return [];
    return Object.entries(schedule.scheduleData)
      .filter(([date]) => date >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3);
  }, [schedule, todayKey]);

  const todaySchedule = useMemo(
    () => schedule?.scheduleData[todayKey],
    [schedule, todayKey],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }, []);

  const handleRefresh = async () => {
    await Promise.all([refreshSalary(), refreshSchedule()]);
  };

  const displayName = user?.email?.split("@")[0] ?? "员工";

  return (
    <PullToRefresh onRefresh={handleRefresh} className="bg-slate-100">
      <section className="min-h-screen px-4 py-6 pb-28 md:px-6 md:pb-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {(error || scheduleError) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              <strong className="font-semibold">提示：</strong>
              {error ?? scheduleError}
            </div>
          )}

          <header className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold text-slate-500">{greeting}</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {displayName}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 bg-white transition hover:-translate-y-0.5"
              aria-label="打开设置"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </header>

          <button
            type="button"
            onClick={() => navigate(`/timecard/${todayKey}`)}
            className="block w-full text-left transition-transform active:scale-[0.99]"
          >
            <div className="relative overflow-hidden rounded-[1.5rem] bg-[#F3F6FC] p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                  今日 · {formatDate(todayKey, { format: "medium" })}
                </span>
                <span className="text-slate-400 transition-colors group-hover:text-blue-500">
                  →
                </span>
              </div>
              <div className="flex items-center gap-5">
                <div
                  className={[
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-3xl bg-white shadow-sm ring-1 bg-white",
                    todaySchedule ? "text-blue-600" : "text-slate-400",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {todaySchedule ? "⏰" : "🏖️"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {todaySchedule
                      ? `${todaySchedule.plannedStartTime ?? "--:--"} → ${todaySchedule.plannedEndTime ?? "--:--"}`
                      : "今日无排班"}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">
                    {todaySchedule ? "点按查看/记录打卡" : "点按添加加班或备注"}
                  </p>
                </div>
              </div>
            </div>
          </button>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                本月
              </h2>
              <button
                type="button"
                onClick={() => navigate(salaryRoute)}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-500"
              >
                查看详情
              </button>
            </div>
            <button
              onClick={() => navigate(salaryRoute)}
              className="block w-full text-left transition-transform active:scale-[0.99]"
            >
              {isLoading ? (
                <SkeletonCard />
              ) : (
                <SalarySummaryCard
                  summary={summary}
                  isLoading={isLoading}
                  isPersisting={isPersisting}
                />
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                即将到来
              </h2>
            </div>
            <div className="space-y-3">
              {isScheduleLoading && (
                <>
                  <SkeletonListItem />
                  <SkeletonListItem />
                </>
              )}
              {!isScheduleLoading && upcomingEntries.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                  <p className="text-sm font-medium text-slate-400">
                    暂无即将到来的排班
                  </p>
                </div>
              )}
              {!isScheduleLoading &&
                upcomingEntries.map(([date, entry]) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => navigate(`/timecard/${date}`)}
                    className="group flex w-full items-center justify-between rounded-[1.25rem] bg-[#F3F6FC] p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 bg-white">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {new Date(date).getDate()}
                        </span>
                        <span className="text-xs font-bold">
                          {
                            ["日", "一", "二", "三", "四", "五", "六"][
                              new Date(date).getDay()
                            ]
                          }
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900">
                          {formatDate(date, { format: "medium" })}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {entry?.type ?? "未记录类型"}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-700 group-hover:text-blue-600">
                      {entry?.plannedStartTime
                        ? `${entry.plannedStartTime}`
                        : "--"}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>
    </PullToRefresh>
  );
}

export default HomePage;
