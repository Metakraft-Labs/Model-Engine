export const autoLayout = (nodes, edges) => {
    let x = 0;
    nodes.forEach(node => {
        node.position.x = x;
        x += 200;
    });
};
