# Din Tai Fung 工资追踪器 - PRD v2.0 (完全重写版)

**项目代号**: DTF Salary Tracker v2  
**版本**: v2.0 PRD (基于真实排班表重新设计)  
**创建日期**: 2025-10-30  
**目标用户**: 新加坡鼎泰丰轮班制员工（初期）  
**开发方式**: AI优先 (Claude Code/Cursor + GPT-4 Vision)  
**核心差异化**: 拍照识别排班表 + 零手动输入

---

## 🎯 核心洞察（基于真实排班表）

### 真实的排班复杂性

**排班表特征**（基于用户提供的Excel表格）：
1. **时间用4位数字表示**：1000 = 10:00上班，1200 = 12:00上班
2. **兼职员工有上下班时间**：如"1200 2100"表示12:00-21:00
3. **多种休息标记**：
   - REST（绿色）= 小周休息日
   - OFF（橙色）= 大周第二个休息日
   - AL（蓝色）= 年假
   - OFF/OT（橙色特殊标记）= 休息日加班
4. **特殊状态**：
   - CO = Compensation Off（补休）
   - 支援 = 去其他分店支援
   - C = 上课培训（有工资，无OT）
   - \* = 备注标记（含义不明）
5. **没有固定班次**：不是"早晚班"，而是每天可能不同时间上班
6. **轮班错开**：每个人的休息日完全不同，无AABB规律

**关键发现**：
- ❌ 预设"大小周模式"完全无用
- ❌ "早班/晚班"分类不存在
- ✅ 必须支持"拍照识别整月排班"
- ✅ 必须支持灵活的时间输入（1000 = 10:00）

---

## 💡 产品定位（重新定义）

### 之前的定位（错误）
"帮助员工手动记录排班和打卡，自动计算工资"

### 现在的定位（正确）
**"拍照导入排班表，零输入追踪工资"**

**核心价值主张**：
1. **拍照一次**，整月排班自动导入
2. **零手动输入**，AI识别所有信息
3. **实时预估**，随时知道这个月拿多少钱
4. **独立验证**，不用100%信任公司算法

---

## 📋 V1.0 MVP 功能规格（完全重写）

### 核心用户流程（新）

```
Step 1: 拍照排班表
  用户拍摄主管发的Excel排班表
  ↓
Step 2: AI自动识别
  - 识别员工姓名（定位自己的行）
  - 提取每天的状态（1000/REST/OFF/AL等）
  - 解析时间（1000 → 10:00）
  ↓
Step 3: 用户确认/修改
  - 显示识别结果
  - 允许手动纠正错误
  - 一键导入日历
  ↓
Step 4: 每日快速打卡（可选）
  - 今天预计10:00上班（根据排班表）
  - 实际打卡：9:55上班，19:30下班
  - 自动计算加班：1.5小时
  ↓
Step 5: 实时工资预估
  - 显示本月已确定工资
  - 显示预估总工资
  - 拆解：基本工资+勤工奖+加班费
```

---

## 🎨 核心功能设计

### 功能1：拍照识别排班表 ⭐⭐⭐⭐⭐

**优先级**：P0（最高优先级，核心差异化）

**功能描述**：
用户拍摄主管发的排班表（Excel截图或WhatsApp图片），AI自动识别并导入整月排班。

**技术方案**：
```javascript
// 使用GPT-4 Vision API
async function recognizeScheduleTable(imageFile, userName) {
  const prompt = `
你是一个专门识别鼎泰丰排班表的AI助手。

任务：从这张排班表中提取员工"${userName}"的10月排班。

排班表格式：
- 第一列是员工姓名
- 后续列是日期（Wed 01, Thu 02, Fri 03...）
- 单元格内容含义：
  * 数字（如1000）= 上班时间（10:00）
  * REST（绿色）= 休息日
  * OFF（橙色）= 大周休息日
  * AL（蓝色）= 年假
  * OFF/OT = 休息日加班
  * 支援 = 去其他店支援
  * C = 上课培训
  * CO = 补休
  * 两个数字（如"1200 2100"）= 兼职的上下班时间

请返回JSON格式：
{
  "employeeName": "识别到的员工姓名",
  "month": "2025-10",
  "schedule": {
    "2025-10-01": {
      "type": "work",
      "startTime": "10:00",
      "endTime": null,
      "notes": ""
    },
    "2025-10-02": {
      "type": "rest",
      "startTime": null,
      "endTime": null,
      "notes": "REST"
    },
    "2025-10-03": {
      "type": "off",
      "startTime": null,
      "endTime": null,
      "notes": "OFF"
    },
    "2025-10-04": {
      "type": "leave",
      "startTime": null,
      "endTime": null,
      "notes": "AL"
    },
    "2025-10-05": {
      "type": "overtime_on_off_day",
      "startTime": "10:00",
      "endTime": null,
      "notes": "OFF/OT"
    },
    "2025-10-06": {
      "type": "support",
      "startTime": "10:00",
      "endTime": null,
      "notes": "支援"
    },
    "2025-10-07": {
      "type": "training",
      "startTime": "09:30",
      "endTime": "11:00",
      "notes": "C"
    }
  }
}

注意：
- 如果是兼职员工有两个时间（如"1200 2100"），提取为startTime和endTime
- 如果只有一个时间，endTime设为null（需要员工后续打卡补充）
- type必须是：work/rest/off/leave/overtime_on_off_day/support/training/co
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageFile } }
      ]
    }],
    max_tokens: 2000
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

**UI设计**：
```
┌─────────────────────────────────────────┐
│  📸 导入本月排班                        │
├─────────────────────────────────────────┤
│                                         │
│      📷                                 │
│   [拍摄排班表]                          │
│                                         │
│      或                                 │
│                                         │
│   [从相册选择]                          │
│                                         │
│  ────────────────────────────────────  │
│                                         │
│  💡 拍摄技巧：                          │
│  • 确保排班表清晰可见                  │
│  • 包含你的姓名和所有日期              │
│  • 光线充足，避免反光                  │
│                                         │
│  🎯 支持格式：                          │
│  ✓ Excel截图                           │
│  ✓ WhatsApp图片                        │
│  ✓ 手机拍照                            │
│                                         │
│  示例：[查看示例图片]                   │
└─────────────────────────────────────────┘
```

**识别结果确认界面**：
```
┌─────────────────────────────────────────┐
│  ✅ 识别完成！                          │
├─────────────────────────────────────────┤
│  📝 识别到的信息：                      │
│                                         │
│  员工姓名：KELLY TEIN ROU YI           │
│  月份：2025年10月                       │
│                                         │
│  📊 本月统计：                          │
│  • 工作日：22天                        │
│  • 休息日(REST)：4天                   │
│  • 大周休息(OFF)：2天                  │
│  • 年假(AL)：2天                       │
│  • 上课(C)：1天                        │
│                                         │
│  🔍 请检查以下关键日期：                │
│                                         │
│  10月1日 (Wed): 10:00上班 ✓            │
│  10月2日 (Thu): REST ✓                 │
│  10月3日 (Fri): 10:00上班 ✓            │
│  10月5日 (Sun): OFF/OT (休息日加班) ✓  │
│  10月10日 (Fri): AL (年假) ✓           │
│  ...                                    │
│  [展开查看全部31天]                     │
│                                         │
│  ⚠️ 发现问题？                          │
│  [手动修改]  [重新拍照]                │
│                                         │
│  [确认无误，导入日历]                   │
└─────────────────────────────────────────┘
```

