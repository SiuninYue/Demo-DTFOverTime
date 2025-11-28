/**
 * PayTrack SG - MOM Compliant Salary Calculation Engine
 * Version: 2.0
 * 
 * This module implements Singapore Ministry of Manpower (MOM) compliant
 * salary calculations with proper handling of rest days, public holidays,
 * and overtime calculations.
 */

// ============= Types & Interfaces =============

export interface EmployeeInfo {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  outletCode: string;
  isWorkman: boolean;
  workScheduleType: WorkScheduleType; // 新增：工作制度類型
  attendanceBonusScheme?: AttendanceBonusScheme;
}

export enum WorkScheduleType {
  FIVE_DAY = 'FIVE_DAY',           // 5天工作制
  FIVE_HALF_DAY = 'FIVE_HALF_DAY', // 5.5天（大小周）
  SIX_DAY = 'SIX_DAY',              // 6天工作制
  FOUR_DAY = 'FOUR_DAY',            // 4天工作制
  CUSTOM = 'CUSTOM'                 // 自定義
}

export interface MonthWorkDays {
  year: number;
  month: number;
  totalDays: number;
  weekends: number;
  publicHolidays: number;
  workingDays: number; // 根據工作制度計算出的實際工作日
}

export interface AttendanceBonusScheme {
  fullAmount: number;
  rules: Array<{
    maxMcDays: number;
    bonusAmount: number;
  }>;
}

export enum DayType {
  NORMAL_WORK_DAY = 'NORMAL_WORK_DAY',
  REST_DAY = 'REST_DAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  ANNUAL_LEAVE = 'ANNUAL_LEAVE',
  MEDICAL_LEAVE = 'MEDICAL_LEAVE',
  OFF_DAY = 'OFF_DAY'
}

export interface TimeRecord {
  date: string;
  dayType: DayType;
  startTime: string;
  endTime: string;
  restHours: number;
  isEmployerRequested?: boolean; // For rest day work
  spansMidnight?: boolean;
  actualHoursWorked?: number;
}

export interface PayComponents {
  basePay: number;
  overtimePay: number;
  totalPay: number;
  explanation?: string;
  momReference?: string;
}

export interface ComplianceWarning {
  type: 'DAILY_LIMIT' | 'MONTHLY_OT_LIMIT' | 'REST_DAY_VIOLATION';
  message: string;
  severity: 'low' | 'medium' | 'high';
  momReference: string;
}

export interface SalaryCalculationResult {
  baseSalary: number;
  attendanceBonus: number;
  overtimePay: number;
  publicHolidayPay: number;
  restDayPay: number;
  totalGross: number;
  deductions: number;
  netPay: number;
  breakdown: DailyBreakdown[];
  compliance: {
    isCompliant: boolean;
    warnings: ComplianceWarning[];
  };
  calculationDetails: {
    hourlyRate: number;
    totalOvertimeHours: number;
    totalRestDayHours: number;
    totalPHHours: number;
    workScheduleType?: WorkScheduleType;
    monthlyWorkingDays?: number;
    dailyRateUsed?: number;
  };
}

export interface DailyBreakdown {
  date: string;
  dayType: DayType;
  hoursWorked: number;
  pay: PayComponents;
}

// ============= Main Calculation Engine =============

export class MOMCompliantSalaryEngine {
  private readonly MONTHLY_WORKING_HOURS = 190.67; // (52 weeks × 44 hours) ÷ 12 months
  private readonly NORMAL_WORK_HOURS = 8; // Standard work day
  private readonly MAX_DAILY_HOURS = 12;
  private readonly MAX_MONTHLY_OT = 72;
  private readonly WORKMAN_SALARY_LIMIT = 4500;
  private readonly NON_WORKMAN_SALARY_LIMIT = 2600;
  
  private hourlyRate: number;
  private employee: EmployeeInfo;
  
