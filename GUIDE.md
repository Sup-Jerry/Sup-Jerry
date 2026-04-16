# GitHub Profile 动态扫雷展示 · 实现指导书

## 概览

在 GitHub 个人主页展示一个动态扫雷演示动画，包含：
- 上方：三句话打字机轮播
- 下方：扫雷棋盘动画（展开 → 插旗 → 亮绿点）

技术方案：**SVG + CSS 动画**，由 Node.js 脚本生成，通过 GitHub Actions 自动部署。

---

## 目录结构

```
{username}/          ← 与 GitHub 用户名同名的 profile 仓库
├── README.md
├── gen-svg.js       ← SVG 生成脚本（核心）
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## 第一步：创建 Profile 仓库

1. 打开 https://github.com/new
2. 仓库名填写**与用户名完全一致**的名称（如 `Sup-Jerry`）
3. 设为 **Public**
4. 不勾选任何初始化选项
5. 点击 Create repository

---

## 第二步：核心文件

### README.md

```markdown
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/{username}/{username}/output/minesweeper.svg">
  <img alt="minesweeper contribution animation" src="https://raw.githubusercontent.com/{username}/{username}/output/minesweeper.svg">
</picture>

</div>
```

> 注意：必须用 `raw.githubusercontent.com`，不能用 `blob` 链接，否则动画不播放。

---

### .github/workflows/deploy.yml

```yaml
name: deploy minesweeper svg

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 0 * * 0"   # 每周日自动更新
  workflow_dispatch:        # 支持手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Generate SVG
        run: node gen-svg.js

      - name: Deploy to output branch
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_branch: output
          publish_dir: .
          include_files: minesweeper.svg
```

---

## 第三步：gen-svg.js 结构说明

脚本分为五个层次：

```
gen-svg.js
├── 数据输入层    CONTRIB_GRID        ← 唯一需要替换的地方
├── 数字计算层    num[][]             ← 自动计算每格周围雷数
├── 展开顺序层    flood fill          ← 决定格子展开顺序
├── 时间轴层      revealTime/flagTime ← 每个动作的触发时间
└── SVG 渲染层    rects + overlays    ← 生成最终 SVG 元素
```

### 关键参数

| 参数 | 含义 | 当前值 |
|------|------|--------|
| `TOTAL` | 动画循环总秒数 | 14 |
| `REVEAL_DUR` | 格子展开阶段时长 | 5.0s |
| `TYPE_MS` | 打字机每字间隔 | 0.10s |
| `HOLD` | 每句话停留时长 | 1.8s |

---

## 第四步：部署流程

```bash
cd github-profile
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/{username}/{username}.git
git push -u origin main

# 手动触发 Action
gh workflow run deploy.yml --repo {username}/{username}
```

---

## 第五步：更新贡献图

1. 用以下 Prompt 让 AI 提取新截图数据：

```
我有一张 GitHub contribution graph 截图，请提取贡献网格数据，输出 JSON。
格式：[列][行]，53列×7行，值 0-4（0=无，4=最深绿）。
只输出 JSON：{"cols":53,"rows":7,"grid":[[...],...]}
```

2. 取 `grid` 字段替换 `gen-svg.js` 第 6 行的 `CONTRIB_GRID`
3. 推送，Action 自动重新生成

---

## 注意事项

- SVG 链接必须用 `raw.githubusercontent.com`，不能用 `blob` 链接
- GitHub 有约 5 分钟缓存，更新后等几分钟再刷新
- `output` 分支由 Action 自动管理，不要手动修改
