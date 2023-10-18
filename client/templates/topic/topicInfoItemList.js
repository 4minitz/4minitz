import { ActionItem } from "/imports/actionitem";
import { formatDateISO8601 } from "/imports/helpers/date";
import { InfoItem } from "/imports/infoitem";
import { Minutes } from "/imports/minutes";
import { Topic } from "/imports/topic";
import { User } from "/imports/user";
import { Blaze } from "meteor/blaze";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { formatDateISO8601Time } from "../../../imports/helpers/date";
import { InfoItemFactory } from "../../../imports/InfoItemFactory";
import { MeetingSeries } from "../../../imports/meetingseries";
import { IsEditedService } from "../../../imports/services/isEditedService";
import { ItemsConverter } from "../../../imports/services/itemsConverter";
import { LabelResolver } from "../../../imports/services/labelResolver";
import { MinutesFinder } from "../../../imports/services/minutesFinder";
import { ResponsibleResolver } from "../../../imports/services/responsibleResolver";
import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { handleError } from "../../helpers/handleError";
import { isEditedHandling } from "../../helpers/isEditedHelpers";

import { handlerShowMarkdownHint } from "./helpers/handler-show-markdown-hint";
import { labelSetFontColor } from "./helpers/label-set-font-color";
import { resizeTextarea } from "./helpers/resize-textarea";

const INITIAL_ITEMS_LIMIT = 4;

export class TopicInfoItemListContext {
  // called from Meeting Series "actionItemList" view (aka "My Action Items")
  static createdReadonlyContextForItemsOfDifferentTopicsAndDifferentMinutes(
    items,
    resolveSeriesForItem,
    resolveTopicForItem,
  ) {
    const context = new TopicInfoItemListContext(items, true, null);
    context.getSeriesId = resolveSeriesForItem;
    context.getTopicId = resolveTopicForItem;

    context.hasLink = true;
    return context;
  }

  // called from Meeting Series "tabItems" view
  static createReadonlyContextForItemsOfDifferentTopics(
    items,
    meetingSeriesId,
  ) {
    const context = new TopicInfoItemListContext(items, true, meetingSeriesId);
    const mapItemID2topicID = {};
    items.forEach((item) => {
      mapItemID2topicID[item._id] = item.parentTopicId;
    });
    context.getTopicId = (itemId) => {
      return mapItemID2topicID[itemId];
    };
    context.hasLink = true;
    return context;
  }

  // called from "topicElement" view
  static createContextForItemsOfOneTopic(
    items,
    isReadonly,
    topicParentId,
    parentTopicId,
  ) {
    return new TopicInfoItemListContext(
      items,
      isReadonly,
      topicParentId,
      parentTopicId,
    );
  }

  /**
   * Constructs an item context
   * @param items list of items
   * @param isReadonly can user edit the items?
   * @param topicParentId either minute ID or meeting series ID
   * @param parentTopicId topic ID
   */
  constructor(items, isReadonly, topicParentId = null, parentTopicId = null) {
    this.items = parentTopicId
      ? items.map((item) => {
          item.parentTopicId = parentTopicId;
          return item;
        })
      : items;
    this.isReadonly = isReadonly;
    this.topicParentId = topicParentId; // the parent of the topic: either
    // minute or meeting series!
    this.getSeriesId = () => {
      return topicParentId;
    };
  }
}

Template.topicInfoItemList.onCreated(function () {
  /** @type {TopicInfoItemListContext} */
  const tmplData = Template.instance().data;
  this.isItemsLimited = new ReactiveVar(
    tmplData.items.length > INITIAL_ITEMS_LIMIT,
  );

  // Dict maps Item._id => true/false, where true := "expanded state"
  // per default: everything is undefined => collapsed!
  this.isItemExpanded = new ReactiveVar({});

  // get last finalized Minute for details's new label
  this.lastFinalizedMinuteId =
    FlowRouter.getRouteName() === "minutesedit" // eslint-disable-line
      ? tmplData.topicParentId
      : MinutesFinder.lastFinalizedMinutesOfMeetingSeries(
          new MeetingSeries(tmplData.topicParentId),
        )._id;
});

const updateItemSorting = (evt, ui) => {
  const item = ui.item;
  const sorting = item.parent().find("> .topicInfoItem");
  const topic = new Topic(
    item.attr("data-topic-parent-id"),
    item.attr("data-parent-id"),
  );
  const newItemSorting = [];

  for (let i = 0; i < sorting.length; ++i) {
    const itemId = $(sorting[i]).attr("data-id");
    const item = topic.findInfoItem(itemId);

    newItemSorting.push(item.getDocument());
  }

  topic.setItems(newItemSorting);
  topic.save().catch((error) => {
    $(".itemPanel").sortable("cancel");
    handleError(error);
  });
};