**识别准确率目标**：
- 员工姓名：99%
- 日期识别：95%
- 状态识别（REST/OFF/AL）：90%
- 时间识别（1000→10:00）：85%

**容错机制**：
- 识别失败时，提供手动输入选项
- 允许逐条修正识别错误
- 保存识别历史，下次更准确

---

### 功能2：灵活的日历视图

**优先级**：P0

**设计原则**：
- ❌ 不预设"大小周"
- ✅ 完全基于识别结果
- ✅ 支持任意复杂的排班

**UI设计**：
```
┌─────────────────────────────────────────┐
│  📅 2025年10月                [导入排班]│
├─────────────────────────────────────────┤
│  Sun Mon Tue Wed Thu Fri Sat            │
│           1   2   3   4   5             │
│        🕙 🔴 🕙 🕙 🟠                  │
│        10 R  10 10 休                   │
│                    加                   │
│                    班                   │
│                                         │
│   6   7   8   9  10  11  12             │
│  🕙 🕛 🕙 🔴 🔵 🕙 🟢                 │
│  10  12  10  R   AL  10  支             │
│                         援             │
│                                         │
│  13  14  15  16  17  18  19             │
│  🕙 🕙 🔴 🕙 🕙 🕙 🔴              │
│  10  10  R   10  10  10  R              │
│                                         │
│  图例：                                 │
│  🕙 工作日  🔴 REST  🟠 OFF            │
│  🔵 年假AL  🟢 支援  📚 上课C          │
│  🔄 补休CO                              │
└─────────────────────────────────────────┘
```

**交互功能**：
- 点击日期查看详情
- 长按修改状态
- 下拉刷新（移动端）
- 左右滑动切换月份

---

### 功能3：快速打卡（基于预排班）

**优先级**：P0

**设计理念**：
- 预填充排班表的上班时间
- 用户只需填写下班时间
- 自动计算加班

**UI设计**：
```
┌─────────────────────────────────────────┐
│  📝 今日打卡 - 10月15日 (星期二)        │
├─────────────────────────────────────────┤
│  📋 排班信息：                          │
│  预计上班：10:00                        │
│  预计下班：19:00 (标准8小时+1小时休息)  │
│                                         │
│  ⏰ 实际打卡：                          │
│                                         │
│  上班时间： [10:00] ✓ (已预填)         │
│              ↑ 点击修改                │
│                                         │
│  下班时间： [19:30] 📝 请输入           │
│                                         │
│  休息时间： [1] 小时                    │
│             ( ) 0.5  (●) 1  ( ) 1.5    │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  💡 自动计算：                          │
│  总工作时长：8.5小时                    │
│  正常工时：8小时                        │
│  ✅ 加班时长：0.5小时                   │
│  💰 加班费：$6.96                       │
│      (0.5hrs × $9.28 × 1.5倍)          │
│                                         │
│  📝 备注（可选）：                      │
│  ┌──────────────────────────────────┐  │
│  │                                   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [保存打卡记录]                         │
└─────────────────────────────────────────┘
```

**特殊情况处理**：

**情况A：休息日加班 (OFF/OT)** - 修正版
```
┌─────────────────────────────────────────┐
│  📝 今日打卡 - 10月20日 (星期日)        │
├─────────────────────────────────────────┤
│  ⚠️ 今天是休息日 (OFF)                  │
│     主管要求加班                        │
│                                         │
│  上班时间： [10:00] 📝                  │
│  下班时间： [19:00] 📝                  │
│  休息时间： [1] 小时                    │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  💰 特殊计算（休息日加班）：            │
│  整天算加班：8小时 × 1.5倍             │
│  加班费：$111.36                        │
│                                         │
│  💡 提示：                              │
│  • 休息日加班整天都是1.5倍工资         │
│  • 休息日已用于加班，不会再给补休      │
│  • 这是新加坡MOM标准规定               │
│                                         │
│  [保存加班记录]                         │
└─────────────────────────────────────────┘
```

**情况B：上课培训日 (C)**
```
┌─────────────────────────────────────────┐
│  📚 今日打卡 - 10月22日 (星期二)        │
├─────────────────────────────────────────┤
│  📋 今天是培训日 (C)                    │
│                                         │
│  培训时间： [09:30 - 11:00]            │
│  培训地点： [总部培训室] (可选)         │
│                                         │
│  💡 说明：                              │
│  • 培训时间正常计入工资                │
│  • 当天不计算加班                      │
│  • 2.5小时培训 = 2.5小时正常工时       │
│                                         │
│  工资影响：                             │
│  无影响（正常工资）                     │
│                                         │
│  [确认培训记录]                         │
└─────────────────────────────────────────┘
```

**情况C：派往其他分店支援** - 新增
```
┌─────────────────────────────────────────┐
│  🏢 今日打卡 - 10月25日 (星期五)        │
├─────────────────────────────────────────┤
│  🚗 今天被派往其他分店                  │
│                                         │
│  目标分店： The Centrepoint (TCP)       │
│  地址：176 Orchard Road                │
│                                         │
│  上班时间： [10:00] 📝                  │
│  下班时间： [19:00] 📝                  │
│  休息时间： [1] 小时                    │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  💰 工资计算：                          │
│  总工作时长：8小时                      │
│  正常工时：8小时（按正常工作日计算）    │
│  加班时长：0小时                        │
│                                         │
│  💡 提示：                              │
│  • 派往其他店按正常工作日计算          │
│  • 可能有交通津贴（请向HR确认）        │
│  • 如有额外津贴，请手动备注            │
│                                         │
│  📝 备注：                              │
│  ┌──────────────────────────────────┐  │
│  │ 例如：交通津贴$10                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [保存支援记录]                         │
└─────────────────────────────────────────┘
```

**情况D：其他店员工来我们店支援**
```
这个情况不影响你的工资，仅作为日历标记：

日历上显示：
10月28日：支援 (绿色圆点)
意思：今天有其他分店的员工来帮忙

你的操作：
正常打卡，不需要特殊处理
```

---

### 功能4：工资实时预估引擎

**优先级**：P0

**计算逻辑（基于真实情况修正版）**：

```javascript
// 工资计算引擎 v2.1 (修正版)
class SalaryCalculator {
  constructor(userProfile) {
    this.baseSalary = userProfile.baseSalary;
    this.attendanceBonus = userProfile.attendanceBonus;
    this.hourlyRate = this.baseSalary / 190.67;
  }
  
  // 计算单日工资
  calculateDailySalary(record) {
    const { type, startTime, endTime, restHours, targetOutlet } = record;
    
    switch(type) {
      case 'work':
        // 正常工作日
        return this.calculateWorkDaySalary(startTime, endTime, restHours);
        
      case 'rest':
      case 'off':
        // REST/OFF休息日，无工资无加班
        return { base: 0, overtime: 0 };
        
      case 'overtime_on_off_day':
        // OFF/OT：休息日加班，整天1.5倍，无补休
        const hours = this.calculateHours(startTime, endTime, restHours);
        return {
          base: 0,
          overtime: this.hourlyRate * 1.5 * hours,
          note: '休息日加班1.5倍工资，无补休'
        };
        
      case 'leave':
        // AL年假，正常工资，无影响
        return { base: 0, overtime: 0 };
        
      case 'public_holiday':
        // PH公共假期，如果上班则2倍工资
        if (startTime && endTime) {
          const hours = this.calculateHours(startTime, endTime, restHours);
          return {
            base: 0,
            overtime: this.hourlyRate * 2.0 * hours,
            note: '公共假期加班2倍工资'
          };
        }
        return { base: 0, overtime: 0 };
        
      case 'training':
        // C培训，正常工资，不算加班
        return { base: 0, overtime: 0 };
        
      case 'support_outgoing':
        // 派往其他店支援，按正常工作日计算
        // TODO: 确认是否有额外交通津贴
        return this.calculateWorkDaySalary(startTime, endTime, restHours);
        
      case 'support_incoming':
        // 其他店员工来支援，不影响自己工资
        return { base: 0, overtime: 0 };
        
      default:
        return { base: 0, overtime: 0, warning: '未知类型' };
    }
  }
  
  // 正常工作日计算
  calculateWorkDaySalary(startTime, endTime, restHours) {
    if (!startTime || !endTime) {
      return { base: 0, overtime: 0, warning: '未打卡' };
    }
    
    const totalHours = this.calculateHours(startTime, endTime, restHours);
    const normalHours = 8;
    const overtimeHours = Math.max(0, totalHours - normalHours);
    
    return {
      base: 0, // 月薪已包含
      overtime: overtimeHours * this.hourlyRate * 1.5
    };
  }
  
  // 辅助函数：计算工作小时数
  calculateHours(startTime, endTime, restHours) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    const totalMinutes = endMinutes - startMinutes;
    const totalHours = totalMinutes / 60;
    
    return totalHours - (restHours || 1);
  }
}
```

