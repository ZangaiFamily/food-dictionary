"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMeal } from "@/lib/meal-builder";
import type { EaterType, Ingredient, KnowledgeBase, MealRole, Seasoning } from "@/lib/knowledge";

type Profile = {
  name: string;
  eaterType?: EaterType;
  likedIngredients: string[];
  likedSeasonings: string[];
  lastRecipe?: string;
};

type Stage = "name" | "interview" | "ingredients" | "seasonings" | "recipe";

const profileIndexKey = "food-dictionary:profile-names";
const fakeNames = ["Mango", "Tofu", "Pepper", "Basil", "Nori", "Olive", "Ginger", "Cumin"];

const eaterOptions: Array<{ value: EaterType; label: string; description: string }> = [
  { value: "vegetarian", label: "素食", description: "多推荐蔬菜、豆类、谷物和植物蛋白。" },
  { value: "meat-lover", label: "肉食主义者", description: "优先推荐肉类和高蛋白食材。" },
  { value: "flexible", label: "都可以", description: "综合推荐，并控制膳食搭配比例。" }
];

const allowedGroups: Record<EaterType, string[]> = {
  vegetarian: ["素食", "综合"],
  "meat-lover": ["肉食", "综合"],
  flexible: ["素食", "肉食", "综合"]
};

const roleTargets: Record<EaterType, Record<MealRole, number>> = {
  vegetarian: { protein: 1, vegetable: 2, staple: 1 },
  "meat-lover": { protein: 1, vegetable: 1, staple: 1 },
  flexible: { protein: 1, vegetable: 2, staple: 1 }
};

