import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateToBibleWithScripture(book, chapter, reference) {
  if (navigationRef.isReady()) {
    // Navigate to Bible Study tab with scripture parameters
    navigationRef.navigate("Bible Study", {
      initialBook: book,
      initialChapter: chapter,
      initialReference: reference,
    });
  }
}
