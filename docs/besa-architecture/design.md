# BESA — Bounded-context Enforced Slice Architecture

**Status:** proposed
**Date:** 2026-05-08

---

## 1. アーキテクチャ名の選定

### 候補

| 名前 | 展開 | 採用判断 |
|---|---|---|
| **BESA** | Bounded-context Enforced Slice Architecture | 採用 |
| CASA | Context-Aware Slice Architecture | 次点（CASA はHomeAssistant関連OSSと重複） |
| AESA | Aggregate-Enforced Slice Architecture | 次点（Aggregate の頭字語だが Bounded Context が見えない） |

### BESA を採用する理由

- **B（Bounded-context）** — コンテキスト境界の明示が設計の核心であり、名前に反映させる
- **Enforced** — 「型とlintで物理的に強制する」ことを明示
- **Slice** — ユースケース単位の実装単位という考え方を維持
- Clean Architecture / Hexagonal Architecture / Onion Architecture と語形が重ならない
- 略語として発音しやすく、`besa generate` / `besa check` のCLI名としても自然

---

## 2. 設計思想とコアコンセプト

### 三つの原則

**原則1: 境界は宣言し、型で強制する**

コンテキスト間のアクセスは config に明示的に書かなければ不可能にする。「暗黙の結合」を型エラーにする。

**原則2: Prisma はインフラの実装詳細であり、設計の基盤ではない**

RepositoryをInterfaceとして定義し、Prismaへの依存をアダプター層に押し込める。ドメインやuse-caseはDBの実装を知らない。

**原則3: 制約は「型エラー」か「lintエラー」のみ有効**

コメントやドキュメントはソフトな制約であり、時間とともに形骸化する。BESAが生成するすべての制約は `tsc --noEmit` か `eslint` の違反として検出できる形式にする。

---

## 3. 概念の定義

### Context（境界づけられたコンテキスト）

ひとつの統一されたビジネス言語が通用する範囲。DDDのBounded Contextに対応する。

**Contextはデータベースのテーブルやモデルのグループではない。** ビジネス上の「文脈（誰が、何のために扱うか）」の単位である。

同じビジネス概念でも文脈が異なれば別のモデルとして存在してよい。例えば「商品」は文脈ごとに全く異なる関心事とデータを持ち、それぞれの文脈で使われる言葉（ユビキタス言語）で命名される：

| 文脈（Context） | 商品の呼び方 | 関心事 | 持つデータ |
|---|---|---|---|
| カタログ（catalog） | Product（商品） | 商品を探す・選ぶ | 名前、説明、画像、価格、カテゴリ |
| カート（cart） | CartProduct（カートの商品） | 購入する商品を管理する | 商品ID、カート時点の価格、数量 |
| 注文（order） | PurchasedProduct（購入した商品） | 注文確定時の記録 | 注文時の価格（変更不可）、SKU、税率 |
| 在庫（inventory） | StockItem（在庫品目） | 運営者が在庫を管理する | 在庫数、入荷予定、倉庫ロケーション |
| 配送（shipping） | ShipmentProduct（配送品目） | 運送会社が扱う物品 | 重量、サイズ、配送先、追跡番号 |

カートコンテキストの `CartProduct` と注文コンテキストの `PurchasedProduct` は別モデルであり、同じクラスを共有してはならない。それぞれのContextが自分の文脈に必要なデータと振る舞いのみを持つ。

モデルの命名はエンジニアが独断で決めるのではなく、そのビジネスの関係者（ドメインエキスパート）が実際に使う言葉（ユビキタス言語）を採用する。

- config の最上位に宣言する
- 各コンテキストはAggregateのセットを持つ
- コンテキスト間のアクセスは `cross_context_reads` として明示的に宣言された読み取り専用interfaceを経由するのみ許可される

```yaml
contexts:
  catalog:
    aggregates: [product]
  cart:
    aggregates: [cart]
    cross_context_reads:
      - context: catalog
        via: ProductReadService        # カート追加時の商品情報取得
  order:
    aggregates: [order]
    cross_context_reads:
      - context: cart
        via: CartReadService           # チェックアウト時のカート内容取得
  inventory:
    aggregates: [stock]
  shipping:
    aggregates: [shipment]
    cross_context_reads:
      - context: order
        via: OrderReadService          # 発送対象の注文情報取得
  identity:
    aggregates: [user]
```

### Aggregate（集約）

整合性の境界を持つエンティティのグループ。ルートエンティティを通じてのみ操作される。

- `root` — ルートエンティティ（外部から参照される唯一のエントリーポイント）
- `entities` — ルートが管理する内部エンティティ（コンテキスト外から直接操作不可）
- CLIは `root` に対して Repository interface と Entity 型定義を自動生成する

