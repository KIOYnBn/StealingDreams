# 夜幕法官台

供线下狼人杀法官使用的静态网页。选择板子、登记玩家身份后，可以按步骤记录夜间行动，自动结算死讯、猎人技能、警徽和胜负，并在白天记录放逐结果。

## 本地运行

需要 Node.js 22 和 npm：

```sh
npm install
npm run dev
```

核心裁定规则可用 `node --test tests/game.test.mjs` 检查。

对局进度只保存在当前浏览器的 localStorage，不上传服务器。清理浏览器数据、切换浏览器或设备会丢失本地进度；界面包含所有身份和行动，请勿展示给玩家。

## 功能与规则

- 内置 12 人预女猎守、10 人预女猎守、9 人预女猎，也可自定义狼人、村民和支持的神职。
- 支持狼人、村民、预言家、女巫、猎人、守卫；支持空刀、空守、守卫不能连守、药剂消耗、女巫自救、同守同救、被毒猎人不能开枪。
- 可配置屠边或屠城、双药、奶穿猎人状态、狼刀优先、双方同时达成胜利条件的处理。
- 首日可在线下竞选后录入警长，支持警徽移交、白天发言阶段狼人自爆、直接记录放逐结果或逐票计数、平票 PK 和警长票权。
- 支持上一步回退、自动保存和下载对局记录。

默认按所有夜间死亡和猎人开枪处理完后判断胜负；“狼刀优先”模式下，狼刀单独满足狼人胜利条件时立即判狼人胜，后续毒药不结算。双方同时达成胜利条件时默认交由法官裁定。

警长竞选中的上警资格、退水及竞选 PK 由法官在线下处理并录入结果。警上自爆与吞警徽、白痴、狼王、丘比特等特殊角色和特殊遗言规则暂不自动裁定。请在开局前和玩家确认现场桌规。

## 发布到 GitHub Pages

本项目是 React + Vite 应用，已提供 `.github/workflows/deploy.yml` 自动构建和部署：

1. 在 GitHub 创建公开的空仓库，例如 `用户名.github.io`。
2. 在项目文件夹中执行以下命令，将项目推送到 `main` 分支。请将地址中的用户名和仓库名替换成自己的：

   ```sh
   git init
   git add .
   git commit -m "Create werewolf judge app"
   git branch -M main
   git remote add origin https://github.com/用户名/用户名.github.io.git
   git push -u origin main
   ```

   确保上传了 `.github/workflows/deploy.yml`。

3. 在仓库 **Settings > Pages > Build and deployment** 中，将 Source 设为 **GitHub Actions**。
4. 在 **Actions** 中运行或重新运行 `Deploy to GitHub Pages` 工作流。后续推送到 `main` 会自动部署。
5. 用户名仓库的网址为 `https://用户名.github.io/`；普通仓库的网址为 `https://用户名.github.io/仓库名/`。

工作流使用相对资源路径，支持 GitHub Pages 的项目子路径。对局数据仍然只保存在访问网页的设备上。
