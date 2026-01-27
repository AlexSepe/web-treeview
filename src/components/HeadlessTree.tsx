import { createElement, Fragment, ReactNode } from "react";
import "./HeadlessTree.css";
import {
    syncDataLoaderFeature,
    dragAndDropFeature,
    hotkeysCoreFeature,
    keyboardDragAndDropFeature,
    selectionFeature,
    searchFeature,
    expandAllFeature
} from "@headless-tree/core";
import { selectionFeatureSingle } from "./selectionSingle/feature";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import cn from "classnames";
//import { DemoItem, asyncDataLoader, data } from "./data";

export type TreeItem = {
    name: string;
    children?: string[];
    isFolder: boolean;
    getContent?(): ReactNode;
};

export type TreeItemDataloader = {
    getItem(itemId: string): TreeItem;
    getChildren(itemId: string): string[];
    onitemChange(itemId: string): void;
};

export function Tree(props: { singleSelection: boolean; dataLoader: TreeItemDataloader }) {
    const tree = useTree<TreeItem>({
        initialState: {
            //expandedItems: ["fruit"],
            //selectedItems: ["banana", "orange"],
        },
        setSelectedItems: (items: any[] | ((prevItems: any[]) => any[]), _tree?: any) => {
            const itemsArray = typeof items === "function" ? items([]) : items;
            console.info("Selected items: " + itemsArray.join(", "));
            if (itemsArray.length > 0) props.dataLoader.onitemChange(itemsArray[0]);
            else props.dataLoader.onitemChange("");
        },
        rootItemId: "root",
        getItemName: item => item.getItemData()?.name,
        isItemFolder: item => item.getItemData()?.isFolder, // !!item.getItemData()?.children,
        canReorder: false,
        // onDrop: createOnDropHandler((item, newChildren) => {
        //   data[item.getId()].children = newChildren;
        // }),
        indent: 20,
        dataLoader: props.dataLoader,
        canDrag: _item => true,
        canDrop(_items, _target) {
            return false;
        },
        onPrimaryAction: item => {
            console.info(`Primary action on ${item.getItemName()} - IsFolder: ${item.getItemData()?.isFolder}`);
            //props.dataLoader.onitemChange(item.getId());
            //force refresh if folder to reload children
            //TODO Lazy load
            // if (item.getItemData()?.isFolder && item.getItemData()?.children === undefined) {
            //     setTimeout(() => {
            //         console.info(`Invalidate children for ${item.getItemName()}`);
            //         item.invalidateItemData(false);
            //         item.invalidateChildrenIds(false);
            //     }, 500);
            // }
        },
        createForeignDragObject: items => ({
            format: "text/plain",
            data: items.map(item => item.getId()).join(",")
        }),
        features: [
            syncDataLoaderFeature,
            props.singleSelection ? selectionFeatureSingle : selectionFeature,
            //selectionFeatureSingle,
            hotkeysCoreFeature,
            dragAndDropFeature,
            keyboardDragAndDropFeature,
            searchFeature,
            expandAllFeature
        ]
    });

    return (
        <Fragment>
            {tree.isSearchOpen() && (
                <div className="searchboxX form-control">
                    <input {...tree.getSearchInputElementProps()} />
                    <span>({tree.getSearchMatchingItems().length} matches)</span>
                </div>
            )}
            {!tree.isSearchOpen() && (
                <div>
                    <button className="mx-button" onClick={() => tree.openSearch()}>
                        Search
                    </button>
                    <button className="mx-button" title="Expand All" onClick={() => tree.expandAll()}>
                        [+]
                    </button>
                    <button className="mx-button" title="Collapse All" onClick={() => tree.collapseAll()}>
                        [-]
                    </button>
                </div>
            )}
            <div>
                <div {...tree.getContainerProps()} className="tree">
                    <AssistiveTreeDescription tree={tree} />
                    {tree.getItems().map(item => (
                        <div className="outeritem" key={item.getId()}>
                            <button
                                key={item.getId()}
                                {...item.getProps()}
                                style={{ paddingLeft: `${item.getItemMeta().level * 20}px` }}
                            >
                                <div
                                    className={cn("treeitem", {
                                        focused: item.isFocused(),
                                        expanded: item.isExpanded(),
                                        selected: item.isSelected(),
                                        folder: item.isFolder(),
                                        drop: item.isDragTarget(),
                                        searchmatch: item.isMatchingSearch()
                                    })}
                                >
                                    {/* {item.getItemName()} */}
                                    {item.getItemData()?.getContent && item.getItemData()?.getContent!()}
                                </div>
                            </button>
                            {/* <button onClick={() => item.invalidateChildrenIds(false)}>[i1]</button> */}
                        </div>
                    ))}
                    <div style={tree.getDragLineStyle()} className="dragline" />
                </div>
            </div>
            {/* <div className="actionbar">
                <button className="actionbtn" onClick={() => tree.openSearch()}>
                    Search items
                </button>
            </div> */}
        </Fragment>
    );
}
