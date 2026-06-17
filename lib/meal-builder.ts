import type { Ingredient, Recipe, Seasoning } from "./knowledge";

export type BuiltMeal = {
  name: string;
  mealCategory: string;
  inspiration?: string;
  prepSteps: string[];
  cookingSteps: string[];
  coverage: {
    ingredients: string[];
    seasonings: string[];
  };
};

function findInspiration(recipes: Recipe[], ingredients: Ingredient[], seasonings: Seasoning[]) {
  const ingredientNames = new Set(ingredients.map((item) => item.name));
  const seasoningNames = new Set(seasonings.map((item) => item.name));

  return recipes
    .map((recipe) => ({
      recipe,
      score:
        recipe.ingredients.filter((item) => ingredientNames.has(item)).length * 2 +
        recipe.seasonings.filter((item) => seasoningNames.has(item)).length
    }))
    .sort((a, b) => b.score - a.score)[0]?.recipe;
}

function buildName(ingredients: Ingredient[], inspiration?: Recipe) {
  const proteins = ingredients.filter((item) => item.role === "protein").map((item) => item.name);
  const vegetables = ingredients.filter((item) => item.role === "vegetable").map((item) => item.name);
  const staples = ingredients.filter((item) => item.role === "staple").map((item) => item.name);
  const leading = [...proteins, ...vegetables].slice(0, 3);

  if (leading.length > 0 && staples.length > 0) {
    return `${leading.join("、")}${staples[0]}碗`;
  }

  if (leading.length > 0) {
    return `${leading.join("、")}组合餐`;
  }

  return inspiration?.name ?? "今日组合餐";
}

function prepStepFor(ingredient: Ingredient) {
  if (ingredient.role === "staple") return `${ingredient.name}提前煮熟或加热，作为主食底。`;
  if (ingredient.role === "protein") return `${ingredient.name}切成易熟大小，擦干水分后备用。`;
  return `${ingredient.name}清洗后切成适口大小，按易熟程度分开放。`;
}

function buildCookingSteps(ingredients: Ingredient[], seasonings: Seasoning[]) {
  const proteins = ingredients.filter((item) => item.role === "protein");
  const vegetables = ingredients.filter((item) => item.role === "vegetable");
  const staples = ingredients.filter((item) => item.role === "staple");
  const aromatics = seasonings.filter((item) => ["蒜", "姜"].includes(item.name));
  const sauces = seasonings.filter((item) => !["蒜", "姜"].includes(item.name));
  const steps: string[] = [];

  if (aromatics.length > 0) {
    steps.push(`热锅后先加入${aromatics.map((item) => item.name).join("、")}爆香。`);
  } else {
    steps.push("热锅后加入少量油，保持中火。");
  }

  if (proteins.length > 0) {
    steps.push(`放入${proteins.map((item) => item.name).join("、")}，先煎炒到表面变色并基本熟透。`);
  }

  if (vegetables.length > 0) {
    steps.push(`加入${vegetables.map((item) => item.name).join("、")}，按从难熟到易熟的顺序翻炒。`);
  }

  if (sauces.length > 0) {
    steps.push(
      `用${sauces.map((item) => `${item.name}（${item.usage}）`).join("、")}调味，翻拌均匀后尝味调整。`
    );
  } else {
    steps.push("用少量盐味或清水调整口感，避免过度调味。");
  }

  if (staples.length > 0) {
    steps.push(`把炒好的食材铺在${staples.map((item) => item.name).join("、")}上，组合成完整餐食。`);
  } else {
    steps.push("所有食材熟透后装盘，静置 1 分钟让味道融合。");
  }

  return steps;
}

export function buildMeal(ingredients: Ingredient[], seasonings: Seasoning[], recipes: Recipe[]): BuiltMeal {
  const inspiration = findInspiration(recipes, ingredients, seasonings);
  const hasRawProtein = ingredients.some((item) => item.role === "protein");
  const hasStaple = ingredients.some((item) => item.role === "staple");

  return {
    name: buildName(ingredients, inspiration),
    mealCategory: hasRawProtein && hasStaple ? "动态组合主餐" : "动态组合轻餐",
    inspiration: inspiration?.name,
    prepSteps: ingredients.map(prepStepFor),
    cookingSteps: buildCookingSteps(ingredients, seasonings),
    coverage: {
      ingredients: ingredients.map((item) => item.name),
      seasonings: seasonings.map((item) => item.name)
    }
  };
}
