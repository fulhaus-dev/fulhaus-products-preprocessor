import { envConfig } from '@ludwig-preprocessor/config/env';

const productCategoryMax = envConfig.PRODUCT_CATEGORY_MAX;
let categoryCountMap = new Map<string, number>();
let runningTotal = 0;

export function isCategoryFull(key: string) {
  return (categoryCountMap.get(key) ?? 0) >= productCategoryMax;
}

export function setCategoryCount(key: string) {
  const currentCount = categoryCountMap.get(key) ?? 0;
  if (currentCount >= productCategoryMax) return false;

  categoryCountMap.set(key, currentCount + 1);
  runningTotal++;
  return true;
}

export function getCategoryKeyCount() {
  return categoryCountMap.size;
}

export function getCategoryTotal() {
  return runningTotal;
}

export function getCategoryCountMap() {
  return categoryCountMap;
}

export function clearCategoryCountMap() {
  categoryCountMap.clear();
  runningTotal = 0;
}
