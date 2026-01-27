import { Component, Fragment, ReactNode, createElement } from "react";
import { WebTreeviewContainerProps } from "../typings/WebTreeviewProps";
import "./ui/WebTreeview.css";
import { ObjectItem } from "mendix";
import { Tree, TreeItemDataloader } from "./components/HeadlessTree";

interface WebTreeviewState {
    cachedItems: ObjectItem[];
    loading: boolean;
    rootItems: string[];
}

export class WebTreeview extends Component<WebTreeviewContainerProps, WebTreeviewState> {
    constructor(props: WebTreeviewContainerProps) {
        super(props);
        this.state = { cachedItems: [], rootItems: [], loading: true };
    }

    componentDidMount() {
        //this.ensureSelection();
        this.cacheItems();
    }

    componentDidUpdate(prevProps: WebTreeviewContainerProps) {
        if (prevProps.rootDs !== this.props.rootDs) {
            this.cacheItems();
        }
        // if (prevProps.selection !== this.props.selection) {
        //     this.ensureSelection();
        // }
    }

    cacheItems() {
        const sortedItems = this.getItemsSorted();
        this.setState({ cachedItems: sortedItems });
        console.info("cached items length -> " + sortedItems.length);

        // const rootItems = this.getRootItems(sortedItems).map(item => item.id.toString());
        // const isEqual =
        //     rootItems.length === this.state.rootItems.length &&
        //     rootItems.every((value, index) => value === this.state.rootItems[index]);

        // if (!isEqual) {
             this.setState({ loading: true });
            //console.info(`--------------- reload root items: ${rootItems.length}------------------`);
            setTimeout(() => {
                this.setState({ loading: false });
            }, 50);
        //}
    }

    getItemsSorted() {
        const { rootDs, parentID, isFolder } = this.props;
        if (rootDs?.items) {
            const sortedItems = rootDs?.items.sort((a, b) => {
                const byID = parentID
                    .get(a)
                    .value?.toString()
                    .localeCompare(parentID.get(b).value?.toString() || "");
                if (byID !== 0) return byID ?? 0;
                // folders first
                const nb = isFolder.get(b).value ? 0 : 1;
                const na = isFolder.get(a).value ? 0 : 1;
                const result = nb - na;
                return result;
            }); // optional: sort items by id or any other criteria
            return sortedItems;
        }
        return [];
    }

    getItems() {
        // const { rootDs } = this.props;
        // return rootDs?.items ?? []
        return this.state.cachedItems;
    }

    getRootItems(items?: ObjectItem[]) {
        const { parentID } = this.props;
        const cachedItems = items ?? this.getItems();

        // raiz = itens sem parentID
        return cachedItems.filter(item => {
            const parentValue = parentID.get(item).value;
            return !parentValue; // vazio = raiz
        });
    }
    getRootItemsChildrenIDs() {
        const rootItems = this.getRootItems();
        const { nodeID } = this.props;
        const childrenIDs = rootItems.map(item => {
            const rootNodeID = nodeID.get(item).value?.toString() || "";
            return rootNodeID;
        });
        return childrenIDs;
    }

    getChildItems(parent: ObjectItem) {
        const { parentID, nodeID } = this.props;
        //const { cachedItems } = this.state;
        const cachedItems = this.getItems();

        const nodeIDValue = nodeID.get(parent).value?.toString();
        // filhos = itens cujo parentID == nodeID do pai
        const childItems = cachedItems.filter(item => {
            const childParentID = parentID.get(item).value?.toString();
            const equals = childParentID === nodeIDValue;
            return equals;
        });
        //console.info("Found children count -> " + childItems.length);
        return childItems;
    }

    //LOADER..........
    findItemById(id: string): ObjectItem | null {
        const cachedItems = this.getItems();
        const { nodeID } = this.props;

        const foundItem = cachedItems.find(item => {
            const itemNodeID = nodeID.get(item).value?.toString();
            return itemNodeID === id;
        });
        return foundItem || null;
    }

