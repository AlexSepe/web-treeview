import { Component, Fragment, ReactNode, createElement } from "react";
import { WebTreeviewContainerProps } from "../typings/WebTreeviewProps";
import "./ui/WebTreeview.css";
import { ObjectItem } from "mendix";
import { TreeItem, TreeItemDataloader, TreeHost } from "./components/HeadlessTree";
import { TreeInstance } from "@headless-tree/core";

type MapTreeItem = Record<string, TreeItem>;

interface WebTreeviewState {
    cachedItems: MapTreeItem;
    treeInstance?: TreeInstance<TreeItem>;
    loading: boolean;
}

export class WebTreeview extends Component<WebTreeviewContainerProps, WebTreeviewState> {
    constructor(props: WebTreeviewContainerProps) {
        super(props);
        // static root initial state
        const dataMap: MapTreeItem = {};
        dataMap.root = {
            id: "root",
            uuid: "root",            
            parentId: null,
            isFolder: true,
            children: [],
            mxObject: undefined
        };

        this.state = {
            cachedItems: dataMap,
            treeInstance: undefined,
            loading: true
        };
    }

    componentDidMount(): void {
        // this.cacheItems();
    }

    componentDidUpdate(prevProps: WebTreeviewContainerProps): void {
        // console.info(
        //     " component DID update: Datasource Changed:" +
        //         (prevProps.rootDs !== this.props.rootDs) +
        //         " - DataSource disponivel? " +
        //         this.props.rootDs?.status
        // );
        if (prevProps.rootDs !== this.props.rootDs && this.props.rootDs.status === "available") {
            this.cacheItems();
        }
    }

    cacheItems(): void {
        const sortedItems = this.getMxItemsSorted();
        const mappedItemsNew = this.buildDataMap(sortedItems);
        // console.info("cacheItems:: cached items length -> " + sortedItems.length);
        this.setState({ cachedItems: mappedItemsNew, loading: false }, () => this.refreshTreeview());
    }

    refreshTreeview(): void {
        const { treeInstance } = this.state;
        console.info("RefreshTreeview:: items on refresh treeView:: " + Object.keys(this.state.cachedItems).length);
        treeInstance?.rebuildTree();
    }

    // get items from datasource and map to TreeItem
    getMxItemsSorted(): TreeItem[] {
        const { rootDs, parentID, nodeID, captionText, isFolder } = this.props;
        if (rootDs?.items) {
            const treeItemsMap: TreeItem[] = rootDs?.items.map(item => {
                return {
                    id: nodeID.get(item).value?.toString() || "",
                    parentId: parentID.get(item).value?.toString() || null,
                    isFolder: isFolder?.get(item).value || false,
                    caption: () => captionText.get(item).value?.toString() || "",
                    mxObject: item,
                    uuid: item.id
                };
            });
            const sortedItems = treeItemsMap.sort((a, b) => {
                const byID = a.parentId?.toString().localeCompare(a.parentId?.toString() || "");
                if (byID !== 0) {
                    return byID ?? 0;
                }
                // folders last
                const nb = b.isFolder ? 0 : 1;
                const na = a.isFolder ? 0 : 1;
                const result = nb - na;
                return result;
            }); // optional: sort items by id or any other criteria
            return sortedItems;
        }
        return [];
    }

    // build a map of items by id and set children
    buildDataMap(mxItems: TreeItem[]): MapTreeItem {
        const dataMap: MapTreeItem = {};
        // static root
        dataMap.root = {
            id: "root",
            parentId: null,
            isFolder: true,
            children: [],
            mxObject: undefined,
            uuid: "root",
        };
        mxItems.forEach(item => {
            dataMap[item.id] = item;
        });
        mxItems.forEach(item => {
            if (item.parentId) {
                const parentItem = dataMap[item.parentId];
                if (parentItem) {
                    if (!parentItem.children) {
                        parentItem.children = [];
                    }
                    parentItem.children.push(item);
                    parentItem.isFolder = true;
                }
            } else {
                // add to root
                const rootItem = dataMap.root;
                if (rootItem) {
                    if (!rootItem.children) {
                        rootItem.children = [];
                    }
                    rootItem.children.push(item);
                }
            }
        });

        const dataMapRemappedIds: MapTreeItem = {};
        dataMapRemappedIds.root = dataMap.root;
        mxItems.forEach(item => {
            if (item.mxObject?.id) {
                dataMapRemappedIds[item.mxObject.id] = dataMap[item.id];
            }
        });
        return dataMapRemappedIds;
    }

