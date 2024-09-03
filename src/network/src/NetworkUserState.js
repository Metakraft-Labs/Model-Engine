import React, { useEffect } from "react";
import { defineSystem } from "../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../ecs/SystemGroups";
import { defineState, getMutableState, getState, none, useHookstate } from "../../hyperflux";
import { NetworkTopics } from "./Network";
import { NetworkState } from "./NetworkState";

/**
 * NetworkUserState is a state that tracks which users are in which instances
 */
export const NetworkWorldUserState = defineState({
    name: "ee.engine.network.NetworkWorldUserState",
    initial: {},

    userJoined: (userID, instanceID) => {
        if (!getState(NetworkWorldUserState)[userID])
            getMutableState(NetworkWorldUserState)[userID].set([]);
        if (!getState(NetworkWorldUserState)[userID].includes(instanceID))
            getMutableState(NetworkWorldUserState)[userID].merge([instanceID]);
    },

    userLeft: (userID, instanceID) => {
        if (!getState(NetworkWorldUserState)[userID]) return;
        getMutableState(NetworkWorldUserState)[userID].set(ids =>
            ids.filter(id => id !== instanceID),
        );
        if (getState(NetworkWorldUserState)[userID].length === 0)
            getMutableState(NetworkWorldUserState)[userID].set(none);
    },
});

const NetworkUserReactor = props => {
    useEffect(() => {
        NetworkWorldUserState.userJoined(props.userID, props.networkID);
        return () => NetworkWorldUserState.userLeft(props.userID, props.networkID);
    }, []);
    return null;
};

const NetworkReactor = props => {
    const networkUsers = useHookstate(
        getMutableState(NetworkState).networks[props.networkID].users,
    );

    return (
        <>
            {networkUsers.keys.map(userID => (
                <NetworkUserReactor networkID={props.networkID} userID={userID} key={userID} />
            ))}
        </>
    );
};

const reactor = () => {
    const worldNetworkIDs = Object.entries(
        useHookstate(getMutableState(NetworkState).networks).value,
    )
        .filter(([_id, network]) => network.topic === NetworkTopics.world)
        .map(([id]) => id);
    return (
        <>
            {worldNetworkIDs.map(networkID => (
                <NetworkReactor networkID={networkID} key={networkID} />
            ))}
        </>
    );
};

export const NetworkWorldUserStateSystem = defineSystem({
    uuid: "ee.networking.NetworkWorldUserStateSystem",
    reactor,
    insert: { with: SimulationSystemGroup },
});
