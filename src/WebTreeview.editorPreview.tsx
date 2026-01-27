import { Component, ReactNode, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { WebTreeviewPreviewProps } from "../typings/WebTreeviewProps";

export class preview extends Component<WebTreeviewPreviewProps> {
    render(): ReactNode {
        return <HelloWorldSample sampleText={"this.props.sampleText"} />;
    }
}

export function getPreviewCss(): string {
    return require("./ui/WebTreeview.css");
}
