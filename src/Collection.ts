export interface xCollection {
    id: string
    name: string
    modes: Array<{
        modeId: string
        name: string
        renderWidth: number
    }>
    variables: xVariable[]
    renderWidth: number
}

export interface xVariable {
    id: string
    name: string
    description: string
    type: VariableResolvedDataType
    values: xValue[]
    renderWidth: number
}

export interface xValue {
    modeId: string
    alias: string
    resolvedValue: any
    renderWidth: number
}
