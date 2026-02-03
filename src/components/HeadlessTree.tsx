import { createElement, Fragment, ReactNode, useEffect, useState } from "react";
import "./HeadlessTree.css";
import {
    syncDataLoaderFeature,
    dragAndDropFeature,
    hotkeysCoreFeature,
    keyboardDragAndDropFeature,
    selectionFeature,
    expandAllFeature,
    TreeInstance,
    ItemInstance
} from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import cn from "classnames";

import { ObjectItem } from "mendix";
import { selectionFeatureSingle } from "../features/selectionSingle/feature";
import { searchFeatureCustom } from "../features/search/feature";

export type TreeItem = {
    uuid: string;
    id: string;
    caption?: () => string;
    parentId: string | null;
    children?: TreeItem[];
    isFolder: boolean;
    mxObject: ObjectItem | undefined;
};

export type TreeItemDataloader = {
    getItem(itemId: string): TreeItem;
    getChildren(itemId: string): string[];
    onSelectionChange(itemId: string[]): void;
    getContent(item: TreeItem): ReactNode;
};

export function TreeHost(props: {
    singleSelection: boolean;
    dataLoader: TreeItemDataloader;
    showControllers: boolean;
    onReady?: (tree: TreeInstance<TreeItem>) => void;
}): ReactNode {
    const { singleSelection, dataLoader, showControllers, onReady } = props;
    function doCreateForeingDragObject(items: Array<ItemInstance<TreeItem>>): any {
        const itemData = items[0].getItemData();
        const dataobj = {
            nodeId: itemData.id,
            objectId: itemData.uuid
        };
        return {
            format: "application/json",
            data: JSON.stringify(dataobj)
        };
    }

    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    // Runs every time `selected` changes
    useEffect(() => {
        if (!selectedItems) {
            return;
        }
        //console.info("Selected items: " + selectedItems);
        dataLoader.onSelectionChange(selectedItems);
    }, [selectedItems]);

    const tree = useTree<TreeItem>({
        initialState: {},
        state: { selectedItems },
        setSelectedItems: setSelectedItems,
        rootItemId: "root",
        getItemName: item => item.getItemData()?.uuid,
        isItemFolder: item => item.getItemData()?.isFolder,
        isSearchMatchingItem: (search, item) => {
            if (search.length <= 0 && !item.getItemData().caption) {
                return false;
            }
            const itemcaption = item.getItemData().caption?.() || "";
            return itemcaption.toLowerCase().includes(search.toLowerCase());
        },
        canReorder: false,
        indent: 20,
        dataLoader,
        canDrag: _item => true,
        canDrop(_items, _target) {
            return false;
        },
        // onPrimaryAction: item => {
        //     console.info(`Primary action on ${item.getItemName()} - IsFolder: ${item.getItemData()?.isFolder}`);
        // },
        createForeignDragObject: doCreateForeingDragObject,
        features: [
            syncDataLoaderFeature,
            singleSelection ? selectionFeatureSingle : selectionFeature,
            hotkeysCoreFeature,
            dragAndDropFeature,
            keyboardDragAndDropFeature,
            searchFeatureCustom,
            expandAllFeature
        ]
    });

    useEffect(() => {
        onReady?.(tree);
    }, [tree, onReady]);

    return <Tree tree={tree} dataLoader={dataLoader} showControllers={showControllers} />;
}

export function Tree(props: { tree: TreeInstance<TreeItem>; dataLoader: TreeItemDataloader; showControllers: boolean }): ReactNode {
    const { tree } = props;
    return (
        <Fragment>
            <div className="treeviewMain form-control">
                <div className="treeviewControls">
                    {tree.isSearchOpen() && (
                        <div className="searchbox">
                            <input {...tree.getSearchInputElementProps()} className={`form-control ${tree.getSearchInputElementProps()?.className || ""}`} />
                            <span className="textmatchingitems"> ({tree.getSearchMatchingItems().length} matches)</span>
                        </div>
                    )}
                    {props.showControllers && !tree.isSearchOpen() && (
                        <div>
                            <button className="btn mx-button" onClick={() => tree.openSearch()}>
                                Search
                            </button>
                            <button className="btn mx-button" title="Expand All" onClick={() => tree.expandAll()}>
                                [+]
                            </button>
                            <button className="btn mx-button" title="Collapse All" onClick={() => tree.collapseAll()}>
                                [-]
                            </button>
                        </div>
                    )}
                </div>
                <div className="treeviewTree">
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
                                        {item.isLoading() && " (loading...)"}
                                        <div className="treeitem-content">
                                            {props.dataLoader.getContent(item.getItemData()) ||
                                                item.getItemData().caption?.() ||
                                                "<no caption>"}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                        <div style={tree.getDragLineStyle()} className="dragline" />
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
