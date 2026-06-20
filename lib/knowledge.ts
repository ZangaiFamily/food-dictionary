import fs from "node:fs";
import path from "node:path";

export type EaterType = "vegetarian" | "meat-lover" | "flexible";
export type IngredientGroup = "素食" | "肉食" | "综合";
export type MealRole = "protein" | "vegetable" | "staple";
export type SeasoningLimit = "low" | "medium" | "high-sodium";

export type Ingredient = {
  name: string;
  calories: string;
  price: string;
  group: IngredientGroup;
  role: MealRole;
  image: string;
  recipes: string[];
};

export type Seasoning = {
  name: string;
  flavor: string;
  price: string;
  limit: SeasoningLimit;
  image: string;
  pairings: string[];
  usage: string;
};

export type Recipe = {
  name: string;
  type: IngredientGroup;
  ingredients: string[];
  seasonings: string[];
  mealCategory: string;
  steps: string[];
};

export type KnowledgeBase = {
  ingredients: Ingredient[];
  seasonings: Seasoning[];
  recipes: Recipe[];
};

function readKnowledgeFile(fileName: string) {
  return fs.readFileSync(path.join(process.cwd(), "knowledge", fileName), "utf8");
}

function parseMarkdownTable(markdown: string) {
  const rows = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim())
    );

  const [headers, , ...body] = rows;
  return body.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}

function splitList(value: string) {
  return value
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getKnowledgeBase(): KnowledgeBase {
  const ingredients = parseMarkdownTable(readKnowledgeFile("ingredients.md")).map((row) => ({
    name: row["食材名字"],
    calories: row["卡路里"],
    price: row["大约物价"],
    group: row["分类"] as IngredientGroup,
    role: row["膳食角色"] as MealRole,
    image: row["图片"],
    recipes: splitList(row["可以组成的食谱"])
  }));

  const seasonings = parseMarkdownTable(readKnowledgeFile("seasonings.md")).map((row) => ({
    name: row["调料名字"],
    flavor: row["风味"],
    price: row["大约物价"],
    limit: row["限制等级"] as SeasoningLimit,
    image: row["图片"],
    pairings: splitList(row["适配食材"]),
    usage: row["建议用量"]
  }));

  const recipes = parseMarkdownTable(readKnowledgeFile("recipes.md")).map((row) => ({
    name: row["名称"],
    type: row["类型"] as IngredientGroup,
    ingredients: splitList(row["食材"]),
    seasonings: splitList(row["调料"]),
    mealCategory: row["餐食分类"],
    steps: row["步骤"]
      .split(";")
      .map((step) => step.trim())
      .filter(Boolean)
  }));

  return { ingredients, seasonings, recipes };
}
