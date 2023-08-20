export interface xCollection {
    id: string
    name: string
    modes: Map<string, {
        modeId: string
        name: string
        renderWidth?: number
    }>
    variables: Map<string, xVariable>
    renderWidth?: number
}

export interface xVariable {
    id: string
    name: string
    description: string
    type: VariableResolvedDataType
    values: Map<string, xValue>
    renderWidth?: number
}

export interface xValue {
    modeId: string
    alias: string
    resolvedValue: any
    renderWidth?: number
}
