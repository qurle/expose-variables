const diff = {
    UNCHANGED: {},
    UPDATED: {},
    ADDED: {},
    DELETED: {}
}

//  Structure will look like:

JSON.stringify({
    "collection_id1": {
        // Unchanged properties
        UNCHANGED: {
            id: "collection_id1"
        },
        // Properties that changed or thier children changed somehow
        UPDATED: {
            name: "First Collection New Name",
            modes: {
                UNCHANGED: {
                    "mode_id1": { id: "mode_id1", name: "First mode" }
                },
                // Changes are nested
                UPDATED: {
                    // At any level
                    "mode_id2": {
                        // Maybe UNCHANGED is not that necessary
                        UNCHANGED: {
                            id: "mode_id2",
                        },
                        UPDATED: {
                            name: "Second Mode New Name"
                        }
                    }
                },
                ADDED: {
                    "mode_id3": { id: "mode_id3", name: "Third mode" }
                },
                DELETED: {
                    // DELETED details is optional too
                    "mode_id4": { id: "mode_id4", name: "Fourth Mode" }
                }
            },
            variables: {
                // Variables list diff
                UNCHANGED: {
                    "variable_id1": {
                        id: "variable_id1",
                        name: "First Variable",
                        description: "",
                        type: "color",
                        values: { ...},
                    },
                    UPDATED: {
                        "variable_id2": {
                            // Diff of the variable
                            UNCHANGED: { id: "variable_id2", description: "", type: "string" },
                            UPDATED: {
                                name: "Second Variable New",
                                values: {
                                    UNCHANGED: {
                                        "mode_id1": { modeId: "mode_id1", alias: null, resolvedValue: "i am one" }
                                    },
                                    UPDATED: {
                                        "mode_id2": {
                                            UNCHANGED: { modeId: "mode_id2", alias: "variable_idN" },
                                            UPDATED: { resolvedValue: "i am two" }
                                        }
                                    },
                                }
                            }
                        }
                    },
                    ADDED: {
                        "variable_id3": {
                            id: "variable_id3",
                            name: "Third Variable",
                            description: "",
                            type: "color",
                            values: { ...},
                        }
                    },
                    DELETED: {
                        "variable_id4": {
                            id: "variable_id4",
                            name: "Fourth Variable",
                            description: "",
                            type: "color",
                            values: { ...},
                        }
                    }
                }
            }
        }
    }
})