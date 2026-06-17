import { getKnowledgeBase } from "@/lib/knowledge";
import RecipeTinderApp from "./recipe-tinder-app";

export default function Home() {
  return <RecipeTinderApp knowledge={getKnowledgeBase()} />;
}
