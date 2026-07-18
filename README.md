# 散歩記事化アプリ

散歩中に話した内容を録音し、文字起こし・AIによる記事生成を経て、Note/X向けの記事にするiOSアプリ。

## 目的

個人開発プロジェクトとして、実務レベルのアプリ開発スキル習得を目的に開発している（趣味開発だが本番リリース志向）。

## 対象ユーザー・利用シーン

散歩中に考えを音声で残し、Note/Xへ発信したい人。歩きながらスマホの録音ボタンを押すだけで、記事の下書きが手に入る体験を目指す。

## MVPスコープ

録音 → アップロード → 文字起こし → 記事生成（Note用・X用を各1本固定） → 編集 → 手動コピーで投稿 → 履歴閲覧。自動投稿はスコープ外（Xのみ後述の理由でPhase2に実装予定）。

## 技術スタック・選定理由

- **モバイルアプリ**: React Native + Expo + TypeScript
  開発機がWindows（WSL2）でXcodeが使えないため、EAS Buildによるクラウドビルドで
  コード記述〜実機ビルド〜TestFlight提出までをMacなしで完結できる構成を採用した。
- **バックエンド（予定）**: Node.js + TypeScript + Fastify + PostgreSQL + Redis/BullMQ + Cloudflare R2
- **文字起こし**: Whisper API
- **記事生成**: Claude API

n8n（社内自動化ツール）はバックエンド候補から除外し、専用バックエンドを構築する方針とした。

## 主な意思決定ログ

| 決定事項 | 結論 |
|---|---|
| Note公式APIの有無 | 存在しないため自動投稿はスコープ外。「下書きコピー→手動貼り付け」を標準フローとする |
| X APIの投稿権限・コスト | 2026年2月に従量課金化を確認。月額約$6の見込みでPhase2に自動投稿を実装 |
| iOSバックグラウンド録音 | React Native + Expo構成でも実現可能。ただしExpo Goでは検証不可で、EAS Build開発ビルドが必須 |
| 音声データの保存期間 | 文字起こし完了後30日で自動削除 |
| 1回の録音から生成する記事数 | Note用1本・X用1本の固定生成（MVP） |
| 開発プラットフォーム | 開発機がWindowsでXcode不可のため、React Native + Expo + EAS Buildへ確定 |

決定の経緯や詳細な調査結果は開発時のプロジェクトドキュメントに記録している（本リポジトリ外で管理）。

## セットアップ・実行方法

```bash
npm install
npx expo start --tunnel
```

WSL2環境はNATモードのため、Expo Goとの接続には`--tunnel`オプションが必須。QRコードをExpo Goアプリ（iPhone）で読み込むと起動する。

## フォルダ構成

```
src/
├── screens/       画面コンポーネント（8画面）
├── navigation/    React Navigation（Stack + Bottom Tabs）
├── components/    共通UIコンポーネント（今後追加）
├── hooks/         カスタムフック（今後追加）
├── services/      API通信・外部サービス連携（今後追加）
├── types/         型定義（今後追加）
└── constants/     配色テーマなどの定数
```