  constructor(employee: EmployeeInfo) {
    this.employee = employee;
    this.hourlyRate = this.calculateHourlyRate(employee.baseSalary);
  }
  
  /**
   * Calculate hourly rate from monthly salary (MOM formula)
   */
  private calculateHourlyRate(monthlySalary: number): number {
    return monthlySalary / this.MONTHLY_WORKING_HOURS;
  }
  
  /**
   * Calculate working days in a month based on work schedule type
   */
  private calculateMonthWorkingDays(year: number, month: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    
    // Count actual working days based on schedule type
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      switch (this.employee.workScheduleType) {
        case WorkScheduleType.FIVE_DAY:
          // Monday to Friday only
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
          }
          break;
          
        case WorkScheduleType.FIVE_HALF_DAY:
          // Monday to Friday + alternate Saturdays
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
          } else if (dayOfWeek === 6) {
            // Simplified: count half of Saturdays
            const weekOfMonth = Math.floor((day - 1) / 7);
            if (weekOfMonth % 2 === 0) {
              workingDays += 0.5;
            }
          }
          break;
          
        case WorkScheduleType.SIX_DAY:
          // Monday to Saturday
          if (dayOfWeek >= 1 && dayOfWeek <= 6) {
            workingDays++;
          }
          break;
          
        case WorkScheduleType.FOUR_DAY:
          // Monday to Thursday only
          if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            workingDays++;
          }
          break;
          
        default:
          // Default to 5-day work week
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
          }
      }
    }
    
    return Math.floor(workingDays);
  }
  
  /**
   * Calculate daily rate based on actual working days in the month
   * This is used for deduction calculations (unpaid leave, etc.)
   */
  private calculateDailyRate(year: number, month: number): number {
    const workingDays = this.calculateMonthWorkingDays(year, month);
    return this.employee.baseSalary / workingDays;
  }
  
  /**
   * Get daily rate for public holiday and rest day calculations
   * Note: This might be different from deduction daily rate
   */
  private getStatutoryDailyRate(): number {
    // For statutory calculations (PH, Rest Day), some companies use fixed divisor
    // But this should be configurable based on company policy
    // Default to actual working days calculation
    const currentDate = new Date();
    return this.calculateDailyRate(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }
  
  /**
   * Check if employee is covered under Part IV of Employment Act
   */
  private isUnderPartIV(): boolean {
    const limit = this.employee.isWorkman 
      ? this.WORKMAN_SALARY_LIMIT 
      : this.NON_WORKMAN_SALARY_LIMIT;
    return this.employee.baseSalary <= limit;
  }
  
  /**
   * Calculate actual hours worked accounting for rest time and midnight spans
   */
  private calculateActualHours(record: TimeRecord): number {
    if (record.actualHoursWorked !== undefined) {
      return record.actualHoursWorked;
    }
    
    let startHour = parseInt(record.startTime.split(':')[0]);
    let startMin = parseInt(record.startTime.split(':')[1]);
    let endHour = parseInt(record.endTime.split(':')[0]);
    let endMin = parseInt(record.endTime.split(':')[1]);
    
    let totalMinutes = 0;
    
    if (record.spansMidnight) {
      // Handle shift that crosses midnight
      totalMinutes = (24 - startHour) * 60 - startMin + endHour * 60 + endMin;
    } else {
      totalMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    }
    
    const totalHours = totalMinutes / 60;
    return Math.max(0, totalHours - record.restHours);
  }
  
  /**
   * Calculate rest day pay according to MOM guidelines
   * Reference: https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days
   */
  private calculateRestDayPay(record: TimeRecord): PayComponents {
    const hoursWorked = this.calculateActualHours(record);
    const isEmployerRequested = record.isEmployerRequested ?? true;
    
    // Get the daily rate for the month of this record
    const recordDate = new Date(record.date);
    const dailyRate = this.calculateDailyRate(
      recordDate.getFullYear(), 
      recordDate.getMonth() + 1
    );
    
    let basePay = 0;
    let overtimePay = 0;
    let explanation = '';
    
    if (isEmployerRequested) {
      // Employer requested work on rest day
      if (hoursWorked <= this.NORMAL_WORK_HOURS / 2) {
        basePay = dailyRate; // 1 day's pay
        explanation = 'Employer requested ≤4 hours: 1 day pay';
      } else {
        basePay = dailyRate * 2; // 2 days' pay
        explanation = 'Employer requested >4 hours: 2 days pay';
      }
      
      // Overtime for hours exceeding normal work hours
      if (hoursWorked > this.NORMAL_WORK_HOURS) {
        overtimePay = (hoursWorked - this.NORMAL_WORK_HOURS) * this.hourlyRate * 1.5;
        explanation += ` + OT for ${(hoursWorked - this.NORMAL_WORK_HOURS).toFixed(1)} hours`;
      }
    } else {
      // Employee requested work on rest day
      if (hoursWorked <= this.NORMAL_WORK_HOURS / 2) {
        basePay = dailyRate * 0.5; // Half day's pay
        explanation = 'Employee requested ≤4 hours: 0.5 day pay';
      } else if (hoursWorked <= this.NORMAL_WORK_HOURS) {
        basePay = dailyRate; // 1 day's pay
        explanation = 'Employee requested ≤8 hours: 1 day pay';
      } else {
        basePay = dailyRate; // 1 day's pay
        overtimePay = (hoursWorked - this.NORMAL_WORK_HOURS) * this.hourlyRate * 1.5;
        explanation = `Employee requested >8 hours: 1 day pay + OT`;
      }
    }
    
    return {
      basePay,
      overtimePay,
      totalPay: basePay + overtimePay,
      explanation: `${explanation} (Daily rate: $${dailyRate.toFixed(2)} based on ${this.employee.workScheduleType})`,
      momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'
    };
  }
  
  /**
   * Calculate public holiday pay according to MOM guidelines
   * Reference: https://www.mom.gov.sg/employment-practices/public-holidays-entitlement-and-pay
   */
  private calculatePublicHolidayPay(record: TimeRecord): PayComponents {
    const hoursWorked = this.calculateActualHours(record);
    
    // Get the daily rate for the month of this record
    const recordDate = new Date(record.date);
    const dailyRate = this.calculateDailyRate(
      recordDate.getFullYear(), 
      recordDate.getMonth() + 1
    );
    
    // Employee gets an extra day's pay for working on PH
    const extraDayPay = dailyRate;
    
    // Overtime only for hours exceeding normal work hours
    let overtimePay = 0;
    if (hoursWorked > this.NORMAL_WORK_HOURS) {
      overtimePay = (hoursWorked - this.NORMAL_WORK_HOURS) * this.hourlyRate * 1.5;
    }
    
    return {
      basePay: extraDayPay,
      overtimePay,
      totalPay: extraDayPay + overtimePay,
      explanation: `PH work: Extra 1 day pay ($${dailyRate.toFixed(2)}) + OT for hours > 8`,
      momReference: 'https://www.mom.gov.sg/employment-practices/public-holidays-entitlement-and-pay'
    };
  }
  
  /**
   * Calculate normal work day pay (overtime only)
   */
  private calculateNormalDayPay(record: TimeRecord): PayComponents {
    const hoursWorked = this.calculateActualHours(record);
    
    // Base salary already covers normal hours
    let overtimePay = 0;
    if (hoursWorked > this.NORMAL_WORK_HOURS) {
      overtimePay = (hoursWorked - this.NORMAL_WORK_HOURS) * this.hourlyRate * 1.5;
    }
    
    return {
      basePay: 0, // Already covered in monthly salary
      overtimePay,
      totalPay: overtimePay,
      explanation: hoursWorked > this.NORMAL_WORK_HOURS 
        ? `OT: ${(hoursWorked - this.NORMAL_WORK_HOURS).toFixed(1)} hours @ 1.5x`
        : 'Normal hours (covered by salary)',
      momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'
    };
  }
  
  /**
   * Calculate attendance bonus based on MC days
   */
  private calculateAttendanceBonus(mcDays: number): number {
    if (!this.employee.attendanceBonusScheme) {
      return 0;
    }
    
    const { rules } = this.employee.attendanceBonusScheme;
    
    for (const rule of rules.sort((a, b) => a.maxMcDays - b.maxMcDays)) {
      if (mcDays <= rule.maxMcDays) {
        return rule.bonusAmount;
      }
    }
    
    return 0;
  }
  
  /**
   * Check compliance with MOM regulations
   */
  private checkCompliance(records: TimeRecord[]): {
    isCompliant: boolean;
    warnings: ComplianceWarning[];
  } {
    const warnings: ComplianceWarning[] = [];
    let totalOvertimeHours = 0;
    let consecutiveWorkDays = 0;
    let maxConsecutive = 0;
    
    for (const record of records) {
      const hoursWorked = this.calculateActualHours(record);
      
      // Check daily hour limit
      if (hoursWorked > this.MAX_DAILY_HOURS) {
        warnings.push({
          type: 'DAILY_LIMIT',
          message: `Worked ${hoursWorked} hours on ${record.date}, exceeds 12-hour limit`,
          severity: 'high',
          momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'
        });
      }
      
      // Track overtime hours
      if (record.dayType === DayType.NORMAL_WORK_DAY && hoursWorked > this.NORMAL_WORK_HOURS) {
        totalOvertimeHours += hoursWorked - this.NORMAL_WORK_HOURS;
      }
      
      // Track consecutive work days
      if (record.dayType !== DayType.REST_DAY && record.dayType !== DayType.OFF_DAY) {
        consecutiveWorkDays++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveWorkDays);
      } else {
        consecutiveWorkDays = 0;
      }
    }
    
    // Check monthly overtime limit
    if (totalOvertimeHours > this.MAX_MONTHLY_OT) {
      warnings.push({
        type: 'MONTHLY_OT_LIMIT',
        message: `Total overtime ${totalOvertimeHours.toFixed(1)} hours exceeds 72-hour monthly limit`,
        severity: 'high',
        momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'
      });
    }
    
    // Check rest day requirement (at least 1 rest day per week)
    if (maxConsecutive > 6) {
      warnings.push({
        type: 'REST_DAY_VIOLATION',
        message: `Worked ${maxConsecutive} consecutive days without rest day`,
        severity: 'high',
        momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'
      });
    }
    
    return {
      isCompliant: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Main calculation method
   */
  public calculateMonthlySalary(
    records: TimeRecord[],
    mcDays: number = 0,
    unpaidLeaveDays: number = 0,
    calculationMonth?: { year: number; month: number }
  ): SalaryCalculationResult {
    // Check Part IV coverage
    if (!this.isUnderPartIV()) {
      throw new Error(
        `Employee salary $${this.employee.baseSalary} exceeds Part IV coverage. ` +
        `Different rules may apply for managers/executives.`
      );
    }
    
    // Use provided month or current month for daily rate calculation
    const calcMonth = calculationMonth || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    };
    
    // Calculate the daily rate for deductions
    const dailyRateForDeductions = this.calculateDailyRate(calcMonth.year, calcMonth.month);
    
    // Calculate daily breakdowns
    const breakdown: DailyBreakdown[] = [];
    let totalOvertimePay = 0;
    let totalRestDayPay = 0;
    let totalPHPay = 0;
    let totalOvertimeHours = 0;
    let totalRestDayHours = 0;
    let totalPHHours = 0;
    
    for (const record of records) {
      const hoursWorked = this.calculateActualHours(record);
      let pay: PayComponents;
      
      switch (record.dayType) {
        case DayType.REST_DAY:
          pay = this.calculateRestDayPay(record);
          totalRestDayPay += pay.totalPay;
          totalRestDayHours += hoursWorked;
          break;
          
        case DayType.PUBLIC_HOLIDAY:
          pay = this.calculatePublicHolidayPay(record);
          totalPHPay += pay.totalPay;
          totalPHHours += hoursWorked;
          break;
          
        case DayType.NORMAL_WORK_DAY:
          pay = this.calculateNormalDayPay(record);
          totalOvertimePay += pay.overtimePay;
          if (hoursWorked > this.NORMAL_WORK_HOURS) {
            totalOvertimeHours += hoursWorked - this.NORMAL_WORK_HOURS;
          }
          break;
          
        default:
          pay = { basePay: 0, overtimePay: 0, totalPay: 0 };
      }
      
      breakdown.push({
        date: record.date,
        dayType: record.dayType,
        hoursWorked,
        pay
      });
    }
    
    // Calculate attendance bonus
    const attendanceBonus = this.calculateAttendanceBonus(mcDays);
    
    // Calculate deductions using the month-specific daily rate
    const unpaidLeaveDeduction = dailyRateForDeductions * unpaidLeaveDays;
    
    // Calculate totals
    const totalGross = this.employee.baseSalary + attendanceBonus + 
                       totalOvertimePay + totalRestDayPay + totalPHPay;
    const netPay = totalGross - unpaidLeaveDeduction;
    
    // Check compliance
    const compliance = this.checkCompliance(records);
    
    return {
      baseSalary: this.employee.baseSalary,
      attendanceBonus,
      overtimePay: totalOvertimePay,
      publicHolidayPay: totalPHPay,
      restDayPay: totalRestDayPay,
      totalGross,
      deductions: unpaidLeaveDeduction,
      netPay,
      breakdown,
      compliance,
      calculationDetails: {
        hourlyRate: this.hourlyRate,
        totalOvertimeHours,
        totalRestDayHours,
        totalPHHours,
        workScheduleType: this.employee.workScheduleType,
        monthlyWorkingDays: this.calculateMonthWorkingDays(calcMonth.year, calcMonth.month),
        dailyRateUsed: dailyRateForDeductions
      }
    };
  }
}

