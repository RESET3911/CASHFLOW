// Japan income tax calculation (2025 tax year)

interface TaxInput {
  businessIncome: number;     // 事業所得（収入 - 経費）
  salaryIncome: number;       // 給与収入（税込年収）
  pension: number;            // 国民年金保険料（年間）
  nhiPremium: number;         // 国民健康保険料（年間）
  basicDeduction?: number;    // 基礎控除（デフォルト48万）
}

interface TaxResult {
  salaryDeductedIncome: number;   // 給与所得控除後の給与所得
  grossIncome: number;            // 合計所得金額
  socialInsuranceDeduction: number;
  taxableIncome: number;          // 課税所得
  incomeTax: number;              // 所得税（復興税含む）
  residentTax: number;            // 住民税概算
  totalTax: number;               // 合計税負担
  monthlyProvision: number;       // 月次積立推奨額
}

function calcSalaryDeduction(salary: number): number {
  if (salary <= 1_625_000) return 550_000;
  if (salary <= 1_800_000) return Math.floor(salary * 0.4) - 100_000;
  if (salary <= 3_600_000) return Math.floor(salary * 0.3) + 80_000;
  if (salary <= 6_600_000) return Math.floor(salary * 0.2) + 440_000;
  if (salary <= 8_500_000) return Math.floor(salary * 0.1) + 1_100_000;
  return 1_950_000;
}

// 超過累進課税（所得税）
function calcIncomeTax(taxableIncome: number): number {
  const brackets = [
    { limit: 1_950_000,  rate: 0.05, deduction: 0 },
    { limit: 3_300_000,  rate: 0.10, deduction: 97_500 },
    { limit: 6_950_000,  rate: 0.20, deduction: 427_500 },
    { limit: 9_000_000,  rate: 0.23, deduction: 636_000 },
    { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { limit: Infinity,   rate: 0.45, deduction: 4_796_000 },
  ];
  if (taxableIncome <= 0) return 0;
  const bracket = brackets.find(b => taxableIncome <= b.limit)!;
  const base = Math.floor(taxableIncome * bracket.rate) - bracket.deduction;
  // 復興特別所得税 2.1%
  return Math.floor(base * 1.021);
}

export function calcTax(input: TaxInput): TaxResult {
  const basicDeduction = input.basicDeduction ?? 480_000;

  // 給与所得
  const salaryDeductedIncome = Math.max(
    0,
    input.salaryIncome - calcSalaryDeduction(input.salaryIncome),
  );

  // 合計所得（給与所得 + 事業所得）
  const grossIncome = salaryDeductedIncome + input.businessIncome;

  // 社会保険料控除
  const socialInsuranceDeduction = input.pension + input.nhiPremium;

  // 課税所得
  const taxableIncome = Math.max(
    0,
    grossIncome - basicDeduction - socialInsuranceDeduction,
  );

  const incomeTax = calcIncomeTax(taxableIncome);

  // 住民税概算（所得割10% + 均等割5,000）
  const residentTax = Math.floor(taxableIncome * 0.1) + 5_000;

  const totalTax = incomeTax + residentTax;
  const monthlyProvision = Math.ceil(totalTax / 12 / 1000) * 1000;

  return {
    salaryDeductedIncome,
    grossIncome,
    socialInsuranceDeduction,
    taxableIncome,
    incomeTax,
    residentTax,
    totalTax,
    monthlyProvision,
  };
}

export function calcYTDProjection(
  monthlyIncomes: number[],  // 1月〜現在月の実績
  currentMonth: number,      // 1-indexed
): number {
  if (currentMonth <= 0) return 0;
  const total = monthlyIncomes.reduce((s, v) => s + v, 0);
  const avg = total / currentMonth;
  return Math.round(total + avg * (12 - currentMonth));
}

export function fmt(n: number): string {
  return '¥' + n.toLocaleString('ja-JP');
}