const getMeetingSeriesId = (parentElementId) => {
  const aMin = Minutes.findOne(parentElementId);
  return aMin ? aMin.parentMeetingSeriesID() : parentElementId;
};

const createTopic = (parentElementId, topicId) => {
  if (!parentElementId || !topicId) return undefined;
  return new Topic(parentElementId, topicId);
};

const findInfoItem = (parentElementId, topicId, infoItemId) => {
  const aTopic = createTopic(parentElementId, topicId);
  if (aTopic) {
    return aTopic.findInfoItem(infoItemId);
  }
  return undefined;
};

const performActionForItem = (evt, tmpl, action) => {
  evt.preventDefault();
  /** @type {TopicInfoItemListContext} */
  const context = tmpl.data;

  if (context.isReadonly) {
    return;
  }

  const index = evt.currentTarget.getAttribute("data-index");
  const infoItem = context.items[index];
  const aInfoItem = findInfoItem(
    context.getSeriesId(infoItem._id),
    infoItem.parentTopicId,
    infoItem._id,
  );
  action(aInfoItem);
};

function initializeDragAndDrop(tmpl) {
  tmpl.$(".itemPanel").sortable({
    appendTo: document.body,
    axis: "y",
    opacity: 0.5,
    disabled: false,
    handle: ".itemDragDropHandle",
    update: updateItemSorting,
  });
}

function getDetails(tmpl, infoItemIndex) {
  /** @type {TopicInfoItemListContext} */
  const context = tmpl.data;
  const item = context.items[infoItemIndex];
  return item ? item.details || [] : [];
}

Template.topicInfoItemList.onRendered(function () {
  if (!Template.instance().data.isReadonly) {
    initializeDragAndDrop(this);
  }
});

const addNewDetails = async (tmpl, index) => {
  /** @type {TopicInfoItemListContext} */
  const context = tmpl.data;
  if (context.isReadonly) {
    return;
  }
  const infoItem = context.items[index];
  const aMin = new Minutes(context.getSeriesId(infoItem._id));
  const aTopic = new Topic(aMin, infoItem.parentTopicId);
  const aItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);

  const detailsRootElement = tmpl.$(`#id-details-${infoItem._id}`);
  detailsRootElement.parent().collapse("show");

  aItem.addDetails(aMin._id);
  await aItem.save();

  // Defer opening new details editor to give DOM some time for its expand
  // animation
  Meteor.setTimeout(() => {
    const inputEl = detailsRootElement.find(".detailInput").last().show();
    detailsRootElement.find(".detailActions").last().show();
    inputEl.parent().css("margin", "0 0 25px 0");
    inputEl.show();
    inputEl.focus();
  }, 250);
};

function makeDetailEditable(textEl, inputEl, detailActionsId) {
  textEl.hide();
  inputEl.show();
  detailActionsId.show();

  inputEl.val(textEl.attr("data-text"));
  inputEl.parent().css("margin", "0 0 25px 0");
  inputEl.focus();
  resizeTextarea(inputEl);
}