**优先级**：P0

**计算逻辑（基于真实情况）**：

```javascript
// 工资计算引擎 v2.0
class SalaryCalculator {
  constructor(userProfile) {
    this.baseSalary = userProfile.baseSalary; // 如 1770
    this.attendanceBonus = userProfile.attendanceBonus; // 如 200
    this.hourlyRate = this.baseSalary / 190.67; // MOM标准
  }
  
  // 计算单日工资
  calculateDailySalary(record) {
    const { type, startTime, endTime, restHours } = record;
    
    switch(type) {
      case 'work':
        // 正常工作日
        return this.calculateWorkDaySalary(startTime, endTime, restHours);
        
      case 'rest':
        // REST休息日，无工资无加班
        return { base: 0, overtime: 0 };
        
      case 'off':
        // OFF大周休息日，同REST
        return { base: 0, overtime: 0 };
        
      case 'overtime_on_off_day':
        // OFF/OT：休息日加班，整天1.5倍
        const hours = this.calculateHours(startTime, endTime, restHours);
        return {
          base: 0,
          overtime: this.hourlyRate * 1.5 * hours
        };
        
      case 'leave':
        // AL年假，正常工资，无影响
        return { base: 0, overtime: 0 }; // 月薪已包含
        
      case 'training':
        // C培训，正常工资，不算加班
        return { base: 0, overtime: 0 }; // 月薪已包含
        
      case 'support':
        // 支援其他店，正常工作日逻辑
        // TODO: 确认是否有额外津贴
        return this.calculateWorkDaySalary(startTime, endTime, restHours);
        
      case 'co':
        // 补休，正常工资
        return { base: 0, overtime: 0 };
    }
  }
  
  // 正常工作日计算
  calculateWorkDaySalary(startTime, endTime, restHours) {
    const totalHours = this.calculateHours(startTime, endTime, restHours);
    const normalHours = 8; // 标准工作时长
    const overtimeHours = Math.max(0, totalHours - normalHours);
    
    return {
      base: 0, // 月薪已包含
      overtime: overtimeHours * this.hourlyRate * 1.5
    };
  }
  
  // 计算勤工奖（基于MC天数）
  calculateAttendanceBonus(mcDays) {
    if (mcDays <= 1) return this.attendanceBonus; // 全额
    if (mcDays <= 3) return this.attendanceBonus / 2; // 减半
    return 0; // 取消
  }
  
  // 月度总工资
  calculateMonthlySalary(records, mcDays) {
    let totalOvertime = 0;
    
    records.forEach(record => {
      const daily = this.calculateDailySalary(record);
      totalOvertime += daily.overtime;
    });
    
    const attendanceBonus = this.calculateAttendanceBonus(mcDays);
    
    return {
      baseSalary: this.baseSalary,
      attendanceBonus: attendanceBonus,
      overtimePay: totalOvertime,
      totalSalary: this.baseSalary + attendanceBonus + totalOvertime,
      breakdown: {
        hourlyRate: this.hourlyRate.toFixed(2),
        overtimeMultiplier: 1.5,
        mcDays: mcDays
      }
    };
  }
}
```

**UI设计**：
```
┌─────────────────────────────────────────┐
│  💰 本月工资预估                        │
├─────────────────────────────────────────┤
│  ╔═══════════════════════════════════╗  │
│  ║  预计总工资： $2,450.00          ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│  📊 工资构成：                          │
│                                         │
│  基本月薪              $1,770.00       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  勤工奖                                 │
│  • MC 2天，减半          $100.00     ⚠│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  加班费                   $580.00     │
│  • 工作日加班 15hrs      $208.80  [详]│
│  • 休息日加班 2天        $222.72  [详]│
│  • 公共假期 1天          $148.48  [详]│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  💳 预计发薪日： 2025年11月7日          │
│  📅 还有 9 天                           │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  📈 本月进度：                          │
│  已工作：18天 / 22天 (82%)              │
│  █████████████░░░                      │
│                                         │
│  已加班：32小时                         │
│  ⚠️ 距离月加班上限(72hrs)还剩40小时     │
│                                         │
│  [查看详细记录]  [导出工资单]          │
└─────────────────────────────────────────┘
```

---

### 功能5：MC/AL追踪（简化版）

**优先级**：P1（重要但不紧急）

**简化原则**：
- V1.0只追踪MC天数（影响勤工奖）
- AL在排班表识别时已导入
- 无需复杂的配额管理

**UI设计**：
```
┌─────────────────────────────────────────┐
│  🏥 MC记录                              │
├─────────────────────────────────────────┤
│  📊 本月MC统计：                        │
│                                         │
│  MC天数：2天                            │
│  ⚠️ 影响：勤工奖减半至 $100             │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  [+ 添加MC记录]                         │
│                                         │
│  📅 10月18日 (1天)                      │
│  证明编号：MC202510180001               │
│  备注：感冒发烧                         │
│  [编辑] [删除]                          │
│                                         │
│  📅 10月22日 (1天)                      │
│  证明编号：MC202510220001               │
│  备注：肠胃不适                         │
│  [编辑] [删除]                          │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  💡 年度配额：                          │
│  Paid MC: 已用 2/14 天 (14%)           │
│  ████░░░░░░░░░░░░░░                    │
└─────────────────────────────────────────┘
```

---

## 🚫 V1.0 不做的功能

### 明确砍掉的功能（避免功能膨胀）

| 功能 | 为什么不做 | 何时做 |
|------|-----------|--------|
| **主管VI分红计算** | 机制不明确，需要更多调研 | V2.0（收集5个主管数据后） |
| **交通津贴追踪** | 不确定派往其他店是否有津贴 | V1.5（确认政策后） |
| **多工作支持** | 增加复杂度，目标用户单一 | V2.0 |
| **社区功能（匿名对比）** | 需要足够用户基数 | V2.0（1000用户后） |
| **预算管理** | Seedly已经做得很好 | 永不做 |
| **支出追踪** | 不是核心痛点 | 永不做 |
| **投资建议** | 超出产品定位 | 永不做 |

---

## 💡 **新功能讨论：内置排班查看器**

### **功能提案：方便用户查看排班表**