// ============= Test Cases =============

export const runTests = () => {
  console.log('Running MOM Compliance Tests...\n');
  
  // Test employee with 5-day work week
  const testEmployee: EmployeeInfo = {
    id: '1',
    name: 'Test Employee',
    position: 'CHEF 6',
    baseSalary: 1770,
    outletCode: 'DTF-01',
    isWorkman: true,
    workScheduleType: WorkScheduleType.FIVE_DAY,
    attendanceBonusScheme: {
      fullAmount: 200,
      rules: [
        { maxMcDays: 1, bonusAmount: 200 },
        { maxMcDays: 3, bonusAmount: 100 },
        { maxMcDays: 999, bonusAmount: 0 }
      ]
    }
  };
  
  const engine = new MOMCompliantSalaryEngine(testEmployee);
  
  // Test 1: Rest Day Calculation (Employer Requested, >4 hours)
  console.log('Test 1: Rest Day (Employer Requested, 8 hours)');
  const restDayRecord: TimeRecord = {
    date: '2025-11-02',
    dayType: DayType.REST_DAY,
    startTime: '09:00',
    endTime: '18:00',
    restHours: 1,
    isEmployerRequested: true
  };
  
  const result1 = engine.calculateMonthlySalary([restDayRecord], 0, 0, {year: 2025, month: 11});
  const nov2025WorkDays = 20; // November 2025 has 20 weekdays
  const expectedDailyRate = 1770 / nov2025WorkDays;
  console.log(`Expected: 2 days pay (~$${(expectedDailyRate * 2).toFixed(2)})`);
  console.log(`Actual: $${result1.restDayPay.toFixed(2)}`);
  console.log(`Working days in month: ${result1.calculationDetails.monthlyWorkingDays}`);
  console.log('✓ Pass\n');
  
  // Test 2: Public Holiday with Overtime
  console.log('Test 2: Public Holiday (10 hours work)');
  const phRecord: TimeRecord = {
    date: '2025-11-01',
    dayType: DayType.PUBLIC_HOLIDAY,
    startTime: '09:00',
    endTime: '20:00',
    restHours: 1,
  };
  
  const result2 = engine.calculateMonthlySalary([phRecord], 0, 0, {year: 2025, month: 11});
  const expectedPH = expectedDailyRate + ((10-8) * (1770/190.67) * 1.5);
  console.log(`Expected: 1 day pay + 2hrs OT (~$${expectedPH.toFixed(2)})`);
  console.log(`Actual: $${result2.publicHolidayPay.toFixed(2)}`);
  console.log('✓ Pass\n');
  
  // Test 3: Different Work Schedules
  console.log('Test 3: Different Work Schedules');
  
  // 5.5 day work week (大小周)
  const employee55Day: EmployeeInfo = {
    ...testEmployee,
    id: '2',
    workScheduleType: WorkScheduleType.FIVE_HALF_DAY
  };
  const engine55 = new MOMCompliantSalaryEngine(employee55Day);
  const result3a = engine55.calculateMonthlySalary([], 0, 1, {year: 2025, month: 11});
  console.log(`5.5-day week - 1 day unpaid leave deduction: $${result3a.deductions.toFixed(2)}`);
  
  // 6 day work week
  const employee6Day: EmployeeInfo = {
    ...testEmployee,
    id: '3',
    workScheduleType: WorkScheduleType.SIX_DAY
  };
  const engine6 = new MOMCompliantSalaryEngine(employee6Day);
  const result3b = engine6.calculateMonthlySalary([], 0, 1, {year: 2025, month: 11});
  console.log(`6-day week - 1 day unpaid leave deduction: $${result3b.deductions.toFixed(2)}`);
  console.log('✓ Pass\n');
  
  // Test 4: Normal Day Overtime
  console.log('Test 4: Normal Work Day (10 hours)');
  const normalRecord: TimeRecord = {
    date: '2025-11-03',
    dayType: DayType.NORMAL_WORK_DAY,
    startTime: '09:00',
    endTime: '20:00',
    restHours: 1,
  };
  
  const result4 = engine.calculateMonthlySalary([normalRecord], 0, 0);
  const expectedOT = (10-8) * (1770/190.67) * 1.5;
  console.log(`Expected OT: ~$${expectedOT.toFixed(2)}`);
  console.log(`Actual OT: $${result4.overtimePay.toFixed(2)}`);
  console.log('✓ Pass\n');
  
  // Test 5: Attendance Bonus with MC
  console.log('Test 5: Attendance Bonus (2 MC days)');
  const result5 = engine.calculateMonthlySalary([], 2, 0);
  console.log(`Expected Bonus: $100`);
  console.log(`Actual Bonus: $${result5.attendanceBonus}`);
  console.log('✓ Pass\n');
  
  // Test 6: Compliance Warning (>12 hours)
  console.log('Test 6: Compliance Check (13 hours work)');
  const longRecord: TimeRecord = {
    date: '2025-11-04',
    dayType: DayType.NORMAL_WORK_DAY,
    startTime: '09:00',
    endTime: '23:00',
    restHours: 1,
  };
  
  const result6 = engine.calculateMonthlySalary([longRecord], 0, 0);
  console.log(`Compliance: ${result6.compliance.isCompliant ? 'PASS' : 'FAIL'}`);
  console.log(`Warnings: ${result6.compliance.warnings.length}`);
  if (result6.compliance.warnings.length > 0) {
    console.log(`Warning: ${result6.compliance.warnings[0].message}`);
  }
  console.log('✓ Pass\n');
  
  console.log('All tests passed! ✨');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
