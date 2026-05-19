# BESA — Bounded-context Enforced Slice Architecture

**スタートアップで DDD を現実的に運用するための CLI。**

BESA は、スタートアップが DDD を導入するときの核心的な矛盾を解決します。境界コンテキストによる構造的メリットは欲しい。でも、週単位で仕様が変わる中でその設計を維持するコストは払えない。

解決策はシンプルです。アーキテクチャを YAML ファイル 1 つに宣言する。BESA が型と lint ルールで自動的に強制する。

---

**The CLI that makes DDD practical for startups.**

BESA solves the core tension of applying DDD in a fast-moving startup: you need the structural benefits of bounded contexts, but you can't afford the maintenance cost when requirements change weekly.

Declare your architecture in a single YAML file. BESA enforces it with types and lint rules — automatically.

---

## なぜ BESA なのか / Why BESA

DDD を真剣にやると、境界コンテキストの境界はコメント・Confluence・チームの慣習の中にしか存在しなくなります。それらは腐ります。気づいたら `contexts/cart` が `contexts/order` を直接 import していて、誰も気づかなかった——なぜなら機械的に検出するルールがなかったから。

ピボット時は、ドメインモデルの変更がコードベース全体に波及します。コンテキスト内に収まるはずだった結合が至るところに漏れているからです。

**BESA の答え：**

```yaml
# besa.config.yml — アーキテクチャの唯一の真実
contexts:
  cart:
    aggregates: [cart]
    cross_context_reads:
      - context: catalog
        via: ProductReadService   # cart が catalog のデータに触れる唯一の合法的な経路
```

`besa generate` を実行すると、以下が自動生成されます：

- **リポジトリインターフェース** (`MutableCartRepository`, `ReadonlyCartRepository`) — ユースケースは Prisma ではなく抽象に依存する
- **コンテキスト間インターフェース** (`ProductReadService`) — コンテキスト間の唯一の合法的な橋
- **ユースケースコントラクト** — 各ユースケースがどのリポジトリにアクセスできるかを型で強制
- **ESLint ルール** — 不正な import を CI エラーにする `eslint-plugin-boundaries` 設定
- **スキャフォルドファイル** — 全ユースケースの `execute.ts` / `handler.ts` / `execute.test.ts`（初回のみ生成、以降はあなたのコード）

ピボット時：YAML を編集して `besa generate` を実行するだけ。

---

## クイックスタート / Quick Start

```bash
npm install -g @besa/cli
```

プロジェクトのルートで：

```bash
besa init        # besa.config.yml を最小構成で生成
besa generate    # すべてのファイルをスキャフォルド
besa check       # 宣言と実装の一致を検証（CI で実行）
```

動作するサンプルは [`examples/ecommerce/`](./examples/ecommerce/) を参照してください。

---

## コマンド / Commands

### `besa init`

最小構成の `besa.config.yml` をカレントディレクトリに生成します。

```bash
besa init
```

### `besa generate [--dry-run]`

`besa.config.yml` を読み込み、全ファイルを生成します。`src/besa-generated/` 配下は毎回上書き。`src/contexts/` 配下は初回のみ生成（以降スキップ）。

```bash
besa generate

# ファイルを書かずに何が生成されるかを確認する
besa generate --dry-run
```

### `besa check`

生成済みファイルとスキャフォルドファイルの存在、`cross_context_reads` 宣言の整合性を検証します。CI で実行してください。チェックが失敗した場合、終了コード `1` で終了します。

```bash
besa check
```

### `besa add context <name>`

新しいコンテキストを `besa.config.yml` に追加し、ファイルを再生成します。

```bash
besa add context payments

# 初期集約を同時に指定する場合
besa add context payments --aggregates payment
```

### `besa add aggregate <name>`

新しい集約を `besa.config.yml` に追加し、ファイルを再生成します。

```bash
besa add aggregate payment \
  --context payments \
  --root Payment \
  --entities PaymentMethod
```

### `besa add use-case <path>`

ユースケースの宣言を `besa.config.yml` に追加し、ファイルを再生成します。

```bash
besa add use-case cart/remove-product \
  --context cart \
  --type mutation \
  --aggregates cart

besa add use-case order/checkout \
  --context order \
  --type mutation \
  --aggregates order \
  --cross-context-reads cart
```

---

## besa.config.yml リファレンス / Reference

```yaml
version: 1

contexts:
  catalog:
    aggregates: [product]
  cart:
    aggregates: [cart]
    cross_context_reads:
      - context: catalog
        via: ProductReadService   # BESA が生成するインターフェース名

aggregates:
  product:
    root: Product           # PascalCase のルートエンティティ名
    entities: [ProductImage]
    context: catalog
  cart:
    root: Cart
    entities: [CartProduct]
    context: cart

use-cases:
  catalog/get-product:
    context: catalog
    type: query             # query | mutation
    aggregates: [product]

  cart/add-product:
    context: cart
    type: mutation
    aggregates: [cart]
    cross_context_reads: [catalog]   # context レベルで宣言済みのもののみ指定可
```

---

## 生成されるファイル構成 / Generated File Structure

