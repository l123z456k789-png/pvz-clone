# 植物大战僵尸 — 浏览器版 v1.0.0

基于 HTML5 Canvas 的植物大战僵尸复刻，纯前端实现。

## 在线试玩

**[https://pvz-bimubai.pages.dev](https://pvz-bimubai.pages.dev)**

## 运行

### 本地运行

```bash
python -m http.server 8000
```

浏览器打开 `http://localhost:8000` 即可。

### 自动部署

- 仓库：https://github.com/l123z456k789-png/pvz-clone
- Cloudflare Pages 项目：`pvz-bimubai`
- 每次 push 到 `main` 分支后，GitHub Actions 自动部署
- 工作流文件：`.github/workflows/deploy-cloudflare-pages.yml`
- 部署命令：`wrangler pages deploy . --project-name=pvz-bimubai --branch=main`

## 玩法

- 5×9 网格战场
- 9 种植物：向日葵、豌豆射手、坚果墙、寒冰射手、樱桃炸弹、双发射手、土豆地雷、大嘴花、加特林豌豆
- 5 种僵尸：普通僵尸、路障僵尸、铁桶僵尸、旗帜僵尸、撑杆跳僵尸
- 阳光经济 + 卡牌选择
- 割草机防线
- 关卡自动存档

## 操作

| 操作 | 说明 |
|------|------|
| 点击卡牌 | 选择植物 |
| 点击格子 | 种植 |
| 点击阳光 | 收集 |
| 键盘 1-9 | 快捷选择植物 |
| ESC | 取消选择 / 关闭弹窗 |
| 空格 / P | 暂停 / 继续 |
| Q | 铲子模式 |

详见游戏内「操作说明」。

## 文件结构

```
植物大战僵尸/
├── index.html                              # 游戏主入口（内联游戏逻辑）
├── styles/ui.css                           # 开始界面、弹窗等 UI 样式
├── scripts/ui.js                           # UI 控制逻辑
├── images/                                 # 精灵图和素材
│   ├── plants/                             # 植物精灵
│   ├── zombies/                            # 僵尸精灵
│   ├── cards/                              # 卡牌图标
│   └── ...
├── .github/workflows/deploy-cloudflare-pages.yml  # 自动部署
├── ASSET_ATTRIBUTION.md                    # 素材来源说明
└── README.md
```

## 素材版权

`images/` 目录中的精灵图来源于 PvZ Wiki 和 Spriters Resource，版权属 PopCap Games / Electronic Arts。本项目仅供学习和技术演示。

详见 [ASSET_ATTRIBUTION.md](ASSET_ATTRIBUTION.md)。

## 免责声明

本项目为**非商业学习与技术演示项目**，与 Electronic Arts、PopCap Games 无隶属或授权关系。

Plants vs. Zombies 相关名称、角色和美术资源归其权利人所有。

*This is a non-commercial fan project created for learning and technical demonstration. It is not affiliated with or endorsed by Electronic Arts or PopCap Games. Plants vs. Zombies and related assets belong to their respective rights holders.*

## 版本

v1.0.0

## 许可证

MIT（仅限代码部分。图片素材版权属各自权利人）