**背景**：
- 用户目前需要：
  1. 打开WhatsApp查看主管发的排班表
  2. 或者打开手机相册找排班表照片
  3. 在不同APP之间切换很麻烦

**提议功能**：
在APP内嵌入排班表查看器，用户可以：
- 查看原始排班表图片
- 或者查看AI识别后的排班列表
- 不需要切换APP

---

### **方案A：图片查看器（推荐）✅**

**实现方式**：
```
日历顶部添加按钮：
┌─────────────────────────────────────────┐
│  📅 2025年10月        [📸 查看排班表]   │
├─────────────────────────────────────────┤
│  (日历内容)                              │
└─────────────────────────────────────────┘

点击后：
┌─────────────────────────────────────────┐
│  📸 本月排班表           [×] 关闭       │
├─────────────────────────────────────────┤
│                                         │
│   (显示原始排班表图片)                  │
│   支持缩放、滚动                        │
│                                         │
│  [重新导入排班]  [下载图片]            │
└─────────────────────────────────────────┘
```

**优点**：
- ✅ 实现简单（保存上传的图片即可）
- ✅ 用户熟悉（看到的是原始表格）
- ✅ 可以看到其他同事的排班（有时需要调班）
- ✅ 不需要额外开发

**缺点**：
- ❌ 图片在手机上可能看不清
- ❌ 需要捏合缩放

**成本**：
- 开发时间：2小时
- 存储成本：每张图约500KB，100用户 = 50MB = $0

**建议**：✅ **采纳此方案**，作为V1.0功能

---

### **方案B：排班列表视图（未来考虑）**

**实现方式**：
```
┌─────────────────────────────────────────┐
│  📋 本月排班详情                        │
├─────────────────────────────────────────┤
│  10月1日 (Wed)  🕙 工作日 10:00        │
│  10月2日 (Thu)  🔴 REST               │
│  10月3日 (Fri)  🕙 工作日 10:00        │
│  10月4日 (Sat)  🕙 工作日 10:00        │
│  10月5日 (Sun)  🟠 OFF/OT 休息日加班   │
│  10月6日 (Mon)  🕙 工作日 10:00        │
│  10月7日 (Tue)  📚 培训日 09:30-11:00  │
│  ...                                    │
│                                         │
│  [查看原始图片]                         │
└─────────────────────────────────────────┘
```

**优点**：
- ✅ 清晰易读
- ✅ 可以快速搜索特定日期
- ✅ 方便复制文字

**缺点**：
- ❌ 看不到其他同事的排班
- ❌ 如果OCR识别错误，列表也会错

**建议**：⏸️ V1.5再考虑，V1.0先用方案A

---

### **方案C：混合模式（最优但复杂）**

**实现方式**：
```
日历顶部两个按钮：
┌─────────────────────────────────────────┐
│  📅 2025年10月  [📸 图片] [📋 列表]    │
├─────────────────────────────────────────┤
```

**优点**：
- ✅ 两全其美
- ✅ 用户可以选择喜欢的方式

**缺点**：
- ❌ 开发时间翻倍
- ❌ 界面更复杂

**建议**：⏸️ V2.0再做

---

### **✅ V1.0最终决定**

**采纳方案A：简单的图片查看器**

**实现规格**：
1. 保存用户上传的排班表图片到Supabase Storage
2. 日历顶部添加"查看排班表"按钮
3. 点击后全屏显示原始图片
4. 支持双指缩放、拖动
5. 提供"重新导入"和"下载到相册"按钮

**优先级**：P1（重要但非核心）

**开发时间**：2小时

**用户价值**：
- 不用切换APP
- 随时查看完整排班
- 方便调班时查看同事排班

---

## 💾 数据模型（基于真实排班）

### 核心数据结构

#### **排班数据（新增图片存储）**
```json
{
  "scheduleId": "sch_202510",
  "month": "2025-10",
  "importedFrom": "photo",
  "importedAt": "2025-10-01T10:30:00Z",
  "originalImageUrl": "https://supabase.storage/schedules/user001_202510.jpg",
  "imageFileName": "排班表_2025年10月.jpg",
  "imageSize": 524288,
  "recognitionAccuracy": 0.92,
  "schedules": {
    "2025-10-01": {
      "type": "work",
      "plannedStartTime": "10:00",
      "plannedEndTime": null,
      "notes": "",
      "isConfirmed": true
    },
    "2025-10-15": {
      "type": "support_outgoing",
      "targetOutlet": "TCP",
      "outletFullName": "The Centrepoint",
      "plannedStartTime": "10:00",
      "plannedEndTime": null,
      "notes": "派往Orchard分店支援",
      "isConfirmed": true
    }
  }
}
```管VI分红计算** | 机制不明确，需要更多调研 | V2.0（收集5个主管数据后） |
| **补休(CO)追踪** | 复杂度高，使用频率低 | V1.5 |
| **支援津贴计算** | 不确定是否有额外钱 | V1.5（确认后再做） |
| **多工作支持** | 增加复杂度，目标用户单一 | V2.0 |
| **社区功能（匿名对比）** | 需要足够用户基数 | V2.0（1000用户后） |
| **预算管理** | Seedly已经做得很好 | 永不做 |
| **支出追踪** | 不是核心痛点 | 永不做 |
| **投资建议** | 超出产品定位 | 永不做 |

---

## 💾 数据模型（基于真实排班）

### 核心数据结构

#### **用户配置**
```json
{
  "userId": "user_001",
  "profile": {
    "name": "KELLY TEIN ROU YI",
    "employeeId": "2637",
    "position": "CHEF 4",
    "employmentType": "full_time",
    "baseSalary": 1770,
    "attendanceBonus": 200,
    "startDate": "2025-09-15",
    "payDay": 7,
    "workingHoursPerDay": 8,
    "restHoursPerDay": 1
  }
}
```

#### **排班数据（从图片识别）**
```json
{
  "scheduleId": "sch_202510",
  "month": "2025-10",
  "importedFrom": "photo",
  "importedAt": "2025-10-01T10:30:00Z",
  "imageUrl": "blob:xxxxx",
  "schedules": {
    "2025-10-01": {
      "type": "work",
      "plannedStartTime": "10:00",
      "plannedEndTime": null,
      "notes": "",
      "isConfirmed": true
    },
    "2025-10-02": {
      "type": "rest",
      "plannedStartTime": null,
      "plannedEndTime": null,
      "notes": "REST",
      "isConfirmed": true
    },
    "2025-10-05": {
      "type": "overtime_on_off_day",
      "plannedStartTime": "10:00",
      "plannedEndTime": null,
      "notes": "OFF/OT - 休息日加班",
      "isConfirmed": true
    },
    "2025-10-07": {
      "type": "training",
      "plannedStartTime": "09:30",
      "plannedEndTime": "11:00",
      "notes": "C - 上课培训",
      "isConfirmed": true
    },
    "2025-10-10": {
      "type": "leave",
      "plannedStartTime": null,
      "plannedEndTime": null,
      "notes": "AL - 年假",
      "isConfirmed": true
    },
    "2025-10-15": {
      "type": "support",
      "plannedStartTime": "10:00",
      "plannedEndTime": null,
      "notes": "支援其他分店",
      "isConfirmed": true
    }
  }
}
```

