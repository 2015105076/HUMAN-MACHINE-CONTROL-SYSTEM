window.LARYNGOSCOPE_CASES = {
  diagnosisOptions: [
    {
      id: "class-0",
      classId: 0,
      label: "A. 低风险 / 未见明确高级别病变",
      shortLabel: "低风险",
      description: "以随访或常规处理为主，未提示明确高级别风险。"
    },
    {
      id: "class-1",
      classId: 1,
      label: "B. 良性或炎症性病变",
      shortLabel: "良性/炎症",
      description: "倾向声带良性改变、炎症或反应性病变。"
    },
    {
      id: "class-2",
      classId: 2,
      label: "C. 中高风险病变",
      shortLabel: "中高风险病变",
      description: "提示中高风险病变，需要结合病理、窄带血管形态或短期复查进一步判断。"
    },
    {
      id: "class-3",
      classId: 3,
      label: "D. 高度可疑恶性 / 最高风险",
      shortLabel: "最高风险",
      description: "需要优先处理，建议尽快完善活检或治疗路径。"
    }
  ],
  cases: [
    makeCase("case-001", "C0_P001", "病例 001", "class 0 低风险", 0, 0, 0.86, [0.86, 0.09, 0.04, 0.01], 2, 2),
    makeCase("case-002", "C0_P002", "病例 002", "class 0 低风险", 0, 2, 0.83, [0.05, 0.06, 0.83, 0.06], 2, 1, ["NBI 血管纹理提示风险升高", "白光下局部边界不均", "该例用于观察 AI 过诊断后的医生修正"]),
    makeCase("case-003", "C0_P004", "病例 003", "class 0 低风险", 0, 0, 0.79, [0.79, 0.14, 0.05, 0.02], 2, 2),
    makeCase("case-004", "C0_P049", "病例 004", "class 0 低风险", 0, 0, 0.82, [0.82, 0.10, 0.06, 0.02], 2, 2),
    makeCase("case-005", "C0_P050", "病例 005", "class 0 低风险", 0, 0, 0.77, [0.77, 0.16, 0.05, 0.02], 2, 2),

    makeCase("case-006", "C1_P001", "病例 006", "class 1 良性/炎症", 1, 1, 0.76, [0.10, 0.76, 0.10, 0.04], 1, 1),
    makeCase("case-007", "C1_P002", "病例 007", "class 1 良性/炎症", 1, 1, 0.74, [0.08, 0.74, 0.13, 0.05], 2, 2),
    makeCase("case-008", "C1_P003", "病例 008", "class 1 良性/炎症", 1, 1, 0.72, [0.11, 0.72, 0.12, 0.05], 2, 1),
    makeCase("case-009", "C1_P012", "病例 009", "class 1 良性/炎症", 1, 1, 0.78, [0.09, 0.78, 0.09, 0.04], 1, 1),
    makeCase("case-010", "C1_P013", "病例 010", "class 1 良性/炎症", 1, 1, 0.75, [0.10, 0.75, 0.11, 0.04], 1, 1),

    makeCase("case-011", "C2_P001", "病例 011", "class 2 中高风险", 2, 2, 0.80, [0.04, 0.09, 0.80, 0.07], 1, 1),
    makeCase("case-012", "C2_P005", "病例 012", "class 2 中高风险", 2, 2, 0.73, [0.06, 0.12, 0.73, 0.09], 1, 1),
    makeCase("case-013", "C2_P008", "病例 013", "class 2 中高风险", 2, 2, 0.82, [0.04, 0.08, 0.82, 0.06], 2, 2),
    makeCase("case-014", "C2_P009", "病例 014", "class 2 中高风险", 2, 3, 0.66, [0.03, 0.06, 0.25, 0.66], 2, 2, ["AI 更偏向最高风险", "中高风险与最高风险概率接近", "该例适合评估医生是否被 AI 上调风险等级影响"]),
    makeCase("case-015", "C2_P010", "病例 015", "class 2 中高风险", 2, 2, 0.84, [0.03, 0.07, 0.84, 0.06], 2, 2),

    makeCase("case-016", "C3_P001", "病例 016", "class 3 最高风险", 3, 3, 0.88, [0.01, 0.03, 0.08, 0.88], 2, 2),
    makeCase("case-017", "C3_P002", "病例 017", "class 3 最高风险", 3, 3, 0.86, [0.02, 0.04, 0.08, 0.86], 2, 2),
    makeCase("case-018", "C3_P003", "病例 018", "class 3 最高风险", 3, 3, 0.90, [0.01, 0.02, 0.07, 0.90], 2, 2),
    makeCase("case-019", "C3_P004", "病例 019", "class 3 最高风险", 3, 3, 0.88, [0.01, 0.03, 0.08, 0.88], 2, 2),
    makeCase("case-020", "C3_P005", "病例 020", "class 3 最高风险", 3, 2, 0.69, [0.05, 0.07, 0.69, 0.19], 2, 2, ["AI 倾向中高风险但最高风险概率不低", "属于需要医生重点复核的分歧样例", "建议结合病理和临床处理"])
  ]
};

function makeCase(id, patientAlias, title, cohort, groundTruthClassId, predictedClassId, confidence, probabilities, wlbCount, nbiCount, evidence) {
  return {
    id,
    patientAlias,
    title,
    cohort,
    groundTruthClassId,
    images: [
      ...makeImages(id, "WLB", wlbCount, "白光喉镜"),
      ...makeImages(id, "NBI", nbiCount, "窄带喉镜")
    ],
    ai: {
      model: "ResNet18 WLB-NBI fusion demo",
      predictedClassId,
      confidence,
      probabilities,
      evidence: evidence || defaultEvidence(predictedClassId)
    }
  };
}

function makeImages(caseId, modality, count, captionPrefix) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const filename = modality === "WLB" ? `wlb-${number}.jpg` : `nbi-${number}.jpg`;
    return {
      modality,
      src: `./assets/cases/${caseId}/${modality}/${filename}`,
      caption: `${captionPrefix} ${number}`
    };
  });
}

function defaultEvidence(predictedClassId) {
  const evidenceByClass = {
    0: ["白光和窄带图像未提示明确高级别风险", "模型倾向低风险", "可结合临床随访策略"],
    1: ["整体更符合良性或炎症性改变", "高风险概率较低", "建议结合症状与常规处理"],
    2: ["双模态提示可疑癌前或中高风险特征", "最高风险概率未超过阈值", "建议病理或短期复查确认"],
    3: ["白光与 NBI 均提示较高风险", "局部结构或血管模式不规则", "建议优先完善活检或治疗路径"]
  };
  return evidenceByClass[predictedClassId];
}
