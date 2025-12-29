import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BasicInfoForm, { type BasicInfoValues } from '@/components/settings/BasicInfoForm'
import SalaryInfoForm, { type SalaryInfoValues } from '@/components/settings/SalaryInfoForm'
import WorkPreferencesForm, {
  type WorkPreferencesValues,
} from '@/components/settings/WorkPreferencesForm'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import {
  createEmployee,
  getEmployee,
  updateEmployee,
  type EmployeeUpsertInput,
} from '@/services/supabase/database'
import { propagateProfileChange, type SettingsPropagationResult } from '@/services/settings/profileSync'
import { CalculationMode, type Employee, WorkScheduleType } from '@/types/employee'
import { DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { evaluatePartIV } from '@/utils/partIV'

type DraftProfile = EmployeeUpsertInput
type AuthIdentity = { id: string; email?: string | null } | null | undefined

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isValidUuid = (value: string | undefined | null): boolean =>
  typeof value === 'string' && uuidRegex.test(value)

const buildDefaultProfile = (identity?: AuthIdentity): DraftProfile => ({
  id: identity?.id ?? DEMO_EMPLOYEE_ID,
  email: identity?.email ?? 'demo@dtf.sg',
  name: '示例员工',
  employeeId: undefined,
  position: '员工',
  outletCode: 'DTF-SG-01',
  baseSalary: 1770,
  attendanceBonus: 200,
  workScheduleType: WorkScheduleType.FIVE_DAY,
  normalWorkHours: 8,
  defaultRestHours: 1,
  isWorkman: true,
  isPartIVApplicable: true,
  payDay: 7,
  calculationMode: CalculationMode.FULL_COMPLIANCE,
})

const toDraft = (profile?: Employee | null, identity?: AuthIdentity): DraftProfile =>
  profile
    ? {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      employeeId: profile.employeeId,
      position: profile.position,
      outletCode: profile.outletCode,
      baseSalary: profile.baseSalary,
      attendanceBonus: profile.attendanceBonus,
      workScheduleType: profile.workScheduleType,
      normalWorkHours: profile.normalWorkHours,
      defaultRestHours: profile.defaultRestHours,
      defaultStartTime: profile.defaultStartTime,
      defaultEndTime: profile.defaultEndTime,
      isWorkman: profile.isWorkman,
      isPartIVApplicable: profile.isPartIVApplicable,
      payDay: profile.payDay,
      calculationMode: profile.calculationMode,
      startDate: profile.startDate,
    }
    : buildDefaultProfile(identity)

const toEmployee = (draft: DraftProfile): Employee => ({
  id: draft.id ?? DEMO_EMPLOYEE_ID,
  email: draft.email,
  name: draft.name,
  employeeId: draft.employeeId,
  position: draft.position,
  outletCode: draft.outletCode,
  baseSalary: draft.baseSalary,
  attendanceBonus: draft.attendanceBonus ?? 0,
  workScheduleType: draft.workScheduleType ?? WorkScheduleType.FIVE_DAY,
  normalWorkHours: draft.normalWorkHours ?? 8,
  defaultRestHours: draft.defaultRestHours ?? 1,
  defaultStartTime: draft.defaultStartTime,
  defaultEndTime: draft.defaultEndTime,
  isWorkman: draft.isWorkman,
  isPartIVApplicable: draft.isPartIVApplicable ?? true,
  payDay: draft.payDay ?? 7,
  startDate: draft.startDate,
  calculationMode: draft.calculationMode ?? CalculationMode.FULL_COMPLIANCE,
})

function SettingsPage() {
  const navigate = useNavigate()
  const profile = useUserStore((state) => state.profile)
  const status = useUserStore((state) => state.status)
  const setProfile = useUserStore((state) => state.setProfile)
  const loadProfile = useUserStore((state) => state.loadProfile)
  const { user, signOut } = useAuthStore()
  const [draft, setDraft] = useState<DraftProfile>(() => toDraft(profile, user))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [recalcReport, setRecalcReport] = useState<SettingsPropagationResult | null>(null)
  const lastLoadedIdRef = useRef<string | null>(null)

  const employeeId = user?.id ?? draft.id ?? DEMO_EMPLOYEE_ID

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    setDraft(toDraft(profile, user))
  }, [profile, user])

  useEffect(() => {
    if (profile || status === 'loading') {
      return
    }
    if (!isValidUuid(employeeId)) {
      setLoadError('未找到现有资料，请先填写个人信息。')
      return
    }
    if (lastLoadedIdRef.current === employeeId) {
      return
    }
    lastLoadedIdRef.current = employeeId
    loadProfile(() => getEmployee(employeeId))
      .then((remoteProfile) => {
        if (!remoteProfile) {
          setLoadError('未找到现有资料，请先填写个人信息。')
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '无法加载个人资料。'
        setLoadError(message)
      })
  }, [employeeId, loadProfile, profile, status])

  const evaluation = useMemo(
    () =>
      evaluatePartIV({
        baseSalary: draft.baseSalary,
        isWorkman: draft.isWorkman,
      }),
    [draft.baseSalary, draft.isWorkman],
  )

  const updateDraft = (updates: Partial<DraftProfile>) => {
    setDraft((current) => ({ ...current, ...updates }))
  }

  const handleSave = async () => {
    setSaveError(null)
    setRecalcReport(null)
    setIsSaving(true)
    const payload: DraftProfile = {
      ...draft,
      id: user?.id ?? draft.id ?? employeeId,
      isPartIVApplicable: evaluation.isApplicable,
      calculationMode: evaluation.calculationMode,
    }

    let persistedProfile: Employee | null = null

    try {
      if (user?.id && isValidUuid(user.id)) {
        try {
          persistedProfile = await updateEmployee(user.id, payload)
        } catch {
          const createPayload: DraftProfile = { ...payload, id: user.id }
          persistedProfile = await createEmployee(createPayload)
        }
      } else if (profile?.id && isValidUuid(profile.id)) {
        persistedProfile = await updateEmployee(profile.id, payload)
      } else {
        const createPayload: DraftProfile = isValidUuid(payload.id)
          ? payload
          : { ...payload, id: undefined }
        persistedProfile = await createEmployee(createPayload)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '保存设置失败，仅已保存到本地。'
      setSaveError(message)
    }

    const committedProfile = persistedProfile ?? toEmployee(payload)
    setProfile(committedProfile)
    setDraft(toDraft(committedProfile))
    setLastSavedAt(new Date().toISOString())

    try {
      setIsRecalculating(true)
      const report = await propagateProfileChange(committedProfile)
      setRecalcReport(report)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '刷新工资缓存失败。'
      setRecalcReport({
        monthsProcessed: 0,
        summariesPersisted: 0,
        warnings: [message],
      })
    } finally {
      setIsRecalculating(false)
      setIsSaving(false)
    }
  }

  const basicValues: BasicInfoValues = {
    name: draft.name,
    email: draft.email,
    employeeId: draft.employeeId,
    position: draft.position,
    outletCode: draft.outletCode,
    isWorkman: draft.isWorkman,
  }

  const salaryValues: SalaryInfoValues = {
    baseSalary: draft.baseSalary,
    attendanceBonus: draft.attendanceBonus ?? 0,
    payDay: draft.payDay ?? 7,
    isPartIVApplicable: draft.isPartIVApplicable ?? evaluation.isApplicable,
    calculationMode: draft.calculationMode ?? evaluation.calculationMode,
  }

  const preferenceValues: WorkPreferencesValues = {
    normalWorkHours: draft.normalWorkHours ?? 8,
    defaultRestHours: draft.defaultRestHours ?? 1,
    defaultStartTime: draft.defaultStartTime,
    defaultEndTime: draft.defaultEndTime,
    workScheduleType: draft.workScheduleType ?? WorkScheduleType.FIVE_DAY,
  }

  return (
    <section className="min-h-screen px-4 py-6 pb-28 md:px-6 md:pb-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2 px-1">
          <p className="text-sm font-semibold text-slate-500">个人资料与合规</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">设置</h1>
          <p className="text-sm text-slate-600">
            请保持以下信息准确，以确保工资计算符合 MOM 规定。
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span aria-live="polite">
              状态：{status === 'loading' ? '同步中…' : '就绪'}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              上次保存：
              {lastSavedAt ? new Date(lastSavedAt).toLocaleString('zh-SG') : '尚未保存'}
            </span>
          </div>
        </header>

        {(loadError || saveError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong className="font-semibold">错误：</strong>
            {loadError ?? saveError}
          </div>
        )}

        {isRecalculating && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            正在重新计算工资缓存数据…
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <BasicInfoForm
            values={basicValues}
            onChange={updateDraft}
            onSubmit={handleSave}
            isSaving={isSaving}
          />
          <SalaryInfoForm
            values={salaryValues}
            isWorkman={draft.isWorkman}
            onChange={updateDraft}
            onSubmit={handleSave}
            isSaving={isSaving}
          />
          <WorkPreferencesForm
            values={preferenceValues}
            onChange={updateDraft}
            onSubmit={handleSave}
            isSaving={isSaving}
          />

          <section className="settings-card space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">账户</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">登录信息</h3>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">当前登录</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              className="danger w-full"
              onClick={handleLogout}
            >
              退出登录
            </button>
          </section>
        </div>

        {recalcReport && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">重新计算摘要</h3>
            <p className="mt-2 text-sm text-slate-600">
              已更新 {recalcReport.summariesPersisted}/{recalcReport.monthsProcessed} 份工资缓存汇总。
            </p>
            {recalcReport.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-amber-700">
                {recalcReport.warnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </section>
  )
}

export default SettingsPage