**排班类型枚举**：
```typescript
enum ScheduleType {
  WORK = "work",                    // 正常工作日（有时间数字）
  REST = "rest",                    // 小周休息日（绿色）
  OFF = "off",                      // 大周休息日（橙色）
  OVERTIME_ON_OFF_DAY = "overtime_on_off_day", // OFF/OT 休息日加班（橙色+OT标记）
  LEAVE = "leave",                  // AL 年假（蓝色）
  TRAINING = "training",            // C 上课培训
  PUBLIC_HOLIDAY = "public_holiday", // PH 公共假期
  SUPPORT_INCOMING = "support_incoming", // 支援：其他店员工来我们店（单元格显示"支援"）
  SUPPORT_OUTGOING = "support_outgoing", // 派往其他店：你去别的店支援（显示分店代码如CO/TCP/NP）
  UNKNOWN = "unknown"               // 无法识别的标记
}
```

**关键修正**：
1. **CO ≠ 补休**
   - CO = Compass One分店
   - 如果你的行出现"CO"，表示你被派去Compass One支援
   
2. **支援 = 其他店员工来我们店**
   - 不是你去支援别人
   - 而是别人来帮我们
   - 单元格显示"支援"文字
   
3. **分店代码 = 你去别的店**
   - 如果你的行出现"TCP"、"NP"、"CO"等2-3字母缩写
   - 表示你被派去该分店工作
   - 这一天的工资计算方式可能不同（需确认）

4. **PH = Public Holiday 公共假期**
   - 类似AL，但加班费是2倍
   
5. **OFF/OT ≠ 会获得补休**
   - 休息日加班就是1.5倍工资
   - 不会再给补休（因为已经用掉休息日了）

---

#### **实际打卡记录**（修正版）
```json
{
  "timeRecords": {
    "2025-10": [
      {
        "id": "tr_20251001",
        "date": "2025-10-01",
        "scheduleType": "work",
        "plannedStartTime": "10:00",
        "actualStartTime": "09:55",
        "actualEndTime": "19:30",
        "restHours": 1,
        "totalHours": 8.58,
        "normalHours": 8,
        "overtimeHours": 0.58,
        "overtimePay": 8.07,
        "notes": ""
      },
      {
        "id": "tr_20251005",
        "date": "2025-10-05",
        "scheduleType": "overtime_on_off_day",
        "plannedStartTime": "10:00",
        "actualStartTime": "10:00",
        "actualEndTime": "19:00",
        "restHours": 1,
        "totalHours": 8,
        "normalHours": 0,
        "overtimeHours": 8,
        "overtimePay": 111.36,
        "notes": "OFF日加班，整天1.5倍，无补休"
      },
      {
        "id": "tr_20251015",
        "date": "2025-10-15",
        "scheduleType": "support_outgoing",
        "targetOutlet": "TCP",
        "plannedStartTime": "10:00",
        "actualStartTime": "10:00",
        "actualEndTime": "19:00",
        "restHours": 1,
        "totalHours": 8,
        "normalHours": 8,
        "overtimeHours": 0,
        "overtimePay": 0,
        "notes": "派往The Centrepoint分店支援",
        "hasTransportAllowance": true
      }
    ]
  }
}
```
```json
{
  "timeRecords": {
    "2025-10": [
      {
        "id": "tr_20251001",
        "date": "2025-10-01",
        "scheduleType": "work",
        "plannedStartTime": "10:00",
        "actualStartTime": "09:55",
        "actualEndTime": "19:30",
        "restHours": 1,
        "totalHours": 8.58,
        "normalHours": 8,
        "overtimeHours": 0.58,
        "overtimePay": 8.07,
        "notes": "店里比较忙"
      },
      {
        "id": "tr_20251005",
        "date": "2025-10-05",
        "scheduleType": "overtime_on_off_day",
        "plannedStartTime": "10:00",
        "actualStartTime": "10:00",
        "actualEndTime": "19:00",
        "restHours": 1,
        "totalHours": 8,
        "normalHours": 0,
        "overtimeHours": 8,
        "overtimePay": 111.36,
        "notes": "休息日加班，整天1.5倍"
      }
    ]
  }
}
```

#### **MC记录**
```json
{
  "mcRecords": {
    "2025-10": [
      {
        "id": "mc_001",
        "date": "2025-10-18",
        "duration": 1,
        "certificateNumber": "MC202510180001",
        "reason": "感冒发烧",
        "isPaid": true,
        "impact": {
          "attendanceBonusReduction": 100
        }
      }
    ]
  }
}
```

#### **月度工资汇总**
```json
{
  "monthlySalaries": {
    "2025-10": {
      "month": "2025-10",
      "status": "pending",
      "baseSalary": 1770,
      "attendanceBonus": 100,
      "overtime": {
        "workDays": {
          "hours": 15,
          "pay": 208.80
        },
        "offDays": {
          "days": 2,
          "hours": 16,
          "pay": 222.72
        },
        "publicHolidays": {
          "days": 1,
          "hours": 8,
          "pay": 148.48
        },
        "total": 580.00
      },
      "deductions": {
        "unpaidMc": 0,
        "unpaidLeave": 0,
        "total": 0
      },
      "totalSalary": 2450.00,
      "estimatedPayDate": "2025-11-07",
      "breakdown": {
        "hourlyRate": 9.28,
        "mcDays": 2,
        "workDays": 22,
        "restDays": 6,
        "leaveDays": 2
      }
    }
  }
}
```

---

## 🎨 完整UI流程图

### 用户旅程地图

```
新用户首次打开
  ↓
欢迎页面
  • "3步快速上手"
  • "拍照导入排班"
  • [开始使用]
  ↓
Step 1: 基本设置
  • 输入姓名
  • 输入月薪 $1770
  • 输入勤工奖 $200
  • 选择发薪日
  ↓
Step 2: 导入排班
  • [拍照排班表]
  • AI识别中...
  • 确认识别结果
  • [导入日历]
  ↓
Step 3: 完成设置
  • "✅ 设置完成！"
  • "你的10月排班已导入"
  • [开始记录打卡]
  ↓
主界面（Dashboard）
  ├─ 顶部：本月工资预估卡片
  ├─ 中部：日历视图
  └─ 底部：快捷操作按钮
```

### 主界面（Dashboard）设计

```
┌─────────────────────────────────────────┐
│  🕒 DTF 工资追踪器        [☰] [设置]   │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  💰 本月预估工资                 ║  │
│  ║  $2,450.00                       ║  │
│  ║  ─────────────────────────────   ║  │
│  ║  📊 已工作 18/22天  加班32小时   ║  │
│  ║  💳 11月7日发薪 (还有9天)        ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│  📅 十月                    [◀ 2025 ▶] │
│  ┌───────────────────────────────────┐ │
│  │ Sun Mon Tue Wed Thu Fri Sat       │ │
│  │           1   2   3   4   5       │ │
│  │        🕙 🔴 🕙 🕙 🟠           │ │
│  │        10  R  10  10 休加班        │ │
│  │                                   │ │
│  │  6   7   8   9  10  11  12        │ │
│  │ 🕙 🕛 🕙 🔴 🔵 🕙 🟢          │ │
│  │ 10  12  10  R  AL  10 支援        │ │
│  │                                   │ │
│  │ ... (更多日期)                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  🎯 今日任务 (10月28日)                 │
│  ✓ 已导入本月排班                      │
│  ⚠ 需要记录今天的下班时间               │
│  → [快速打卡]                          │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  快捷操作：                             │
│  ┌──────┬──────┬──────┬──────┐      │
│  │ 📸   │ 📝   │ 💰   │ 🏥   │      │
│  │ 导入 │ 打卡 │ 工资 │ MC   │      │
│  │ 排班 │ 记录 │ 详情 │ 记录 │      │
│  └──────┴──────┴──────┴──────┘      │
└─────────────────────────────────────────┘
```