```yaml
aggregates:
  product:
    root: Product                      # catalog文脈の商品
    entities: [ProductImage]
    context: catalog
  cart:
    root: Cart
    entities: [CartProduct]            # cart文脈での「カートに入れた商品」
    context: cart
  order:
    root: Order
    entities: [PurchasedProduct]       # order文脈での「購入した商品」
    context: order
```

### Use-Case（ユースケース）

ひとつのユースケースを実装する最小単位。必ずひとつのContextに属する。

- `mutation` — 状態を変更する操作。Aggregateのrepositoryを書き込みモードで受け取る
- `query` — 状態を読み取る操作。Aggregateのrepositoryを読み取りモードで受け取る
- 同一Context内のAggregateには直接アクセスできる
- 他Contextのデータが必要な場合は `cross_context_reads` で宣言された読み取り専用interfaceのみ利用可能

### Repository（リポジトリ）

AggregateのルートエンティティのCRUD操作を抽象化したinterface。

- CLIが interface として生成する（実装はユーザーが書く）
- Prismaアダプター（`@besa/prisma-adapter`）を使えばPrisma実装の雛形も生成できる
- `mutation` use-caseは `Mutable{Agg}Repository`、`query` use-caseは `Readonly{Agg}Repository` を受け取る

### Domain（ドメイン層）

ビジネスルールを表現する純粋関数と値オブジェクトのセット。

- DBアクセスを必要とする場合はRepositoryのinterface経由
- `infra/` に依存しない
- Aggregate単位でファイルを分割する

---

## 4. config ファイル仕様

### 全体構造

```yaml
# besa.config.yml

version: 1

contexts:
  catalog:
    aggregates: [product]
  cart:
    aggregates: [cart]
    cross_context_reads:
      - context: catalog
        via: ProductReadService        # カート追加時の商品情報取得
  order:
    aggregates: [order]
    cross_context_reads:
      - context: cart
        via: CartReadService           # チェックアウト時のカート内容取得
  shipping:
    aggregates: [shipment]
    cross_context_reads:
      - context: order
        via: OrderReadService          # 発送対象の注文情報取得
  identity:
    aggregates: [user]

aggregates:
  product:
    root: Product                      # catalog文脈の商品（名前・説明・画像・価格・カテゴリ）
    entities: [ProductImage]
    context: catalog
  cart:
    root: Cart                         # cart文脈（CartProduct = カートに入れた商品 を管理）
    entities: [CartProduct]
    context: cart
  order:
    root: Order                        # order文脈（PurchasedProduct = 購入した商品 を管理）
    entities: [PurchasedProduct]
    context: order
  shipment:
    root: Shipment                     # shipping文脈（ShipmentProduct = 配送品目 を管理）
    entities: [ShipmentProduct]
    context: shipping
  user:
    root: User
    entities: []
    context: identity

use-cases:
  catalog/get-product:
    context: catalog
    type: query
    aggregates: [product]

  cart/add-product:
    context: cart
    type: mutation
    aggregates: [cart]
    cross_context_reads: [catalog]     # 商品の存在確認・価格取得

  cart/get-cart:
    context: cart
    type: query
    aggregates: [cart]

  order/checkout:
    context: order
    type: mutation
    aggregates: [order]
    cross_context_reads: [cart]        # カート内容を注文として確定

  order/get-purchase-history:
    context: order
    type: query
    aggregates: [order]

  shipping/create-shipment:
    context: shipping
    type: mutation
    aggregates: [shipment]
    cross_context_reads: [order]       # 発送対象の注文情報を取得して配送を作成

  shipping/get-shipment-status:
    context: shipping
    type: query
    aggregates: [shipment]
```

### フィールド定義

| フィールド | 必須 | 説明 |
|---|---|---|
| `version` | ✓ | config スキーマバージョン。現在は `1` |
| `contexts` | ✓ | コンテキストの宣言。キーがコンテキスト名 |
| `contexts.*.aggregates` | ✓ | このコンテキストに属するAggregateの名前リスト |
| `contexts.*.cross_context_reads` | - | 他コンテキストのデータを読み取るための参照宣言 |
| `contexts.*.cross_context_reads[].context` | ✓ | 参照先のコンテキスト名 |
| `contexts.*.cross_context_reads[].via` | ✓ | 参照に使うサービスのinterface名。CLIが生成する |
| `aggregates` | ✓ | Aggregateの宣言 |
| `aggregates.*.root` | ✓ | ルートエンティティ名（PascalCase） |
| `aggregates.*.entities` | ✓ | 内部エンティティ名のリスト（空リスト可） |
| `aggregates.*.context` | ✓ | 所属するコンテキスト名 |
| `use-cases` | ✓ | use-caseの宣言。キーがuse-caseパス |
| `use-cases.*.context` | ✓ | 所属するコンテキスト名 |
| `use-cases.*.type` | ✓ | `mutation` または `query` |
| `use-cases.*.aggregates` | ✓ | 操作対象のAggregate名リスト（同一context内のみ） |
| `use-cases.*.cross_context_reads` | - | 使用する他コンテキストの名前リスト（contextレベルで宣言済みのもののみ） |

