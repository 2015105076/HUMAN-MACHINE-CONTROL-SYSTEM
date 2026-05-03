# 线上部署说明

当前系统是纯前端静态页面，适合直接部署到 Vercel、Netlify 或任意静态网站托管服务。

## 重要限制

页面右上角“病例数据设置”中上传的图片和分类会保存在当前浏览器本地存储中。也就是说：

- 设置者本人刷新页面后仍能看到自己设置的数据。
- 其他电脑、手机、平板或其他浏览器不会自动看到这份本地设置。
- 如果要让不同局域网下的设备访问同一套“病例数据设置”内容，需要接入公共后端或数据库。

## 可选方案

1. 把最终病例数据写入 `data/cases.js` 后再部署。
   这种方式最稳定，所有访问者看到同一套病例，但每次修改病例都需要重新部署。

2. 增加后端数据库。
   例如使用 Supabase、Firebase、Vercel KV/Blob 或自有服务器。这样管理员在线上传后，所有访问者都能看到同一套数据。

3. 自建服务器部署。
   如果部署到一台公网服务器，并使用文件或数据库保存病例配置，就可以满足在线统一维护病例数据。
# Vercel 静态部署

本目录是纯静态人机对照系统，可以直接部署到 Vercel，不需要购买云服务器，也不强制需要购买域名。

## 推荐部署方式

1. 将项目推送到 GitHub。
2. 打开 Vercel，选择 `Add New Project`。
3. 选择本仓库。
4. 在项目设置中将 `Root Directory` 设置为：

```text
Human-machine control system
```

5. Framework Preset 选择：

```text
Other
```

6. Build Command 留空。
7. Output Directory 留空或填写：

```text
.
```

8. 点击 Deploy。

部署完成后，Vercel 会提供一个类似下面的免费地址：

```text
https://your-project-name.vercel.app
```

## 域名

不买域名也可以使用 Vercel 免费域名。正式收集实验数据时，建议后续再绑定自己的域名并开启 HTTPS。

## AI 结果模式

当前静态部署使用 `data/cases.js` 中预置的 AI 结果，不会调用云端模型。这样适合人机对照实验、病例浏览、医生初诊/复核和 CSV 导出。

如果以后要接真实模型推理，需要单独部署 `agent_api` 后端，并在页面加载前设置：

```html
<script>
  window.LARYNGOSCOPE_AGENT_API_BASE = "https://your-api-domain.com";
</script>
```

未设置该变量时，系统会自动使用静态预置 AI 结果。

## CSV 自动保存到后台

纯 Vercel 静态页面不能直接把 CSV 写入服务器目录。若需要“每位医生完成后自动保存到后台”，必须额外部署一个后端服务，并在页面加载前设置：

```html
<script>
  window.LARYNGOSCOPE_AGENT_API_BASE = "https://your-backend-domain.com";
</script>
```

配置后，系统会在医生完成全部病例或点击“导出 CSV”时，自动调用：

```text
POST /api/results
```

后端会保存：

```text
agent_api/saved_results/*.csv
agent_api/saved_results/*.json
```

如果只使用 Vercel 免费静态部署且不配置后端，则仍只能由浏览器下载 CSV。