---

## 🛠️ 技术架构（AI优先）

### 技术栈选择（成本优化）

| 层级 | 技术选择 | 成本 | 理由 |
|------|---------|------|------|
| **前端** | React + Tailwind | $0 | AI生成代码友好 |
| **OCR** | GPT-4 Vision API | $0.01-0.03/图 | 识别准确率最高 |
| **后端** | Supabase | 免费(50万行) | PostgreSQL + 实时订阅 |
| **存储** | Supabase Storage | 免费(1GB) | 存储排班表图片 |
| **托管** | Vercel | 免费 | 自动部署 + CDN |
| **域名** | Namecheap | $10/年 | 品牌化 |
| **分析** | Posthog | 免费(100万事件) | 开源替代GA |

**月度成本预估**：
- 100用户 × 1次OCR = $1-3
- Supabase免费额度足够
- **总计：$1-5/月**

---

### 核心技术实现

#### **1. OCR识别流程**

```javascript
// 完整的OCR工作流
class ScheduleRecognitionService {
  
  async recognizeSchedule(imageFile, userName) {
    try {
      // 1. 上传图片到Supabase Storage
      const imageUrl = await this.uploadImage(imageFile);
      
      // 2. 调用GPT-4 Vision识别
      const rawData = await this.callGPT4Vision(imageUrl, userName);
      
      // 3. 验证识别结果
      const validated = this.validateRecognitionResult(rawData);
      
      // 4. 后处理优化
      const processed = this.postProcessSchedule(validated);
      
      // 5. 保存到数据库
      await this.saveSchedule(processed);
      
      return {
        success: true,
        data: processed,
        confidence: this.calculateConfidence(rawData)
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackToManual: true
      };
    }
  }
  
  async callGPT4Vision(imageUrl, userName) {
    const prompt = this.buildPrompt(userName);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { 
            type: "image_url", 
            image_url: { 
              url: imageUrl,
              detail: "high" // 高清模式，准确率更高
            } 
          }
        ]
      }],
      max_tokens: 2000,
      temperature: 0.1 // 低温度，更准确
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  buildPrompt(userName) {
    return `
你是鼎泰丰排班表识别专家。

任务：从图片中提取员工"${userName}"的完整排班。

排班表特征：
1. 格式：Excel表格，第一列是员工姓名
2. 日期格式：Wed 01, Thu 02, Fri 03 等
3. 单元格内容规则：

时间规则：
- 单个4位数字(如1000) = 上班时间10:00
- 两个数字(如"1200 2100") = 兼职的上下班时间12:00-21:00
- 计算规则：1000→10:00, 1200→12:00, 2100→21:00

状态标记：
- REST (绿色背景) = 小周休息日
- OFF (橙色背景) = 大周休息日  
- AL (蓝色背景) = 年假
- OFF/OT = 休息日加班
- 支援 = 去其他分店工作
- C = 上课培训
- CO = 补休
- * = 备注(含义不明)

返回JSON格式：
{
  "employeeName": "YUE KAM CHEONG",
  "recognitionConfidence": 0.95,
  "month": "2025-10",
  "schedule": {
    "2025-10-01": {
      "type": "work",
      "startTime": "10:00",
      "endTime": null,
      "originalText": "1000",
      "confidence": 0.98
    },
    "2025-10-02": {
      "type": "rest",
      "startTime": null,
      "endTime": null,
      "originalText": "REST",
      "confidence": 1.0
    },
    "2025-10-05": {
      "type": "overtime_on_off_day",
      "startTime": "10:00",
      "endTime": null,
      "originalText": "OFF/OT",
      "confidence": 0.95,
      "note": "休息日加班，1.5倍工资，无补休"
    },
    "2025-10-15": {
      "type": "support_outgoing",
      "targetOutlet": "TCP",
      "outletFullName": "The Centrepoint",
      "startTime": "10:00",
      "endTime": null,
      "originalText": "TCP",
      "confidence": 0.90
    },
    "2025-10-20": {
      "type": "support_incoming",
      "startTime": null,
      "endTime": null,
      "originalText": "支援",
      "confidence": 1.0,
      "note": "其他店员工来我们店，不影响该员工"
    }
  },
  "warnings": [
    "2025-10-18单元格内容模糊，建议人工确认"
  ]
}

type枚举值（严格遵守）：
- work: 正常工作日（有时间数字）
- rest: REST休息日
- off: OFF大周休息日
- overtime_on_off_day: OFF/OT休息日加班
- leave: AL年假
- public_holiday: PH公共假期
- training: C上课培训
- support_incoming: "支援"文字 = 别人来帮我们
- support_outgoing: 分店代码(CO/TCP/NP等) = 派往该店
- unknown: 无法识别的内容

注意事项：
1. 如果某个单元格无法识别，设confidence < 0.7并添加warning
2. 时间转换示例：0930→09:30, 1000→10:00, 1230→12:30
3. 兼职员工有两个时间的，提取startTime和endTime
4. 分店代码必须标记为support_outgoing类型
5. "支援"文字必须标记为support_incoming类型
6. 必须提取整个月（通常30或31天）
7. OFF/OT表示休息日加班，不会再给补休
`;
  }
  
  validateRecognitionResult(data) {
    // 验证姓名
    if (!data.employeeName || data.recognitionConfidence < 0.7) {
      throw new Error('员工姓名识别失败，请重新拍照');
    }
    
    // 验证日期完整性
    const days = Object.keys(data.schedule).length;
    if (days < 28 || days > 31) {
      throw new Error(`识别到${days}天，不符合月度范围`);
    }
    
    // 验证每个排班记录
    Object.entries(data.schedule).forEach(([date, record]) => {
      if (!this.isValidScheduleType(record.type)) {
        throw new Error(`${date}的排班类型无效：${record.type}`);
      }
      
      if (record.type === 'work' && !record.startTime) {
        throw new Error(`${date}工作日缺少上班时间`);
      }
    });
    
    return data;
  }
  
  postProcessSchedule(data) {
    // 智能填充缺失信息
    Object.entries(data.schedule).forEach(([date, record]) => {
      // 如果工作日没有结束时间，预估为上班后9小时(含1小时休息)
      if (record.type === 'work' && !record.endTime && record.startTime) {
        const [hours, mins] = record.startTime.split(':');
        const endHour = parseInt(hours) + 9;
        record.endTime = `${endHour}:${mins}`;
        record.isEndTimeEstimated = true;
      }
    });
    
    return data;
  }
  
  calculateConfidence(data) {
    const confidences = Object.values(data.schedule)
      .map(r => r.confidence);
    
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
}
```

---

#### **2. 工资计算引擎（完整版）**