```
src/
├── besa-generated/               ← 編集禁止。besa generate のたびに再生成される。
│   ├── types/
│   │   ├── aggregate-types.ts    ← エンティティの基底インターフェース
│   │   └── context-scope.ts      ← コンテキスト → 集約マッピング型
│   ├── repositories/
│   │   └── cart-repository.ts    ← MutableCartRepository / ReadonlyCartRepository
│   ├── cross-context/
│   │   └── product-read-service-interface.ts  ← ProductReadService インターフェース
│   └── contracts/
│       ├── mutation.ts            ← defineMutation ヘルパー
│       ├── query.ts               ← defineQuery ヘルパー
│       └── cart/
│           └── add-product.ts     ← AddProductRepos 型 / AddProductExecute 型
│
├── contexts/                     ← あなたのコード。初回生成後は自由に編集できる。
│   └── cart/
│       ├── domain/
│       │   └── cart.ts           ← ビジネスロジック（infra への依存なし）
│       └── use-cases/
│           └── add-product/
│               ├── execute.ts    ← ユースケースのロジック
│               ├── handler.ts    ← HTTP ハンドラ（リポジトリを注入）
│               └── execute.test.ts
│
└── infra/                        ← リポジトリの実装（あなたが書く）
    └── cart-prisma-repository.ts
```

---

## generate 後の次のステップ / After `besa generate`

`besa generate` を実行すると、`handler.ts` に次のようなプレースホルダーが生成されます：

```ts
export async function handler(input: unknown): Promise<unknown> {
  const repos: AddProductRepos = {
    cart: null as never,               // ← ここを実装に置き換える
    productReadService: null as never, // ← ここを実装に置き換える
  };
  return execute(input, repos);
}
```

**置き換え手順：**

1. `src/infra/cart-prisma-repository.ts` を作成し、`MutableCartRepository` インターフェースを実装する
2. `handler.ts` で import して `null as never` を差し替える

```ts
import { PrismaCartRepository } from "../../../../infra/cart-prisma-repository";
import { PrismaProductReadService } from "../../../../infra/product-read-service";

const repos: AddProductRepos = {
  cart: new PrismaCartRepository(prisma),
  productReadService: new PrismaProductReadService(prisma),
};
```

リポジトリインターフェースは `src/besa-generated/repositories/` に生成されています。それを実装するだけです。

---

## `src/besa-generated/` は git 管理すべきか / Should you commit `src/besa-generated/`?

**推奨：git 管理しない（デフォルトの `.gitignore` 設定）**

`src/besa-generated/` は `besa generate` で常に再生成できるため、コミットする必要はありません。CI では `besa generate` → `besa check` の順に実行することで、宣言と実装の一致を常に保証できます。

```yaml
# .github/workflows/ci.yml
- run: npx @besa/cli generate
- run: npx @besa/cli check
```

**例外：生成ファイルをコミットしたい場合**

モノレポで他パッケージが `besa-generated/` の型に依存する場合など、コミットしたい事情があれば `.gitignore` から除外してください。`besa generate` は冪等なので、同じ config から何度実行しても同じ結果が得られます。

---

## ESLint 連携 / ESLint Integration

`besa generate` は `eslint-plugin-boundaries` のルールを含む `.eslintrc-besa.json` を生成します。以下を強制します：

- `contexts/cart/` は `contexts/order/` などの他コンテキストを直接 import できない
- `contexts/*/domain/` は `infra/` を import できない
- コンテキスト間のアクセスは `besa-generated/cross-context/` のインターフェース経由のみ許可

```json
// .eslintrc.json
{
  "extends": ["./.eslintrc-besa.json"]
}
```

```bash
npm install -D eslint eslint-plugin-boundaries @typescript-eslint/eslint-plugin
```

---

## CI セットアップ / CI Setup

```yaml
# .github/workflows/ci.yml
- run: npx @besa/cli generate
- run: npx @besa/cli check
```

`besa check` は以下の場合に失敗します：

- 生成済みファイルが存在しない（config 変更後に `besa generate` を忘れた）
- スキャフォルドファイルが存在しない
- ユースケースの `cross_context_reads` がコンテキストレベルで宣言されていない

---

## 設計原則 / Design Principles

**1. 境界は宣言し、型で強制する**
コンテキスト境界は `besa.config.yml` に記述する。宣言されていなければ存在しない。

**1. Boundaries are declared, not implied.**
Context boundaries live in `besa.config.yml`. If it's not declared, it doesn't exist.

**2. 制約は「型エラー」か「lint エラー」のみ有効**
コメントとドキュメントは腐る。BESA が強制するすべての制約は `tsc --noEmit` または `eslint` の違反として検出できる。

**2. Constraints are type errors or lint errors — nothing else.**
Comments and docs rot. Every constraint BESA enforces is caught by `tsc --noEmit` or `eslint`.

**3. インフラは実装の詳細**
リポジトリインターフェースは自動生成される。Prisma・Drizzle・生 SQL は `src/infra/` に閉じた実装の選択であり、ドメインとユースケース層からは見えない。

**3. Infra is a detail.**
Repository interfaces are generated. Prisma, Drizzle, or raw SQL are implementation choices that live in `src/infra/`, invisible to your domain and use-case layers.

**4. ピボットのコストは YAML の書き換え 1 つ**
コンテキスト境界を `besa.config.yml` で変更し、`besa generate` を実行し、型エラーを修正する。移行作業はそれだけ。

**4. Pivoting costs one YAML edit.**
Change a context boundary in `besa.config.yml`, run `besa generate`, fix the type errors. That's the entire migration path.

---

## ライセンス / License

MIT