    getItemsFromCache(): MapTreeItem {
        // const { rootDs } = this.props;
        // return rootDs?.items ?? []
        return this.state.cachedItems;
    }

    selectItem(firstItem: ObjectItem): void {
        const { selection, onChangeDatabaseEvent } = this.props;
        if (selection.type === "Single") {
            selection.setSelection(firstItem);
        } else {
            selection.setSelection([firstItem]);
        }
        onChangeDatabaseEvent?.execute();
        console.info("selection set -> " + firstItem.id);
    }

    getMxItemFromTreeItem(item: TreeItem): ObjectItem | undefined {
        if (!item || !this.props.rootDs.items) {
            console.info("getMxItemFromTreeItem ITEM NULL ou DS Not ready!!");
            return undefined;
        }
        const cachedItems = this.getItemsFromCache();
        const itemRefreshed = cachedItems[item.uuid];
        if (!itemRefreshed) {
            console.info("getMxItemFromTreeItem CACHE not found for -> ", item);
            return undefined;
        }
        if (itemRefreshed.mxObject) {
            return itemRefreshed.mxObject;
        }
        // todo atualizar o cache se necessario
        const mxItem = this.props.rootDs.items.find(i => {
            const found = i.id.toString() === itemRefreshed.mxObject?.id.toString();
            return found;
        });
        return mxItem;
    }

    // LOADER..........
    getDataloader(): TreeItemDataloader {
        const dataLoader: TreeItemDataloader = {
            getItem: (id: string) => {
                const items = this.getItemsFromCache();
                const treeItem = items[id];
                //console.debug("dataLoader getItem -" + id, treeItem);
                return treeItem ?? { id: "<loadin>", uuid: id };
            },
            getChildren: (id: string) => {
                const items = this.getItemsFromCache();
                const treeItem = items[id];
                const childwithdata = treeItem?.children?.map(child => child.uuid) || [];
                //console.debug("dataLoader getChildren -" + id, treeItem.children);
                return childwithdata;
            },

            onitemChange: (itemsId: string[]) => {
                if (this.props.selection.type === "Single") {
                    if (!itemsId || itemsId.length === 0) {
                        //this.selectItem(undefined as any);
                        console.info("Item changed to null");
                        return;
                    }
                    const firstItemId = itemsId[0];
                    const items = this.getItemsFromCache();
                    const treeItem = items[firstItemId];
                    const item = this.getMxItemFromTreeItem(treeItem);
                    if (item) {
                        this.selectItem(item);
                        console.info("Item changed found: " + treeItem.id);
                    } else {
                        this.selectItem(null as any);
                        console.info("Item changed NOT found: " + firstItemId);
                    }
                }
            },

            getContent: (item: TreeItem): ReactNode => {
                // console.info("getting content for :", item);
                if (!item) {
                    return " <<item empty>> ";
                }
                if (this.props.content) {
                    const mxItem = this.getMxItemFromTreeItem(item);
                    return mxItem && this.props.content.get(mxItem);
                }
            }
        };
        return dataLoader;
    }

    render(): ReactNode {
        return (
            <Fragment>
                <div className={this.props.class} style={this.props.style}>
                    <TreeHost
                        singleSelection={this.props.selection.type === "Single"}
                        dataLoader={this.getDataloader()}
                        onReady={inst => {
                            if (this.state.treeInstance !== inst) {
                                console.debug("treeHost Ready with newInstance");
                                this.setState({ treeInstance: inst });
                            }
                        }}
                    />
                </div>
            </Fragment>
        );
    }
}
