import { AddOutlined, CancelOutlined } from "@mui/icons-material";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useReactFlow } from "reactflow";

import { TextField } from "@mui/material";
import { UndefinedEntity } from "../../../../../ecs";
import { NodetoEnginetype } from "../../../../../engine";
import { NO_PROXY, useMutableState } from "../../../../../hyperflux";
import { VisualScriptDomain, VisualScriptState } from "../../../../../visual-script";
import Button from "../../../../Button";
import SelectInput from "../../../../Select";
import PaginatedList from "../../../layout/PaginatedList";
import NodeEditor from "../../../properties/nodeEditor";
import ParameterInput from "../../../properties/parameter";
import { visualToFlow } from "../../../visualScript/VisualScriptUIModule";

export const SidePanel = ({
    flowref,
    examples,
    variables,
    onNodesChange,
    handleAddTemplate,
    handleApplyTemplate,
    handleDeleteTemplate,
    handleEditTemplate,
    handleAddVariable,
    handleEditVariable,
    handleDeleteVariable,
}) => {
    const reactFlow = useReactFlow();
    const visualScriptState = useMutableState(VisualScriptState);
    const { t } = useTranslation();
    const graphTypes = visualScriptState.registries[VisualScriptDomain.ECS].values.get(NO_PROXY);

    useEffect(() => {
        for (const graph of Object.values(examples)) {
            const [nodes, edges] = visualToFlow(graph);
            handleAddTemplate(nodes, edges);
        }
    }, [examples, handleAddTemplate]);

    return (
        <NodeEditor entity={UndefinedEntity} name={t("editor:visualScript.sidePanel.title")}>
            {/*<NodeEditor
        entity={UndefinedEntity}
        name={t('editor:visualScript.sidePanel.node.name')}
        description={t('editor:visualScript.sidePanel.node.description')}
      >
        <PaginatedList
          options={{ countPerPage: 10 }}
          list={Object.keys(visualScriptState.registries[VisualScriptDomain.ECS].nodes)}
          element={(nodeName, index) => {
            return (
              <Button
                variant="outline"
                className="w-full truncate p-0 lowercase"
                onClick={() => {
                  const bounds = (flowref.current).getBoundingClientRect()
                  const centerX = bounds.left + bounds.width / 2
                  const centerY = bounds.top + bounds.height / 2
                  const viewportCenter = reactFlow.screenToFlowPosition({ x: centerX, y: centerY } as XYPosition)
                  const position = viewportCenter // need a way to get viewport
                  const newNode = {
                    id: uuidv4(),
                    type: nodeName,
                    position,
                    data: { configuration: {}, values: {} } //fill with default values here
                  }
                  onNodesChange([
                    {
                      type: 'add',
                      item: newNode
                    }
                  ])
                }}
              >
                <Panel title={nodeName}></Panel>
              </Button>
            )
          }}
        ></PaginatedList>
      </NodeEditor>*/}
            <NodeEditor
                entity={UndefinedEntity}
                name={t("editor:visualScript.sidePanel.template.name")}
                description={t("editor:visualScript.sidePanel.template.description")}
            >
                <PaginatedList
                    options={{ countPerPage: 5 }}
                    list={visualScriptState.templates.get(NO_PROXY)}
                    element={(template, index) => {
                        return (
                            <div className="flex w-full">
                                <Button
                                    variant="outline"
                                    className="h-7 w-[20%]"
                                    onClick={() => {
                                        handleApplyTemplate(template);
                                    }}
                                >
                                    <AddOutlined />
                                </Button>
                                <TextField
                                    className="h-7"
                                    value={template.name}
                                    onChange={e => {
                                        template.name = e;
                                        handleEditTemplate(template);
                                    }}
                                />

                                <Button
                                    variant="outline"
                                    className="h-7 w-[20%]"
                                    style={{ width: "20%" }}
                                    onClick={() => {
                                        handleDeleteTemplate(template);
                                    }}
                                >
                                    <CancelOutlined />
                                </Button>
                            </div>
                        );
                    }}
                ></PaginatedList>
            </NodeEditor>
            <NodeEditor
                entity={UndefinedEntity}
                name={t("editor:visualScript.sidePanel.variables.name")}
                description={t("editor:visualScript.sidePanel.variables.description")}
            >
                <PaginatedList
                    options={{ countPerPage: 5 }}
                    list={variables}
                    element={(variable, index) => {
                        return (
                            <NodeEditor entity={UndefinedEntity} name={variable.name}>
                                <div className="flex w-full flex-col">
                                    <div className="flex w-full flex-row overflow-hidden">
                                        <TextField
                                            value={variable.name}
                                            className="h-7"
                                            onChange={e => {
                                                handleEditVariable({ ...variable, name: e });
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            className="h-7 w-[10%] "
                                            onClick={() => {
                                                handleDeleteVariable(variable);
                                            }}
                                        >
                                            <CancelOutlined />
                                        </Button>
                                    </div>
                                    <SelectInput
                                        options={Object.keys(graphTypes).map(valueType => {
                                            return { label: valueType, value: valueType };
                                        })}
                                        value={variable.valueTypeName}
                                        onChange={value => {
                                            handleEditVariable({
                                                ...variable,
                                                valueTypeName: value,
                                                initialValue: graphTypes[value].creator(),
                                            });
                                        }}
                                    />
                                    <ParameterInput
                                        entity={`${UndefinedEntity}`}
                                        values={[
                                            NodetoEnginetype(
                                                variable.initialValue,
                                                variable.valueTypeName,
                                            ),
                                        ]}
                                        onChange={key => e => {
                                            let value = e;
                                            if (
                                                variable.valueTypeName !== "object" &&
                                                typeof e === "object"
                                            )
                                                value = e.target.value;
                                            handleEditVariable({
                                                ...variable,
                                                initialValue: value,
                                            });
                                        }}
                                    />
                                </div>
                            </NodeEditor>
                        );
                    }}
                ></PaginatedList>
                <div className="flex w-full flex-row justify-center">
                    <Button
                        variant="outline"
                        onClick={() => {
                            handleAddVariable();
                        }}
                    >
                        {t("editor:visualScript.sidePanel.variables.add")}
                    </Button>
                </div>
            </NodeEditor>
        </NodeEditor>
    );
};

export default SidePanel;
