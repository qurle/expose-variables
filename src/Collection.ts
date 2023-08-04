export interface xCollection {
    id: string
    name: string
    modes: Array<{
        modeId: string
        name: string
    }>
    variables: xVariable[]
}

export interface xVariable {
    id: string
    name: string
    description: string
    type: VariableResolvedDataType
    values: xValue[]
}

export interface xValue {
    modeId: string
    alias: string
    resolvedValue: any
}
