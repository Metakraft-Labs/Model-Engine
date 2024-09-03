import { fadeOutAnimationStateActions } from "./AnimationState";
import { updateBlendSpace1D } from "./BlendSpace1D";
import { updateDistanceMatchingAction, updateFollowerAction } from "./DistanceMatchingAction";

function updateNodes(state, xNodes, yNodes) {
    if (!xNodes.length && !yNodes.length) return;
    // TODO: Use blend space 2D instead

    let allNodes = [...xNodes, ...yNodes];

    const xIdleNode = xNodes.find(node => node.action === state.idleAction),
        yIdleNode = yNodes.find(node => node.action === state.idleAction);

    // If idle action does not exist on both axis
    // Remove it from blending
    if ((xIdleNode && !yIdleNode) || (!xIdleNode && yIdleNode)) {
        allNodes = allNodes.filter(node => node.action !== state.idleAction);
        state.idleAction.weight = 0;
    } else if (xIdleNode && yIdleNode) {
        // If idle exist on both axis
        xIdleNode.weight =
            yIdleNode.weight =
            state.idleAction.weight =
                xIdleNode.weight * yIdleNode.weight;
    }

    // Remove duplicate nodes
    for (let index1 = 0; index1 < allNodes.length; index1++) {
        const firstNode = allNodes[index1];

        for (let index2 = index1 + 1; index2 < allNodes.length; index2++) {
            const secondNode = allNodes[index2];
            if (firstNode.action === secondNode.action) {
                firstNode.weight += secondNode.weight;
                allNodes.splice(index2, 1);
                index2--;
            }
        }
    }

    // Normalize and assign weights
    const totalWeight = allNodes.reduce((total, node) => total + node.weight, 0);

    allNodes.forEach(node => {
        node.weight = node.action.weight = node.weight / totalWeight;
    });

    // Update distance based actions

    const distanceActions = allNodes
        .filter(node => node.data)
        .map(node => node.data)
        .sort((a, b) => b.action.weight - a.action.weight);

    const leaderAction = distanceActions.shift();
    if (leaderAction) {
        const updateValue = state.frameBlendValue.length();
        updateDistanceMatchingAction(leaderAction, updateValue);
        distanceActions.forEach(action => updateFollowerAction(leaderAction, action));
    }
}

export function updateLocomotionStateBlendValues(state, delta) {
    const locomotion = state.locomotion;
    state.blendValue.set(locomotion.x, locomotion.z);
    state.frameBlendValue.copy(state.blendValue).multiplyScalar(delta);
}

export function updateLocomotionState(state, delta) {
    updateLocomotionStateBlendValues(state, delta);

    const updatedNodesX = updateBlendSpace1D(state.xAxisBlendSpace, -state.blendValue.x);
    const updatedNodesY = updateBlendSpace1D(state.yAxisBlendSpace, state.blendValue.y);

    updateNodes(state, updatedNodesX, updatedNodesY);
}

export function enterLocomotionState(state, prevState) {
    fadeOutAnimationStateActions(prevState);
    getLocomotionStateActions(state).forEach(x => {
        x.reset().play().fadeIn(0.1);
    });
}

export function getLocomotionStateActions(state) {
    const yActions = state.forwardMovementActions.map(node => node.action);
    const xActions = state.sideMovementActions.map(node => node.action);
    return [state.idleAction, ...yActions, ...xActions];
}
