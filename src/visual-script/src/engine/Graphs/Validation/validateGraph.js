import { validateGraphAcyclic } from "./validateGraphAcyclic";
import { validateGraphLinks } from "./validateGraphLinks";

export function validateGraph(graph) {
    const errorList = [];
    errorList.push(...validateGraphAcyclic(graph.nodes), ...validateGraphLinks(graph.nodes));
    return errorList;
}