```javascript
// 符合新加坡MOM的工资计算器
class MOMCompliantSalaryCalculator {
  
  constructor(baseSalary, attendanceBonus) {
    this.baseSalary = baseSalary;
    this.attendanceBonus = attendanceBonus;
    
    // MOM规定的时薪计算
    this.hourlyRate = baseSalary / 190.67;
    
    // 加班倍数
    this.overtimeMultiplier = 1.5;
    this.publicHolidayMultiplier = 2.0;
  }
  
  // 计算单日工资
  calculateDailyPay(record) {
    const { type, actualStartTime, actualEndTime, restHours } = record;
    
    // 如果当天没打卡，返回0
    if (!actualStartTime || !actualEndTime) {
      return { base: 0, overtime: 0, warning: '未打卡' };
    }
    
    const totalHours = this.calculateHours(
      actualStartTime, 
      actualEndTime, 
      restHours || 1
    );
    
    switch (type) {
      case 'work':
      case 'support':
      case 'training':
        // 正常工作日
        const normalHours = 8;
        const overtimeHours = Math.max(0, totalHours - normalHours);
        return {
          base: 0, // 月薪已包含
          overtime: overtimeHours * this.hourlyRate * this.overtimeMultiplier,
          hours: {
            total: totalHours,
            normal: normalHours,
            overtime: overtimeHours
          }
        };
        
      case 'overtime_on_off_day':
        // 休息日加班，整天1.5倍
        return {
          base: 0,
          overtime: totalHours * this.hourlyRate * this.overtimeMultiplier,
          hours: {
            total: totalHours,
            normal: 0,
            overtime: totalHours
          },
          note: '休息日加班整天算OT'
        };
        
      case 'public_holiday_work':
        // 公共假期加班，整天2倍
        return {
          base: 0,
          overtime: totalHours * this.hourlyRate * this.publicHolidayMultiplier,
          hours: {
            total: totalHours,
            normal: 0,
            overtime: totalHours
          },
          note: '公共假期加班2倍工资'
        };
        
      default:
        // REST/OFF/AL/CO等不计算工资
        return { base: 0, overtime: 0 };
    }
  }
  
  // 计算勤工奖
  calculateAttendanceBonus(mcDays) {
    if (mcDays <= 1) {
      return {
        amount: this.attendanceBonus,
        rate: 1.0,
        reason: 'MC ≤ 1天，全额'
      };
    } else if (mcDays <= 3) {
      return {
        amount: this.attendanceBonus / 2,
        rate: 0.5,
        reason: 'MC 2-3天，减半'
      };
    } else {
      return {
        amount: 0,
        rate: 0,
        reason: 'MC ≥ 4天，取消'
      };
    }
  }
  
  // 月度总工资
  calculateMonthly(records, mcDays) {
    let workDayOT = 0;
    let offDayOT = 0;
    let phOT = 0;
    
    let workDayHours = 0;
    let offDayHours = 0;
    let phHours = 0;
    
    records.forEach(record => {
      const daily = this.calculateDailyPay(record);
      
      if (record.type === 'work' || record.type === 'support') {
        workDayOT += daily.overtime;
        workDayHours += daily.hours?.overtime || 0;
      } else if (record.type === 'overtime_on_off_day') {
        offDayOT += daily.overtime;
        offDayHours += daily.hours?.total || 0;
      } else if (record.type === 'public_holiday_work') {
        phOT += daily.overtime;
        phHours += daily.hours?.total || 0;
      }
    });
    
    const attendanceBonus = this.calculateAttendanceBonus(mcDays);
    const totalOvertime = workDayOT + offDayOT + phOT;
    const totalSalary = this.baseSalary + attendanceBonus.amount + totalOvertime;
    
    return {
      baseSalary: this.baseSalary,
      attendanceBonus: attendanceBonus,
      overtime: {
        workDay: { hours: workDayHours, pay: workDayOT },
        offDay: { hours: offDayHours, pay: offDayOT },
        publicHoliday: { hours: phHours, pay: phOT },
        total: totalOvertime
      },
      totalSalary: totalSalary,
      hourlyRate: this.hourlyRate.toFixed(2)
    };
  }
  
  // 辅助函数：计算工作小时数
  calculateHours(startTime, endTime, restHours) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    const totalMinutes = endMinutes - startMinutes;
    const totalHours = totalMinutes / 60;
    
    return totalHours - restHours;
  }
}
```

---

## 📅 开发计划（基于AI工具）

### Week 1: 核心OCR + 数据模型

**Day 1-2: 项目初始化**
```bash
# 使用Claude Code初始化
claude code init dtf-salary-tracker \
  --template react-tailwind \
  --database supabase \
  --ai-features ocr

# 或使用Cursor
# 1. 创建项目文件夹
# 2. 粘贴此PRD到Composer
# 3. 提示："根据PRD生成完整项目结构"
```

**交付物**：
- [x] Supabase数据库表结构
- [x] 基础React组件框架
- [x] Tailwind配置
- [x] GPT-4 Vision API集成

---

**Day 3-5: OCR核心功能**
```bash
# Cursor提示词
"实现排班表OCR识别功能：
1. 拍照/上传图片
2. 调用GPT-4 Vision识别
3. 解析JSON结果
4. 显示确认界面
5. 允许手动修正

参考PRD中的ScheduleRecognitionService类"
```

**测试用例**：
- 用真实的鼎泰丰排班表测试
- 测试识别准确率（目标90%+）
- 测试异常情况（模糊图片、手写表格）

**交付物**：
- [x] 拍照上传功能
- [x] OCR识别准确率90%+
- [x] 识别结果确认界面
- [x] 手动修正功能

---

**Day 6-7: 数据存储 + 日历UI**
```bash
# Cursor提示词
"基于识别结果，实现：
1. 保存排班到Supabase
2. 日历组件显示排班
3. 支持不同颜色标记(work/rest/off/al)
4. 点击日期查看详情"
```

**交付物**：
- [x] 日历组件
- [x] 数据持久化
- [x] 月份切换功能

---

### Week 2: 打卡记录 + 工资计算

**Day 8-10: 打卡功能**
```bash
# Cursor提示词
"实现每日打卡记录：
1. 读取排班表预填上班时间
2. 用户输入下班时间
3. 自动计算工作时长和加班
4. 处理特殊情况(OFF/OT, 培训日)
5. 实时显示加班费

参考PRD中的MOMCompliantSalaryCalculator"
```

**交付物**：
- [x] 打卡表单
- [x] 自动计算逻辑
- [x] 特殊情况处理

---

**Day 11-12: 工资计算引擎**
```bash
# Cursor提示词
"实现完整的工资计算：
1. 符合MOM规定的时薪计算
2. 工作日/休息日/公共假期加班费
3. 勤工奖根据MC天数计算
4. 月度汇总

测试用例：
- 基本工资$1770
- MC 2天，勤工奖应为$100
- 加班15小时，应为$208.80"
```

**交付物**：
- [x] 工资计算引擎
- [x] 单元测试通过
- [x] 工资明细UI

---

**Day 13-14: MC记录 + 集成**
```bash
# Cursor提示词
"实现MC追踪功能并集成所有模块：
1. MC记录表单
2. 自动计算对勤工奖的影响
3. 集成到工资计算
4. 端到端测试完整流程"
```

**交付物**：
- [x] MC记录功能
- [x] 所有模块集成
- [x] 完整用户流程可用

---

### Week 3: 优化 + 测试 + 发布

**Day 15-17: UI/UX优化**
- [ ] 响应式设计调整
- [ ] 加载状态优化
- [ ] 错误提示改进
- [ ] 动画效果
- [ ] 移动端适配

**Day 18-19: 真实用户测试**
- [ ] 找3个鼎泰丰员工测试
- [ ] 收集反馈
- [ ] 修复bug
- [ ] 优化OCR准确率

**Day 20-21: 部署上线**
- [ ] Vercel部署
- [ ] 域名配置
- [ ] 性能优化
- [ ] 编写用户文档
- [ ] 准备推广材料

---

## 🎯 成功指标

