# PayTrack SG - 薪資追蹤系統 PRD v2.0

## 一、產品概述

### 1.1 產品定位
**薪資估算 + 權益提醒**工具，專為新加坡餐飲零售業輪班員工設計，確保薪資計算透明化並保護員工權益。

### 1.2 核心價值主張
- **準確性**：符合新加坡MOM法規的薪資計算引擎
- **可信度**：每項計算都附帶法規引用和明細解釋
- **易用性**：OCR自動識別排班表，零手動輸入
- **權益保護**：自動檢測違規情況並提供維權指導

### 1.3 目標用戶
- **主要**：鼎泰豐(Din Tai Fung)月薪制輪班員工
- **次要**：新加坡所有餐飲業輪班員工
- **擴展**：零售、醫療行業輪班員工

---

## 二、核心功能規格

### 2.1 雙層薪資計算引擎 ⭐NEW

#### 2.1.1 法規層（MOM Compliance Layer）
基於新加坡人力部(MOM)官方規定，不可修改：

```typescript
interface MOMCompliance {
  // 基礎時薪計算（月薪制）
  calculateHourlyRate(monthlySalary: number): number {
    return monthlySalary / 190.67; // (52週 × 44小時) ÷ 12個月
  }
  
  // Part IV 覆蓋範圍檢查
  isUnderPartIV(salary: number, isWorkman: boolean): boolean {
    return isWorkman ? salary <= 4500 : salary <= 2600;
  }
  
  // 工時上限檢查
  validateWorkHours(daily: number, monthlyOT: number): ValidationResult {
    return {
      dailyExceeded: daily > 12,
      monthlyOTExceeded: monthlyOT > 72,
      requiresExemption: daily > 12 || monthlyOT > 72
    };
  }
}
```

#### 2.1.2 公司內規層（Company Rules Layer）
可根據不同公司/門店/職位配置：

```typescript
interface CompanyRules {
  outletCode: string;           // 門店代碼
  positionLevel: string;        // 職位等級
  attendanceBonus: {            // 出勤獎規則
    full: number;                // 全勤獎金額
    rules: AttendanceBonusRule[]; // MC天數對應規則
  };
  mealAllowance?: number;        // 餐補
  transportAllowance?: number;   // 交通津貼
  customOvertimeRules?: any;     // 公司特殊加班規則
}
```

### 2.2 休息日計算修正 ⭐CRITICAL

#### 修正前（錯誤）：
```javascript
// ❌ 錯誤：整天都算1.5倍
if (type === 'overtime_on_off_day') {
  return hourlyRate * 1.5 * totalHours;
}
```

#### 修正後（正確）：
```typescript
interface RestDayCalculation {
  calculateRestDayPay(params: {
    isEmployerRequested: boolean;  // 是否雇主要求
    hoursWorked: number;
    hourlyRate: number;
    normalWorkHours: number;  // 正常工時（通常8小時）
  }): PayComponents {
    const { isEmployerRequested, hoursWorked, hourlyRate, normalWorkHours } = params;
    
    if (isEmployerRequested) {
      // 雇主要求在休息日工作
      let basePay = 0;
      let overtimePay = 0;
      
      // 基礎報酬
      if (hoursWorked <= normalWorkHours / 2) {
        basePay = hourlyRate * normalWorkHours;  // 1日薪
      } else {
        basePay = hourlyRate * normalWorkHours * 2;  // 2日薪
      }
      
      // 超過正常工時的部分才算加班
      if (hoursWorked > normalWorkHours) {
        overtimePay = (hoursWorked - normalWorkHours) * hourlyRate * 1.5;
      }
      
      return { basePay, overtimePay };
    } else {
      // 員工自願
      let basePay = 0;
      let overtimePay = 0;
      
      if (hoursWorked <= normalWorkHours / 2) {
        basePay = hourlyRate * normalWorkHours * 0.5;  // 半日薪
      } else if (hoursWorked <= normalWorkHours) {
        basePay = hourlyRate * normalWorkHours;  // 1日薪
      } else {
        basePay = hourlyRate * normalWorkHours;  // 1日薪
        overtimePay = (hoursWorked - normalWorkHours) * hourlyRate * 1.5;
      }
      
      return { basePay, overtimePay };
    }
  }
}
```

### 2.3 公眾假期計算修正 ⭐CRITICAL

#### 修正前（錯誤）：
```javascript
// ❌ 錯誤：整天都算2倍
if (type === 'public_holiday') {
  return hourlyRate * 2.0 * totalHours;
}
```

