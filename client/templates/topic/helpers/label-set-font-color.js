export const labelSetFontColor = (labelObj) => {
  const doc = labelObj.getDocument();
  doc.fontColor = labelObj.hasDarkBackground() ? "#ffffff" : "#000000";
  return doc;
};
