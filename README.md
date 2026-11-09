# 傳奇戰線：地牢遠征 (Legend Quest)

> **無伺服器零帳單 WebRTC P2P 桌遊 RPG**
> 純前端靜態架構（Vue 3 + TypeScript + Tailwind CSS + PeerJS + Tone.js + ZzFX），可直接部署於 GitHub Pages，無需任何後端主機或伺服器費用。

---

## 🎮 核心遊戲特色

1. **無伺服器零帳單架構（Serverless WebRTC P2P）**
   - 採用 **房主即主機（Host-as-Server）** 架構，由開房者的瀏覽器執行權威戰鬥狀態機與回合結算（Turn Resolver），結算後透過 WebRTC 點對點廣播給隊友。
   - 零伺服器維護成本，靜態部署於 GitHub Pages / Cloudflare Pages 即可暢玩。

2. **盲選共時回合制（Simultaneous Turns）**
   - 隊友各自於無壓力下獨立決策出招，全員鎖定後 Host 端依速度排序動作序列（Action Queue），以每步 0.7 秒間隔依序播放打擊、受擊震動、飄浮數字與音效。

3. **無障礙巨型決策按鍵（Accessibility-First）**
   - 專為無障礙操作設計，提供超大尺寸（>80px）高對比行動按鈕，內建直觀效果預覽（「【破甲怒斬】造成 55 傷害並降防 30%」）。
   - 完整支援鍵盤快捷鍵 `1`, `2`, `3`, `4` 一鍵決策。

4. **鐵三角職能與金色連攜（Combo Synergy）**
   - **守護者 (Tank)**：戰吼嘲諷、全隊聖盾守護、重裝盾擊。
   - **狂戰士 (DPS)**：破甲怒斬（點亮金色連攜）、絕殺處決（殘血/連攜必定暴擊）。
   - **牧師 (Healer)**：快速治療（及時拉起倒地隊友）、聖光祝福（全隊下擊必暴）。
   - 當觸發破甲或聖光時，隊友技能亮起金色動畫流光（`anim-combo-glow`），打出巨額連攜傷害！

5. **非同步替身與單人出團（Mercenary AI）**
   - 隊友離線快照自動快取於 LocalStorage。
   - 單人遊玩時，系統自動配對補齊 AI 傭兵隊友（剛鐸、克雷、艾蓮），依戰況智慧出招（殘血急救、破甲斬殺、戰吼嘲諷），一個人也能完整體驗 3 人連攜快感。

6. **桌遊榮耀貼紙簿（成就系統）**
   - 涵蓋「戰鬥高光」、「搞笑翻車（如：全隊滿血仍放群補）」與「進度收集」。
   - 解鎖時自畫面頂部滑出高對比 Toast 橫幅、彩帶特效與 ZzFX 號角音效，並享有全隊永久屬性加成！

7. **復古晶片音樂與程序化音效**
   - **ZzFX**：Web Audio API 程序化音效合成，零延遲產生揮刀、暴擊、治癒、受擊音效。
   - **Tone.js**：晶片音樂合成器（Chiptune RPG BGM），進入 Boss 戰或危機狀態時動態加速 20% BPM。

8. **地牢推進與紙娃娃裝備**
   - 5 階段節點地牢（哥布林哨站 ➔ 狂暴半獸人 ➔ 幽暗營火 ➔ 遠古符文寶箱 ➔ 深淵骨龍領主）。
   - 武器、防具、飾品 3 欄位輕量圖示紙娃娃，隨機詞綴加成，點擊隊友頭像可隨時檢視裝備。

---

## 🚀 本地開發與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 測試生產構建
npm run build
```

---

## 🌐 GitHub Pages 部署

本專案已配置 `.github/workflows/deploy.yml`。推送到 `main` 分支後，GitHub Actions 將會自動編譯並部署至 GitHub Pages：

1. 在 GitHub 專案的 **Settings** -> **Pages**。
2. 將 **Source** 設為 **GitHub Actions**。
3. 推送程式碼後，即可在 `https://<使用者名稱>.github.io/<倉庫名稱>/` 直接開啟遊玩！
