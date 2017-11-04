export const labelSetFontColor = (labelObj) => {
    let doc = labelObj.getDocument();
    doc.fontColor = labelObj.hasDarkBackground() ? '#ffffff' : '#000000';
    return doc;
};