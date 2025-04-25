export const getDirection = (oldIndex: number, newIndex: number) => {
  return newIndex - oldIndex > 0 ? "right" : "left";
};
