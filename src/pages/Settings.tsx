import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BasicInfoForm, { type BasicInfoValues } from '@/components/settings/BasicInfoForm'
import SalaryInfoForm, { type SalaryInfoValues } from '@/components/settings/SalaryInfoForm'
import WorkPreferencesForm, {
  type WorkPreferencesValues,
} from '@/components/settings/WorkPreferencesForm'
import PartIVBadge from '@/components/settings/PartIVBadge'
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

const buildDefaultProfile = (employeeId = DEMO_EMPLOYEE_ID): DraftProfile => ({
  id: employeeId,
  email: 'demo@dtf.sg',
  name: 'Demo Employee',
  employeeId: 'DTF-001',
  position: 'Crew',
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

const toDraft = (profile?: Employee | null): DraftProfile =>
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
        isWorkman: profile.isWorkman,
        isPartIVApplicable: profile.isPartIVApplicable,
        payDay: profile.payDay,
        calculationMode: profile.calculationMode,
        startDate: profile.startDate,
      }
    : buildDefaultProfile()

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
  isWorkman: draft.isWorkman,
  isPartIVApplicable: draft.isPartIVApplicable ?? true,
  payDay: draft.payDay ?? 7,
  startDate: draft.startDate,
  calculationMode: draft.calculationMode ?? CalculationMode.FULL_COMPLIANCE,
})

function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const profile = useUserStore((state) => state.profile)
  const status = useUserStore((state) => state.status)
  const setProfile = useUserStore((state) => state.setProfile)
  const loadProfile = useUserStore((state) => state.loadProfile)
  const { user, signOut } = useAuthStore()
  const [draft, setDraft] = useState<DraftProfile>(() => toDraft(profile))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [recalcReport, setRecalcReport] = useState<SettingsPropagationResult | null>(null)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const isValidUuid = (value: string | undefined | null): boolean =>
    typeof value === 'string' && uuidRegex.test(value)

  const employeeId = user?.id ?? draft.id ?? DEMO_EMPLOYEE_ID

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    setDraft(toDraft(profile))
  }, [profile])

  useEffect(() => {
    if (profile || status === 'loading') {
      return
    }
    if (!isValidUuid(employeeId)) {
      setLoadError('No existing profile found. Fill in your details to get started.')
      return
    }
    loadProfile(() => getEmployee(employeeId))
      .then((remoteProfile) => {
        if (!remoteProfile) {
          setLoadError('No existing profile found. Fill in your details to get started.')
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to load profile.'
        setLoadError(message)
      })
  }, [employeeId, loadProfile, profile, status, isValidUuid])

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
      id: draft.id ?? employeeId,
      isPartIVApplicable: evaluation.isApplicable,
      calculationMode: evaluation.calculationMode,
    }

    let persistedProfile: Employee | null = null

    try {
      if (profile?.id && isValidUuid(profile.id)) {
        persistedProfile = await updateEmployee(profile.id, payload)
      } else {
        const createPayload = { ...payload }
        if (!isValidUuid(createPayload.id)) {
          delete (createPayload as any).id
        }
        persistedProfile = await createEmployee(createPayload)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Saving settings failed. Stored locally only.'
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
        error instanceof Error ? error.message : 'Failed to refresh salary caches.'
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
    workScheduleType: draft.workScheduleType ?? WorkScheduleType.FIVE_DAY,
  }

  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <div>
          <p className="text-muted">Profile & compliance</p>
          <h1>Settings</h1>
          <p>Keep these values accurate to unlock reliable MOM-compliant calculations.</p>
        </div>
        <div className="settings-page__meta">
          <p>Status: {status === 'loading' ? 'Syncing…' : 'Ready'}</p>
          <p>Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : 'Not saved yet'}</p>
        </div>
      </header>

      <PartIVBadge
        isApplicable={evaluation.isApplicable}
        threshold={evaluation.threshold}
        baseSalary={draft.baseSalary}
        isWorkman={draft.isWorkman}
        calculationMode={evaluation.calculationMode}
      />

      {(loadError || saveError) && (
        <div className="settings-alert settings-alert--error">
          ⚠️ {loadError ?? saveError}
        </div>
      )}

      {isRecalculating && (
        <div className="settings-alert settings-alert--info">Recalculating cached salary data…</div>
      )}

      <div className="settings-grid">
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

        <section className="settings-section">
          <h3>{t('settings.language')}</h3>
          <p className="settings-description">{t('settings.languageDescription')}</p>
          <div className="language-selector">
            <button
              className={`language-button ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              English
            </button>
            <button
              className={`language-button ${i18n.language === 'zh' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('zh')}
            >
              中文
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3>Account</h3>
          <p className="settings-description">Logged in as: {user?.email}</p>
          <button className="logout-button" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </section>
      </div>

      {recalcReport && (
        <section className="settings-recalc">
          <h3>Recalculation summary</h3>
          <p>
            Updated {recalcReport.summariesPersisted}/{recalcReport.monthsProcessed} cached salary
            summaries.
          </p>
          {recalcReport.warnings.length > 0 && (
            <ul>
              {recalcReport.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}

export default SettingsPage