### V1.0 MVP成功标准（3个月内）

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| **功能完整性** | 100%核心功能实现 | 功能清单勾选 |
| **OCR准确率** | 90%+ | 人工验证50张真实排班表 |
| **工资计算准确性** | 99%+ | 与实际工资单对比 |
| **用户数** | 30个日活用户 | Posthog统计 |
| **留存率** | 50%次日留存 | Posthog漏斗分析 |
| **用户满意度** | NPS > 50 | 应用内问卷 |

### 关键里程碑

| 里程碑 | 日期 | 标准 |
|--------|------|------|
| **M1: OCR可用** | Day 7 | 能识别真实排班表 |
| **M2: 工资计算准确** | Day 14 | 与工资单对比无误差 |
| **M3: MVP完成** | Day 21 | 完整流程可用 |
| **M4: 真实用户验证** | Week 6 | 10个用户日活使用 |
| **M5: 产品成熟** | Week 12 | 30个日活，准备扩张 |

---

## 💰 成本与收益分析

### V1.0 开发成本

| 项目 | 成本 | 说明 |
|------|------|------|
| **开发时间** | 3周全职 | 你的时间成本 |
| **GPT-4 API** | ~$50 | 开发期间测试 |
| **Supabase** | $0 | 免费额度 |
| **Vercel** | $0 | 免费托管 |
| **域名** | $10 | 第一年 |
| **总计** | **$60** | 极低成本 |

### V1.0 运营成本（月度）

| 项目 | 用户量 | 成本 |
|------|--------|------|
| **GPT-4 OCR** | 30用户 × 1次/月 | ~$1 |
| **Supabase** | 30用户 | $0（免费额度内） |
| **Vercel** | - | $0 |
| **总计** | 30用户 | **$1-5/月** |

### 扩张成本预估

| 用户数 | GPT-4 | Supabase | 总成本 |
|--------|-------|----------|--------|
| **100** | $3 | $0 | $3/月 |
| **500** | $15 | $0 | $15/月 |
| **1000** | $30 | $25 | $55/月 |
| **5000** | $150 | $25 | $175/月 |

**结论**：成本极低，可以长期免费运营！

---

## 📈 V2.0 扩展路线（6个月后）

### 基于V1.0验证后的扩展方向

#### **扩展1：职级支持**
如果有5个以上主管用户要求：
- [ ] 主管模式（无OT，有VI）
- [ ] VI分红预估功能
- [ ] 需要调研5个主管的VI机制

#### **扩展2：连锁店扩张**
从鼎泰丰扩展到：
- [ ] 海底捞
- [ ] 麦当劳
- [ ] 星巴克
- 每个品牌需要适配不同的勤工奖规则

#### **扩展3：社区功能**
当用户达到1000+：
- [ ] 匿名工资对比
- [ ] "你的工资超过XX%的同行"
- [ ] 行业工资报告

#### **扩展4：B2B切入**
当某家餐厅有50+员工使用：
- [ ] 联系该餐厅HR
- [ ] 提供企业版对接
- [ ] 收费模式：$99/月/店

---

## 🚀 推广策略

### Phase 1: 种子用户（0-30人）

**目标**：验证产品可用性

**渠道**：
1. **你的同事**：最直接的用户
   - 帮5个同事手把手设置
   - 收集真实反馈
   
2. **鼎泰丰员工WhatsApp群**（如果有）
   - 分享："我做了个算工资的APP，大家试试"
   - 提供1对1设置帮助

3. **小红书**：
   - 发帖："在鼎泰丰打工，自己做了个算工资的小工具"
   - 标签：#新加坡打工 #鼎泰丰 #工资计算

**成功标准**：
- 10个用户连续使用2周
- 收集到20+条反馈
- NPS > 30

---

### Phase 2: 口碑扩散（30-100人）

**目标**：验证产品市场契合度

**渠道**：
1. **Reddit r/singapore**
   - 标题："I built a free salary tracker for F&B shift workers"
   - 强调：拍照导入排班，零手动输入

2. **Facebook群组**：
   - 新加坡打工仔交流群
   - 鼎泰丰/餐饮业员工群

3. **用户推荐机制**：
   - "邀请同事，双方各得1个月Pro会员"
   - 虽然V1.0免费，但为V2.0铺路

**成功标准**：
- 100个注册用户
- 30个日活
- 病毒系数K > 1.2（每个用户带来1.2个新用户）

---

### Phase 3: 规模化（100-1000人）

**目标**：成为F&B行业标准工具

**渠道**：
1. **媒体报道**：
   - 投稿到 Channel NewsAsia
   - 标题："Local Developer Builds App to Help F&B Workers Track Salary"

2. **与工会合作**：
   - 联系NTUC（新加坡职工总会）
   - 提供给会员免费使用

3. **餐厅HR直接合作**：
   - "你的100个员工里，50个在用我们"
   - 提供企业版对接

**成功标准**：
- 1000+注册用户
- 300+日活
- 覆盖10+连锁品牌

---

## 🎓 用户教育材料

### 快速开始指南（3分钟）

**Step 1: 拍照排班表**
```
📸 打开APP → 点击"导入排班" → 拍摄主管发的排班表
```

**Step 2: 确认识别结果**
```
✅ AI自动识别你的排班 → 检查是否正确 → 点击"导入日历"
```

**Step 3: 记录打卡**
```
📝 每天下班后 → 点击"快速打卡" → 输入下班时间 → 保存
```

**Step 4: 查看工资**
```
💰 随时查看"本月预估工资" → 了解能拿多少钱
```

---

### 常见问题

**Q: OCR识别不准确怎么办？**
A: 点击"手动修改"逐条纠正，我们会学习并改进算法。

**Q: 排班表每个月格式不一样？**
A: 没关系，GPT-4 Vision能适应不同格式，如果失败可以手动输入。

**Q: 数据安全吗？**
A: 数据加密存储在Supabase，只有你能访问，我们看不到你的工资信息。

**Q: 免费吗？**
A: V1.0完全免费，未来可能推出付费功能（云端同步、多工作支持）。

**Q: 支持其他餐厅吗？**
A: V1.0专注鼎泰丰，V2.0会支持更多品牌。如果你在其他餐厅工作，可以联系我们定制。

---

## 📝 总结

### 这版PRD解决了什么问题？

✅ **完全基于真实排班表重新设计**
- 不再假设"大小周模式"
- 支持灵活的轮班制
- 时间用数字表示（1000 = 10:00）

✅ **AI优先，降低开发成本**
- OCR自动识别排班表
- 零手动输入负担
- 月度成本$1-5

✅ **聚焦核心价值**
- V1.0只做最重要的功能
- 砍掉主管模式、VI、补休等复杂功能
- 先验证基本假设

✅ **明确的成功指标**
- 30个日活用户
- 90%+ OCR准确率
- 99%+ 工资计算准确性

---

### 下一步行动

**现在你可以：**

1. **立即开始开发**
   ```bash
   # 方案A: 使用Claude Code
   claude code init dtf-salary-tracker --from-prd prd-v2.md
   
   # 方案B: 使用Cursor
   # 打开Cursor → 粘贴PRD → 开始生成代码
   ```

2. **或者先做简化Demo**
   - 我可以用Artifact生成一个简化版
   - 只有日历+打卡+工资计算
   - 让你先体验核心流程

3. **或者继续讨论细节**
   - 还有哪些不清楚的？
   - 需要调整哪些功能？
   - 想要增加什么？

---

**你想选择哪个？** 🚀

我个人建议：**先用Cursor生成一个可运行的Demo**，真实体验一下OCR识别排班表的效果，然后再决定是否继续投入3周时间。

要不要我现在就帮你生成一个**核心功能的原型**（拍照识别+日历显示）？