#### 修正後（正確）：
```typescript
interface PublicHolidayCalculation {
  calculatePHPay(params: {
    hoursWorked: number;
    hourlyRate: number;
    normalWorkHours: number;
  }): PayComponents {
    const { hoursWorked, hourlyRate, normalWorkHours } = params;
    
    // 月薪已包含假日薪，上班額外給一天基本薪
    const extraDayPay = hourlyRate * normalWorkHours;
    
    // 只有超過正常工時的部分才算1.5倍加班
    let overtimePay = 0;
    if (hoursWorked > normalWorkHours) {
      overtimePay = (hoursWorked - normalWorkHours) * hourlyRate * 1.5;
    }
    
    return {
      basePay: extraDayPay,  // 額外一天基本薪
      overtimePay: overtimePay  // 超時部分的1.5倍
    };
  }
}
```

### 2.4 班表類型語義對齊 ⭐NEW

```typescript
enum ShiftType {
  WORK = 'work',              // 正常工作日
  REST_DAY = 'rest_day',      // 法定休息日（每週1天）
  OFF_DAY = 'off_day',        // 其他非工作日
  REST_OT = 'rest_overtime',  // 休息日加班
  OFF_OT = 'off_overtime',    // 非工作日加班
  PUBLIC_HOLIDAY = 'ph',      // 公眾假期
  PH_OT = 'ph_overtime',      // 公眾假期加班
  ANNUAL_LEAVE = 'al',        // 年假
  MEDICAL_LEAVE = 'mc',       // 病假
  TRAINING = 'training',      // 培訓
  SUPPORT_IN = 'support_in',  // 其他店支援到本店
  SUPPORT_OUT = 'support_out',// 本店去支援其他店
  CO = 'compensation_off'     // 補休（不是補償假）
}
```

### 2.5 跨日班與分段班處理 ⭐NEW

```typescript
interface ShiftTimeCalculation {
  // 跨日班處理
  calculateCrossMidnightShift(params: {
    date: string;
    startTime: string;  // "22:00"
    endTime: string;    // "06:00" (次日)
    restHours: number;
  }): ShiftRecord[] {
    // 自動分割為兩天記錄
    return [
      { date: date, hours: hoursBeforeMidnight },
      { date: nextDate, hours: hoursAfterMidnight }
    ];
  }
  
  // 分段班處理
  calculateSplitShift(params: {
    segments: Array<{
      start: string;
      end: string;
    }>;
    restPeriods: Array<{
      start: string;
      end: string;
      isPaid: boolean;
    }>;
  }): number {
    // 計算實際工作時數
    return totalWorkHours;
  }
}
```

---

## 三、創新功能模組

### 3.1 權益雷達（Rights Radar）⭐NEW
自動監測並提醒違規情況：

```typescript
interface RightsRadar {
  alerts: {
    dailyOvertime: {
      threshold: 12,  // 每日上限12小時
      message: "今日工時已達{hours}小時，超過MOM規定上限"
    },
    monthlyOvertime: {
      threshold: 72,  // 每月加班上限72小時
      message: "本月加班已達{hours}小時，接近法定上限"
    },
    restDayViolation: {
      message: "連續{days}天未休息，違反每週至少1天休息日規定"
    }
  };
  
  // 提供應對建議
  getActionGuide(violation: string): ActionGuide {
    return {
      steps: string[];
      templateMessage: string;
      momReference: string;
    };
  }
}
```

### 3.2 差額解釋器（Discrepancy Explainer）⭐NEW
對比實際薪單，逐項解釋差異：

```typescript
interface DiscrepancyExplainer {
  compareWithPayslip(params: {
    calculated: SalaryBreakdown;
    actual: PayslipData;
  }): DiscrepancyReport {
    return {
      differences: [
        {
          item: "休息日加班費",
          calculated: 450.00,
          actual: 300.00,
          difference: -150.00,
          possibleReason: "公司可能未按MOM規定計算休息日報酬",
          momReference: "https://mom.gov.sg/rest-day-pay"
        }
      ],
      totalDifference: number;
      severity: 'low' | 'medium' | 'high';
      recommendedAction: string;
    };
  }
}
```

### 3.3 證據包生成器（Evidence Package）⭐NEW
一鍵生成可提交給HR或MOM的完整報告：

