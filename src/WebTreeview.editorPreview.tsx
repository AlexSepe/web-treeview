import { Component, Fragment, ReactNode, createElement } from "react";
import { WebTreeviewPreviewProps } from "../typings/WebTreeviewProps";

export class preview extends Component<WebTreeviewPreviewProps> {
    render(): ReactNode {
        return (
            <Fragment>
                <div
                    style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        width: "300px",
                        height: "400px",
                        overflow: "auto"
                    }}
                >
                    NO PREVIEW AVAILABLE
                </div>
            </Fragment>
        );
    }
}

export function getPreviewCss(): string {
    return require("./ui/WebTreeview.css");
}
