const STORAGE_KEY = "laryngoscope-human-machine-records-v2";
const PROFILE_KEY = "laryngoscope-doctor-profile-v1";
const CASES_KEY = "laryngoscope-custom-cases-v1";
const CASE_SETTINGS_PASSWORD = "wbzdmm123";
const AGENT_API_BASE = window.LARYNGOSCOPE_AGENT_API_BASE || "";
const RESULT_SAVE_KEY = "laryngoscope-result-save-v1";

const defaultData = JSON.parse(JSON.stringify(window.LARYNGOSCOPE_CASES));
normalizeDiagnosisOptions(defaultData.diagnosisOptions);

let data = {
  diagnosisOptions: defaultData.diagnosisOptions,
  cases: loadCustomCases() || defaultData.cases
};
let optionsByClass = new Map(data.diagnosisOptions.map((option) => [option.classId, option]));

const state = {
  caseIndex: 0,
  step: "doctor",
  modality: "ALL",
  compareMode: false,
  settingsCaseIndex: 0,
  records: loadRecords(),
  doctorProfile: loadDoctorProfile()
};

const els = {
  caseCount: document.querySelector("#caseCount"),
  caseList: document.querySelector("#caseList"),
  patientAlias: document.querySelector("#patientAlias"),
  caseTitle: document.querySelector("#caseTitle"),
  phasePill: document.querySelector("#phasePill"),
  savePill: document.querySelector("#savePill"),
  imageGrid: document.querySelector("#imageGrid"),
  compareMode: document.querySelector("#compareMode"),
  doctorOptions: document.querySelector("#doctorOptions"),
  finalOptions: document.querySelector("#finalOptions"),
  doctorForm: document.querySelector("#doctorForm"),
  finalForm: document.querySelector("#finalForm"),
  aiSection: document.querySelector("#aiSection"),
  aiResult: document.querySelector("#aiResult"),
  acceptAiButton: document.querySelector("#acceptAiButton"),
  doctorNote: document.querySelector("#doctorNote"),
  aiInfluence: document.querySelector("#aiInfluence"),
  finalNote: document.querySelector("#finalNote"),
  caseSummary: document.querySelector("#caseSummary"),
  nextCaseButton: document.querySelector("#nextCaseButton"),
  finishExportActions: document.querySelector("#finishExportActions"),
  finishExportCsvButton: document.querySelector("#finishExportCsvButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  resetCaseButton: document.querySelector("#resetCaseButton"),
  imageDialog: document.querySelector("#imageDialog"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogCaption: document.querySelector("#dialogCaption"),
  doctorLevelDialog: document.querySelector("#doctorLevelDialog"),
  doctorLevelForm: document.querySelector("#doctorLevelForm"),
  caseSettingsButton: document.querySelector("#caseSettingsButton"),
  caseSettingsDialog: document.querySelector("#caseSettingsDialog"),
  caseSettingsAuthForm: document.querySelector("#caseSettingsAuthForm"),
  caseSettingsForm: document.querySelector("#caseSettingsForm"),
  caseSettingsPassword: document.querySelector("#caseSettingsPassword"),
  caseSettingsError: document.querySelector("#caseSettingsError"),
  settingsCaseList: document.querySelector("#settingsCaseList"),
  settingsCaseTitle: document.querySelector("#settingsCaseTitle"),
  settingsPatientAlias: document.querySelector("#settingsPatientAlias"),
  settingsCaseClass: document.querySelector("#settingsCaseClass"),
  settingsAiClass: document.querySelector("#settingsAiClass"),
  settingsAiConfidence: document.querySelector("#settingsAiConfidence"),
  settingsWlbFiles: document.querySelector("#settingsWlbFiles"),
  settingsNbiFiles: document.querySelector("#settingsNbiFiles"),
  settingsWlbPreview: document.querySelector("#settingsWlbPreview"),
  settingsNbiPreview: document.querySelector("#settingsNbiPreview"),
  closeCaseSettingsButton: document.querySelector("#closeCaseSettingsButton"),
  restoreDefaultCasesButton: document.querySelector("#restoreDefaultCasesButton")
};

const doctorLevelLabels = {
  junior: "初级",
  intermediate: "中级",
  senior: "高级"
};

function normalizeDiagnosisOptions(options) {
  const class2 = options.find((option) => option.classId === 2);
  if (class2) {
    class2.label = "C. 中高风险病变";
    class2.shortLabel = "中高风险病变";
    class2.description = "提示中高风险病变，需要结合病理、窄带血管形态或短期复查进一步判断。";
  }
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function loadDoctorProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
  } catch {
    return null;
  }
}

function saveDoctorProfile(level) {
  state.doctorProfile = {
    level,
    levelLabel: doctorLevelLabels[level],
    submittedAt: new Date().toISOString()
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(state.doctorProfile));
}

function loadCustomCases() {
  try {
    const customCases = JSON.parse(localStorage.getItem(CASES_KEY));
    return Array.isArray(customCases) ? customCases : null;
  } catch {
    return null;
  }
}

function saveCustomCases(cases) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

function ensureDoctorProfile() {
  if (!state.doctorProfile && els.doctorLevelDialog && !els.doctorLevelDialog.open) {
    els.doctorLevelDialog.showModal();
  }
}

function currentCase() {
  return data.cases[state.caseIndex];
}

function currentRecord() {
  const caseId = currentCase().id;
  state.records[caseId] ||= { caseId, createdAt: new Date().toISOString() };
  return state.records[caseId];
}

function optionLabel(classId) {
  return optionsByClass.get(Number(classId))?.shortLabel || "-";
}

function render() {
  if (state.caseIndex >= data.cases.length) state.caseIndex = 0;
  const caseItem = currentCase();
  const record = currentRecord();
  const isDoctorSubmitted = Boolean(record.doctor);
  const isFinalSubmitted = Boolean(record.final);

  if (!isDoctorSubmitted) state.step = "doctor";
  if (state.step === "final" && !isDoctorSubmitted) state.step = "doctor";
  if (state.step === "ai" && !isDoctorSubmitted) state.step = "doctor";

  els.caseCount.textContent = `${state.caseIndex + 1}/${data.cases.length}`;
  els.patientAlias.textContent = caseItem.patientAlias;
  els.caseTitle.textContent = caseItem.title;
  els.phasePill.textContent = phaseLabel(state.step);
  els.savePill.textContent = isFinalSubmitted ? "已完成" : isDoctorSubmitted ? "初诊已保存" : "未保存";

  renderCaseList();
  renderImages(caseItem);
  renderChoices(els.doctorOptions, "doctorDiagnosis", record.doctor?.diagnosisClassId);
  renderChoices(els.finalOptions, "finalDiagnosis", record.final?.diagnosisClassId ?? record.doctor?.diagnosisClassId);
  renderAi(caseItem, record);
  renderForms(record);
  renderSummary(caseItem, record);
  renderCaseAction(record);
}

function phaseLabel(step) {
  return {
    doctor: "医生初诊",
    ai: "AI 输出",
    final: "医生复核"
  }[step];
}

function renderCaseList() {
  els.caseList.innerHTML = data.cases
    .map((caseItem, index) => {
      const record = state.records[caseItem.id];
      const status = record?.final ? "完成" : record?.doctor ? "待复核" : "未作答";
      const active = index === state.caseIndex ? "is-active" : "";
      return `
        <button class="case-item ${active}" type="button" data-case-index="${index}">
          <span>
            <strong>${caseItem.title}</strong>
            <small>${caseItem.patientAlias}</small>
          </span>
          <em>${status}</em>
        </button>
      `;
    })
    .join("");
}

function renderImages(caseItem) {
  const images = caseItem.images.filter((image) => state.modality === "ALL" || image.modality === state.modality);
  els.imageGrid.classList.toggle("compare-mode", state.compareMode);
  els.imageGrid.innerHTML = images
    .map((image, index) => `
      <figure class="scope-image" data-image-index="${index}">
        <img src="${image.src}" alt="${caseItem.patientAlias} ${image.caption}" loading="lazy" />
        <figcaption>
          <span>${image.modality}</span>
          <strong>${image.caption}</strong>
        </figcaption>
      </figure>
    `)
    .join("");
}

function renderChoices(container, name, selectedClassId) {
  container.innerHTML = data.diagnosisOptions
    .map((option) => {
      const checked = Number(selectedClassId) === option.classId ? "checked" : "";
      return `
        <label class="choice">
          <input type="radio" name="${name}" value="${option.classId}" ${checked} required />
          <span>
            <strong>${option.label}</strong>
            <small>${option.description}</small>
          </span>
        </label>
      `;
    })
    .join("");
}

function currentAi(caseItem, record = currentRecord()) {
  return record.ai || caseItem.ai;
}

function renderAi(caseItem, record = currentRecord()) {
  if (record.aiStatus === "loading") {
    els.aiResult.innerHTML = `
      <div class="ai-call">
        <span>AI 预测</span>
        <strong>诊断辅助智能体正在分析</strong>
        <small>正在读取 WLB/NBI 图像并生成辅助意见</small>
      </div>
    `;
    return;
  }

  if (record.aiStatus === "error") {
    els.aiResult.innerHTML = `
      <div class="ai-call">
        <span>AI 预测</span>
        <strong>智能体调用失败</strong>
        <small>${record.aiError || "请确认后端服务是否已启动"}</small>
      </div>
    `;
    return;
  }

  const ai = currentAi(caseItem, record);
  const aiOption = optionsByClass.get(ai.predictedClassId);
  const bars = ai.probabilities
    .map((probability, index) => {
      const option = optionsByClass.get(index);
      return `
        <div class="prob-row">
          <span>${option.shortLabel}</span>
          <div><i style="width:${Math.round(probability * 100)}%"></i></div>
          <strong>${Math.round(probability * 100)}%</strong>
        </div>
      `;
    })
    .join("");

  els.aiResult.innerHTML = `
    <div class="ai-call">
      <span>AI 预测</span>
      <strong>${aiOption.label}</strong>
      <small>${ai.model} · 置信度 ${Math.round(ai.confidence * 100)}%</small>
    </div>
    <div class="prob-list">${bars}</div>
    <ul class="evidence-list">
      ${ai.evidence.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function renderAiLegacy(caseItem) {
  const aiOption = optionsByClass.get(caseItem.ai.predictedClassId);
  const bars = caseItem.ai.probabilities
    .map((probability, index) => {
      const option = optionsByClass.get(index);
      return `
        <div class="prob-row">
          <span>${option.shortLabel}</span>
          <div><i style="width:${Math.round(probability * 100)}%"></i></div>
          <strong>${Math.round(probability * 100)}%</strong>
        </div>
      `;
    })
    .join("");

  els.aiResult.innerHTML = `
    <div class="ai-call">
      <span>AI 预测</span>
      <strong>${aiOption.label}</strong>
      <small>${caseItem.ai.model} · 置信度 ${Math.round(caseItem.ai.confidence * 100)}%</small>
    </div>
    <div class="prob-list">${bars}</div>
    <ul class="evidence-list">
      ${caseItem.ai.evidence.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function renderForms(record) {
  document.querySelectorAll(".step").forEach((button) => {
    const step = button.dataset.step;
    button.classList.toggle("is-active", step === state.step);
    button.disabled = step !== "doctor" && !record.doctor;
  });

  document.querySelectorAll(".flow-section").forEach((section) => section.classList.remove("is-active"));
  if (state.step === "doctor") els.doctorForm.classList.add("is-active");
  if (state.step === "ai") els.aiSection.classList.add("is-active");
  if (state.step === "final") els.finalForm.classList.add("is-active");

  els.doctorNote.value = record.doctor?.note || "";
  els.finalNote.value = record.final?.note || "";
  els.aiInfluence.value = record.final?.aiInfluence || "unchanged";
  els.acceptAiButton.disabled = record.aiStatus === "loading" || record.aiStatus === "error";
}

function renderSummary(caseItem, record) {
  const ai = currentAi(caseItem, record);
  const aiClass = ai.predictedClassId;
  const aiSummary = record.doctor ? `${optionLabel(aiClass)} (${Math.round(ai.confidence * 100)}%)` : "初诊提交后显示";
  const finalSummary = record.doctor ? (record.final ? optionLabel(record.final.diagnosisClassId) : "未提交") : "复核阶段显示";
  els.caseSummary.innerHTML = `
    <div><dt>医生级别</dt><dd>${state.doctorProfile?.levelLabel || "未填写"}</dd></div>
    <div><dt>医生初诊</dt><dd>${record.doctor ? optionLabel(record.doctor.diagnosisClassId) : "未提交"}</dd></div>
    <div><dt>AI 输出</dt><dd>${aiSummary}</dd></div>
    <div><dt>最终意见</dt><dd>${finalSummary}</dd></div>
  `;
}

function renderCaseAction(record) {
  const allCompleted = data.cases.every((caseItem) => state.records[caseItem.id]?.final);
  const isCurrentCompleted = Boolean(record.final);

  els.finishExportActions.classList.toggle("is-visible", allCompleted);
  els.nextCaseButton.hidden = allCompleted;

  if (allCompleted) return;

  els.nextCaseButton.disabled = !isCurrentCompleted;
  if (!isCurrentCompleted) {
    els.nextCaseButton.textContent = "完成本病例后进入下一例";
    return;
  }

  const nextIndex = getNextCaseIndex();
  els.nextCaseButton.textContent = nextIndex > state.caseIndex ? "进入下一病例" : "进入未完成病例";
}

async function submitDoctor(event) {
  event.preventDefault();
  ensureDoctorProfile();
  if (!state.doctorProfile) return;

  const selected = new FormData(els.doctorForm).get("doctorDiagnosis");
  if (selected === null) return;

  const caseItem = currentCase();
  const record = currentRecord();
  record.doctor = {
    doctorLevel: state.doctorProfile.level,
    doctorLevelLabel: state.doctorProfile.levelLabel,
    diagnosisClassId: Number(selected),
    note: els.doctorNote.value.trim(),
    submittedAt: new Date().toISOString()
  };
  delete record.final;
  delete record.ai;
  record.aiStatus = "loading";
  delete record.aiError;
  saveRecords();
  state.step = "ai";
  render();
  await requestAgentDiagnosis(caseItem, record);
}

async function requestAgentDiagnosis(caseItem, record) {
  if (!AGENT_API_BASE) {
    record.ai = caseItem.ai;
    record.aiStatus = "ready";
    delete record.aiError;
    saveRecords();
    render();
    return;
  }

  try {
    const response = await fetch(`${AGENT_API_BASE}/api/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: caseItem.id,
        patientAlias: caseItem.patientAlias,
        title: caseItem.title,
        images: caseItem.images,
        doctorInitialClassId: record.doctor?.diagnosisClassId ?? null,
        doctorNote: record.doctor?.note ?? "",
        fallbackAi: caseItem.ai
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    record.ai = {
      model: result.model,
      predictedClassId: result.predictedClassId,
      confidence: result.confidence,
      probabilities: result.probabilities,
      evidence: [
        ...(result.evidence || []),
        result.recommendation ? `建议：${result.recommendation}` : "",
        result.uncertainty ? `不确定性：${result.uncertainty}` : "",
        ...(result.warnings || []).map((item) => `提示：${item}`)
      ].filter(Boolean)
    };
    record.aiStatus = "ready";
    delete record.aiError;
  } catch (error) {
    record.aiStatus = "error";
    record.aiError = `诊断辅助智能体不可用：${error.message}`;
  }
  saveRecords();
  render();
}

async function submitFinal(event) {
  event.preventDefault();
  ensureDoctorProfile();
  if (!state.doctorProfile) return;

  const selected = new FormData(els.finalForm).get("finalDiagnosis");
  if (selected === null) return;

  const record = currentRecord();
  record.final = {
    doctorLevel: state.doctorProfile.level,
    doctorLevelLabel: state.doctorProfile.levelLabel,
    diagnosisClassId: Number(selected),
    aiInfluence: els.aiInfluence.value,
    note: els.finalNote.value.trim(),
    submittedAt: new Date().toISOString()
  };
  saveRecords();
  render();
  if (allCasesCompleted()) {
    await saveResultsToBackend({ silent: true });
  }
}

function resetCurrentCase() {
  const caseId = currentCase().id;
  delete state.records[caseId];
  saveRecords();
  state.step = "doctor";
  render();
}

async function exportCsv() {
  const payload = buildExportPayload();
  await saveResultsToBackend({ payload, silent: true });
  const rows = [
    ["doctor_level", "case_id", "patient_alias", "doctor_initial", "ai_prediction", "ai_confidence", "final_diagnosis", "ai_influence", "doctor_note", "final_note", "doctor_submitted_at", "final_submitted_at"],
    ...payload.records.map((row) => [
      row.doctorLevelLabel,
      row.caseId,
      row.patientAlias,
      row.doctorInitialLabel,
      row.aiPredictionLabel,
      row.aiConfidence,
      row.finalDiagnosisLabel,
      row.aiInfluence,
      row.doctorNote,
      row.finalNote,
      row.doctorSubmittedAt,
      row.finalSubmittedAt
    ])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile("human-machine-results.csv", csv, "text/csv;charset=utf-8");
}

function allCasesCompleted() {
  return data.cases.every((caseItem) => state.records[caseItem.id]?.final);
}

function getNextCaseIndex() {
  for (let index = state.caseIndex + 1; index < data.cases.length; index += 1) {
    if (!state.records[data.cases[index].id]?.final) return index;
  }
  for (let index = 0; index < state.caseIndex; index += 1) {
    if (!state.records[data.cases[index].id]?.final) return index;
  }
  return Math.min(state.caseIndex + 1, data.cases.length - 1);
}

function goToNextCase() {
  const record = currentRecord();
  if (!record.final) return;
  state.caseIndex = getNextCaseIndex();
  state.step = state.records[currentCase().id]?.doctor ? "ai" : "doctor";
  render();
}

function buildExportPayload() {
  return {
    exportedAt: new Date().toISOString(),
    system: "laryngoscope-human-machine-control",
    doctorProfile: state.doctorProfile,
    records: data.cases.map((caseItem) => {
      const record = state.records[caseItem.id] || {};
      const ai = currentAi(caseItem, record);
      return {
        doctorLevel: record.doctor?.doctorLevel || record.final?.doctorLevel || state.doctorProfile?.level || "",
        doctorLevelLabel: record.doctor?.doctorLevelLabel || record.final?.doctorLevelLabel || state.doctorProfile?.levelLabel || "",
        caseId: caseItem.id,
        patientAlias: caseItem.patientAlias,
        doctorInitialClassId: record.doctor?.diagnosisClassId ?? null,
        doctorInitialLabel: record.doctor ? optionLabel(record.doctor.diagnosisClassId) : "",
        doctorNote: record.doctor?.note ?? "",
        aiPredictionClassId: ai.predictedClassId,
        aiPredictionLabel: optionLabel(ai.predictedClassId),
        aiConfidence: ai.confidence,
        aiProbabilities: ai.probabilities,
        finalDiagnosisClassId: record.final?.diagnosisClassId ?? null,
        finalDiagnosisLabel: record.final ? optionLabel(record.final.diagnosisClassId) : "",
        aiInfluence: record.final?.aiInfluence ?? "",
        finalNote: record.final?.note ?? "",
        doctorSubmittedAt: record.doctor?.submittedAt ?? "",
        finalSubmittedAt: record.final?.submittedAt ?? ""
      };
    })
  };
}

async function saveResultsToBackend({ payload = buildExportPayload(), silent = false } = {}) {
  if (!AGENT_API_BASE) return null;
  const fingerprint = JSON.stringify({
    doctorProfile: payload.doctorProfile,
    records: payload.records.map((record) => ({
      caseId: record.caseId,
      finalDiagnosisClassId: record.finalDiagnosisClassId,
      finalSubmittedAt: record.finalSubmittedAt
    }))
  });
  const previous = loadResultSaveState();
  if (previous?.fingerprint === fingerprint && previous?.submissionId) return previous;

  try {
    const response = await fetch(`${AGENT_API_BASE}/api/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const state = {
      fingerprint,
      submissionId: result.submissionId,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(RESULT_SAVE_KEY, JSON.stringify(state));
    return state;
  } catch (error) {
    if (!silent) alert(`结果保存到后台失败：${error.message}`);
    return null;
  }
}

function loadResultSaveState() {
  try {
    return JSON.parse(localStorage.getItem(RESULT_SAVE_KEY)) || null;
  } catch {
    return null;
  }
}

function openCaseSettings() {
  els.caseSettingsPassword.value = "";
  els.caseSettingsError.textContent = "";
  els.caseSettingsAuthForm.hidden = false;
  els.caseSettingsForm.hidden = true;
  els.caseSettingsDialog.showModal();
}

function unlockCaseSettings(event) {
  event.preventDefault();
  if (els.caseSettingsPassword.value !== CASE_SETTINGS_PASSWORD) {
    els.caseSettingsError.textContent = "密码错误，请重新输入。";
    return;
  }
  els.caseSettingsAuthForm.hidden = true;
  els.caseSettingsForm.hidden = false;
  renderSettingsEditor();
}

function validateCases(candidate) {
  if (!Array.isArray(candidate)) throw new Error("病例数据必须是数组。");
  if (candidate.length !== 20) throw new Error("病例数量必须正好是 20 个。");
  const ids = new Set();
  candidate.forEach((caseItem, index) => {
    if (!caseItem.id || !caseItem.patientAlias || !caseItem.title) throw new Error(`第 ${index + 1} 个病例缺少 id、patientAlias 或 title。`);
    if (ids.has(caseItem.id)) throw new Error(`病例 id 重复：${caseItem.id}`);
    ids.add(caseItem.id);
    if (!Array.isArray(caseItem.images) || caseItem.images.length === 0) throw new Error(`${caseItem.id} 缺少 images。`);
    const modalities = new Set(caseItem.images.map((image) => image.modality));
    if (!modalities.has("WLB") || !modalities.has("NBI")) throw new Error(`${caseItem.id} 必须至少包含 WLB 和 NBI 图像。`);
    caseItem.images.forEach((image) => {
      if (!image.modality || !image.src || !image.caption) throw new Error(`${caseItem.id} 的图像缺少 modality、src 或 caption。`);
    });
    if (!caseItem.ai || typeof caseItem.ai.predictedClassId !== "number") throw new Error(`${caseItem.id} 缺少 ai.predictedClassId。`);
    if (!Array.isArray(caseItem.ai.probabilities) || caseItem.ai.probabilities.length !== 4) throw new Error(`${caseItem.id} 的 AI 概率必须是 4 个数。`);
    if (!Array.isArray(caseItem.ai.evidence)) caseItem.ai.evidence = [];
    if (!caseItem.ai.model) caseItem.ai.model = "Custom AI result";
    if (typeof caseItem.ai.confidence !== "number") caseItem.ai.confidence = Math.max(...caseItem.ai.probabilities);
  });
}

function renderSettingsEditor() {
  renderSettingsCaseList();
  renderSettingsForm();
}

function renderSettingsCaseList() {
  els.settingsCaseList.innerHTML = data.cases
    .map((caseItem, index) => `
      <button class="settings-case-item ${index === state.settingsCaseIndex ? "is-active" : ""}" type="button" data-settings-case-index="${index}">
        <strong>${caseItem.title}</strong>
        <small>${caseItem.patientAlias}</small>
      </button>
    `)
    .join("");
}

function renderSettingsForm() {
  const caseItem = data.cases[state.settingsCaseIndex];
  els.settingsCaseTitle.value = caseItem.title;
  els.settingsPatientAlias.value = caseItem.patientAlias;
  els.settingsCaseClass.value = String(caseItem.groundTruthClassId ?? 0);
  els.settingsAiClass.value = String(caseItem.ai?.predictedClassId ?? 0);
  els.settingsAiConfidence.value = caseItem.ai?.confidence ?? 0.8;
  els.settingsWlbFiles.value = "";
  els.settingsNbiFiles.value = "";
  renderSettingsPreview("WLB");
  renderSettingsPreview("NBI");
}

function renderSettingsPreview(modality) {
  const caseItem = data.cases[state.settingsCaseIndex];
  const container = modality === "WLB" ? els.settingsWlbPreview : els.settingsNbiPreview;
  const images = caseItem.images.filter((image) => image.modality === modality);
  container.innerHTML = images.length
    ? images.map((image) => `
      <figure>
        <img src="${image.src}" alt="${image.caption}" />
        <figcaption>${image.caption}</figcaption>
      </figure>
    `).join("")
    : `<p>尚未上传 ${modality} 图像</p>`;
}

async function handleSettingsFiles(event, modality) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  const caseItem = data.cases[state.settingsCaseIndex];
  const uploaded = await Promise.all(files.map((file, index) => fileToImage(file, modality, index)));
  caseItem.images = [
    ...caseItem.images.filter((image) => image.modality !== modality),
    ...uploaded
  ];
  renderSettingsPreview(modality);
}

function fileToImage(file, modality, index) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1000;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const number = String(index + 1).padStart(2, "0");
        resolve({
          modality,
          src: canvas.toDataURL("image/jpeg", 0.78),
          caption: `${modality === "WLB" ? "白光喉镜" : "窄带喉镜"} ${number}`
        });
      };
      image.onerror = () => reject(new Error(`无法读取图片：${file.name}`));
      image.src = reader.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildProbabilities(predictedClassId, confidence) {
  const safeConfidence = Math.min(1, Math.max(0, Number(confidence)));
  const remainder = Math.max(0, 1 - safeConfidence);
  const other = remainder / 3;
  return [0, 1, 2, 3].map((classId) => classId === predictedClassId ? safeConfidence : Number(other.toFixed(4)));
}

function saveCurrentCaseSettings(event) {
  event.preventDefault();
  try {
    const caseItem = data.cases[state.settingsCaseIndex];
    const aiClass = Number(els.settingsAiClass.value);
    const aiConfidence = Number(els.settingsAiConfidence.value);
    caseItem.title = els.settingsCaseTitle.value.trim();
    caseItem.patientAlias = els.settingsPatientAlias.value.trim();
    caseItem.groundTruthClassId = Number(els.settingsCaseClass.value);
    caseItem.ai = {
      ...(caseItem.ai || {}),
      model: caseItem.ai?.model || "Custom AI result",
      predictedClassId: aiClass,
      confidence: aiConfidence,
      probabilities: buildProbabilities(aiClass, aiConfidence),
      evidence: caseItem.ai?.evidence || ["自定义病例数据"]
    };
    validateCases(data.cases);
    saveCustomCases(data.cases);
    state.records = {};
    state.caseIndex = 0;
    state.step = "doctor";
    saveRecords();
    renderSettingsEditor();
    render();
    alert("当前病例数据已保存，作答记录已重置。");
  } catch (error) {
    alert(`病例数据格式错误：${error.message}`);
  }
}

function restoreDefaultCases() {
  localStorage.removeItem(CASES_KEY);
  data = { diagnosisOptions: defaultData.diagnosisOptions, cases: defaultData.cases };
  optionsByClass = new Map(data.diagnosisOptions.map((option) => [option.classId, option]));
  state.records = {};
  state.caseIndex = 0;
  state.step = "doctor";
  saveRecords();
  renderSettingsEditor();
  render();
  alert("已恢复默认 20 个病例，作答记录已重置。");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

els.caseList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-case-index]");
  if (!button) return;
  state.caseIndex = Number(button.dataset.caseIndex);
  state.step = state.records[currentCase().id]?.doctor ? "ai" : "doctor";
  render();
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    state.modality = button.dataset.modality;
    document.querySelectorAll(".segment").forEach((item) => item.classList.toggle("is-active", item === button));
    renderImages(currentCase());
  });
});

