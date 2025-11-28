# 日薪計算詳解：為什麼不能簡單地除以26

## ⚠️ 常見錯誤

許多薪資計算系統會犯一個嚴重錯誤：使用固定的除數來計算日薪。

```javascript
// ❌ 錯誤的簡化方式
const dailyRate = monthlySalary / 26;
```

這個錯誤會導致：
- **5天工作制員工**被多扣錢（實際工作日少於26天）
- **計算不精確**，每個月的工作日數都不同
- **法律風險**，可能違反MOM的計算規定

## ✅ 正確的計算方法

### 1. 時薪計算（固定公式）
```javascript
// MOM標準公式，所有月薪制員工通用
const hourlyRate = monthlySalary / 190.67;
// 190.67 = (52週 × 44小時) ÷ 12個月
```

### 2. 日薪計算（根據工作制度）
```javascript
// 必須根據實際工作制度計算
const dailyRate = monthlySalary / monthlyWorkingDays;
```

## 📊 不同工作制度對比

### 2025年11月為例（30天）

| 工作制度 | 週一至週五 | 週六 | 週日 | 工作日數 | 日薪計算 |
|---------|----------|------|------|---------|---------|
| **5天制** | ✅工作 | ❌休息 | ❌休息 | 20天 | $1770÷20 = **$88.50** |
| **5.5天制(大小周)** | ✅工作 | 🔄交替 | ❌休息 | 22天 | $1770÷22 = **$80.45** |
| **6天制** | ✅工作 | ✅工作 | ❌休息 | 25天 | $1770÷25 = **$70.80** |
| **4天制** | ✅部分 | ❌休息 | ❌休息 | 16天 | $1770÷16 = **$110.63** |

### 差異分析
如果錯誤地使用 ÷26 計算（$68.08）：
- **5天制員工**：每天少扣 $20.42（29.9%誤差）
- **4天制員工**：每天多扣 $42.55（38.5%誤差）

## 🗓️ 月份差異

即使是同一工作制度，不同月份的工作日也不同：

### 2025年5天工作制
| 月份 | 總天數 | 週末 | 公眾假期 | 實際工作日 | 日薪 |
|-----|-------|-----|---------|-----------|-----|
| 1月 | 31 | 8 | 2 | 21 | $84.29 |
| 2月 | 28 | 8 | 0 | 20 | $88.50 |
| 3月 | 31 | 10 | 0 | 21 | $84.29 |
| 4月 | 30 | 8 | 1 | 21 | $84.29 |
| 5月 | 31 | 9 | 1 | 21 | $84.29 |
| 11月 | 30 | 10 | 0 | 20 | $88.50 |

## 💼 實際應用場景

### 場景1：計算無薪假扣款
```javascript
// 員工：5天工作制，11月請了2天無薪假
const workingDaysInNov = 20;
const dailyRate = 1770 / workingDaysInNov; // $88.50
const deduction = dailyRate * 2; // $177.00

// 如果錯誤使用÷26
const wrongDailyRate = 1770 / 26; // $68.08
const wrongDeduction = wrongDailyRate * 2; // $136.16
// 少扣了 $40.84！
```

### 場景2：大小周員工
```javascript
// 大小周：單週5天，雙週6天
function calculate55DayWorkWeek(year, month) {
  let workingDays = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const weekOfMonth = Math.floor((day - 1) / 7);
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++; // 週一到週五
    } else if (dayOfWeek === 6 && weekOfMonth % 2 === 0) {
      workingDays++; // 雙週的週六
    }
  }
  return workingDays;
}
```

### 場景3：公眾假期處理
```javascript
function calculateWorkingDays(year, month, workSchedule, publicHolidays) {
  const baseWorkingDays = getBaseWorkingDays(year, month, workSchedule);
  const phInWorkDays = publicHolidays.filter(date => {
    const ph = new Date(date);
    return ph.getMonth() + 1 === month && 
           isWorkingDay(ph, workSchedule);
  }).length;
  
  return baseWorkingDays - phInWorkDays;
}
```

## 🏢 公司政策配置

### 靈活配置系統
```typescript
interface CompanyPolicy {
  salaryCalculation: {
    // 有些公司可能有固定政策
    dailyRateMethod: 'ACTUAL_WORKING_DAYS' | 'FIXED_26' | 'CUSTOM';
    customDivisor?: number;
    
    // 特殊情況處理
    publicHolidayHandling: 'EXCLUDE' | 'INCLUDE';
    probationPeriodMethod?: 'PRORATED' | 'FULL';
  };
  
  workSchedules: {
    [positionType: string]: WorkScheduleType;
  };
}

// 範例：不同職位不同工作制
const dtfPolicy: CompanyPolicy = {
  salaryCalculation: {
    dailyRateMethod: 'ACTUAL_WORKING_DAYS',
    publicHolidayHandling: 'EXCLUDE'
  },
  workSchedules: {
    'CHEF': WorkScheduleType.SIX_DAY,      // 廚師6天
    'MANAGER': WorkScheduleType.FIVE_DAY,   // 經理5天
    'PART_TIME': WorkScheduleType.CUSTOM    // 兼職自定義
  }
};
```

## 📋 實施建議

### 1. **用戶介面設計**
```
┌────────────────────────────────┐
│ 工作制度：[5天制 ▼]            │
│ 本月工作日：20天               │
│ 日薪率：$88.50                 │
│ ℹ️ 查看計算明細                │
└────────────────────────────────┘
```

### 2. **透明度原則**
始終向用戶顯示：
- 使用的工作制度
- 當月工作日數
- 計算公式
- MOM參考連結

### 3. **驗證檢查**
```javascript
function validateDailyRate(salary, workingDays, calculatedRate) {
  const expectedRate = salary / workingDays;
  const difference = Math.abs(expectedRate - calculatedRate);
  
  if (difference > 0.01) {
    console.warn(`日薪計算可能有誤差: 
      預期: $${expectedRate.toFixed(2)}
      實際: $${calculatedRate.toFixed(2)}`);
  }
  
  return difference < 0.01;
}
```

## ⚖️ 法律依據

根據新加坡MOM規定：
> "For incomplete month's work, salary is calculated as: 
> Monthly gross rate of pay ÷ Total number of working days in that month × 
> Total number of days the employee actually worked in that month"

來源：[MOM - Incomplete month's salary](https://www.mom.gov.sg/employment-practices/salary)

## 🎯 關鍵要點

1. **永遠不要**使用固定除數計算日薪
2. **必須**根據實際工作制度計算
3. **應該**考慮每月天數差異
4. **需要**排除公眾假期
5. **建議**讓計算過程透明可驗證

## 🚨 常見問題

### Q: 為什麼MOM用190.67計算時薪，卻不提供日薪標準？
A: 因為時薪基於年度標準工時（44小時/週），但日薪取決於公司的工作制度，沒有統一標準。

### Q: 如果員工月中轉換工作制度怎麼辦？
A: 按比例計算：
```javascript
const days5Day = 10;
const days6Day = 15;
const rate5Day = salary / 22; // 假設該月5天制22個工作日
const rate6Day = salary / 26; // 假設該月6天制26個工作日
const totalSalary = (rate5Day * days5Day) + (rate6Day * days6Day);
```

### Q: 公司堅持用÷26怎麼辦？
A: 
1. 確認這是否寫在僱傭合約中
2. 計算實際差額
3. 向HR提出合理訴求
4. 必要時聯繫MOM或工會

---

**記住：準確的日薪計算不僅是技術問題，更是保護員工權益的關鍵。**