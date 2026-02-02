/**
 * This file was generated from WebTreeview.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, ListValue, ListAttributeValue, ListExpressionValue, ListWidgetValue, SelectionSingleValue, SelectionMultiValue } from "mendix";
import { Big } from "big.js";

export interface WebTreeviewContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    rootDs: ListValue;
    nodeID: ListAttributeValue<Big | string>;
    parentID: ListAttributeValue<Big | string>;
    captionText: ListExpressionValue<string>;
    isFolder?: ListExpressionValue<boolean>;
    content?: ListWidgetValue;
    selection: SelectionSingleValue | SelectionMultiValue;
    onChangeDatabaseEvent?: ActionValue;
}

export interface WebTreeviewPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    rootDs: {} | { caption: string } | { type: string } | null;
    nodeID: string;
    parentID: string;
    captionText: string;
    isFolder: string;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    selection: "Single" | "Multi";
    onChangeDatabaseEvent: {} | null;
}