document.querySelectorAll(".step").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) return;
    state.step = button.dataset.step;
    render();
  });
});

els.compareMode.addEventListener("change", () => {
  state.compareMode = els.compareMode.checked;
  renderImages(currentCase());
});

els.imageGrid.addEventListener("click", (event) => {
  const figure = event.target.closest(".scope-image");
  if (!figure) return;
  const image = figure.querySelector("img");
  const caption = figure.querySelector("figcaption").innerText;
  els.dialogImage.src = image.src;
  els.dialogImage.alt = image.alt;
  els.dialogCaption.textContent = caption;
  els.imageDialog.showModal();
});

document.querySelector(".image-dialog .dialog-close").addEventListener("click", () => els.imageDialog.close());
els.doctorLevelDialog.addEventListener("cancel", (event) => event.preventDefault());
els.doctorLevelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = new FormData(els.doctorLevelForm).get("doctorLevel");
  if (!selected) return;
  saveDoctorProfile(selected);
  els.doctorLevelDialog.close();
  render();
});
els.doctorForm.addEventListener("submit", submitDoctor);
els.finalForm.addEventListener("submit", submitFinal);
els.acceptAiButton.addEventListener("click", () => {
  state.step = "final";
  render();
});
els.exportCsvButton.addEventListener("click", exportCsv);
els.finishExportCsvButton.addEventListener("click", exportCsv);
els.nextCaseButton.addEventListener("click", goToNextCase);
els.resetCaseButton.addEventListener("click", resetCurrentCase);
els.caseSettingsButton.addEventListener("click", openCaseSettings);
els.caseSettingsAuthForm.addEventListener("submit", unlockCaseSettings);
els.caseSettingsForm.addEventListener("submit", saveCurrentCaseSettings);
els.settingsCaseList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-settings-case-index]");
  if (!button) return;
  state.settingsCaseIndex = Number(button.dataset.settingsCaseIndex);
  renderSettingsEditor();
});
els.settingsWlbFiles.addEventListener("change", (event) => handleSettingsFiles(event, "WLB"));
els.settingsNbiFiles.addEventListener("change", (event) => handleSettingsFiles(event, "NBI"));
els.closeCaseSettingsButton.addEventListener("click", () => els.caseSettingsDialog.close());
els.restoreDefaultCasesButton.addEventListener("click", restoreDefaultCases);

render();
ensureDoctorProfile();