```typescript
interface EvidenceGenerator {
  generateReport(): EvidencePackage {
    return {
      format: 'PDF',
      contents: [
        'MOM法規引用',
        '薪資計算明細',
        '班表記錄截圖',
        '差額對比表',
        '相關法條解釋'
      ],
      metadata: {
        generatedAt: Date;
        employeeInfo: EmployeeData;
        period: string;
        signature: string;  // 數字簽名
      }
    };
  }
}
```

### 3.4 店規模板市場（Template Marketplace）⭐NEW
社群共享各公司/門店的薪資規則：

```typescript
interface TemplateMarketplace {
  templates: Array<{
    company: string;
    outlet: string;
    version: string;
    verifiedBy: number;  // 驗證人數
    accuracy: number;     // 準確度評分
    rules: CompanyRules;
  }>;
  
  // 一鍵應用模板
  applyTemplate(templateId: string): void;
  
  // 貢獻模板（需審核）
  submitTemplate(rules: CompanyRules): void;
}
```

---

## 四、核心計算引擎重構

### 4.1 計算引擎架構
```typescript
class SalaryCalculationEngine {
  private momCompliance: MOMCompliance;
  private companyRules: CompanyRules;
  private validator: ComplianceValidator;
  
  calculateMonthlySalary(params: {
    employee: EmployeeInfo;
    records: TimeRecord[];
    mcDays: number;
    month: string;
  }): SalaryResult {
    // 1. 驗證Part IV覆蓋範圍
    const coverage = this.momCompliance.isUnderPartIV(
      params.employee.salary,
      params.employee.isWorkman
    );
    
    if (!coverage) {
      return this.calculateManagerSalary(params);
    }
    
    // 2. 逐日計算
    const dailyCalculations = records.map(record => {
      // 先判斷日期屬性
      const dayType = this.determineDayType(record);
      
      // 根據類型計算
      switch(dayType) {
        case 'REST_DAY':
          return this.calculateRestDayPay(record);
        case 'PUBLIC_HOLIDAY':
          return this.calculatePHPay(record);
        default:
          return this.calculateNormalDay(record);
      }
    });
    
    // 3. 計算出勤獎
    const attendanceBonus = this.calculateAttendanceBonus(
      mcDays,
      this.companyRules.attendanceBonus
    );
    
    // 4. 驗證合規性
    const compliance = this.validator.validate({
      dailyHours: records.map(r => r.hours),
      monthlyOT: totalOvertimeHours,
      consecutiveWorkDays: maxConsecutiveDays
    });
    
    // 5. 生成結果
    return {
      breakdown: {
        baseSalary: params.employee.salary,
        attendanceBonus: attendanceBonus,
        overtimePay: totalOvertime,
        deductions: deductions,
        total: finalAmount
      },
      compliance: compliance,
      warnings: warnings,
      evidence: this.generateEvidence()
    };
  }
}
```

### 4.2 可驗證性設計
每個計算結果都包含：
- **計算明細**：逐步展示計算過程
- **法規引用**：對應的MOM條款連結
- **公式說明**：使用的計算公式
- **原始數據**：班表截圖、打卡記錄

---

## 五、技術實現規格

### 5.1 技術棧
- **前端**：React + TypeScript + Tailwind CSS
- **後端**：Supabase (PostgreSQL + Auth + Storage)
- **OCR**：GPT-4 Vision API (主) + Tesseract.js (備)
- **部署**：Vercel
- **測試**：Jest + React Testing Library

### 5.2 數據庫設計
```sql
-- 核心表結構
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  position VARCHAR(50),
  base_salary DECIMAL(10,2),
  outlet_code VARCHAR(10),
  is_workman BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE time_records (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  date DATE,
  shift_type ENUM(...),
  start_time TIME,
  end_time TIME,
  rest_hours DECIMAL(3,1),
  is_employer_requested BOOLEAN,  -- 新增：用於休息日計算
  spans_midnight BOOLEAN,         -- 新增：跨日班標記
  verified BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE salary_calculations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  month VARCHAR(7),
  calculation_details JSONB,  -- 存儲完整計算明細
  compliance_check JSONB,     -- 合規檢查結果
  created_at TIMESTAMP
);

CREATE TABLE company_rules (
  id UUID PRIMARY KEY,
  company VARCHAR(100),
  outlet_code VARCHAR(10),
  rules JSONB,
  version VARCHAR(10),
  verified_count INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

### 5.3 API設計
```typescript
// 薪資計算API
POST /api/salary/calculate
Request: {
  employeeId: string;
  month: string;
  records: TimeRecord[];
}
Response: {
  calculation: SalaryBreakdown;
  compliance: ComplianceResult;
  warnings: Warning[];
}

