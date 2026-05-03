# 喉镜人机对照 Web 页面系统

这是一个静态前端原型，用于完成“医生独立诊断 → AI 单独输出 → 医生查看 AI 后修正诊断”的人机对照流程。所有代码、样例图、文档和结果目录均位于 `Human-machine control system` 下。

## 使用方式

直接用浏览器打开 `index.html` 即可运行，不需要安装依赖或启动后端服务。

流程：

1. 打开页面后先在居中弹窗中选择医生级别：初级、中级或高级。
2. 选择左侧病例，查看同一患者的白光喉镜与窄带喉镜图像。
3. 在“医生独立诊断”阶段完成选择题和初诊意见。
4. 提交后进入“AI 单独输出”，查看 AI 类别、置信度、四分类概率和提示证据。
5. 进入“医生复核修正”，在已知 AI 输出后提交最终诊断。
6. 点击顶部按钮导出 CSV 结果。

## 目录结构

```text
Human-machine control system/
├─ index.html
├─ styles.css
├─ app.js
├─ data/
│  └─ cases.js
├─ assets/
│  └─ cases/
├─ docs/
│  └─ protocol.md
└─ results/
   └─ README.md
```

## 数据说明

- 当前 `assets/cases/` 内放置了 20 个患者级示例病例，四类病理状态各 5 个患者，每例均包含白光 WLB 和窄带 NBI 图片。
- 病例定义位于 `data/cases.js`，可继续追加病例、替换 AI 输出或调整诊断选项。
- 浏览器内的作答记录保存在 `localStorage`，导出文件由浏览器下载生成。

## 修改病例

页面右上角提供“病例数据设置”入口。点击后需要输入管理密码 `wbzdmm123`，密码正确后进入病例维护界面，可选择 20 个病例中的任意一例，上传 WLB/NBI 图像并设置病例分类。保存后系统会使用新病例数据，并重置当前作答记录。

图片路径建议放在本目录下，例如：

```text
./assets/cases/case-001/WLB/wlb-01.jpg
./assets/cases/case-001/NBI/nbi-01.jpg
```

如果需要直接替换图片，推荐在“病例数据设置”界面上传本地图片。

在 `data/cases.js` 中按同样结构添加：

```js
{
  id: "case-004",
  patientAlias: "匿名患者编号",
  title: "病例 004",
  cohort: "队列说明",
  images: [
    { modality: "WLB", src: "./assets/cases/case-004/WLB/wlb-01.jpg", caption: "白光喉镜 01" },
    { modality: "NBI", src: "./assets/cases/case-004/NBI/nbi-01.jpg", caption: "窄带喉镜 01" }
  ],
  ai: {
    model: "模型名称",
    predictedClassId: 0,
    confidence: 0.9,
    probabilities: [0.9, 0.05, 0.03, 0.02],
    evidence: ["AI 输出依据 1", "AI 输出依据 2"]
  }
}
```

四分类名称可在 `diagnosisOptions` 中修改。