Template.topicInfoItemList.helpers({
  topicStateClass(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    if (infoItem && infoItem.itemType !== "actionItem") {
      return "infoitem";
    } else if (infoItem?.isOpen) {
      const todayDate = formatDateISO8601(new Date());
      if (infoItem.duedate && infoItem.duedate === todayDate) {
        return "actionitem-open-due-today";
      }
      if (infoItem.duedate && infoItem.duedate < todayDate) {
        return "actionitem-open-due-over";
      }
      return "actionitem-open";
    } else {
      return "actionitem-closed";
    }
  },

  hasDetails(index) {
    const details = getDetails(Template.instance(), index);
    return details.length > 0;
  },

  detailsArray(index) {
    return getDetails(Template.instance(), index);
  },

  isExpanded(itemID) {
    const allItemsExpandedState = Template.instance().isItemExpanded.get();
    return allItemsExpandedState[itemID];
  },

  isActionItem(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const item = context.items[index];
    return item && item.itemType === "actionItem";
  },

  isInfoItem(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const item = context.items[index];
    return item && context.items[index].itemType === "infoItem";
  },

  isItemConversationAllowed(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    if (context.isReadonly) {
      return false;
    }
    const item = context.items[index];
    return (
      item && ItemsConverter.isConversionAllowed(item, context.topicParentId)
    );
  },

  checkedState(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    return (infoItem && infoItem.itemType === "infoItem") || infoItem.isOpen
      ? ""
      : { checked: "checked" };
  },

  disabledState() {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    return context.isReadonly ? { disabled: "disabled" } : "";
  },

  cursorForEdit() {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    return context.isReadonly ? "" : "pointer";
  },

  responsiblesHelper(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    if (!infoItem) {
      return;
    }
    const responsible = ResponsibleResolver.resolveAndformatResponsiblesString(
      infoItem.responsibles,
    );
    return responsible ? `(${responsible})` : "";
  },

  getLabels(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    if (!infoItem) {
      return;
    }
    return LabelResolver.resolveLabels(
      infoItem.labels,
      getMeetingSeriesId(context.getSeriesId(infoItem._id)),
    ).map(labelSetFontColor);
  },

  getLinkToTopic(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    console.log("index:", index);
    console.log(infoItem);
    if (!infoItem) {
      return;
    }
    return Blaze._globalHelpers.pathForImproved(
      `/topic/${context.getTopicId(infoItem._id)}`,
    );
  },

  showLinks() {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    return context.hasLink;
  },

  tooltipForTopic(index) {
    /** @type {TopicInfoItemListContext} */
    const context = Template.instance().data;
    const infoItem = context.items[index];
    if (!infoItem) {
      return;
    }
    const topicId = context.getTopicId(infoItem._id);
    const seriesId = context.getSeriesId(infoItem._id);
    const ms = new MeetingSeries(seriesId);
    const aTopic = createTopic(seriesId, topicId);
    return (
      "Meeting Series:\n    " +
      ms.project +
      ":" +
      ms.name +
      "\nTopic:\n    " +
      aTopic.getDocument().subject
    );
  },
});

