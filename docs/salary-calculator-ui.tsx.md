import React, { useState, useMemo } from 'react';
import { 
  
  WorkScheduleType, 
  MOMCompliantSalaryEngine,
  EmployeeInfo 
} from './salary-calculation-engine';

/**
 * 薪資計算器UI組件
 * 清楚展示不同工作制度對日薪計算的影響
 */
export const SalaryCalculator: React.FC = () => {
  const [baseSalary, setBaseSalary] = useState(1770);
  const [workSchedule, setWorkSchedule] = useState(WorkScheduleType.FIVE_DAY);
  const [selectedMonth, setSelectedMonth] = useState({ year: 2025, month: 11 });
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  // 計算當月工作日數
  const workingDays = useMemo(() => {
    const employee: EmployeeInfo = {
      id: 'calc',
      name: 'Calculator',
      position: 'STAFF',
      baseSalary,
      workScheduleType: workSchedule,
      outletCode: 'CALC',
      isWorkman: true
    };
    
    const engine = new MOMCompliantSalaryEngine(employee);
    // 這裡需要訪問私有方法，實際實現時應該暴露為公共方法
    return engine['calculateMonthWorkingDays'](selectedMonth.year, selectedMonth.month);
  }, [workSchedule, selectedMonth, baseSalary]);
  
  // 計算日薪
  const dailyRate = useMemo(() => {
    return baseSalary / workingDays;
  }, [baseSalary, workingDays]);
  
  // 計算扣款
  const deduction = unpaidLeaveDays * dailyRate;
  
  // 錯誤計算對比（使用÷26）
  const wrongDailyRate = baseSalary / 26;
  const wrongDeduction = unpaidLeaveDays * wrongDailyRate;
  const difference = Math.abs(deduction - wrongDeduction);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">薪資計算器 - 日薪詳解</h2>
      
      {/* 基本輸入 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            月薪 (SGD)
          </label>
          <input
            type="number"
            value={baseSalary}
            onChange={(e) => setBaseSalary(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            工作制度
          </label>
          <select
            value={workSchedule}
            onChange={(e) => setWorkSchedule(e.target.value as WorkScheduleType)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value={WorkScheduleType.FIVE_DAY}>5天工作制</option>
            <option value={WorkScheduleType.FIVE_HALF_DAY}>5.5天（大小周）</option>
            <option value={WorkScheduleType.SIX_DAY}>6天工作制</option>
            <option value={WorkScheduleType.FOUR_DAY}>4天工作制</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            計算月份
          </label>
          <input
            type="month"
            value={`${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedMonth({ year: Number(year), month: Number(month) });
            }}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            無薪假天數
          </label>
          <input
            type="number"
            value={unpaidLeaveDays}
            onChange={(e) => setUnpaidLeaveDays(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      
      {/* 計算結果卡片 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="font-semibold text-lg mb-3">✅ 正確計算（基於實際工作日）</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">當月工作日數</p>
            <p className="text-2xl font-bold">{workingDays}天</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">日薪率</p>
            <p className="text-2xl font-bold">${dailyRate.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              = ${baseSalary} ÷ {workingDays}天
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">無薪假扣款</p>
            <p className="text-2xl font-bold text-red-600">
              ${deduction.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              = ${dailyRate.toFixed(2)} × {unpaidLeaveDays}天
            </p>
          </div>
        </div>
      </div>
      
      {/* 錯誤計算對比 */}
      {difference > 0.01 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">❌ 錯誤計算（固定÷26）</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">固定除數</p>
              <p className="text-2xl font-bold line-through">26天</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">錯誤日薪</p>
              <p className="text-2xl font-bold line-through">
                ${wrongDailyRate.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">錯誤扣款</p>
              <p className="text-2xl font-bold line-through text-red-600">
                ${wrongDeduction.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded">
            <p className="text-sm">
              <span className="font-semibold">差額：</span>
              <span className={`ml-2 font-bold ${deduction > wrongDeduction ? 'text-red-600' : 'text-green-600'}`}>
                {deduction > wrongDeduction ? '+' : '-'}${difference.toFixed(2)}
              </span>
              <span className="text-gray-600 ml-2">
                ({((difference / deduction) * 100).toFixed(1)}%誤差)
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {deduction > wrongDeduction 
                ? '使用固定÷26會少扣員工薪水，對員工不利' 
                : '使用固定÷26會多扣員工薪水，可能違法'}
            </p>
          </div>
        </div>
      )}
      
      {/* 詳細解釋 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left flex justify-between items-center"
      >
        <span className="font-medium">查看計算明細</span>
        <span>{showDetails ? '▲' : '▼'}</span>
      </button>
      
      {showDetails && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">計算公式解釋</h4>
          
          <div className="space-y-3">
            <div className="p-3 bg-white rounded">
              <p className="font-medium text-sm mb-2">1. MOM標準時薪（固定）</p>
              <code className="text-sm bg-gray-100 p-2 block rounded">
                時薪 = 月薪 ÷ 190.67 = ${baseSalary} ÷ 190.67 = ${(baseSalary / 190.67).toFixed(2)}
              </code>
              <p className="text-xs text-gray-600 mt-2">
                190.67 = (52週 × 44小時) ÷ 12個月，這是MOM的標準公式
              </p>
            </div>
            
            <div className="p-3 bg-white rounded">
              <p className="font-medium text-sm mb-2">2. 日薪計算（根據工作制度）</p>
              <code className="text-sm bg-gray-100 p-2 block rounded">
                日薪 = 月薪 ÷ 當月工作日數 = ${baseSalary} ÷ {workingDays} = ${dailyRate.toFixed(2)}
              </code>
              <p className="text-xs text-gray-600 mt-2">
                {workSchedule === WorkScheduleType.FIVE_DAY && '5天制：週一至週五工作'}
                {workSchedule === WorkScheduleType.FIVE_HALF_DAY && '大小周：週一至週五 + 隔週週六'}
                {workSchedule === WorkScheduleType.SIX_DAY && '6天制：週一至週六工作'}
                {workSchedule === WorkScheduleType.FOUR_DAY && '4天制：週一至週四工作'}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded">
              <p className="font-medium text-sm mb-2">3. 不同工作制度對比</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">工作制度</th>
                    <th className="text-right py-2">工作日</th>
                    <th className="text-right py-2">日薪</th>
                    <th className="text-right py-2">vs ÷26</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: WorkScheduleType.FOUR_DAY, name: '4天制', days: 16 },
                    { type: WorkScheduleType.FIVE_DAY, name: '5天制', days: 20 },
                    { type: WorkScheduleType.FIVE_HALF_DAY, name: '5.5天制', days: 22 },
                    { type: WorkScheduleType.SIX_DAY, name: '6天制', days: 25 },
                  ].map((schedule) => {
                    const rate = baseSalary / schedule.days;
                    const diff = rate - wrongDailyRate;
                    return (
                      <tr key={schedule.type} className="border-b">
                        <td className="py-2">{schedule.name}</td>
                        <td className="text-right">{schedule.days}天</td>
                        <td className="text-right">${rate.toFixed(2)}</td>
                        <td className={`text-right ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* MOM參考 */}
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm font-medium mb-1">📚 MOM官方參考</p>
            <a 
              href="https://www.mom.gov.sg/employment-practices/salary"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              查看MOM薪資計算指南 →
            </a>
          </div>
        </div>
      )}
      
      {/* 重要提示 */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h4 className="font-semibold mb-2 flex items-center">
          ⚠️ 重要提示
        </h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 此計算基於MOM標準，實際計算可能因公司政策而異</li>
          <li>• 公眾假期不計入工作日總數</li>
          <li>• 如果發現薪資計算有誤，請保留證據並聯繫HR或MOM</li>
          <li>• 計算結果僅供參考，以實際薪單為準</li>
        </ul>
      </div>
    </div>
  );
};

export default SalaryCalculator;