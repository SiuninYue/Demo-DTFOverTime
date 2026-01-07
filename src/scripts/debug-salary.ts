
const BASE = 1770;
const BONUS = 200;
const DEDUCTION_INPUT = 70.80;
const TARGET_NET = 2630.25;
const APP_NET = 2623.04;
const DIFF = TARGET_NET - APP_NET; // 7.21

const OT_HOURS = 52.0; // From user table analysis
const NORMAL_HOURS = 190.67; // MOM constant

console.log(`Target Diff: ${DIFF.toFixed(4)}`);

// Hypothesis 1: Deductions skipped on specific days
// User has 1 MC, 2 OFF. Total 3 days "absent" from work site?
// Or maybe deduction is $X/day.
for (let days = 20; days <= 31; days++) {
    const dailyDed = DEDUCTION_INPUT / days;
    // If we remove k days
    for (let k = 1; k <= 5; k++) {
        const adjustment = dailyDed * k;
        if (Math.abs(adjustment - DIFF) < 0.1) {
            console.log(`[MATCH] Deduction Adjustment: Days=${days}, Skipped=${k}, Val=${adjustment.toFixed(4)}`);
        }
    }
}

// Hypothesis 2: Hourly Rate Variation
// Try different divisors
const DIVISORS = [
    190.67, // APP
    190.7,
    190.6,
    191,
    208, // 26 * 8
    176, // 22 * 8
    184, // 23 * 8
    (52 * 44) / 12, // Exact unrounded 190.6666
];

for (const div of DIVISORS) {
    const rate = BASE / div;
    // Try round vs unrounded
    const rateRounded = Math.round(rate * 100) / 100;

    // Total OT Pay
    const payUnrounded = rate * 1.5 * OT_HOURS;
    const payRounded = rateRounded * 1.5 * OT_HOURS;

    // Compare with App OT (723.84)
    // App uses rateRounded (9.28) * 1.5 * 52 = 723.84.

    const diffUn = payUnrounded - 723.84;
    const diffRd = payRounded - 723.84;

    if (Math.abs(diffUn - DIFF) < 1) console.log(`[Rate] Div=${div} (Unrounded Rate), Diff=${diffUn.toFixed(4)}`);
    if (Math.abs(diffRd - DIFF) < 1) console.log(`[Rate] Div=${div} (Rounded Rate), Diff=${diffRd.toFixed(4)}`);
}

// Hypothesis 3: Implied Hourly Rate
const IMPLIED_OT_PAY = 723.84 + DIFF; // 731.05
const IMPLIED_RATE = IMPLIED_OT_PAY / 1.5 / OT_HOURS;
console.log(`Implied Hourly Rate for match: ${IMPLIED_RATE.toFixed(4)}`);
const IMPLIED_BASE = IMPLIED_RATE * 190.67;
console.log(`Implied Base Salary for match: ${IMPLIED_BASE.toFixed(4)}`);

// Hypothesis 4: Fixed Allowance included in OT Rate?
// Base + X
const X = (IMPLIED_RATE * 190.67) - BASE;
console.log(`Required Extra Base for mismatch: ${X.toFixed(4)}`);

// Hypothesis 5: Deduction is exactly $X/day, User input 70.80 is approximation?
// Maybe Deduction is $2.40/day?
// 30 days * 2.40 = 72.00. 
// If paid 30 days -> 72.00.
// If valid days = 28 (31 - 3). 28 * 2.40 = 67.20.
// Difference 72.00 - 67.20 = 4.80. Not 7.21.

// What if Deduction is strictly "Refund for 3 days"?
// Refund = 7.21. 
// Daily = 2.40.
// Total Month Deduction = 30 * 2.40 = 72.00.
// User input 70.80. Close. 
// 29.5 * 2.40 = 70.80.
// 29.5 days?