---

## 5. 生成されるファイルの一覧と役割

### 自動生成ファイル（常に上書き・編集禁止）

| ファイルパス | 役割 |
|---|---|
| `src/besa-generated/types/aggregate-types.ts` | 各AggregateのEntity型定義（ルートとエンティティ）。configから生成 |
| `src/besa-generated/types/context-scope.ts` | コンテキストと所属Aggregateのマッピング型 |
| `src/besa-generated/repositories/{aggregate}-repository.ts` | Repository interfaceの型定義。`Mutable{Agg}Repository` と `Readonly{Agg}Repository` |
| `src/besa-generated/cross-context/{service}-interface.ts` | `cross_context_reads` で宣言されたサービスのinterface |
| `src/besa-generated/contracts/mutation.ts` | `defineMutation` 関数とその型定義 |
| `src/besa-generated/contracts/query.ts` | `defineQuery` 関数とその型定義 |
| `.eslintrc-besa.json` | eslint-plugin-boundaries 向けのlintルール。contextとlayer間の依存禁止ルールを含む |

### 初回のみ生成（以降は編集可）

| ファイルパス | 役割 |
|---|---|
| `src/contexts/{context}/domain/{aggregate}.ts` | Aggregateのドメイン関数。ビジネスルールの実装場所 |
| `src/contexts/{context}/use-cases/{use-case-path}/execute.ts` | use-caseのロジック実装。repositoryを引数で受け取る |
| `src/contexts/{context}/use-cases/{use-case-path}/handler.ts` | HTTPハンドラ。repositoryの実装を注入してexecuteを呼ぶ |
| `src/contexts/{context}/use-cases/{use-case-path}/execute.test.ts` | use-caseのテスト雛形 |
| `src/infra/{aggregate}-prisma-repository.ts` | `--adapter prisma` 指定時のみ生成。Repository interfaceのPrisma実装雛形 |

---

## 6. ディレクトリ構成（生成後）

```
src/
├── besa-generated/               ← CLIが管理。編集禁止。gitignoreに追加推奨
│   ├── types/
│   │   ├── aggregate-types.ts    ← Product, ProductImage, Cart, CartProduct, Order, PurchasedProduct, Shipment, ShipmentProduct, User の型
│   │   └── context-scope.ts      ← コンテキスト所属マッピング型
│   ├── repositories/
│   │   ├── product-repository.ts    ← MutableProductRepository / ReadonlyProductRepository
│   │   ├── cart-repository.ts       ← MutableCartRepository / ReadonlyCartRepository
│   │   ├── order-repository.ts      ← MutableOrderRepository / ReadonlyOrderRepository
│   │   ├── shipment-repository.ts   ← MutableShipmentRepository / ReadonlyShipmentRepository
│   │   └── user-repository.ts
│   ├── cross-context/
│   │   ├── product-read-service-interface.ts  ← ProductReadService（cart が参照）
│   │   ├── cart-read-service-interface.ts     ← CartReadService（order が参照）
│   │   └── order-read-service-interface.ts    ← OrderReadService（shipping が参照）
│   └── contracts/
│       ├── mutation.ts           ← defineMutation, MutationContract 型
│       └── query.ts              ← defineQuery, QueryContract 型
│
├── contexts/
│   ├── catalog/
│   │   ├── domain/
│   │   │   └── product.ts        ← 商品の検索・フィルタリングなどのビジネスルール
│   │   └── use-cases/
│   │       └── get-product/
│   │           ├── execute.ts
│   │           ├── handler.ts
│   │           └── execute.test.ts
│   │
│   ├── cart/
│   │   ├── domain/
│   │   │   └── cart.ts           ← addProduct(), removeProduct(), calcTotal() などのビジネスルール
│   │   └── use-cases/
│   │       ├── add-product/      ← ProductReadService 経由で商品情報を取得
│   │       │   ├── execute.ts
│   │       │   ├── handler.ts
│   │       │   └── execute.test.ts
│   │       └── get-cart/
│   │           ├── execute.ts
│   │           ├── handler.ts
│   │           └── execute.test.ts
│   │
│   ├── order/
│   │   ├── domain/
│   │   │   └── order.ts          ← 注文確定時の価格凍結・税計算などのビジネスルール
│   │   └── use-cases/
│   │       ├── checkout/         ← CartReadService 経由でカート内容を取得し注文を作成
│   │       │   ├── execute.ts
│   │       │   ├── handler.ts
│   │       │   └── execute.test.ts
│   │       └── get-purchase-history/
│   │           ├── execute.ts
│   │           ├── handler.ts
│   │           └── execute.test.ts
│   │
│   ├── shipping/
│   │   ├── domain/
│   │   │   └── shipment.ts       ← 配送ステータス管理・追跡番号割当などのビジネスルール
│   │   └── use-cases/
│   │       ├── create-shipment/  ← OrderReadService 経由で注文情報を取得し配送を作成
│   │       │   ├── execute.ts
│   │       │   ├── handler.ts
│   │       │   └── execute.test.ts
│   │       └── get-shipment-status/
│   │           ├── execute.ts
│   │           ├── handler.ts
│   │           └── execute.test.ts
│   │
│   └── identity/
│       ├── domain/
│       │   └── user.ts
│       └── use-cases/
│           └── ...
│
├── infra/                        ← Repository の実装（Prisma等）
│   ├── product-prisma-repository.ts
│   ├── cart-prisma-repository.ts
│   ├── order-prisma-repository.ts
│   ├── shipment-prisma-repository.ts
│   └── user-prisma-repository.ts
│
└── _shared/                      ← ドメイン知識を含まない純粋関数のみ
    ├── money.ts
    └── date.ts
```

