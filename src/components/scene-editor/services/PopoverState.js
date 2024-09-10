import { defineState, getMutableState } from "../../../hyperflux";

/**
 * Popover state for tailwind routes
 */
export const PopoverState = defineState({
    name: "ee.client.PopoverState",
    initial: {
        elements: [],
    },

    /**shows a popupover. if a previous popover was already present, the `element` popover will be current showed */
    showPopupover: element => {
        getMutableState(PopoverState).elements.merge([element]);
    },
    /**close the current popover. if a previous popover was present, the previous one will be shown */
    hidePopupover: () => {
        getMutableState(PopoverState).elements.set(prevElements => {
            prevElements.pop();
            return prevElements;
        });
    },
    /**Returns true if there are any open popovers, false otherwise, based on the length of the elements array in PopoverState.*/
    isPopupoverOpen: () => getMutableState(PopoverState).elements.length > 0,
});