function emptyProfile(name = ""): Profile {
  return { name, likedIngredients: [], likedSeasonings: [] };
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function loadProfile(name: string): Profile {
  const raw = localStorage.getItem(name);
  if (!raw) return emptyProfile(name);

  try {
    return { ...emptyProfile(name), ...JSON.parse(raw), name };
  } catch {
    return emptyProfile(name);
  }
}

function saveProfile(profile: Profile) {
  localStorage.setItem(profile.name, JSON.stringify(profile));
  const names = new Set(JSON.parse(localStorage.getItem(profileIndexKey) || "[]") as string[]);
  names.add(profile.name);
  localStorage.setItem(profileIndexKey, JSON.stringify([...names]));
}

function getRoleCounts(ingredients: Ingredient[]) {
  return ingredients.reduce(
    (counts, ingredient) => ({ ...counts, [ingredient.role]: counts[ingredient.role] + 1 }),
    { protein: 0, vegetable: 0, staple: 0 } as Record<MealRole, number>
  );
}

export default function RecipeTinderApp({ knowledge }: { knowledge: KnowledgeBase }) {
  const [stage, setStage] = useState<Stage>("name");
  const [profileNames, setProfileNames] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [nameDraft, setNameDraft] = useState("");
  const [ingredientDeck, setIngredientDeck] = useState<Ingredient[]>([]);
  const [seasoningDeck, setSeasoningDeck] = useState<Seasoning[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    setProfileNames(JSON.parse(localStorage.getItem(profileIndexKey) || "[]"));
  }, []);

  useEffect(() => {
    if (profile.name) saveProfile(profile);
  }, [profile]);

  const selectedIngredients = useMemo(
    () => knowledge.ingredients.filter((item) => profile.likedIngredients.includes(item.name)),
    [knowledge.ingredients, profile.likedIngredients]
  );

  const selectedSeasonings = useMemo(
    () => knowledge.seasonings.filter((item) => profile.likedSeasonings.includes(item.name)),
    [knowledge.seasonings, profile.likedSeasonings]
  );

  const currentIngredient = ingredientDeck[0];
  const currentSeasoning = seasoningDeck[0];
  const eaterType = profile.eaterType ?? "flexible";
  const counts = getRoleCounts(selectedIngredients);
  const targets = roleTargets[eaterType];
  const builtMeal = buildMeal(selectedIngredients, selectedSeasonings, knowledge.recipes);
  const highSodiumCount = selectedSeasonings.filter((item) => item.limit === "high-sodium").length;

  function enterProfile(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;

    const nextProfile = loadProfile(cleanName);
    setProfile(nextProfile);
    setNameDraft(cleanName);
    setStage(nextProfile.eaterType ? "ingredients" : "interview");
    seedIngredientDeck(nextProfile.eaterType ?? "flexible", nextProfile.likedIngredients);
  }

  function seedIngredientDeck(type: EaterType, likedNames: string[] = []) {
    const deck = knowledge.ingredients.filter(
      (item) => allowedGroups[type].includes(item.group) && !likedNames.includes(item.name)
    );
    setIngredientDeck(shuffle(deck));
  }

  function seedSeasoningDeck(likedNames: string[] = []) {
    const ingredientNames = new Set(selectedIngredients.map((item) => item.name));
    const deck = knowledge.seasonings.filter(
      (item) =>
        !likedNames.includes(item.name) &&
        (item.pairings.includes("全部") || item.pairings.some((pairing) => ingredientNames.has(pairing)))
    );
    setSeasoningDeck(shuffle(deck));
  }

  function chooseEaterType(value: EaterType) {
    const nextProfile = { ...profile, eaterType: value, likedIngredients: [], likedSeasonings: [] };
    setProfile(nextProfile);
    seedIngredientDeck(value);
    setStage("ingredients");
  }

  function dislikeIngredient() {
    setIngredientDeck((deck) => deck.slice(1));
    setDragX(0);
  }

  function likeIngredient() {
    if (!currentIngredient) return;

    setProfile((current) => ({
      ...current,
      likedIngredients: [...current.likedIngredients, currentIngredient.name],
      likedSeasonings: []
    }));
    setIngredientDeck((deck) => deck.slice(1));
    setDragX(0);
  }

  function dislikeSeasoning() {
    setSeasoningDeck((deck) => deck.slice(1));
    setDragX(0);
  }

  function likeSeasoning() {
    if (!currentSeasoning) return;
    if (selectedSeasonings.length >= 3) return setStage("recipe");
    if (currentSeasoning.limit === "high-sodium" && highSodiumCount >= 1) return dislikeSeasoning();

    setProfile((current) => ({
      ...current,
      likedSeasonings: [...current.likedSeasonings, currentSeasoning.name],
      lastRecipe: builtMeal.name
    }));
    setSeasoningDeck((deck) => deck.slice(1));
    setDragX(0);
  }

  function continueToSeasonings() {
    seedSeasoningDeck(profile.likedSeasonings);
    setStage("seasonings");
  }

  function restart() {
    const nextProfile = { ...profile, likedIngredients: [], likedSeasonings: [] };
    setProfile(nextProfile);
    seedIngredientDeck(profile.eaterType ?? "flexible");
    setStage("ingredients");
  }

  function finishDrag(onLeft: () => void, onRight: () => void) {
    if (dragX < -90) onLeft();
    else if (dragX > 90) onRight();
    else setDragX(0);
    setDragStart(null);
  }

  function renderNameGate() {
    return (
      <section className="panel auth-panel">
        <p className="eyebrow">Food Dictionary</p>
        <h1>选择今天的食客</h1>
        <div className="stack">
          {profileNames.length > 0 && (
            <label className="field">
              <span>已有姓名</span>
              <select value="" onChange={(event) => enterProfile(event.target.value)}>
                <option value="" disabled>
                  选择姓名
                </option>
                {profileNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>新姓名</span>
            <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="输入你的名字" />
          </label>
          <div className="button-row">
            <button className="secondary" onClick={() => setNameDraft(fakeNames[Math.floor(Math.random() * fakeNames.length)])}>
              随机名字
            </button>
            <button onClick={() => enterProfile(nameDraft)}>继续</button>
          </div>
        </div>
      </section>
    );
  }

  function renderInterview() {
    return (
      <section className="panel">
        <p className="eyebrow">风味采访</p>
        <h1>{profile.name} 是哪种类型的食客？</h1>
        <div className="option-grid">
          {eaterOptions.map((option) => (
            <button className="choice-card" key={option.value} onClick={() => chooseEaterType(option.value)}>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  function renderIngredientSwipe() {
    const ready = selectedIngredients.length >= 3 && counts.protein >= 1 && counts.vegetable >= 1;

    return (
      <section className="workspace">
        <aside className="side-panel">
          <p className="eyebrow">{profile.name}</p>
          <h2>今日购物车</h2>
          <Cart items={selectedIngredients.map((item) => `${item.name} · ${item.role}`)} empty="右滑喜欢的食材" />
          <Balance counts={counts} targets={targets} />
          <button disabled={!ready} onClick={continueToSeasonings}>
            去选调料
          </button>
        </aside>
        <main className="swipe-zone">
          {currentIngredient ? (
            <SwipeCard
              dragX={dragX}
              onDragStart={setDragStart}
              onDragMove={(x) => dragStart !== null && setDragX(x - dragStart)}
              onDragEnd={() => finishDrag(dislikeIngredient, likeIngredient)}
            >
              <span className="badge">{currentIngredient.group}</span>
              <h1>{currentIngredient.name}</h1>
              <p>{currentIngredient.calories}</p>
              <dl>
                <div>
                  <dt>物价</dt>
                  <dd>{currentIngredient.price}</dd>
                </div>
                <div>
                  <dt>角色</dt>
                  <dd>{currentIngredient.role}</dd>
                </div>
              </dl>
              <p className="muted">可组成：{currentIngredient.recipes.join("、")}</p>
            </SwipeCard>
          ) : (
            <EmptyDeck title="食材卡片用完了" action="进入调料选择" onClick={continueToSeasonings} />
          )}
          <SwipeActions onLeft={dislikeIngredient} onRight={likeIngredient} />
        </main>
      </section>
    );
  }

  function renderSeasoningSwipe() {
    const canFinish = selectedSeasonings.length >= 1;

    return (
      <section className="workspace">
        <aside className="side-panel">
          <p className="eyebrow">调味限制</p>
          <h2>最多 3 种调料</h2>
          <p className="muted">高钠调料最多选 1 种，优先保留蒜、姜、柠檬汁等新鲜风味。</p>
          <Cart items={selectedSeasonings.map((item) => `${item.name} · ${item.usage}`)} empty="右滑喜欢的调料" />
          <button disabled={!canFinish} onClick={() => setStage("recipe")}>
            生成食谱
          </button>
        </aside>
        <main className="swipe-zone">
          {currentSeasoning ? (
            <SwipeCard
              dragX={dragX}
              onDragStart={setDragStart}
              onDragMove={(x) => dragStart !== null && setDragX(x - dragStart)}
              onDragEnd={() => finishDrag(dislikeSeasoning, likeSeasoning)}
            >
              <span className={`badge ${currentSeasoning.limit === "high-sodium" ? "warn" : ""}`}>
                {currentSeasoning.limit}
              </span>
              <h1>{currentSeasoning.name}</h1>
              <p>{currentSeasoning.flavor}</p>
              <dl>
                <div>
                  <dt>物价</dt>
                  <dd>{currentSeasoning.price}</dd>
                </div>
                <div>
                  <dt>用量</dt>
                  <dd>{currentSeasoning.usage}</dd>
                </div>
              </dl>
              <p className="muted">适配：{currentSeasoning.pairings.join("、")}</p>
            </SwipeCard>
          ) : (
            <EmptyDeck title="调料卡片用完了" action="生成食谱" onClick={() => setStage("recipe")} />
          )}
          <SwipeActions onLeft={dislikeSeasoning} onRight={likeSeasoning} />
        </main>
      </section>
    );
  }

  function renderRecipe() {
    return (
      <section className="recipe-page">
        <div className="recipe-hero">
          <p className="eyebrow">今日组合食谱</p>
          <h1>{builtMeal.name}</h1>
          <p>{builtMeal.mealCategory}{builtMeal.inspiration ? ` · 参考 ${builtMeal.inspiration}` : ""}</p>
        </div>
        <div className="recipe-grid">
          <section className="panel">
            <h2>按选择顺序备菜</h2>
            <ol>{builtMeal.prepSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>
          <section className="panel">
            <h2>组合烹饪步骤</h2>
            <ol>{builtMeal.cookingSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>
          <section className="panel">
            <h2>覆盖检查</h2>
            <Cart
              items={[
                ...builtMeal.coverage.ingredients.map((item) => `食材 · ${item}`),
                ...builtMeal.coverage.seasonings.map((item) => `调味 · ${item}`)
              ]}
              empty="暂无选择"
            />
            <div className="button-row">
              <button className="secondary" onClick={() => setStage("name")}>切换姓名</button>
              <button onClick={restart}>重新选择</button>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      {stage === "name" && renderNameGate()}
      {stage === "interview" && renderInterview()}
      {stage === "ingredients" && renderIngredientSwipe()}
      {stage === "seasonings" && renderSeasoningSwipe()}
      {stage === "recipe" && renderRecipe()}
    </div>
  );
}

function SwipeCard({
  children,
  dragX,
  onDragStart,
  onDragMove,
  onDragEnd
}: {
  children: React.ReactNode;
  dragX: number;
  onDragStart: (x: number) => void;
  onDragMove: (x: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      className="swipe-card"
      style={{ transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` }}
      onPointerDown={(event) => onDragStart(event.clientX)}
      onPointerMove={(event) => onDragMove(event.clientX)}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      {children}
    </article>
  );
}

function SwipeActions({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  return (
    <div className="swipe-actions">
      <button className="round dislike" aria-label="不喜欢" onClick={onLeft}>×</button>
      <button className="round like" aria-label="喜欢" onClick={onRight}>✓</button>
    </div>
  );
}

function Cart({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="empty">{empty}</p>;

  return (
    <ul className="cart-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Balance({ counts, targets }: { counts: Record<MealRole, number>; targets: Record<MealRole, number> }) {
  return (
    <div className="balance">
      {(["protein", "vegetable", "staple"] as MealRole[]).map((role) => (
        <div key={role}>
          <span>{role}</span>
          <meter min={0} max={targets[role]} value={Math.min(counts[role], targets[role])} />
          <b>{counts[role]}/{targets[role]}</b>
        </div>
      ))}
    </div>
  );
}

function EmptyDeck({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return (
    <div className="empty-card">
      <h1>{title}</h1>
      <button onClick={onClick}>{action}</button>
    </div>
  );
}
