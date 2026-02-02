import { ItemInstance, SetStateFn } from "@headless-tree/core";

export interface SelectionDataRef {
    selectUpToAnchorId?: string | null;
}

export type SelectionFeatureDef<T> = {
    state: {
        selectedItems: string[];
    };
    config: {
        setSelectedItems?: SetStateFn<string[]>;
    };
    treeInstance: {
        setSelectedItems: (selectedItems: string[]) => void;
        getSelectedItems: () => Array<ItemInstance<T>>;
    };
    itemInstance: {
        select: () => void;
        deselect: () => void;
        toggleSelect: () => void;
        isSelected: () => boolean;
        selectUpTo: (ctrl: boolean) => void;
    };
    hotkeys: "toggleSelectedItem" | "selectUpwards" | "selectDownwards" | "selectAll";
};