### レイヤー間の依存方向

```
contexts/{ctx}/use-cases  →  contexts/{ctx}/domain, besa-generated, _shared
contexts/{ctx}/domain     →  besa-generated/repositories, _shared  （infra には依存しない）
infra                     →  besa-generated/repositories  （interfaceを実装する）
handler.ts                →  infra  （repositoryの実装を注入）
```

コンテキスト間の依存（`contexts/cart → contexts/order`）はlintで全面禁止。
`cross_context_reads` で宣言された `besa-generated/cross-context/` のinterfaceを経由する場合のみ許可。

---

## 7. 型とlintの役割分担

### 型が担う制約

| 制約 | 手段 |
|---|---|
| use-caseが宣言していないAggregateにはアクセスできない | `MutationContract<TInput, TOutput, TRepos>` の `TRepos` 型引数 |
| `mutation` use-caseで読み取り専用repositoryを書き込み操作に使えない | `MutableCartRepository` と `ReadonlyCartRepository` の型分離 |
| 他contextのAggregate型を直接操作できない | 型として公開されない（besa-generatedの型はcontext-scopedで管理） |
| Entity型の不正な状態遷移 | Discriminated Union（`PendingOrder \| ConfirmedOrder \| CancelledOrder`） |

### lintが担う制約（eslint-plugin-boundaries）

| 制約 | 手段 |
|---|---|
| `contexts/cart/` が `contexts/order/` を直接importすることを禁止 | `boundaries/element-types: disallow` |
| `domain/` 層が `infra/` をimportすることを禁止 | `boundaries/element-types: disallow` |
| `use-cases/` が他contextの `use-cases/` をimportすることを禁止 | `boundaries/element-types: disallow` |
| `besa-generated/` の手動編集（import以外での参照）を禁止 | CLIが生成する `boundaries` 設定 |

`besa generate` は `.eslintrc-besa.json` に上記ルールをすべて書き出す。ESLint設定でこのファイルをextendsするだけで有効になる。

#### セットアップ

```bash
# プロジェクト側に必要なパッケージをインストール
npm install -D eslint eslint-plugin-boundaries @typescript-eslint/eslint-plugin
```

```json
// .eslintrc.json（または eslint.config.js）でextendsする
{
  "extends": ["./.eslintrc-besa.json"]
}
```

`.eslintrc-besa.json` は `besa generate` のたびに上書きされる。手動編集は無効になるため、ルールのカスタマイズは `.eslintrc.json` 側で上書きすること。

### 型とlintが担えない制約（テストとCIで補完）

| 制約 | 手段 |
|---|---|
| `as any` によるスコープ回避 | `@typescript-eslint/no-explicit-any: error` + CI |
| `besa.config.yml` と実装の乖離 | `besa check` コマンド + CI |
| Repositoryの実装が宣言したinterfaceを満たしているか | TypeScriptの構造的部分型（型が保証） |
| ビジネスルール関数の正しさ | ユニットテスト |
