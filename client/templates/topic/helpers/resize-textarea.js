import { $ } from "meteor/jquery";

export const resizeTextarea = (element) => {
  const scrollPos = $(document).scrollTop();
  if (element.css) {
    element.css("height", "auto");
    element.css("height", `${element.prop("scrollHeight")}px`);
  }
  $(document).scrollTop(scrollPos);
};