// 權益檢查API
POST /api/rights/check
Request: {
  employeeId: string;
  period: DateRange;
}
Response: {
  violations: Violation[];
  recommendations: Action[];
}

// 差額分析API
POST /api/discrepancy/analyze
Request: {
  calculatedSalary: number;
  actualPayslip: PayslipData;
}
Response: {
  differences: Difference[];
  explanations: string[];
  evidence: EvidenceLinks[];
}
```

---

## 六、風險控制與合規保證

### 6.1 計算準確性保證
- **雙重驗證**：前後端都進行計算驗證
- **單元測試**：覆蓋所有邊界情況
- **真實數據測試**：使用實際薪單數據驗證

### 6.2 法律合規聲明
```typescript
const LegalDisclaimer = {
  calculation: "此計算結果僅供參考，實際薪資以雇主發放為準",
  discrepancy: "如發現差異超過5%，建議與HR部門核實",
  evidence: "本報告可作為與雇主溝通的參考，但不構成法律建議",
  support: "如需法律援助，請聯繫MOM或相關工會"
};
```

### 6.3 數據安全
- 端到端加密
- 遵守PDPA（個人資料保護法）
- 定期安全審計
- 用戶數據可隨時導出/刪除

---

## 七、開發時間線

### Phase 1: MVP (Week 1-3)
- Week 1: 核心計算引擎 + MOM合規層
- Week 2: OCR識別 + 基礎UI
- Week 3: 測試修正 + 用戶試用

### Phase 2: 增強功能 (Week 4-6)
- 權益雷達實現
- 差額解釋器
- 證據包生成

### Phase 3: 社群功能 (Week 7-8)
- 店規模板市場
- 用戶互助社群
- 多語言支持（中英馬泰）

---

## 八、成功指標

### 8.1 短期指標（3個月）
- 日活用戶：30人
- OCR準確率：>90%
- 薪資計算準確率：>99%
- NPS分數：>50

### 8.2 長期指標（12個月）
- 月活用戶：1000人
- 覆蓋公司：20家
- 成功維權案例：10件
- 用戶留存率：>60%

---

## 九、附錄：MOM法規參考

### 主要引用來源
1. [工時、加班與休息日](https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days)
2. [公眾假期權益與薪資](https://www.mom.gov.sg/employment-practices/public-holidays-entitlement-and-pay)
3. [就業法覆蓋範圍](https://www.mom.gov.sg/employment-practices/employment-act/who-is-covered)
4. [月薪與日薪定義計算](https://www.mom.gov.sg/employment-practices/salary/monthly-and-daily-salary)

### 關鍵計算公式

#### 時薪計算（固定公式）
```
月薪制時薪 = 月薪 ÷ 190.67
// 這個是MOM標準公式：(52週 × 44小時) ÷ 12個月
```

#### 日薪計算（根據工作制度而定）⚠️重要修正
```
// 錯誤方式 ❌
日薪 = 月薪 ÷ 26  // 這是過度簡化！

// 正確方式 ✅
日薪 = 月薪 ÷ 當月實際工作日數

例如：
- 5天工作制：當月工作日可能是20-23天
- 5.5天工作制（大小周）：當月工作日可能是22-24天  
- 6天工作制：當月工作日可能是24-26天
- 4天工作制：當月工作日可能是16-18天

具體計算示例：
- 11月有30天，週末8天，工作日22天
- 5天工作制員工：日薪 = $1770 ÷ 22 = $80.45
- 大小周員工：日薪 = $1770 ÷ 24 = $73.75
- 6天工作制：日薪 = $1770 ÷ 26 = $68.08
```

#### 扣款計算原則
```
無薪假扣款 = 月薪 ÷ 當月工作日總數 × 缺勤天數

注意事項：
1. 即使員工當月未做滿（如月中入職），仍用全月薪資計算日薪
2. 不同月份的工作日數不同，需要動態計算
3. 公眾假期不計入工作日總數
```

#### 加班與假期計算
```
休息日報酬 = 基礎報酬 + 超時加班費（分開計算）
公眾假期報酬 = 額外一天基本薪 + 超時部分1.5倍
```

---

*本PRD版本：2.0*  
*更新日期：2025年11月*  
*主要更新：MOM合規修正、雙層架構設計、創新功能模組*