Template.topicInfoItemList.events({
  "click .show-more-items"(evt, tmpl) {
    evt.preventDefault();
    tmpl.isItemsLimited.set(false);
  },

  // INFO ITEM EVENTS

  "click #btnDelInfoItem"(evt, tmpl) {
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;
    performActionForItem(evt, tmpl, (item) => {
      const isDeleteAllowed = item.isDeleteAllowed(
        context.getSeriesId(item._infoItemDoc._id),
      );

      if (item.isSticky() || isDeleteAllowed) {
        const templateData = {
          type: item.isActionItem()
            ? i18n.__("Dialog.ConfirmDeleteItem.typeActionItem")
            : i18n.__("Dialog.ConfirmDeleteItem.typeInfoItem"),
          isActionItem: item.isActionItem(),
          subject: item.getSubject(),
          deleteAllowed: isDeleteAllowed,
        };

        let title = i18n.__("Dialog.ConfirmDelete.title");
        let button = i18n.__("Buttons.delete");
        if (!isDeleteAllowed) {
          title = item.isActionItem()
            ? i18n.__("Dialog.ConfirmDeleteItem.titleCloseActionItem")
            : i18n.__("Dialog.ConfirmDeleteItem.titleUnpinInfoItem");
          button = item.isActionItem()
            ? i18n.__("Dialog.ConfirmDeleteItem.buttonCloseActionItem")
            : i18n.__("Dialog.ConfirmDeleteItem.buttonUnpinInfoItem");
        }

        const action = () => {
          if (isDeleteAllowed) {
            item
              .getParentTopic()
              .removeInfoItem(item.getId())
              .catch(handleError);
          } else {
            if (item.isActionItem()) item.toggleState();
            else item.toggleSticky();
            item.save().catch(handleError);
          }
        };

        ConfirmationDialogFactory.makeWarningDialogWithTemplate(
          action,
          title,
          "confirmDeleteItem",
          templateData,
          button,
        ).show();
        return;
      }
      // not-sticky && delte-not-allowed
      ConfirmationDialogFactory.makeInfoDialog(
        i18n.__("Dialog.ItemDeleteError.title"),
        i18n.__("Dialog.ItemDeleteError.body1") +
          " " +
          (item.isActionItem()
            ? i18n.__("Dialog.ItemDeleteError.body2a")
            : i18n.__("Dialog.ItemDeleteError.body2b")) +
          " " +
          i18n.__("Dialog.ItemDeleteError.body3"),
      ).show();
    });
  },

  "click .btnToggleAIState"(evt, tmpl) {
    performActionForItem(evt, tmpl, (item) => {
      if (item instanceof ActionItem) {
        item.toggleState();
        item.save().catch(handleError);
      }
    });
  },

  "click .btnConvertInfoItem"(evt, tmpl) {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
      return;
    }

    const index = evt.currentTarget.getAttribute("data-index");
    const infoItem = context.items[index];

    const item = findInfoItem(
      context.topicParentId,
      infoItem.parentTopicId,
      infoItem._id,
    );
    // if edit is allowed topicParentId == currentMinutesId
    if (
      ItemsConverter.isConversionAllowed(
        item.getDocument(),
        context.topicParentId,
      )
    ) {
      ItemsConverter.convertItem(item).catch(handleError);
    } else {
      ConfirmationDialogFactory.makeInfoDialog(
        i18n.__("Dialog.ConvertItemError.title"),
        i18n.__("Dialog.ConvertItemError.body"),
      ).show();
    }
  },

  "click .btnPinInfoItem"(evt, tmpl) {
    performActionForItem(evt, tmpl, (item) => {
      if (item instanceof InfoItem) {
        item.toggleSticky();
        item.save().catch(handleError);
      }
    });
  },

  "click .btnEditInfoItem"(evt, tmpl) {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
      return;
    }
    if (getSelection().toString()) {
      // don't fire while selection is ongoing
      return;
    }

    const index = evt.currentTarget.getAttribute("data-index");
    const infoItem = context.items[index];

    Session.set("topicInfoItemEditTopicId", infoItem.parentTopicId);
    Session.set("topicInfoItemEditInfoItemId", infoItem._id);
    $("#dlgAddInfoItem").modal("show");
  },

  // Keep <a href=...> as clickable links inside detailText markdown
  "click .detailText a"(evt) {
    evt.stopPropagation();
  },

  "click .detailText"(evt, tmpl) {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
      return;
    }
    if (getSelection().toString()) {
      // don't fire while selection is ongoing
      return;
    }

    const detailId = evt.currentTarget.getAttribute("data-id");
    const textEl = tmpl.$(`#detailText_${detailId}`);
    const inputEl = tmpl.$(`#detailInput_${detailId}`);
    const detailActionsId = tmpl.$(`#detailActions_${detailId}`);

    if (inputEl.val() !== "") {
      return;
    }

    const index = inputEl.data("item");
    const infoItem = context.items[index];
    const aMin = new Minutes(context.topicParentId);
    const aTopic = new Topic(aMin, infoItem.parentTopicId);
    const aActionItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);

    const detailIndex = detailId.split("_")[1]; // detail id is: <collapseId>_<index>

    // Attention: .isEditedBy and .isEditedDate may be null!
    if (
      aActionItem._infoItemDoc.details[detailIndex].isEditedBy != undefined &&
      aActionItem._infoItemDoc.details[detailIndex].isEditedDate != undefined
    ) {
      const unset = () => {
        IsEditedService.removeIsEditedDetail(
          aMin._id,
          aTopic._topicDoc._id,
          aActionItem._infoItemDoc._id,
          detailIndex,
          true,
        );
      };

      const user = Meteor.users.findOne({
        _id: aActionItem._infoItemDoc.details[detailIndex].isEditedBy,
      });

      const tmplData = {
        isEditedByName: User.PROFILENAMEWITHFALLBACK(user),
        isEditedDate: formatDateISO8601Time(
          aActionItem._infoItemDoc.details[detailIndex].isEditedDate,
        ),
        isDetail: true,
      };

      ConfirmationDialogFactory.makeWarningDialogWithTemplate(
        unset,
        i18n.__("Dialog.IsEditedHandling.title"),
        "confirmationDialogResetEdit",
        tmplData,
        i18n.__("Dialog.IsEditedHandling.button"),
      ).show();
    } else {
      IsEditedService.setIsEditedDetail(
        aMin._id,
        aTopic._topicDoc._id,
        aActionItem._infoItemDoc._id,
        detailIndex,
      );
      makeDetailEditable(textEl, inputEl, detailActionsId);
    }

    const element = aActionItem._infoItemDoc.details[detailIndex];
    const unset = () => {
      IsEditedService.removeIsEditedDetail(
        aMin._id,
        aTopic._topicDoc._id,
        aActionItem._infoItemDoc._id,
        detailIndex,
        true,
      );
    };
    const setIsEdited = () => {
      IsEditedService.setIsEditedDetail(
        aMin._id,
        aTopic._topicDoc._id,
        aActionItem._infoItemDoc._id,
        detailIndex,
      );
      makeDetailEditable(textEl, inputEl, detailActionsId);
    };

    isEditedHandling(
      element,
      unset,
      setIsEdited,
      evt,
      "confirmationDialogResetDetail",
    );
  },

  "click .addDetail"(evt, tmpl) {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
      return;
    }

    const index = evt.currentTarget.getAttribute("data-index");
    addNewDetails(tmpl, index).catch(handleError);
  },

  "blur .detailInput"(evt, tmpl) {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
      return;
    }

    const detailId = evt.currentTarget.getAttribute("data-id");
    const index = $(evt.currentTarget).data("item");
    const infoItem = context.items[index];
    const textEl = tmpl.$(`#detailText_${detailId}`);
    const inputEl = tmpl.$(`#detailInput_${detailId}`);
    const detailActionsEl = tmpl.$(`#detailActions_${detailId}`);

    const text = inputEl.val().trim();

    const aMin = new Minutes(context.topicParentId);
    const aTopic = new Topic(aMin, infoItem.parentTopicId);
    const aActionItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);
    const detailIndex = detailId.split("_")[1]; // detail id is: <collapseId>_<index>

    IsEditedService.removeIsEditedDetail(
      aMin._id,
      aTopic._topicDoc._id,
      aActionItem._infoItemDoc._id,
      detailIndex,
      true,
    );

    if (text === "" || text !== textEl.attr("data-text")) {
      if (text === "") {
        const deleteDetails = () => {
          aActionItem.removeDetails(detailIndex);
          aActionItem.save().catch(handleError);
          const detailsCount = aActionItem.getDetails().length;
          if (detailsCount === 0) {
            tmpl.$(`#collapse-${infoItem._id}`).collapse("hide");
          }
        };

        const oldText = aActionItem.getDetailsAt(detailIndex).text;
        if (oldText) {
          // otherwise we show an confirmation dialog before the deails will be
          // removed
          ConfirmationDialogFactory.makeWarningDialog(
            deleteDetails,
            undefined,
            i18n.__("Dialog.confirmDeleteDetails", {
              subject: aActionItem.getSubject(),
            }),
          ).show();
        } else {
          // use case: Adding details and leaving the input field without
          // entering any text should go silently.
          deleteDetails();
        }
      } else {
        aActionItem.updateDetails(detailIndex, text);
        aActionItem.save().catch(handleError);
        IsEditedService.removeIsEditedDetail(
          aMin._id,
          aTopic._topicDoc._id,
          aActionItem._infoItemDoc._id,
          detailIndex,
          true,
        );
      }
    }

    inputEl.val("");
    inputEl.hide();
    detailActionsEl.hide();

    textEl.show();
  },

  "keydown .detailInput"(evt, tmpl) {
    const detailId = evt.currentTarget.getAttribute("data-id");
    const inputEl = tmpl.$(`#detailInput_${detailId}`);
    if (evt.which === 13 /*enter*/ && (evt.ctrlKey || evt.metaKey)) {
      evt.preventDefault();
      inputEl.blur();
    }

    resizeTextarea(inputEl);
  },

  "hide.bs.collapse"(evt, tmpl) {
    const itemID = $(evt.currentTarget).data("itemid");
    const expandStates = tmpl.isItemExpanded.get();
    expandStates[itemID] = false;
    tmpl.isItemExpanded.set(expandStates);
  },
  "show.bs.collapse"(evt, tmpl) {
    const itemID = $(evt.currentTarget).data("itemid");
    const expandStates = tmpl.isItemExpanded.get();
    expandStates[itemID] = true;
    tmpl.isItemExpanded.set(expandStates);
  },

  // Important! We have to use "mousedown" instead of "click" here.
  // -> for more details see next event handler
  "mousedown .detailInputDelete"(evt, tmpl) {
    evt.preventDefault();
    evt.stopPropagation();
    const detailId = evt.currentTarget.getAttribute("data-id");
    const inputEl = tmpl.$(`#detailInput_${detailId}`);
    inputEl.val("");
    inputEl.blur();
  },

  // Important! We have to use "mousedown" instead of "click" here.
  // Otherwise the detailsEdit textarea will loose focus and trigger
  // its blur-event which in turn makes the markdownhint icon invisible
  // which in turn swallow the click event - and nothing happens on click.
  "mousedown .detailInputMarkdownHint"(evt) {
    handlerShowMarkdownHint(evt);
  },
});