    selectItem(firstItem: ObjectItem) {
        const { selection, onChangeDatabaseEvent } = this.props;        
        if (selection.type === "Single") {
            selection.setSelection(firstItem);
        } else {
            selection.setSelection([firstItem]);
        }
        onChangeDatabaseEvent?.execute();
        console.info("selection set -> " + firstItem.id);
    }

    getDataloader(): TreeItemDataloader {
        const dataLoader: TreeItemDataloader = {
            getItem: (id: string) => {
                const { nodeID, isFolder } = this.props;
                //console.info("getDataloader Getting item for id -> " + id);
                if (id === "root") {
                    return {
                        name: "root",
                        isFolder: true,
                        children: this.getRootItemsChildrenIDs()
                    };
                }
                // find item by id
                const item = this.findItemById(id);

                if (item) {
                    const isFolderValue: boolean = isFolder.get(item).value ?? false;
                    const itemName = "item_" + id; //nameAttr.get(item).value?.toString() || "Unnamed";
                    // check if item has children
                    const children = this.getChildItems(item);
                    const childrenIDs = children.map(child => {
                        const childNodeID = nodeID.get(child).value?.toString() || "";
                        return childNodeID;
                    });
                    return {
                        name: itemName,
                        isFolder: isFolderValue,
                        children: childrenIDs.length > 0 ? childrenIDs : undefined,
                        getContent: () => this.props.content.get(item)
                    };
                } else {
                    //throw new Error("Item not found for id: " + id);
                    return {
                        name: "item_not_found_" + id,
                        isFolder: false
                    };
                }
            },
            getChildren: (id: string) => {
                const cachedItems = this.getItems();
                const { nodeID } = this.props;
                //console.info("getDataloader Getting children for id -> " + id);
                if (id === "root") {
                    const children = this.getRootItems().map(rootItem => {
                        const rootNodeID = nodeID.get(rootItem).value?.toString() || "";
                        return rootNodeID;
                    });
                    //console.info("root response -> " + children);
                    return children;
                }
                // find item by id
                const parentItem = cachedItems.find(item => {
                    const itemNodeID = nodeID.get(item).value?.toString();
                    return itemNodeID === id;
                });
                if (parentItem) {
                    const children = this.getChildItems(parentItem);
                    const childrenIDs = children.map(child => {
                        const childNodeID = nodeID.get(child).value?.toString() || "";
                        return childNodeID;
                    });
                    return childrenIDs;
                } else {
                    return [];
                }
            },
            onitemChange: (itemId: string) => {
                const item = this.findItemById(itemId);
                if (item) {
                    this.selectItem(item);
                    console.info("Item changed found: " + itemId);
                } else {
                    this.selectItem(null as any);
                    console.info("Item changed NOT found: " + itemId);
                }
            }
        };
        return dataLoader;
    }

    render(): ReactNode {
        const { selection } = this.props;
        //const rootItems = this.getRootItems();

        return (
            <Fragment>
                {/* <div>
                    {rootItems.map(item => (
                        <div key={item.id} style={{ marginLeft: "20px", border: "1px solid black", padding: "5px" }}>
                            {content.get(item)}
                            <div>Root Item: {item.id}</div>

                            {this.getChildItems(item).map(child => (
                                <div
                                    key={child.id}
                                    style={{ marginLeft: "40px", border: "1px solid blue", padding: "5px" }}
                                >
                                    {content.get(child)}
                                    <div>Child Item: {child.id}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div> */}
                {/* {this.props.rootDs.status === "loading" && <div>Loading...</div>}
                {this.props.rootDs.status === "available" && (
                    <Tree singleSelection={selection.type === "Single"} dataLoader={this.getDataloader()} />
                )} */}

                {this.state.loading && <div className="loadingTreeview"></div>}
                {!this.state.loading && (
                    <div>                        
                        <Tree singleSelection={selection.type === "Single"} dataLoader={this.getDataloader()} />
                    </div>
                )}
            </Fragment>
        );
    }
}
